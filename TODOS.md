# TODOS (from adapter spec + eng review)

- [ ] `Venue` DB migration, seed format (JSON/CSV), and first **curated** rows for v0.1.
- [ ] `telegram` adapter: rate limit + cache key implementation matching `AdapterSearchRequest` / `AdapterSearchResult` (no secrets in logs).
- [ ] README: privacy and retention (what is stored, TTL for cache) — from spec §8 and `/plan-eng-review` test plan.
- [ ] Web stack and CI: pick and document (Next.js, API layout, test runner) when implementation starts; wire smoke tests to `~/.gstack/projects/distribution/*-eng-review-test-plan-*.md` acceptance criteria.
- [ ] (Optional) Bot API `getChat` **enrichment** for known usernames — only after v0.1 if you add row-level refresh jobs.
