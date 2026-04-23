# distribution

Web app: describe a project → ranked **venues** with evidence, draft text, and a per-venue checklist. v0.1 uses a **Postgres** curated index; the `telegram` adapter **only ranks rows already in your database** (see `docs/telegram-strategy.md` and `docs/adapter-venue-spec.md` §5.1).

## Prerequisites

- Node 20+
- Docker (optional, for local Postgres) or any Postgres 16 instance

## Quick start

1. **Database**

   ```bash
   docker compose up -d
   cp .env.example .env
   ```

   Adjust `DATABASE_URL` in `.env` if your Postgres differs.

2. **Schema and seed**

   ```bash
   npm install
   npm run db:push
   npm run db:seed
   ```

3. **Dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Submit a brief; results come from seeded venues matching `language` (or `language IS NULL`).

4. **Health**

   `GET /api/health` — database connectivity + `telegram` adapter capability metadata.

## Privacy and retention (v0.1)

- **Server:** The POST body (project brief) is used only to rank venues in-process. **Do not log** raw briefs or tokens in production; add redaction if you add structured logging.
- **Browser:** Checklist checkbox state is stored in `localStorage` (`distribution:checklist:v0`) on the device only.
- **Cache:** In-memory rate limit for `POST /api/recommendations` (20 requests / minute / IP). Adapter response cache (TTL + keys per spec §4.6) is not implemented yet — see `TODOS.md`.

## Scripts

| Command        | Purpose                          |
|----------------|----------------------------------|
| `npm run dev`  | Next.js dev                      |
| `npm run build`| Production build                 |
| `npm run db:push` | Apply Drizzle schema to DB   |
| `npm run db:seed` | Upsert rows from `data/venues.seed.json` |
| `npm run lint` | ESLint                           |

## Docs

- `LANDSCAPE.md` — positioning  
- `docs/adapter-venue-spec.md` — contracts  
- `docs/telegram-strategy.md` — v0.1 Telegram behavior  
- `docs/ui-v0.1-design.md` — UI contract  
- `docs/ceo-review.md` — plan review log  

## License

Specify in a follow-up commit if you open-source this repo.
