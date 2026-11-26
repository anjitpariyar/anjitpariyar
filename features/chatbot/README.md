# Portfolio assistant (`/chat`)

A Gemini-powered portfolio assistant that answers from published Supabase data. There's no RAG, vector database or embeddings: the portfolio is small, so Gemini reads it directly and can call read-only functions for specific records.

## Request lifecycle

```
Visitor question
  → POST /api/chat                      validate body (Zod), size limit, rate limit
  → published portfolio data            cached 60 s, anon key (RLS); see server/knowledgeStore.ts
  → system prompt + portfolio context   ai/context/, ai/llm/prompts.ts
    + bounded history + recent context  engine/conversationManager.ts
  → Gemini (structured JSON output)     ai/llm/geminiProvider.ts
      ⇄ function calls (optional)        ai/tools/portfolioTools.ts → ai/data/portfolioRepository.ts
  → validate response                   engine/responseValidator.ts
  → React component registry            components/BlockRenderer.tsx
```

If Gemini is missing, over quota, failing or returns an unusable answer, the request is answered by the rule-based engine in `engine/`, using the same data. Those replies are labelled "Basic mode".

## Context strategy

`CHAT_CONTEXT_MODE` (default `auto`):

| Mode | Prompt contains | When |
|---|---|---|
| `full` | every published record in full (≈3.6k tokens for the current portfolio) | small portfolios |
| `overview` | profile, skills, experience, plus a project and FAQ catalog; details come from tools | larger portfolios |
| `auto` | `full` while it fits within `CHAT_FULL_CONTEXT_MAX_CHARS` (40k), otherwise `overview` | default |

## Function calling

These tools are declared to Gemini and run on the server (`ai/tools/portfolioTools.ts`):

`getProfile()` · `getProjects()` · `getProjectDetails(projectId)` · `searchProjectsByTechnology(technology)` · `getSkills(category?)` · `getExperience()` · `getFAQs(category?)`

- The server owns the tool list; the model only picks a name and arguments.
- Arguments are validated with strict Zod schemas, so unknown keys, out-of-range ids and invalid categories are rejected. Errors go back to the model as data, so it can recover.
- Tools only read published data through the repository. There's no SQL or code execution path.
- A message can use at most `CHAT_MAX_TOOL_ROUNDS` (3) rounds of tool calls. After that the model has to answer.
- Gemini 3 models accept tools and a JSON schema in the same call. If a model rejects that, the provider switches to two calls (tools first, then the JSON answer) and remembers the choice.

## Validation of model output
- Only the 7 approved block types are rendered: `text`, `project_list`, `project_detail`, `skill_grid`, `experience_list`, `contact_card` and `faq_card`.
- Every record id must exist in the published data and must have been shown to the model this turn, either in the prompt or in a tool result. The same applies to cited sources.
- The answer text is stripped of markdown and rendered as plain React text, never as HTML.

## Follow-up questions

Each request carries:
- the last 8 turns of history. Assistant turns are summarized with `[Cards shown: Title (id N)]` so references like "that one" resolve correctly.
- a "recent context" line naming the projects shown last, in order.

The model keeps no memory between calls. History and context live in the visitor's localStorage, and the server re-validates the ids and caps the lengths.

## Adding RAG later

- **Data access:** `ai/data/portfolioRepository.ts` defines `PortfolioRepository`. Swap the in-memory snapshot for SQL queries, semantic search or both.
- **Prompt context:** `ai/context/contextProvider.ts` defines `ContextProvider`. A RAG implementation would return only the relevant records, with the same `{ text, records }` shape.

The chat service, tools, validator, conversation handling and UI wouldn't change. Inject the new pieces through `createRepository` and `createContextProvider` in `ChatDeps`.

## Setup

1. Apply `supabase/migrations/20261125000000_portfolio_chatbot.sql` in the Supabase SQL editor. Optionally also apply `20261126000100_projects_optional_columns.sql` for project contribution, features, category and GitHub URL.
2. Review, then run `supabase/seed/portfolio_seed.sql`. It contains only facts already published on the site.
3. Set `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) in `.env.local` and on your host. See `.env.example`. No service-role key is needed.
4. Run `bun run eval-chat` to test real conversations against your data.

Edits in Supabase reach the assistant within about 1 minute, and the cards on `/chat` within about 5 minutes. No redeploy is needed.

## Costs and limits
- Each message costs one Gemini call, plus one more per tool round. The current portfolio adds about 3.6k input tokens per call; Gemini may cache that part automatically because it's the same every turn.
- The rate limit (10 per minute and 60 per hour per IP by default) is held in memory, so each server instance enforces it separately. Back `createRateLimiter` with Redis or a database table if you need a global cap.
- Visitor messages are sent to Google to generate answers and are not stored by this site. On Gemini's free tier, Google may use that data to improve its products.

## Tests
```
bun test features    # rule engine, context, tools, validation, orchestration, Gemini tool loop (fakes)
bun run eval-chat    # live conversations: references, cards, grounding, tool use, latency
```
