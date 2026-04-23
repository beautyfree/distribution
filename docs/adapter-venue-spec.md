# Adapter and venue spec (v0.1)

Stack-agnostic contract for the **web + Telegram adapter** slice: how the app describes a project, how adapters return candidates, and how **venues** are stored for ranking and copy.

**Out of scope for v0.1:** automatic publishing, user OAuth to Telegram, posting on behalf of the user.

---

## 1. Core concepts

| Term | Meaning |
|------|--------|
| **Project brief** | User's natural-language description of the product, audience, and links. |
| **Venue** | A curated or discovered place where posting is allowed: catalog, community chat, directory, etc. |
| **Adapter** | Pluggable module that **enriches** the universe of venues using external systems (e.g. Telegram). |
| **Recommendation** | A **venue** plus **evidence** (why it matches), **suggested post variants**, and **checklist** items. |

---

## 2. `ProjectBrief` (input to the engine)

```jsonc
{
  "schema_version": "1.0",
  "title": "string, required",
  "summary": "string, required, plain text",
  "target_audience": "string, optional",
  "links": ["https://..."],
  "tags": ["indie", "devtool", "oss"],
  "language": "en|ru|...",
  "locale_hint": "optional, e.g. EU, CIS"
}
```

---

## 3. `Venue` (storage model)

**Purpose:** long-lived row used for search, ranking, and “safe” suggestions. Adapters may **suggest** venues not yet in DB; ingestion policy decides whether to persist or treat as ephemeral.

| Field | Type | Notes |
|------|------|--------|
| `id` | UUID | Stable ID. |
| `slug` | string | URL-safe, unique. |
| `name` | string | Display name. |
| `type` | enum | `community_chat`, `directory`, `newsletter`, `social`, `other`. |
| `source` | enum | `curated`, `import`, `adapter_telegram`, … |
| `url` | string, nullable | Canonical link. |
| `description` | text | For humans and embedding text. |
| `language` | string, nullable | BCP-47. |
| `region` | string, nullable | e.g. `CIS`, `Global`. |
| `rules_url` | string, nullable | Link to rules / “how to post”. |
| `requires_approval` | bool | Default false. |
| `is_nsfw_or_restricted` | bool | For filtering. |
| `scoring_weight` | float | Curator / ML tuning; default 1.0. |
| `last_verified_at` | datetime, nullable | Human or job verification. |
| `tags` | string[] | Optional topic tags for filter and search (e.g. `indie`, `oss`). |
| `metadata` | JSON | Free-form: Telegram chat id, invite policy, etc. (see §5). |
| `created_at` / `updated_at` | datetime | Audit. |

**Indexes to plan early:** `type + language`, `source`, GIN on `tags` (if used), `metadata` (GIN or provider-specific) per DB.

---

## 4. Adapter contract (all adapters)

### 4.1 Methods

| Method | Returns | Use |
|--------|--------|-----|
| `capabilities()` | `AdapterCapabilities` | What this adapter can do. |
| `search(query: AdapterSearchRequest)` | `AdapterSearchResult` | Find or rank **external** candidates. |
| `health()` | `AdapterHealth` | Liveness, quota, last error. |

### 4.2 `AdapterCapabilities`

```jsonc
{
  "adapter_id": "telegram",
  "version": "1.0.0",
  "modes": ["search"],
  "rate_limit_per_minute": 20,
  "notes": "optional"
}
```

### 4.3 `AdapterSearchRequest`

```jsonc
{
  "request_id": "uuid",
  "project_brief": { /* ProjectBrief */ },
  "query_text": "string, optional, preprocessed keywords",
  "max_results": 20,
  "context": {
    "locale": "en",
    "include_global": true
  }
}
```

`query_text` may be produced by the host app (e.g. extract keywords from `ProjectBrief`).

### 4.4 `AdapterSearchResult`

```jsonc
{
  "request_id": "uuid",
  "status": "ok|partial|error",
  "items": [ /* AdapterCandidate, see 4.5 */ ],
  "error": { "code": "string", "message": "string" }  // if status=error
}
```

### 4.5 `AdapterCandidate` (per item)

| Field | Type | Notes |
|--------|------|--------|
| `external_id` | string | Stable within adapter (e.g. chat username + id). |
| `title` | string | |
| `url` or `invite_hint` | string, nullable | Public URL, t.me, or how to find it. |
| `snippet` | string | Why it might match (from search API or heuristics). |
| `scores` | object | e.g. `{ "relevance": 0.0-1.0, "safety": 0.0-1.0 }` |
| `provenance` | string | e.g. `tg_search`, `tg_inferred`. |
| `suggested_venue` | object, optional | Partial `Venue` to merge if ingested. |

Host app **merges** candidates with curated `Venue` rows, deduplicates, then runs ranking.

### 4.6 Operational rules

- **Timeouts:** adapter calls have a **hard cap** (e.g. 10–30s); return `partial` with what you have.
- **Caching:** per `(adapter_id, normalized query)` with TTL; store **no** message bodies if policy requires minimal retention.
- **Idempotency:** `request_id` is logged; duplicate UI submits should not double-charge rate limits.
- **Secrets:** adapter reads creds from env/secret store; **never** log tokens.

---

## 5. Telegram adapter (v0.1)

**Goal:** return **candidates** that look like public chats/supergroups/channels relevant to the brief, not post on behalf of the user.

### 5.1 Implementation options (status for v0.1)

**Decision (2026-04-23, eng review):** v0.1 uses the **curated-DB + match/rank** model only. The Telegram `search()` implementation **must not** call third-party or Telegram-wide “find any public group” services unless product and ToS are explicitly revisited. Rationale: the Bot API does not expose a global public-chat search; off-platform “discovery” APIs are a separate product and legal review surface.

- **A — Curated + match in DB (v0.1, locked):** the adapter **ranks and explains** `Venue` rows (and optional pre-imported public metadata you control) using `ProjectBrief` + `query_text` against fields you store (`title`, `description`, `tags`, etc.). This is the honest “Telegram” slice for v0.1. Document behavior in the `adapter_id: telegram` README and in `docs/telegram-strategy.md`.
- **B — Enrichment via Bot API (post-v0.1 or optional if needed):** `getChat` and similar for usernames you **already** store, to refresh titles/member visibility flags — not used as a global discovery source.
- **C — Userbot / MTProto “search Telegram” (not in scope):** high **ToS, legal, and account** risk; not a default for OSS.
- **D — Third-party directory API (deferred):** if added later, requires its own allowlist, keys, and compliance line in the README.

Document the chosen path in `adapter_id: telegram` README.

### 5.2 `metadata` (when `type` = `community_chat` and `source` = `adapter_telegram`)

```jsonc
{
  "telegram": {
    "username": "optional, without @",
    "chat_id": "optional, if known and safe to store",
    "is_public": true
  }
}
```

### 5.3 Disclaimers to show in UI

- “Suggestions are not endorsed by the venue moderators. Read each community’s rules before posting.”
- “Do not spam; this tool only suggests where to look.”

---

## 6. `Recommendation` (API response to the web)

```jsonc
{
  "recommendation_id": "uuid",
  "venue": { /* full Venue, merged + ranked */ },
  "evidence": ["string bullets for the user"],
  "draft_posts": [
    { "locale": "en", "tone": "short", "body": "..." }
  ],
  "checklist": [
    { "id": "read_rules", "label": "Read posting rules", "done": false },
    { "id": "join_if_needed", "label": "Join / request access if required", "done": false }
  ],
  "sources": ["curated|adapter:telegram|…"]
}
```

---

## 7. Ranking (minimal v0.1)

1. Filter: language, `is_nsfw_or_restricted`, `requires_approval` if user wants “low friction” mode.
2. Score: `relevance` from model or keyword + `scoring_weight` + adapter scores.
3. Diversify: top-N with cap per `type` / `source` to avoid 10x Telegram.

---

## 8. Checklist: before implementation

- [x] Decide Telegram strategy (§5.1) and write one paragraph in `docs/telegram-strategy.md`.
- [ ] Define `Venue` migration and seed format (CSV/JSON) for first curated rows.
- [ ] Define rate limits and cache keys for `telegram` adapter.
- [ ] Add privacy + retention line to README (what you store, how long).

---

*Generated to unblock v0.1: web + base + Telegram adapter, no auto-post.*
