-- =============================================================================
-- OPTIONAL — richer project data for the assistant.  Review before running.
--
-- Adds nullable columns to the EXISTING public.projects table. Nothing is
-- renamed, dropped or rewritten; existing rows and pages are unaffected.
-- The app works with or without these columns: when present and filled, the
-- assistant uses them; otherwise it relies on `description`.
--
--   contribution  What Anjit personally did on the project.
--   features      Key features, one per array item.
--   category      e.g. 'Marketplace', 'Dashboard', 'Marketing site'.
--   github_url    Public repository, if any.
--   updated_at    Lets you see when a project last changed (kept by trigger).
-- =============================================================================

alter table public.projects add column if not exists contribution text;
alter table public.projects add column if not exists features     text[] not null default '{}';
alter table public.projects add column if not exists category     text;
alter table public.projects add column if not exists github_url   text;
alter table public.projects add column if not exists updated_at   timestamptz not null default now();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.portfolio_set_updated_at();
