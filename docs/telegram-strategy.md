# Telegram strategy (v0.1)

**Locked 2026-04-23** after `/plan-eng-review` decision.

## What the product does

- The `telegram` adapter in v0.1 **ranks and explains** venues you already have in the database (curated, imported, or pre-seeded public **metadata** you are allowed to store and match on).
- Matching is against stored fields: **title, description, tags, language, region,** plus optional embeddings off those fields, driven by the **Project Brief** and optional `query_text`.
- The app **does not** present “we searched all of Telegram” or rely on a global Telegram-wide search API from a bot. That matches how the real Bot API works: no global public-chat search for server bots; discovery in the wild is usually **indexes you build**, **curated lists,** or **third parties** (each is its own product and ToS problem).

## What the product does not do (v0.1)

- No automatic posting, no user OAuth, no “mass outreach” flows (see `adapter-venue-spec.md` scope).
- No userbot/MTProto requirement for a default OSS install.
- No mandatory integration with external directory APIs. If you add one later, treat it as a new adapter or a licensed integration with a written compliance section in the README.

## UX

Show the same disclaimers as in `docs/adapter-venue-spec.md` §5.3. Label rows by **provenance** (`curated`, `adapter:telegram` over curated data) so users know suggestions are from **your** index, not a neutral search of the whole network.
