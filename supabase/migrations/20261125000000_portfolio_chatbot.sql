-- =============================================================================
-- Portfolio chatbot knowledge tables
--
-- Adds the tables the /chat assistant reads from. Non-destructive:
--   * creates new tables only (IF NOT EXISTS), never alters or drops anything
--   * does NOT touch the existing public.projects table or its data
--
-- Access model:
--   * anonymous visitors may SELECT rows where is_published = true
--   * nobody may INSERT / UPDATE / DELETE through the public API;
--     edit content in the Supabase dashboard (Table Editor), which uses
--     the service role and bypasses RLS.
--
-- Note: public.projects.id is an integer, so related_project_ids is bigint[]
-- (Postgres cannot put a foreign key on an array column; the app ignores ids
-- that don't match an active project).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at current
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- portfolio_profile: who Anjit is, bio, contact details
-- (one published row is expected; if several are published, the most
-- recently updated one is used)
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_profile (
  id                     uuid primary key default gen_random_uuid(),
  full_name              text not null,
  professional_title     text,
  short_bio              text,
  detailed_bio           text,
  location               text,
  email                  text,
  website                text,
  github_url             text,
  linkedin_url           text,
  cv_url                 text,
  -- any other public profiles: [{"label": "Dribbble", "url": "https://..."}]
  other_links            jsonb not null default '[]'::jsonb,
  years_experience       numeric(4, 1) check (years_experience is null or years_experience >= 0),
  availability_status    text,
  additional_information text,
  is_published           boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint portfolio_profile_other_links_is_array
    check (jsonb_typeof(other_links) = 'array')
);

-- ---------------------------------------------------------------------------
-- portfolio_skills
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_skills (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  category          text not null default 'Other'
    check (category in ('Frontend', 'Backend', 'Database', 'Styling', 'Animation', 'Tools', 'Other')),
  description       text,
  aliases           text[] not null default '{}',
  related_skills    text[] not null default '{}',
  proficiency_label text,
  years_experience  numeric(4, 1) check (years_experience is null or years_experience >= 0),
  is_featured       boolean not null default false,
  sort_order        integer not null default 0,
  is_published      boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists portfolio_skills_published_sort_idx
  on public.portfolio_skills (is_published, sort_order);
create index if not exists portfolio_skills_category_idx
  on public.portfolio_skills (category);
create index if not exists portfolio_skills_aliases_gin
  on public.portfolio_skills using gin (aliases);

-- ---------------------------------------------------------------------------
-- portfolio_experiences: employment history
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_experiences (
  id               uuid primary key default gen_random_uuid(),
  company          text not null,
  position         text not null,
  employment_type  text,
  description      text,
  responsibilities text[] not null default '{}',
  start_date       date,
  end_date         date,
  is_current       boolean not null default false,
  technologies     text[] not null default '{}',
  company_url      text,
  sort_order       integer not null default 0,
  is_published     boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint portfolio_experiences_dates_valid
    check (end_date is null or start_date is null or end_date >= start_date)
);

create index if not exists portfolio_experiences_published_sort_idx
  on public.portfolio_experiences (is_published, sort_order);
create index if not exists portfolio_experiences_technologies_gin
  on public.portfolio_experiences using gin (technologies);

-- ---------------------------------------------------------------------------
-- portfolio_faqs
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_faqs (
  id                  uuid primary key default gen_random_uuid(),
  question            text not null,
  answer              text not null,
  keywords            text[] not null default '{}',
  category            text,
  related_project_ids bigint[] not null default '{}',
  sort_order          integer not null default 0,
  is_published        boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists portfolio_faqs_published_sort_idx
  on public.portfolio_faqs (is_published, sort_order);
create index if not exists portfolio_faqs_keywords_gin
  on public.portfolio_faqs using gin (keywords);

-- ---------------------------------------------------------------------------
-- portfolio_chat_suggestions: starter questions shown when the chat opens
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_chat_suggestions (
  id           uuid primary key default gen_random_uuid(),
  label        text not null,
  message      text not null,
  category     text,
  sort_order   integer not null default 0,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists portfolio_chat_suggestions_published_sort_idx
  on public.portfolio_chat_suggestions (is_published, sort_order);

-- ---------------------------------------------------------------------------
-- updated_at triggers, RLS, read-only public access
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'portfolio_profile',
    'portfolio_skills',
    'portfolio_experiences',
    'portfolio_faqs',
    'portfolio_chat_suggestions'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I
         for each row execute function public.portfolio_set_updated_at()',
      t || '_set_updated_at', t
    );

    execute format('alter table public.%I enable row level security', t);

    -- Visitors may only read published rows.
    execute format('drop policy if exists %I on public.%I', 'Public can read published rows', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (is_published = true)',
      'Public can read published rows', t
    );

    -- Defence in depth: no write privileges for API roles at all.
    -- (RLS already blocks writes since no write policy exists.)
    execute format('revoke insert, update, delete, truncate on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to anon, authenticated', t);
  end loop;
end;
$$;

-- =============================================================================
-- OPTIONAL — review before enabling. Not run by default.
--
-- Today anonymous visitors can read *inactive* projects (is_active = false)
-- straight from the API. The chatbot and the project grid already filter to
-- is_active = true, but the data itself is public. Uncommenting the block
-- below hides inactive projects from the API.
--
-- Side effect: /projects/<slug> for an inactive project (currently "gyre")
-- would then show "not found" instead of the page.
-- =============================================================================
-- alter table public.projects enable row level security;
-- drop policy if exists "Public can read active projects" on public.projects;
-- create policy "Public can read active projects" on public.projects
--   for select to anon, authenticated using (is_active = true);
