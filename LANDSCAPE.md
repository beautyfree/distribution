# External landscape and MVP fit

Generated: 2026-04-23. Scope: v0.1 = web flow (describe project, recommendations, drafts, checklist) + **Telegram adapter** + curated venue database. No auto-publishing in v0.1.

## Three theses from public discourse (2025–2026)

1. **Volume is the default answer.** Launch guides and directory roundups push **long lists** (dozens to 150+ “places to launch”) plus **multi-week checklists** (PH, HN, Reddit, tier-1 directories, then B2B review sites). The implied work is **manual repetition** or **paid bulk submission services**.

2. **Channel types are different jobs.** The same guides separate **spike traffic** (Product Hunt, Show HN), **long SEO** (listings, reviews), and **community** (value first, then link). A single undifferentiated “post everywhere” list **underperforms** a staged strategy.

3. **Telegram is not one thing.** “Find relevant Telegram” can mean **public group discovery** (with **strict anti-spam and admin rules** in many groups), **channel ads** (marketplaces and ad networks), or **DMs and cross-promo**. Conflating them produces bad UX and **real harm** (spam, bans) if the product pretends they are the same.

## How this MVP should respond (positioning, not code)

| Thesis | What the product does instead |
|--------|--------------------------------|
| 1. Long lists | **Ranked, explainable** venues: *why this place for this project* (fit, stage, language, effort), not a copy of “150 links”. |
| 2. Channel types | **Typed outputs**: e.g. launch platform vs community post vs “ask admin / read rules first” for tight groups. |
| 3. Telegram mix | **Adapter contract** that returns **candidates + evidence + rules summary**; UI labels **organic discussion vs paid placement** so users do not treat every row as “drop link and go”. |

## Differentiation (one line)

**Generic LLM:** broad advice, no durable sources. **Directory mills:** many forms, little fit. **This product:** **curated database** + **adapter-backed** discovery (Telegram first) + **drafts and checklist** tied to **each venue’s constraints**.

## Design risks to bake in early

- **Moderation and consent:** many groups ban unsolicited links. The UI should default to **“prepare message + check rules + contact admin if needed”**, not **mass outreach**.
- **Rate limits and ToS:** Telethon/bot usage and group search must stay **within platform rules**; show **stale data** warnings when using cache.
- **Trust:** show **source** (which index, which rule string, last seen time) for each Telegram hit.

## Next artifact (recommended)

A one-page **adapter spec** (input JSON, output shape, cache, `why` field) and a **venue entity schema** (name, type, language, self-promo policy, link pattern). This locks A + Telegram without scope-creeping into auto-post.
