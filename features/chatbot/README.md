# Portfolio assistant (`/chat`)

A Gemini-powered portfolio assistant that answers from published Supabase data. There's no RAG, vector database or embeddings: the portfolio is small, so Gemini reads it directly and can call read-only functions for specific records. If Gemini is unavailable, a rule-based engine answers from the same data.

## Request lifecycle

```
Visitor question                         hooks/useChat.ts (history + context in localStorage)
  → POST /api/chat                       pages/api/chat/index.ts
      bot guard                          server/botGuard.ts
      rate limit per IP                  server/rateLimit.ts
      validate body (Zod)                server/requestSchema.ts (message ≤ 500 chars, body ≤ 32kb)
  → handleChat()                         server/chatService.ts
      published portfolio data           server/knowledgeStore.ts (cached 60 s, anon key + RLS)
      sanitize context, bound history    engine/conversationManager.ts
      build prompt context               ai/context/contextProvider.ts
      system prompt + recent context     ai/llm/prompts.ts
  → Gemini (structured JSON output)      ai/llm/geminiProvider.ts
      ⇄ function calls (optional)        ai/tools/portfolioTools.ts → ai/data/portfolioRepository.ts
  → validate response                    engine/responseValidator.ts
  → React component registry             components/BlockRenderer.tsx
```

If Gemini is missing, over quota, failing or returns an unusable answer, the request is answered by the rule-based engine in `engine/`. Those replies have `mode: "fallback"` and are labelled "Basic mode" in the UI.

## Folder layout

| Folder | Contents |
|---|---|
| `ai/` | Config, prompt context, Gemini provider, prompts, output schema, tools, eval dataset |
| `engine/` | Rule-based fallback (normalization, entities, intents, synonyms, response builder), conversation state and the response validator |
| `server/` | Chat orchestration, knowledge cache, LLM provider selection, rate limit, request schema, server-only guard |
| `services/` | Supabase loaders for profile, projects, skills, experience, FAQs and suggestions |
| `components/` | Chat UI and the card components in `components/blocks/` |
| `hooks/useChat.ts` | Client state, localStorage persistence (`anjit-portfolio-chat:v2`), calls `/api/chat` |
| `types/database.ts` | Supabase table types |

## Context strategy

`CHAT_CONTEXT_MODE` (default `auto`):

| Mode | Prompt contains | When |
|---|---|---|
| `full` | profile, skills, experience, every published project in full and every FAQ with its answer (≈3.6k tokens for the current portfolio) | small portfolios |
| `overview` | profile, skills, experience, plus one-line project summaries and FAQ questions; details come from tools | larger portfolios |
| `auto` | `full` while it fits within `CHAT_FULL_CONTEXT_MAX_CHARS` (40k), otherwise `overview` | default |

The system prompt is identical for every turn until the data changes, so Gemini can cache it.

## Prompt rules

Defined in `ai/llm/prompts.ts` (`PROMPT_VERSION = "2026-11-26.direct-1"`):

- **Grounding:** only portfolio data and tool results count. Never invent projects, technologies, dates, availability or contact details. A project's stack is exactly its `technologies` field.
- **Basis:** every answer is labelled `confirmed`, `interpretation` (reasoned relevance, said as such) or `insufficient`.
- **Style:** third person, plain text, usually 1–4 short paragraphs. Off-topic requests are politely declined.
- **Safety:** portfolio data, tool results and history are treated as data, not instructions. The prompt and tools are never revealed.

## Model output

Gemini must return this shape (`ai/llm/responseSchema.ts`):

```ts
{
  answer: string,                                        // plain text
  basis: "confirmed" | "interpretation" | "insufficient",
  intent: "greeting" | "about" | "projects" | ... ,      // 12 intents
  blocks: [{ type, ids: string[], focus?, highlight? }], // 0–3 cards
  suggestions: string[],                                 // 2–4 follow-ups
  sources: [{ sourceType, sourceId }]
}
```

The card schema is flat on purpose, because flat schemas are the most reliable with structured output. The server converts it into the app's `ChatBlock` union.

## Function calling

These tools are declared to Gemini and run on the server (`ai/tools/portfolioTools.ts`):

`getProfile()` · `getProjects()` · `getProjectDetails(projectId)` · `searchProjectsByTechnology(technology)` · `getSkills(category?)` · `getExperience()` · `getFAQs(category?)`

- The server owns the tool list; the model only picks a name and arguments.
- Arguments are validated with strict Zod schemas, so unknown keys, invalid ids and invalid categories are rejected. Errors go back to the model as data, so it can recover. Tools never throw.
- Tools only read published data through `PortfolioRepository`. There's no SQL or code execution path.
- `searchProjectsByTechnology` understands spelling variants ("ReactJS", "next js") through the engine's technology vocabulary, with a substring match as a fallback.
- A message can use at most `CHAT_MAX_TOOL_ROUNDS` (3) rounds of tool calls. After that, tools are switched off and the model has to answer.
- Every record a tool returns is added to the list of records the model was shown this turn.

## Gemini provider

`ai/llm/geminiProvider.ts` implements the provider-neutral `LlmProvider` interface (`ai/llm/llmProvider.ts`). `server/providers.ts` is the only place that picks it.

- **Time budget:** `GEMINI_TIMEOUT_MS` (20 s) covers the whole message, including retries, tool rounds and fallback models. A single attempt is abandoned after 9 s.
- **Retries:** one retry with jittered backoff on 503, 5xx, 429 or a hung call.
- **Fallback models:** if the primary model stays overloaded or rate limited, `GEMINI_FALLBACK_MODELS` are tried in order (empty by default). Tools are read-only, so restarting on another model is safe.
- **JSON modes:**
  - `native`: Gemini structured output (`responseMimeType` + `responseJsonSchema`).
  - `prompted`: the schema is written into the system prompt and the JSON is extracted from plain text (code fences and surrounding prose are tolerated).

  If native JSON fails with a transient error, the provider uses prompted JSON for that model for 10 minutes. Both modes go through the same Zod schema and validator.
- **Tools + JSON:** Gemini 3 models accept tools and a JSON schema in the same call. If a model rejects that, the provider switches to two calls (tools first, then the JSON answer) and remembers the choice per model.
- **Errors:** provider errors are mapped to `auth`, `quota`, `rate_limit`, `timeout`, `unavailable`, `blocked`, `invalid_response`, `not_configured` or `unknown`. Safety-blocked responses count as failures. Raw provider messages are logged on the server only.
- **Generation settings:** temperature 0.3, `GEMINI_MAX_OUTPUT_TOKENS` (1500), optional `GEMINI_THINKING_LEVEL`.

## Validation of model output

`engine/responseValidator.ts` treats the model output as untrusted:

- Only the 7 approved block types are rendered: `text`, `project_list`, `project_detail`, `skill_grid`, `experience_list`, `contact_card` and `faq_card`. At most 3 cards (one per type) and 8 ids per card.
- Project, skill and experience ids must exist in the published data. FAQ ids and cited sources must also have been shown to the model this turn, either in the prompt or in a tool result.
- The answer text is stripped of markdown, capped at 2,000 characters and rendered as plain React text, never as HTML.
- Suggestions are deduplicated and capped at 4. Unknown `intent` becomes `unknown`; unknown `basis` becomes `insufficient`.
- Dropped parts are logged as `rejected`. If no answer text survives, the rule-based engine answers instead.

## Follow-up questions

Each request carries:

- the last 8 turns of history, each capped at 700 characters. Assistant turns are summarized with `[Cards shown: Title (id N)]` so references like "that one" resolve correctly.
- a "recent context" line naming the projects shown last, in order.

The model keeps no memory between calls. History and context live in the visitor's localStorage, and the server re-validates the ids and caps the lengths. The rule engine's context is updated on every turn, including AI turns, so falling back mid-conversation still resolves references.

## Rule-based fallback

`engine/` answers without a model or network: text normalization → entity extraction (technologies, projects, synonyms) → weighted intent detection → `responseBuilder.ts` builds the cards. It's used when:

- `GEMINI_API_KEY` isn't set,
- Gemini fails (auth, quota, rate limit, timeout, blocked, unavailable),
- or the model's output is unusable.

The reason is returned as `meta.fallbackReason` (for example `llm_quota`).

## API

`POST /api/chat`

```ts
// Request
{ message: string, history?: { role: "user" | "assistant", text: string }[], context?: object }

// Response
{
  reply: { blocks, suggestions, intent, sources, basis, mode: "ai" | "fallback" },
  context,   // store and send back with the next message
  meta: { timings, model, promptVersion, contextMode, toolCalls, fallbackReason }
}
```

Errors: `405` for non-POST, `403`/`415` when the bot guard blocks the request, `400` for an invalid body, `429` with `Retry-After` when rate limited, `500` for unexpected failures. Responses are `Cache-Control: no-store`.

Each turn logs one JSON line (`event: "chat_turn"`) with mode, intent, basis, model, tools, rejected count, fallback reason and timings to the server console. The full conversation is stored in `chat_logs` (see Chat logs).

## Chat logs

When `SUPABASE_SERVICE_ROLE_KEY` is set, every request is saved to the private `public.chat_logs` table (`server/chatLog.ts`, migration `20261126000200_chat_logs.sql`). Without the key, logging is off and the chat works as before.

- **What's stored:** time, status (`answered`, `blocked`, `rate_limited`, `invalid`, `error`), the visitor's message, the answer text, the cards shown, mode, intent, basis, model, fallback reason, tool calls, latency, user agent and country (from Vercel or Cloudflare headers).
- **Conversations:** the browser creates a random `sessionId` per conversation (a new one after "clear chat"). The `chat_sessions` view shows one row per conversation with its first message and counts.
- **Visitors:** IPs are never stored. `ip_hash` is a salted SHA-256 (`CHAT_LOG_SALT`), so you can see that several conversations came from the same visitor without keeping the address.
- **Floods:** rejected requests are logged at most 5 per minute and 30 per hour per IP.
- **Privacy:** RLS is on with no policies and the API roles have no privileges, so the anon key can't read or write the logs. Only the server writes, and you read them in the Supabase dashboard.
- **Failures:** a write waits at most 1.5 s and never fails the visitor's request.
- **Retention:** the migration includes an optional pg_cron job that deletes logs older than 90 days.

Useful queries (Supabase SQL editor):

```sql
-- Latest conversations
select * from chat_sessions limit 50;

-- One conversation in order
select created_at, message, answer, mode from chat_logs where session_id = '<id>' order by created_at;

-- Who is being blocked or rate limited
select ip_hash, status, block_reason, count(*), max(created_at)
from chat_logs where status <> 'answered' and created_at > now() - interval '1 day'
group by 1, 2, 3 order by 4 desc;

-- Busiest visitors today
select ip_hash, count(*) from chat_logs
where status = 'answered' and created_at > now() - interval '1 day'
group by 1 order by 2 desc limit 20;
```

## Bot protection

`server/botGuard.ts` runs before any data loading or Gemini call. A request is blocked unless:

- the user agent is present and isn't a known bot, HTTP library (curl, python-requests, axios…) or headless browser;
- it sends `X-Chat-Client: web` (added by `useChat`). A custom header also forces a CORS preflight, which other sites can't pass;
- it's `application/json`, so HTML form posts are rejected;
- its `Origin` (or `Referer`) is this site, with or without `www`, or a host in `CHAT_ALLOWED_ORIGINS`.

Blocked requests are logged as `event: "chat_blocked"` with the reason. After that come the per-IP rate limit and a daily cap on Gemini calls (`CHAT_AI_DAILY_LIMIT`, per server instance). Past the cap, replies come from the free rule-based engine, so a bot that gets through can't run up the bill. `robots.txt` also disallows `/api/` for well-behaved crawlers.

These checks stop crawlers, scanners, cross-site use and casual scripts. A determined script can still fake the headers; for that, add a CAPTCHA such as Cloudflare Turnstile.

## Data and security

- Tables: `portfolio_profile`, `portfolio_skills`, `portfolio_experiences`, `portfolio_faqs` and `portfolio_chat_suggestions`, plus the existing `projects` table.
- Row-level security lets visitors read only rows with `is_published = true`. There's no write policy, so writes are blocked.
- Portfolio data is read with the anon key. The service-role key is used only to write chat logs, on the server.
- Server modules call `assertServer()`, which throws if they're bundled into the browser. `GEMINI_API_KEY` never reaches the client.
- `/chat` is indexable and listed in the sitemap.

## Configuration

All values are read on the server at request time (`ai/config.ts`). See `.env.example`.

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | none | Enables the AI path. Without it, every reply uses the fallback |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Primary model |
| `GEMINI_FALLBACK_MODELS` | empty | Comma-separated models tried when the primary is overloaded |
| `GEMINI_THINKING_LEVEL` | none | `MINIMAL`, `LOW`, `MEDIUM` or `HIGH`, for models that support it |
| `GEMINI_TIMEOUT_MS` | `20000` | Total time budget per message |
| `GEMINI_MAX_OUTPUT_TOKENS` | `1500` | Output token cap |
| `CHAT_CONTEXT_MODE` | `auto` | `auto`, `full` or `overview` |
| `CHAT_FULL_CONTEXT_MAX_CHARS` | `40000` | Size limit for `full` in `auto` mode |
| `CHAT_MAX_TOOL_ROUNDS` | `3` | Tool rounds per message |
| `CHAT_RATE_LIMIT_PER_MINUTE` | `10` | Per IP |
| `CHAT_RATE_LIMIT_PER_HOUR` | `60` | Per IP |
| `CHAT_AI_DAILY_LIMIT` | `1000` | Gemini calls per UTC day per instance; then rule-based replies |
| `CHAT_ALLOWED_ORIGINS` | empty | Extra origins allowed to call `/api/chat`, comma-separated |
| `SUPABASE_SERVICE_ROLE_KEY` | none | Enables chat logs. Server-only |
| `CHAT_LOG_SALT` | service key | Salt for hashing visitor IPs |
| `NEXT_PUBLIC_SITE_URL` | `https://www.anjitpariyar.com.np` | Site origin allowed by the bot guard |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | none | Supabase connection |

## Setup

1. Apply `supabase/migrations/20261125000000_portfolio_chatbot.sql` in the Supabase SQL editor. Optionally also apply `20261126000100_projects_optional_columns.sql` for project contribution, features, category and GitHub URL.
2. Review, then run `supabase/seed/portfolio_seed.sql`. It contains only facts already published on the site.
3. Set `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) in `.env.local` and on your host.
4. Optional, for chat logs: apply `20261126000200_chat_logs.sql`, then set `SUPABASE_SERVICE_ROLE_KEY` and `CHAT_LOG_SALT` on the server.
5. Run `bun run eval-chat` to test real conversations against your data.

Edits in Supabase reach the assistant within about 1 minute (server cache) and the cards on `/chat` within about 5 minutes (page revalidation, 30 s if projects failed to load). No redeploy is needed.

## Adding RAG later

- **Data access:** `ai/data/portfolioRepository.ts` defines `PortfolioRepository`. Swap the in-memory snapshot for SQL queries, semantic search or both.
- **Prompt context:** `ai/context/contextProvider.ts` defines `ContextProvider`. A RAG implementation would return only the relevant records, with the same `{ text, mode, records }` shape.

The chat service, tools, conversation handling and UI wouldn't change. Inject the new pieces through `createRepository` and `createContextProvider` in `ChatDeps`.

Once the prompt holds only some records, also make the validator require project, skill and experience ids to be among the disclosed records, as it already does for FAQs and sources.

## Costs and limits

- Each message costs one Gemini call, plus one more per tool round (usually none in `full` mode). The current portfolio adds about 3.6k input tokens per call.
- The rate limit is held in memory, so each server instance enforces it separately. Back `createRateLimiter` with Redis or a database table if you need a global cap.
- Visitor messages are sent to Google to generate answers and are logged by this site (see Chat logs). On Gemini's free tier, Google may use that data to improve its products.

## Tests

```
bun test features            # rule engine, context, tools, validation, orchestration, Gemini tool loop (fakes)
bun run eval-chat            # live conversations: references, cards, grounding, tool use, latency
bun run eval-chat --only=ID  # one eval case (see ai/eval/dataset.ts)
```

`eval-chat` makes real Gemini calls, which count against your quota.
