# TODOS (from adapter spec + eng review)

- [ ] **Design system:** add `DESIGN.md` (or run `/design-consultation`) using tokens in `docs/ui-v0.1-design.md` §5 — unlocks 10/10 on design system pass.
- [x] **v0.1 home layout:** **1A tool-first** — initial `app/page.tsx` + `app/globals.css` (interim tokens).
- [x] `Venue` Drizzle schema, `data/venues.seed.json`, `npm run db:seed`, `npm run db:push`.
- [x] `telegram` adapter: in-DB rank + `POST /api/recommendations`; in-memory rate limit (20/min/IP). **TODO:** TTL cache keys per spec §4.6.
- [x] README: privacy/retention baseline + Docker quick start.
- [ ] Web stack and CI: wire smoke tests to `~/.gstack/projects/distribution/*-eng-review-test-plan-*.md` acceptance criteria; add Vitest/Playwright when ready.
- [ ] (Optional) Bot API `getChat` **enrichment** for known usernames — only after v0.1 if you add row-level refresh jobs.
