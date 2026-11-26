-- =============================================================================
-- Chat logs for /chat: every answered message, plus blocked and rate-limited
-- requests, so the site owner can review conversations and spot abuse.
--
-- Private: RLS is on with no policies and the API roles have no privileges,
-- so visitors can neither read nor write these tables through the anon key.
-- Only the server writes, with SUPABASE_SERVICE_ROLE_KEY. Read them in the
-- Supabase dashboard (Table Editor or SQL editor).
--
-- Visitor IPs are never stored: ip_hash is a salted SHA-256, enough to group
-- requests from the same visitor without keeping the address.
-- =============================================================================

create table if not exists public.chat_logs (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),
  -- answered | blocked | rate_limited | invalid | error
  status          text not null,
  -- Random id per conversation, created in the visitor's browser.
  session_id      text,
  ip_hash         text,
  country         text,
  user_agent      text,
  message         text,
  answer          text,
  -- Cards shown with the answer (project / skill / experience ids).
  blocks          jsonb not null default '[]'::jsonb,
  mode            text,      -- ai | fallback
  intent          text,
  basis           text,
  model           text,
  fallback_reason text,
  block_reason    text,      -- why the bot guard rejected the request
  tool_calls      text[] not null default '{}',
  latency_ms      integer
);

create index if not exists chat_logs_created_at_idx on public.chat_logs (created_at desc);
create index if not exists chat_logs_session_idx on public.chat_logs (session_id, created_at);
create index if not exists chat_logs_ip_hash_idx on public.chat_logs (ip_hash, created_at desc);
create index if not exists chat_logs_status_idx on public.chat_logs (status, created_at desc);

alter table public.chat_logs enable row level security;
revoke all on public.chat_logs from anon, authenticated;

-- One row per conversation, newest first. security_invoker makes the view
-- obey the table's RLS, so it isn't readable through the anon key either.
create or replace view public.chat_sessions
with (security_invoker = true) as
select
  session_id,
  min(created_at)                                   as started_at,
  max(created_at)                                   as last_message_at,
  count(*) filter (where status = 'answered')       as messages,
  count(*) filter (where status <> 'answered')      as rejected,
  count(*) filter (where mode = 'fallback')         as fallback_replies,
  (array_agg(ip_hash order by created_at))[1]       as ip_hash,
  (array_agg(country order by created_at))[1]       as country,
  (array_agg(message order by created_at))[1]       as first_message
from public.chat_logs
where session_id is not null
group by session_id
order by max(created_at) desc;

revoke all on public.chat_sessions from anon, authenticated;

-- -----------------------------------------------------------------------------
-- OPTIONAL: delete logs older than 90 days every night. Needs the pg_cron
-- extension (Database → Extensions in the Supabase dashboard).
-- -----------------------------------------------------------------------------
-- select cron.schedule(
--   'chat-logs-retention',
--   '15 3 * * *',
--   $$delete from public.chat_logs where created_at < now() - interval '90 days'$$
-- );
