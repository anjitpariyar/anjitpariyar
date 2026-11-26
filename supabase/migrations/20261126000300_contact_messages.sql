-- =============================================================================
-- Contact messages: sent from the /contact form (POST /api/contact) or
-- collected by the chat AI (sendMessageToAnjit tool). This is Anjit's inbox.
--
-- Private, like chat_logs: RLS on with no policies and no API privileges, so
-- the anon key can't read or write it. Only the server writes, with
-- SUPABASE_SERVICE_ROLE_KEY. Read it in Table Editor.
-- =============================================================================

create table if not exists public.contact_messages (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 100),
  email       text not null check (char_length(email) between 3 and 200),
  message     text not null check (char_length(message) between 1 and 3000),
  -- contact-page | chatbot-ai
  source      text not null,
  -- Links the message to its conversation in chat_logs (chat only).
  session_id  text,
  -- Flip to true in Table Editor once you've replied.
  handled     boolean not null default false
);

create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);
create index if not exists contact_messages_unhandled_idx on public.contact_messages (created_at desc) where not handled;

alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;
