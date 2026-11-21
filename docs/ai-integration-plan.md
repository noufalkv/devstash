# AI Integration Plan: DevStash Pro AI Features

Plan for adding four Pro-only AI features to DevStash with the official OpenAI Node SDK: **auto-tagging**, **summaries**, **code explanation** and **prompt optimization**.

_Researched 2026-11-21 against the codebase on `main` (`3ab13b3`), the OpenAI API docs (via Context7, `developers.openai.com`) and the `openai` npm package (latest `7.62.0`)._

---

## 0. Read this first: `gpt-5-nano` shuts down on 2026-12-11

The research brief asks for `gpt-5-nano`. OpenAI's model page lists it as **Deprecated**, and the API reference gives an **announced shutdown date of 2026-12-11**, 20 days from now (same for `gpt-5-nano-2025-08-07`, `gpt-5-mini` and `gpt-5`). Any feature built on it would stop working within weeks of shipping.

OpenAI's guidance on the `gpt-5-nano` page: _"For most new speed- and cost-sensitive workloads, we recommend starting with GPT-6 Luna."_

| Model | Status | Input / 1M | Cached input / 1M | Output / 1M | Context | Reasoning effort values |
| --- | --- | ---: | ---: | ---: | --- | --- |
| `gpt-5-nano` | Deprecated, shutdown 2026-12-11 | $0.05 | $0.005 | $0.40 | 400K (272K input) | `minimal`, `low`, `medium`, `high` |
| `gpt-5.4-nano` | Deprecated, shutdown 2027-04-01 | $0.20 | $0.02 | $1.25 | — | — |
| **`gpt-6-luna`** | Current (released 2026-09-22) | $0.10 | $0.01 (cache writes $0.125) | $0.50 | 1.05M (922K input) | `none`, `low`, `medium`, `high`, `xhigh`, `max` |

**Recommendation:** read the model id from an env var (`OPENAI_MODEL`) so switching is a config change, and default it to `gpt-6-luna`. If you want to prototype on `gpt-5-nano` before 2026-12-11, set `OPENAI_MODEL=gpt-5-nano` locally. Everything else in this plan is model-agnostic, except the reasoning effort value (`minimal` for `gpt-5-nano`, `none` or `low` for `gpt-6-luna`), which the plan also keys off config.

Even at Luna's prices the per-call cost is a fraction of a cent (see section 7), so the move costs nothing meaningful against an $8/month subscription.

---

## 1. Current state

### What exists

| Piece | Where | Relevant to AI |
| --- | --- | --- |
| `OPENAI_API_KEY=""` | `.env.example:56` | The only AI trace. No `openai` package, no imports. |
| Pro flag on the session | `src/auth.ts` `jwt` callback re-reads `isPro` on every `auth()`; `session.user.isPro` | Gate check in actions |
| Gating helpers | `src/lib/usage-limits.ts`: `canUseProFeature(isPro)` returns `true` for Pro or when `ENFORCE_PRO_LIMITS !== "true"` | Use as-is for every AI action |
| UI gating precedent | `NewItemDialog` takes `canUploadFiles` (from `SessionTopBar`) and shows disabled options with a PRO badge plus an Upgrade link to `/upgrade` | Copy this for AI buttons |
| Rate limiting | `src/lib/rate-limit.ts`: Upstash sliding window, `RATE_LIMITS` map, `checkRateLimit(name, id)` **fails open** | Add AI limits; reconsider fail-open (section 5) |
| Action pattern | `src/actions/*.ts`: `auth()` → Zod `safeParse` → `try` query → `{ success, data, error }`; `billing.ts` returns a `GENERIC_ERROR` on third-party failures | Same shape for `src/actions/ai.ts` |
| Lazy third-party client | `src/lib/stripe.ts` `getStripe()`, `src/lib/r2.ts`: create on first use, throw "not configured" without a key | Same shape for `src/lib/openai.ts` |
| Item fields | `Item` has `title`, `description`, `content`, `language`, `url`, `tags` (many-to-many `Tag`) | No `summary` column |
| Forms that take tags/content | `item-edit-form.tsx` (drawer edit mode), `new-item-dialog.tsx`, tags as a comma-separated input | Where suggestions get accepted |
| Markdown rendering | `markdown-editor.tsx` (`react-markdown` + `remark-gfm`, no raw HTML) | Render explanations safely |
| Test pattern | Vitest with `vi.mock` + `vi.hoisted` for Prisma, `@/auth`, Stripe | Mock `@/lib/openai` the same way |

### Spec

`context/project-overview.md` lists AI auto-tag suggestions, AI summaries, "Explain This Code" and a prompt optimizer under **AI Features (Pro Only)**. It names "OpenAI GPT-4o Mini" in the tech stack; that model and the brief's `gpt-5-nano` are both superseded (see section 0).

---

## 2. SDK setup and configuration

### Package

```bash
npm install openai
```

`openai@7.62.0` declares `zod: ^3.25 || ^4.0` as a peer dependency, so it works with the project's `zod@^4.6.7`, including the `openai/helpers/zod` structured-output helper.

**Why the official SDK and not the Vercel AI SDK (`ai` + `@ai-sdk/openai`):** the spec and brief name the OpenAI SDK, none of the four features needs chat history or tool calling, and the official SDK gives typed errors (`OpenAI.RateLimitError` etc.) and `responses.parse` with Zod directly. The AI SDK is worth revisiting only if streaming UI (section 4) or multiple providers become important.

### API: Responses, not Chat Completions

Use `client.responses.create` / `client.responses.parse`. It is OpenAI's current API, all examples in the docs use it, and it supports `instructions`, `reasoning.effort`, `max_output_tokens`, structured outputs via `text.format`, and typed streaming events.

### Env vars (`.env.example`)

```bash
# OpenAI (AI features, Pro only)
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-6-luna"        # gpt-5-nano is deprecated (shutdown 2026-12-11)
OPENAI_REASONING_EFFORT="low"    # "minimal" for gpt-5-nano; "none"/"low" for gpt-6-luna
```

Never prefix with `NEXT_PUBLIC_`.

### `src/lib/openai.ts` (proposed)

Mirrors `getStripe()`:

```ts
import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI is not configured");
  // Interactive features: fail fast instead of the SDK's 10-minute default
  client ??= new OpenAI({ apiKey, timeout: 30_000, maxRetries: 1 });
  return client;
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getAiModel(): string {
  return process.env.OPENAI_MODEL || "gpt-6-luna";
}
```

SDK defaults to change: **timeout** is 10 minutes and **retries** are 2 (on 408/429/5xx/connection errors). A user waiting on a button wants an answer or an error within seconds, so cap both. Keep this file free of Next imports so it is testable under Vitest.

---

## 3. Server action patterns

### File layout

| File | Contents |
| --- | --- |
| `src/lib/openai.ts` | Client, model and config readers (above) |
| `src/lib/ai.ts` | Pure, testable pieces: input trimming, prompt builders, output Zod schemas, tag normalisation, error-to-message mapping, one `runStructured()` helper |
| `src/actions/ai.ts` | Four server actions, all `"use server"` |
| `src/lib/rate-limit.ts` | Add AI entries to `RATE_LIMITS` |

### Shared guard (the order matters)

Every AI action runs the same preamble, cheapest check first, so nothing reaches OpenAI unless all pass:

1. `auth()` → "You must be signed in"
2. `canUseProFeature(session.user.isPro)` → "AI features are a Pro feature" (plus `upgrade: true` so the UI can link to `/upgrade`)
3. `isAiConfigured()` → "AI is not available right now" (do not throw from `getOpenAI` into the user)
4. Zod `safeParse` of the input, including **max lengths**
5. `checkRateLimit("ai", userId)` → `rateLimitMessage(reset)`

```ts
"use server";

export interface AiActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  upgrade?: boolean;
  rateLimited?: boolean;
}

async function guardAi(): Promise<{ userId: string } | AiActionResult<never>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in" };
  if (!canUseProFeature(session.user.isPro)) {
    return { success: false, error: "AI features are a Pro feature", upgrade: true };
  }
  if (!isAiConfigured()) return { success: false, error: "AI is not available right now" };
  const { success, reset } = await checkRateLimit("ai", session.user.id);
  if (!success) return { success: false, error: rateLimitMessage(reset), rateLimited: true };
  return { userId: session.user.id };
}
```

(Run Zod validation before the rate-limit call so invalid input does not use up quota; the snippet keeps the guard compact.)

### Structured output helper (non-streaming)

`responses.parse` with `zodTextFormat` returns a typed `output_parsed`. Check the status: with reasoning models `max_output_tokens` caps reasoning **plus** visible output, and a low cap can return `status: "incomplete"` with nothing visible while you still pay for the tokens.

```ts
import { zodTextFormat } from "openai/helpers/zod";

export async function runStructured<T extends z.ZodType>(opts: {
  schema: T;
  name: string;
  instructions: string;
  input: string;
  maxOutputTokens: number;
  userId: string;
}): Promise<z.infer<T>> {
  const response = await getOpenAI().responses.parse({
    model: getAiModel(),
    instructions: opts.instructions,          // static text first → cache-friendly
    input: opts.input,                        // user content, delimited
    reasoning: { effort: getReasoningEffort() },
    max_output_tokens: opts.maxOutputTokens,
    store: false,                             // don't keep user snippets on OpenAI
    safety_identifier: hashUserId(opts.userId),
    text: { format: zodTextFormat(opts.schema, opts.name) },
  });
  if (response.status !== "completed" || !response.output_parsed) {
    throw new AiIncompleteError(response.incomplete_details?.reason);
  }
  return response.output_parsed;
}
```

- `safety_identifier`: OpenAI recommends a stable per-user id and says to hash it rather than send identifying data. Use a SHA-256 of `userId` (never the email).
- `store: false`: responses are not retained for later retrieval. Nothing here uses `previous_response_id`, so there is no downside.

### The four actions

| Action | Input (Zod) | Output schema | Effort / `max_output_tokens` | Where used |
| --- | --- | --- | --- | --- |
| `suggestTags({ title, description?, content?, url?, type, existingTags[] })` | title ≤ 200, content ≤ 12,000 chars (trimmed server-side), `existingTags` ≤ 20 | `{ tags: string[] }` (≤ 5) | low / ~800 | New Item dialog, edit form |
| `summarizeItem({ title, content, type })` | content 50–20,000 chars | `{ summary: string }` (1–2 sentences, ≤ 300 chars) | low / ~800 | Fills Description in the forms |
| `explainCode({ itemId })` | owned item id; type must be snippet or command | `{ explanation: string }` markdown | low–medium / ~2,000 | Drawer view mode |
| `optimizePrompt({ content })` | content 20–12,000 chars | `{ optimized: string, changes: string[] }` | medium / ~3,000 | Edit form for prompt items |

Design notes:

- **Tags and summary take form values, not an item id**, so they work in the New Item dialog before the item exists. Gating and rate limits still apply, and nothing is saved by the action.
- **Explain takes an item id** and loads the content with an owner-scoped query (reuse `getItemDetail(userId, id)`), because it runs from the read-only drawer. This also prevents the action becoming a general-purpose free proxy to the model.
- **Tag normalisation** (in `src/lib/ai.ts`, unit-tested): trim, lowercase, spaces → `-`, strip characters outside `[a-z0-9.+#-]`, max 30 chars, de-duplicate, drop tags already on the item. Pass the user's most-used existing tag names in the prompt so the model reuses them (`react` instead of `reactjs`), which keeps the tag table tidy.
- **No action writes to the database.** Results are suggestions; the user saves through the existing `createItem`/`updateItem`, which already validate tags and content. This keeps AI code out of the write path and needs no migration.

### Summaries without a migration

`Item` has no summary column. The `description` field already plays that role on every card, so the summary action proposes a description. If a separate, regenerable `aiSummary` is wanted later, that is a Prisma migration (`aiSummary String? @db.Text`, `aiSummaryAt DateTime?`) and an out-of-scope decision.

---

## 4. Streaming vs non-streaming

| Feature | Output size | Recommendation | Why |
| --- | --- | --- | --- |
| Auto-tag | ~5 words | **Non-streaming**, structured | Must be parsed as a list before it can be shown as chips; partial JSON is useless |
| Summary | 1–2 sentences | **Non-streaming**, structured | Short; arrives in ~1–3 s on a small model |
| Explain code | A few paragraphs | Non-streaming for MVP; **streaming is the one upgrade worth making** | Longest output, read top to bottom |
| Prompt optimizer | About the prompt's length | Non-streaming | The UI shows a before/after comparison, which needs the whole result |

### Why server actions for the MVP

Server actions are the codebase convention for client-triggered mutations and calls (`createCheckoutSession` is the closest analogue: client button → server action → third-party API → result). They give the session, CSRF protection via Next's action handling, and typed results with no extra route.

### If explain-code streaming is added later

Next's route handler docs show streaming LLM output from a **route handler** returning a `ReadableStream` (`Response(stream)`). That is the documented pattern; use it rather than trying to stream from a server action.

- `POST /api/ai/explain` (`src/app/api/ai/explain/route.ts`): same guard as the actions, then `client.responses.create({ ..., stream: true })`, forward only `response.output_text.delta` text as a plain-text stream, and close on `response.completed`. On an `error` event, end the stream with an error marker the client can detect.
- Pass `req.signal` to the SDK call (`{ signal: req.signal }` request option) so closing the drawer cancels the OpenAI request and stops billing for unused output.
- Return `401`/`403`/`429` JSON before starting the stream, using the existing `rateLimitResponse(reset)`.
- Add `/api/ai/*` handling to the session check inside the route; the route must do its own `auth()` check like `GET /api/items/[id]`.
- The client reads `response.body.getReader()` and appends text into the markdown renderer.

Do not mix approaches per feature without reason: one guard function in `src/lib/ai.ts` (taking `userId`/`isPro`) can serve both the actions and the route.

---

## 5. Error handling and rate limiting

### OpenAI errors → user messages

The SDK throws subclasses of `OpenAI.APIError` with `status`, `code` and `headers`. Map them in one function in `src/lib/ai.ts`; log the original server-side, return a short message (as `billing.ts` does with `GENERIC_ERROR`).

| Error | Cause | User message | Notes |
| --- | --- | --- | --- |
| `OpenAI.RateLimitError` (429), `code` `insufficient_quota` or `billing_hard_limit_reached` | Our account is out of credit | "AI is temporarily unavailable." | Permanent until topped up; never retry. Alert on it. |
| `OpenAI.RateLimitError` (429), other | OpenAI per-minute limits | "AI is busy. Try again in a moment." | SDK retry (`maxRetries: 1`) already ran |
| `OpenAI.APIConnectionTimeoutError` | Over our 30 s timeout | "That took too long. Try again." | |
| `OpenAI.APIConnectionError` | Network | "Could not reach the AI service." | |
| `OpenAI.AuthenticationError` (401), `PermissionDeniedError` (403) | Bad or revoked key | "AI is not available right now." | Configuration bug; log loudly |
| `OpenAI.BadRequestError` (400) | Invalid params, unsupported effort value for the model, oversized input | Generic message | Usually a deploy/config mismatch (e.g. `minimal` sent to `gpt-6-luna`) |
| `OpenAI.InternalServerError` (5xx) | OpenAI outage | "AI is temporarily unavailable." | |
| `status: "incomplete"` (`max_output_tokens`) | Budget too small | "Couldn't finish. Try with shorter content." | Raise the cap if it shows in logs |
| `status: "incomplete"` (`content_filter`) or a refusal | Model declined | "The AI couldn't process this content." | |
| `output_parsed` null | Unexpected shape | Generic message | |

All four actions wrap the call in `try/catch` and always return `{ success: false, error }`; they never throw to the client.

### Our own rate limits (Upstash)

Add to `RATE_LIMITS` in `src/lib/rate-limit.ts`, keyed by **user id** (not IP; the user is always signed in and Pro):

```ts
aiBurst: { limit: 10, window: "1 m" },   // stops click-spam and scripts
ai:      { limit: 100, window: "1 d" },  // daily cost ceiling per user
```

Check both in `guardAi`. Starting values; tune from usage. 100 calls/day at the worst-case per-call cost in section 7 is about $0.15/day per user, well inside the $8 subscription.

**Fail-open needs a decision for AI.** `checkRateLimit` deliberately lets requests through when Upstash is unconfigured or down, which is right for login (availability) but means an Upstash outage removes the only cost ceiling on a paid API. Options:

1. Add a `failClosed` option to `checkRateLimit` and use it for the AI limits in production (recommended).
2. Keep fail-open and rely on the OpenAI project budget (section 7) as the backstop.

### Client-side protections

- Disable the AI button while a request runs (`useTransition` `isPending`, as `BillingActions` does), and ignore results that arrive after the form or drawer has moved to another item (the item drawer already has this race for edit/favorite; check the item id before applying).
- Never call AI automatically (on typing, on open, on save). Every call is an explicit click.

---

## 6. Pro user gating

Gating happens **on the server in every action/route** (the guard above); the UI only mirrors it.

| Layer | Pattern | Existing precedent |
| --- | --- | --- |
| Action / route | `canUseProFeature(session.user.isPro)` before any OpenAI call; `upgrade: true` in the result | `createItem`, `POST /api/upload` (403) |
| Flag | `ENFORCE_PRO_LIMITS="true"` turns gating on; off in development, so every account can test AI | `isProGatingEnabled()` |
| Passing the capability to client components | Compute `canUseAi = canUseProFeature(isPro)` in the server component that already reads the session and pass it down, like `canUploadFiles` from `SessionTopBar` to `NewItemDialog` | `SessionTopBar` → `NewItemDialog` |
| UI for free users | Keep the AI buttons visible but disabled with the small outline `PRO` badge and an "Upgrade" link to `/upgrade` (teaches the feature exists) | File/Image in the New Item dialog |
| UI if AI is not configured | Hide the buttons entirely (`isAiConfigured()` on the server), so a missing key does not show broken controls | — |
| Pro → free downgrade | Nothing to clean up: AI results are ordinary saved fields | — |

Also gate on content type in the UI and the action: Explain only for snippet/command (`CODE_EDITOR_TYPES` in `src/lib/item-fields.ts`), Optimize only for prompt, Tags/Summary for text types and links (not file/image, whose content is not available as text).

---

## 7. Cost optimization

### Per-call estimate

Assumptions: instructions ~300 tokens, user content capped at 12,000 chars (~3,000 tokens), reasoning at low/minimal effort.

| Feature | Input tokens (typ. / max) | Output incl. reasoning (typ. / max) | `gpt-6-luna` cost (typ. / max) | `gpt-5-nano` cost (typ. / max) |
| --- | --- | --- | --- | --- |
| Auto-tag | 800 / 3,300 | 200 / 800 | $0.0002 / $0.0007 | $0.0001 / $0.0005 |
| Summary | 1,000 / 5,300 | 200 / 800 | $0.0002 / $0.0009 | $0.0001 / $0.0006 |
| Explain code | 1,000 / 3,300 | 800 / 2,000 | $0.0005 / $0.0013 | $0.0004 / $0.0010 |
| Optimize prompt | 800 / 3,300 | 1,200 / 3,000 | $0.0007 / $0.0018 | $0.0005 / $0.0014 |

A heavy Pro user making 300 calls a month costs roughly **$0.10–$0.50/month** on `gpt-6-luna`. AI cost is not a pricing risk at these volumes; runaway usage (scripts, bugs, loops) is, which the rate limits and budget address.

### Strategies, in order of impact

1. **Hard ceilings outside the code:** set a monthly budget and usage alerts on the OpenAI project, and use a key scoped to a project used only by DevStash.
2. **Per-user rate limits** (section 5), ideally fail-closed.
3. **Cap input and output:** trim content server-side before sending (head of the content plus a note that it was truncated), enforce Zod `max` lengths, set `max_output_tokens` per feature. Leave enough headroom that reasoning does not cut the answer off.
4. **Lowest useful reasoning effort:** `minimal` (`gpt-5-nano`) or `none`/`low` (`gpt-6-luna`) for tags and summaries; `low`–`medium` only for explain and optimize. Reasoning tokens are billed as output, the expensive side.
5. **Explicit, on-click calls only.** No auto-suggest while typing.
6. **Optional result cache:** key `ai:<feature>:<sha256(model + content)>` in the existing Upstash Redis with a TTL (e.g. 7 days), so re-opening "Explain" on an unchanged snippet is free. Only worth it if logs show repeat calls.
7. **Prompt caching** happens automatically, but the minimum cacheable prefix is about 1,024 tokens, and these instructions are ~300 tokens, so expect little or no benefit. Still put the static `instructions` first and user content last so the prefix stays identical.
8. **Batch / Flex** processing is 50% cheaper but slow; it does not suit interactive buttons. Consider it only for a future "tag all my items" bulk job.

---

## 8. UI patterns

All four features follow one rule: **AI proposes, the user decides, the existing Save persists.**

### Shared component: `AiButton`

Small ghost button with the Lucide `Sparkles` icon (already used for the Upgrade button and the prompt type), label per feature ("Suggest tags", "Summarize", "Explain", "Optimize"). States: idle, pending (spinner + "Thinking…", disabled), disabled-for-free (PRO badge + Upgrade link). Errors use a sonner toast, consistent with the rest of the app; the rate-limit message also goes in a toast.

### Auto-tag (edit form and New Item dialog)

- Button next to the Tags field.
- Suggestions appear as chips under the field, visually distinct (dashed border, sparkles icon).
- Each chip has accept (✓, adds to the tags input) and dismiss (✕). "Add all" and "Dismiss" act on the set.
- Suggestions already present in the tags input are not shown. Nothing is saved until the form's Save/Create.
- Loading: 3 skeleton chips.

### Summary (edit form and New Item dialog)

- Button next to the Description field label.
- If Description is empty: show the summary in a suggestion box under the field with **Use** / **Discard**.
- If Description has text: same box, with **Replace** / **Discard** (never overwrite silently).
- Loading: two skeleton lines in the suggestion box.

### Explain code (item drawer, view mode, snippets and commands)

- "Explain" in the drawer's content section header.
- Opens a collapsible "Explanation" panel below the code editor, rendered with the existing `react-markdown` setup (no raw HTML).
- Not saved. Includes a **Copy** button and, optionally, "Save to description" (which goes through `updateItem`).
- Loading: skeleton paragraph lines; if streaming is added, text appears progressively instead.
- Clear the panel when the drawer switches item.

### Prompt optimizer (edit form, prompt items)

- "Optimize" next to the content editor.
- Shows a comparison: original vs optimized (side by side from `md`, stacked on phones), plus the model's short list of `changes`.
- Actions: **Accept** (replaces the content in the form; Save still required), **Reject**, and **Copy**.
- Keep the original until the form is saved or cancelled, so Accept can be undone by Cancel.

### Accessibility

- Suggestion regions use `aria-live="polite"` so screen readers announce new suggestions.
- Accept/dismiss controls are real buttons with labels ("Add tag react", "Dismiss tag react").
- Disabled PRO buttons keep a focusable Upgrade link next to them, as the New Item dialog does for File/Image.

---

## 9. Security considerations

### API key

- `OPENAI_API_KEY` is read only in `src/lib/openai.ts`, which is imported only from server actions and route handlers. No `NEXT_PUBLIC_` prefix. Optionally add the `server-only` package import to `src/lib/openai.ts` so a client import fails the build.
- Use a **project-scoped** key with a budget, separate keys for development and production, and keep `.env` gitignored (it already is).
- Never log request bodies or the key; log only error class, status, code and the user id.

### Input handling

- Every action validates with Zod, including **maximum lengths**, before anything is sent.
- Explain loads content by owned item id (owner-scoped query), so users cannot use it on other users' items.
- Tags, summary and optimize take form values; they are bounded by length and only ever return a suggestion to the same user, so there is nothing to escalate to.

### Prompt injection

The model reads user-authored content that may contain instructions ("ignore previous instructions…"). The impact here is low, because the content is the user's own, the output goes back only to that user, the model has no tools and no data access, and nothing is applied without the user clicking Accept. Still:

- Put rules in `instructions` (developer role) and user content in `input`, wrapped in clear delimiters (`<content>…</content>`), with an instruction to treat it as data.
- Constrain output with structured outputs (Zod schemas with `max` lengths and counts).
- **Validate the output again server-side** (tag normalisation, length caps) before returning it.

### Output rendering

- Render explanations and optimized prompts with `react-markdown` without `rehype-raw`, so model output cannot inject HTML or scripts. Never `dangerouslySetInnerHTML`.
- Model-produced links in markdown open like any other user content; consider `rel="noopener noreferrer"` and `target="_blank"` for the explanation panel.

### Data privacy

- Snippets and commands often contain secrets (API keys, connection strings). Sending them to OpenAI is a data-sharing decision. Mention it in the privacy policy/terms, keep calls on-click only, use `store: false`, and consider a one-line notice under the AI buttons ("Content is sent to OpenAI to generate this").
- Optional hardening: redact obvious secret patterns (`sk-…`, `AKIA…`, `ghp_…`, `-----BEGIN … PRIVATE KEY-----`, `postgres://user:pass@`) before sending. Cheap, unit-testable, and worth it for the explain feature.
- Send a hashed user id as `safety_identifier`; never the email or name.

---

## 10. Testing

Follow the existing Vitest conventions (no component tests, no network):

- `src/lib/ai.test.ts`: tag normalisation, input trimming/truncation, secret redaction, error-to-message mapping (construct `OpenAI.RateLimitError` etc. or plain objects with `status`/`code`), `runStructured` handling of `incomplete` and null `output_parsed` (with `@/lib/openai` mocked).
- `src/actions/ai.test.ts`: mock `@/auth`, `next-auth`, `@/lib/openai`, `@/lib/rate-limit`, `@/lib/db/items`, and `@/lib/usage-limits` where needed. Cover signed out, free user with gating on (`upgrade: true`), gating off, not configured, invalid input, rate limited, success, and OpenAI failure → generic error. For `explainCode`, a non-owned or non-code item returns "Item not found".
- `src/lib/openai.test.ts`: "not configured" without a key, model default and override (like `src/lib/stripe.test.ts`).

Manual checks with a real key on `develop`: each feature end to end, a free account with `ENFORCE_PRO_LIMITS="true"`, the rate-limit message, and a revoked key.

---

## 11. Suggested phases

| Phase | Scope | Migration |
| --- | --- | --- |
| **1. Infrastructure** | `openai` package, `src/lib/openai.ts`, `src/lib/ai.ts` (guard, `runStructured`, error mapping, normalisation), AI rate limits (+ fail-closed decision), env vars, tests. No UI. | None |
| **2. Auto-tag + Summary** | `suggestTags`, `summarizeItem`, `AiButton`, chips and suggestion box in the edit form and New Item dialog, `canUseAi` plumbing | None |
| **3. Explain + Optimize** | `explainCode` (drawer panel), `optimizePrompt` (comparison view) | None |
| **4. Optional** | Streaming for Explain via `POST /api/ai/explain`, Redis result cache, secret redaction, persisted `aiSummary` | Only for `aiSummary` |

---

## 12. Decisions needed

1. **Model:** `gpt-6-luna` (recommended) or `gpt-5-nano` for a short prototype, given the 2026-12-11 shutdown.
2. **Rate limiting:** fail-closed for AI in production, or fail-open plus the OpenAI budget.
3. **Summaries:** fill `description` (no migration, recommended) or a separate `aiSummary` column.
4. **Secret redaction** before sending content: in phase 1, or later.
5. **Privacy notice** under the AI buttons and in the policy.

---

## Sources

- OpenAI API docs (via Context7, `/websites/developers_openai_api`): GPT-5 nano and GPT-6 Luna model pages, pricing, deprecations list in the Responses reference, structured outputs (`responses.parse`, `zodTextFormat`), streaming responses guide, reasoning guide (`max_output_tokens` and `incomplete`), rate-limits guide (error codes, retry guidance), prompt caching guide, flex processing (SDK timeout/retry defaults), Chat Completions reference (`safety_identifier`).
- `npm view openai` (7.62.0, peer `zod ^3.25 || ^4.0`).
- Next.js 16 bundled docs: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` (streaming from route handlers).
- Codebase: `src/lib/usage-limits.ts`, `src/lib/rate-limit.ts`, `src/lib/stripe.ts`, `src/actions/billing.ts`, `src/actions/items.ts`, `src/actions/auth.ts`, `prisma/schema.prisma`, `src/components/items/`, `.env.example`, `context/project-overview.md`.
