# TODOS (from adapter spec + eng review)

- [ ] **Design system:** add `DESIGN.md` (or run `/design-consultation`) using tokens in `docs/ui-v0.1-design.md` §5 — unlocks 10/10 on design system pass.
- [ ] **v0.1 home layout:** **1A tool-first** (locked in `docs/ui-v0.1-design.md` §7) — implement as written.
- [ ] `Venue` DB migration, seed format (JSON/CSV), and first **curated** rows for v0.1.
- [ ] `telegram` adapter: rate limit + cache key implementation matching `AdapterSearchRequest` / `AdapterSearchResult` (no secrets in logs).
- [ ] README: privacy and retention (what is stored, TTL for cache) — from spec §8 and `/plan-eng-review` test plan.
- [ ] Web stack and CI: pick and document (Next.js, API layout, test runner) when implementation starts; wire smoke tests to `~/.gstack/projects/distribution/*-eng-review-test-plan-*.md` acceptance criteria.
- [ ] (Optional) Bot API `getChat` **enrichment** for known usernames — only after v0.1 if you add row-level refresh jobs.
