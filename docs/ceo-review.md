# CEO plan review — distribution v0.1

**When:** 2026-04-23  
**Branch:** `master`  
**Inputs:** `LANDSCAPE.md`, `docs/adapter-venue-spec.md`, `docs/telegram-strategy.md`, `docs/ui-v0.1-design.md`, `TODOS.md`, `CLAUDE.md`  
**No `/office-hours` design doc** under `~/.gstack/projects/distribution/` (gstack design artifact path empty). This review used repo docs as the source of truth.

**Default locks for this document (confirm or override via chat):** **HOLD SCOPE** + **Approach A (minimal monolith)**. If you pick another mode or approach, update this header and re-run `gstack-review-log` for `plan-ceo-review`.

---

## External check (three layers)

**Layer 1 (tried and true):** Curated launch surfaces and staged channel mix beat undifferentiated “post everywhere” lists. Quality and rules-aware posting match how serious makers work.

**Layer 2 (search, 2026):** Curated weekly cohorts (e.g. [IndieHunt Studio](https://indiehunt.io/studio/curated-launch-platforms-vs-open-submission-platforms-2026-03-28), [Smol Launch](https://smollaunch.com/compare/smol-launch-vs-betalist)) stress vetting and community engagement; bulk directory roundups stress volume and SEO tiers ([SmartPostly launch map](https://www.smartpostly.com/blogs/high-authority-product-launch-platforms-with-dr-to-promote-your-startup-ai-tool/)). Reddit-style mega lists exist but push “customize per channel” and authenticity warnings ([example thread](https://www.reddit.com/r/Startup_Ideas/comments/1r72h2j/the_2026_product_distribution_checklist/)).

**Layer 3 (first principles):** Your wedge is **fit + explainability + trust on Telegram**, not raw list length. That stays correct. Risk is **looking like another LLM listicle app**; `LANDSCAPE.md` + `docs/ui-v0.1-design.md` already push against that.

---

## Step 0 — Nuclear scope challenge

### 0A Premise challenge

1. **Right problem?** Yes for a narrow v0.1: “where should I post this project, with honest Telegram handling and copy I can adapt.” A wrong framing would be “replace all launch research” or “global Telegram search.” You already cut those in `docs/telegram-strategy.md`.

2. **Outcome:** User leaves with **ranked venues**, **evidence**, **drafts**, **checklist**, and **clear provenance**. The plan maps to that.

3. **Do nothing?** Pain stays: generic advice, spam-prone Telegram advice, no durable venue rows. Real pain for makers who care about rules.

### 0B Existing leverage

- **Docs are the product spec** until code lands. Reuse them as acceptance source for CI later (`TODOS.md` already points at eng review test plan path).
- **No duplicate engine:** do not build a second “recommendation JSON” outside `docs/adapter-venue-spec.md`. Code should implement that contract.

### 0C Dream state (12 months)

```text
CURRENT (docs)          THIS PLAN (v0.1)                 12-MONTH IDEAL
-----------             ----------------                 --------------
Specs + positioning  →  Working web + DB + telegram   →   Multiple adapters,
no shipped app           adapter + curated seed          provenance at scale,
                                                         optional paid data,
                                                         observability and
                                                         retention policy proven
```

### 0C-bis Implementation alternatives (mandatory)

**APPROACH A: Minimal monolith (RECOMMENDED)**  
Summary: One Next.js (or similar) app, server actions or route handlers, one Postgres, `telegram` adapter in-repo, smoke tests in CI.  
Effort: **M** human-weeks → **S** with strong AI assist.  
Risk: **Low**.  
Pros: Few moving parts, matches `TODOS.md` “pick stack when implementation starts,” fast path to dogfood.  
Cons: Can get messy if you defer boundaries; mitigate with `lib/adapters/` package boundary from day one.  
Reuses: Spec only today.

**APPROACH B: API service + thin web client**  
Summary: Separate HTTP API (venues, search, brief) and a SPA or Next front-end.  
Effort: **L**.  
Risk: **Med** (two deployables, CORS, auth story if you add multi-user later).  
Pros: Clear separation if you expect third-party clients.  
Cons: Overkill for v0.1 with no external API consumers yet.  
Reuses: Same spec.

**APPROACH C: UI shell first, mocked adapter**  
Summary: Ship static UI with fixture JSON, wire Telegram second.  
Effort: **S** for UI demo, **M** to real data.  
Risk: **Med** (fixture drift, false confidence).  
Pros: Fast visual proof.  
Cons: Violates “boil the lake” for trust-heavy Telegram unless fixtures mirror real failure modes.  
Reuses: `docs/ui-v0.1-design.md` states.

**RECOMMENDATION:** **Approach A** — smallest number of failure surfaces, matches HOLD scope, aligns with “engineered enough” without two deployables before you need them.

### 0D Mode-specific (confirmed: HOLD SCOPE)

1. **Complexity:** First implementation wave should stay under **8 primary files** for core flow if possible (brief form, search handler, adapter interface, telegram impl, db access, types from spec). New “services” only when a second adapter appears.

2. **Minimum set:** `Venue` persistence + seed + `telegram.search` + one web path + README privacy. Optional enrichment stays in `TODOS.md` as today.

### 0E Temporal interrogation (decide before code)

| When | Decision that should not wait |
|------|-------------------------------|
| Hour 1 | ORM vs SQL, where `AdapterSearchRequest` is validated (zod / typebox), log redaction rules |
| Hour 2–3 | Partial adapter timeout UX vs hard fail, cache TTL default, idempotency key for search |
| Hour 4–5 | Checklist persistence: session vs `localStorage` (UI doc says pick) |
| Hour 6+ | Metrics: `adapter_search_latency_ms`, `adapter_search_errors_total`, provenance labels in logs |

### 0F Mode selection (your call)

Skill options: **EXPANSION**, **SELECTIVE EXPANSION**, **HOLD SCOPE**, **SCOPE REDUCTION**.  
**Draft in this file:** **HOLD SCOPE** until you override.

---

## Section 1 — Architecture

**ASCII — system (v0.1)**

```text
[Browser]
   │  HTTPS
   ▼
[Next app — server]
   │  reads/writes
   ▼
[Postgres — venues, cache metadata, optional search vectors]
   │
   ▼
[telegram adapter module — v0.1: in-process rank/match over Venue rows]
   │  (no global Telegram “discovery”; optional post-v0.1 getChat refresh only)
   ▼
[(optional later) Telegram Bot API — getChat etc., not v0.1 default path]
```

**Coupling:** Keep adapter behind the interface in `docs/adapter-venue-spec.md` §4. Do not let HTTP handlers import Telegram SDK types directly.

**Scaling:** v0.1 is human-scale. First break: uncached adapter calls or N+1 venue loads. Mitigate with indexes from spec §3 and a single query per recommendation page.

**Security boundary:** Server holds bot token. Never send token to browser. Never log token or raw chat payloads.

**Rollback:** No migration before reversible migrations; feature flag optional for `telegram` adapter if you want kill switch.

---

## Section 2 — Error and rescue map (plan-level)

| Codepath | What can go wrong | Class / kind | Rescued? | User sees | Log |
|----------|-------------------|--------------|----------|-----------|-----|
| `adapter.search` | Slow DB / rank path | Timeout | Y | Partial results + stale notice | yes |
| `adapter.search` | (If Option B later) Bot API 429 | Rate limit | Y | Backoff + partial or retry banner | structured, no secrets |
| `adapter.search` | Malformed internal JSON | Parse | N unless handled | Friendly error, not raw | error + snippet hash only |
| `adapter.search` | Empty candidates | Valid empty | Y | Designed empty state | info |
| DB read venues | Connection drop | DB | retry pool | “Try again” | error |
| Clipboard copy | Permission denied | DOM | N | Inline “Copy failed” | optional client log |

**Gap to close in implementation:** forbid `catch (Exception)` / `except Exception` swallow in adapter glue. Name errors per row in Section 2 table.

---

## Section 3 — Security and threat model

| Threat | L / I | Mitigation in plan |
|--------|-------|-------------------|
| Token leak via logs | H / H | Spec + README: redaction; code review gate |
| User tricks server into mass DM | M / H | v0.1 has no outbound post; still document “no automation” in README |
| Prompt injection via brief fields | M / M | Treat brief as data, not instructions to model if you add LLM later; escape in UI |
| IDOR on venue rows | L / H | Single-tenant v0.1 OK; document future authz |

---

## Section 4 — Data flow and UX edge cases

**ASCII — brief to recommendation**

```text
INPUT (brief JSON)
  │ validate (nil, empty string, too long, wrong types)
  ▼
TRANSFORM (normalize language, trim, cap list sizes)
  │ on failure → 400 + field errors
  ▼
ADAPTER search(curated + telegram)
  │ nil path: missing optional fields → defaults
  │ empty path: no venues → empty UI state
  │ error path: adapter status error → banner + log
  │ partial: return partial + reasons
  ▼
OUTPUT (Recommendation[])
```

**Interactions:** double submit → disable button + idempotency or in-flight guard; navigate away mid-request → abort fetch; 10k rows → paginate or cap with “showing top N.”

---

## Section 5 — Code quality (forward-looking)

- One module per adapter; shared types generated or hand-copied from spec JSON examples.
- DRY: ranking helpers one place.
- Cyclomatic: keep `search()` under branch budget or split private helpers.

---

## Section 6 — Tests (plan)

**New flows to cover**

| Item | Happy | Failure | Edge |
|------|-------|---------|------|
| Brief validation | valid brief passes | missing title | max length summary |
| Adapter search | returns ranked | DB timeout then retry | partial |
| UI list | renders rows | API 500 | zero results |

**Friday 2am test:** one E2E: submit real-shaped brief against stubbed adapter in CI, assert disclaimer + provenance text present.

**Chaos:** kill Postgres mid-request, assert user message not 500 raw.

---

## Section 7 — Performance

- Index per `docs/adapter-venue-spec.md` §3.
- Cache adapter responses with TTL from README once written.
- p99 target for search: state a number in implementation plan (e.g. `<3s` total server time) and measure.

---

## Section 8 — Observability

- Metrics: search count, latency histogram, adapter error by code.
- Logs: `request_id`, `adapter_id`, never token.
- Runbook stub: “Telegram returns 401” → rotate token checklist.

---

## Section 9 — Deployment and rollout

- Migrations: additive first.
- Order: migrate → deploy → verify `/health` adapter field if exposed.
- Post-deploy: smoke script from `TODOS.md` eng review path when it exists.

---

## Section 10 — Long-term trajectory

- **Debt:** fixture drift if you choose Approach C.
- **Reversibility:** 4/5 for swapping Approach A to B behind same HTTP contract if you keep adapter boundary clean.
- **12-month:** second adapter, user accounts, audit log for curator edits.

---

## Section 11 — Design and UX (CEO lens)

- IA, states, journey, slop risk: already tightened in `docs/ui-v0.1-design.md` with **1A tool-first** lock.
- **Recommendation:** keep `/plan-design-review` output as the UI contract until `DESIGN.md` exists.

**ASCII — user flow**

```text
LAND → enter brief → SUBMIT → loading → RESULTS (list + disclaimers)
  │                              │
  └──── error banner ←───────────┘
  └──── empty state ─────────────┘
```

---

## NOT in scope (explicit)

- Auto-posting, OAuth, global Telegram “discovery,” paid bulk submission, userbots as default.

## What already exists

- Written contracts and positioning (`LANDSCAPE.md`, adapter spec, Telegram strategy, UI plan, `TODOS.md`).

## Dream state delta

- After v0.1: you have **proven** cache + privacy story and **one** happy path users repeat. Gap to 12-month ideal is multi-adapter + ops maturity.

## Failure modes registry (summary)

| Codepath | Failure | Rescued | Test | User sees | Logged |
|----------|---------|---------|------|-----------|--------|
| search | timeout | planned | needed | partial banner | yes |
| search | 500 from server rank path | planned | needed | error | yes |

Any row with rescued=N and user sees silent → **fix before ship**.

---

## Outside voice (Codex exec, 2026-04-23)

Second model (`codex exec`, repo-only prompt). **Tension vs this file:** Codex correctly flagged that Sections 1–2 above still read like live Bot API discovery; v0.1 is **curated-DB rank only** per `docs/adapter-venue-spec.md` §5.1 and `docs/telegram-strategy.md` — the architecture diagram and Section 2 table were revised in the same pass to match.

**Findings**

- `High`: The plan is still built around a live Telegram Bot API dependency that the repo explicitly removed from v0.1. The system diagram, failure map, tests, and ops all assume Bot API calls, 429s, 401s, and partial external results, but the actual contract says v0.1 `telegram.search()` only ranks rows already in your DB and must not do Telegram-wide or third-party discovery. That is not wording drift; it is the wrong architecture. (Addressed for diagram/table in-repo; tests/ops prose still audit against §5.1.)

- `High`: The seed corpus is the product, and the plan still treats it like setup. Once Telegram is locked to curated-DB ranking, there is no discovery escape hatch. If you do not define source, minimum corpus size, licensing/compliance, verification workflow, and freshness policy for curated rows, you ship an empty or untrustworthy directory with nicer UI. Calling this “0 critical gaps” is wrong.

- `High`: The plan promises `evidence`, `drafts`, and `checklist`, but there is no subsystem responsible for producing them. The architecture and minimum scope only cover storage, search, one page, and privacy. If drafts are deterministic templates, say so. If they are LLM-backed, that is a missing dependency, safety surface, and cost model. Right now it is hidden scope.

- `Medium`: The test plan is aimed at the wrong failures. You have operational-error coverage, but almost nothing for recommendation quality. A system can pass the planned validation/429/API-500 tests and still recommend bad venues, stale rules, or useless evidence. There is no golden dataset, no ranking acceptance bar, no metadata freshness audit, and no reviewer loop for rules correctness. That is the actual trust risk.

- `Medium`: Even the “minimal monolith” is probably overbuilt for what v0.1 now is. You do not have auth, multi-user writes, background jobs, or real Telegram network search. A versioned seed plus SQLite/FTS or even a checked-in corpus would prove the value loop faster and force focus onto the hard part: corpus quality. The review only compared monolith vs split service and missed the actually simpler option.

- `Medium`: The strategic wedge is weaker than the review admits. `LANDSCAPE.md` sells “adapter-backed discovery, Telegram first,” but the locked implementation is “rank our own curated Telegram rows.” That can still be useful, but it is not discovery. If the moat is not proprietary corpus quality and freshness, this is too easy to clone and too annoying to maintain. The review never forced that call.

**Open Questions**

- What is the non-embarrassing launch threshold for the curated corpus: count, coverage, freshness, and rule accuracy?
- Are `draft_posts` deterministic templates or LLM output?
- If corpus curation is the real work, why is the plan centered on adapter/ops mechanics instead of corpus acquisition and QA?

---

## Completion summary (confirmed 2026-04-23)

| Item | Value |
|------|--------|
| Mode | HOLD SCOPE |
| Approach | A — minimal monolith |
| Sections 1–11 | Addressed in this file |
| Critical gaps | **Plan layer:** corpus + evidence/drafts/checklist ownership still need explicit decisions (outside voice 2026-04-23); **0** on infra-only reading if you ignore product-data risk |
| CEO plan file under `~/.gstack/.../ceo-plans/` | Skipped (HOLD; no expansion ceremony) |

---

*End of CEO review. Confirm mode and approach in-repo or reply in chat; then run `~/.claude/skills/gstack/bin/gstack-review-log` with your final `MODE` and counts.*
