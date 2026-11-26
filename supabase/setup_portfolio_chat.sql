
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

    execute format('drop policy if exists %I on public.%I', 'Public can read published rows', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (is_published = true)',
      'Public can read published rows', t
    );

    execute format('revoke insert, update, delete, truncate on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to anon, authenticated', t);
  end loop;
end;
$$;



alter table public.projects add column if not exists contribution text;
alter table public.projects add column if not exists features     text[] not null default '{}';
alter table public.projects add column if not exists category     text;
alter table public.projects add column if not exists github_url   text;
alter table public.projects add column if not exists updated_at   timestamptz not null default now();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.portfolio_set_updated_at();


insert into public.portfolio_profile (
  full_name, professional_title, short_bio, detailed_bio, location,
  email, website, github_url, linkedin_url, other_links, years_experience,
  additional_information, is_published
)
select
  'Anjit Pariyar',
  'React Developer',
  'Anjit Pariyar is a React developer from Nepal with 5 years of experience. He has built 20+ web apps and loves solving problems and creating websites that users love.',
  E'From the start Anjit has thrived on solving problems and creating websites that users love.\n\nHe developed a knack for adding animations to websites, making them more engaging and interactive.\n\nOver the years he has become proficient in React.js, adept at handling performance optimization, ensuring responsiveness, and seamlessly integrating APIs to enhance user experiences.\n\nHe is dedicated to crafting user-friendly interfaces and leveraging technology to bring ideas to life on the web.',
  'Nepal',
  'anjitcoder@gmail.com',
  'https://www.anjitpariyar.com.np',
  'https://github.com/anjitpariyar',
  'https://www.linkedin.com/in/anjit-pariyar-b46131178/',
  '[{"label": "Dribbble", "url": "https://dribbble.com/limbo_anj"},
    {"label": "Instagram", "url": "https://www.instagram.com/limbo_anj/"}]'::jsonb,
  5,
  'He builds web apps with React and Next.js, has delivered 20+ projects, and focuses on interactive, animated frontends that users enjoy.',
  true
where not exists (select 1 from public.portfolio_profile);

update public.portfolio_profile
set email = 'anjitcoder@gmail.com'
where email is null or btrim(email) = '';

update public.portfolio_profile
set years_experience = 5
where years_experience is null;

insert into public.portfolio_skills
  (name, slug, category, description, aliases, related_skills, is_featured, sort_order, is_published)
values
  ('React', 'react', 'Frontend',
   'His main tool: most of his web apps are built with React.',
   '{reactjs,react.js,react js}', '{nextjs,javascript,redux}', true, 10, true),
  ('Next.js', 'nextjs', 'Frontend',
   'He builds web apps with React and Next.js.',
   '{next js,nextjs}', '{react}', true, 20, true),
  ('JavaScript', 'javascript', 'Frontend', null,
   '{js,es6}', '{react}', true, 30, true),
  ('HTML', 'html', 'Frontend', null,
   '{html5}', '{css}', false, 40, true),
  ('CSS', 'css', 'Styling', null,
   '{css3}', '{html,responsive-design}', false, 50, true),
  ('Web animation', 'web-animation', 'Animation',
   'He has a knack for adding animations to websites, making them more engaging and interactive.',
   '{animation,animations,motion,interactive animation}', '{framer-motion,gsap,react-spring}', true, 60, true),
  ('Responsive design', 'responsive-design', 'Frontend',
   'Ensuring responsiveness is part of how he builds interfaces.',
   '{responsive,responsiveness,mobile friendly}', '{css}', false, 70, true),
  ('Performance optimization', 'performance-optimization', 'Frontend',
   'Adept at handling performance optimization in React apps.',
   '{performance,optimization,web performance}', '{react}', false, 80, true),
  ('API integration', 'api-integration', 'Frontend',
   'Integrates APIs to enhance user experiences.',
   '{api,apis,rest api,integration}', '{react}', false, 90, true),
  ('Web design', 'web-design', 'Other',
   'Crafting user-friendly interfaces.',
   '{ui,ui design,interface design,user interface}', '{}', false, 100, true)
on conflict (slug) do nothing;

insert into public.portfolio_faqs (question, answer, keywords, category, sort_order, is_published)
select * from (values
  ('What kind of projects does Anjit build?',
   'Mostly web apps built with React and Next.js, with a focus on interactive, animated frontends that users enjoy.',
   '{kind of projects,type of projects,what does he build,what do you build,specialize,specialise,focus}'::text[],
   'general', 10, true),
  ('How many projects has Anjit built?',
   'He has built 20+ projects over 5 years.',
   '{how many projects,number of projects,project count}'::text[],
   'general', 20, true),
  ('What is his preferred frontend stack?',
   'He builds web apps with React and Next.js.',
   '{preferred stack,favorite stack,favourite stack,go to stack,main stack,preferred frontend}'::text[],
   'skills', 30, true)
) as v(question, answer, keywords, category, sort_order, is_published)
where not exists (select 1 from public.portfolio_faqs);

insert into public.portfolio_chat_suggestions (label, message, category, sort_order, is_published)
select * from (values
  ('Explore projects',        'Show me your projects',              'projects',   10, true),
  ('Technical skills',        'What technologies do you work with?', 'skills',     20, true),
  ('Next.js work',            'Have you worked with Next.js?',      'skills',     30, true),
  ('Animation work',          'Do you have experience with animations?', 'skills', 40, true),
  ('Professional experience', 'Tell me about your experience',      'experience', 50, true),
  ('Contact',                 'How can I contact you?',             'contact',    60, true)
) as v(label, message, category, sort_order, is_published)
where not exists (select 1 from public.portfolio_chat_suggestions);


