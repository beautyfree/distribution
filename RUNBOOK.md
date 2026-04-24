# Distribution — Saturday Runbook

Start here Saturday morning. Everything is wired; you just need to ship and seed.

## State snapshot (as of 2026-04-24)

| | |
|---|---|
| Reader app | `/Users/devall/Projects/tmp/distribution` (this repo) |
| Registry repo | `/Users/devall/Projects/tmp/distribution-registry` (separate, not yet pushed) |
| Seed nodes | 7 of 50 target — 3 Telegram, 2 subreddits, 2 directories |
| Reader build | passes, lint clean, 24 unit tests pass |
| Registry build | passes, 20 validator tests pass |
| Pushed to GitHub? | no |
| Vercel? | no |

## Step 1 — seed the registry (your assignment)

43 more nodes. Do not write a crawler. Open Telegram, Reddit, Discord — copy from your own "where to post" list.

```bash
cd ../distribution-registry
# Copy the shape:
cat nodes/telegram-chat/indiehackers.json
# Write a new one:
$EDITOR nodes/telegram-chat/claude-makers.json
# Verify as you go:
bun run scripts/validate.ts --no-fetch   # skip network while drafting
bun run scripts/validate.ts              # full check before commit
bun test tests/                          # schema tests
```

Rules of thumb:
- **Only chats you've personally posted in.** Drive-by additions kill trust.
- Audience unknown? Set `audience_size: 0`. Don't guess.
- Kebab-case slug matches filename matches `id`.

## Step 2 — push the registry to GitHub

```bash
cd ../distribution-registry
gh repo create distribution-registry --public --source . --push
# Repo will be github.com/<you>/distribution-registry
```

If your GH handle isn't `devall`, update the reader env:

```bash
cd ../distribution
# Edit .env.local and .env.example:
REGISTRY_REPO=<your-handle>/distribution-registry
```

## Step 3 — run the reader locally

```bash
cd ../distribution
# Point at local registry (instant iteration, no network):
echo "REGISTRY_LOCAL_PATH=$(pwd)/../distribution-registry" >> .env.local
# Optional — enable real embeddings + draft generation:
echo "OPENAI_API_KEY=sk-..." >> .env.local
bun run dev
# open http://localhost:3000
```

Without `OPENAI_API_KEY` the app falls back to **topical substring match** and draft endpoint returns a stub. Both modes are fully usable for dogfooding.

With the key: semantic search via `text-embedding-3-small`, drafts via `gpt-4o-mini`. Cost per session is cents.

## Step 4 — deploy to Vercel

```bash
cd ../distribution
vercel link           # or via dashboard
vercel env add OPENAI_API_KEY production
vercel env add REGISTRY_REPO production   # <your-handle>/distribution-registry
vercel --prod
```

After first deploy, grab the **Deploy Hook URL** from Vercel project settings:

```bash
cd ../distribution-registry
gh secret set REGISTRY_DEPLOY_HOOK --body "https://api.vercel.com/v1/integrations/deploy/..."
# Now every merge to registry main triggers a reader rebuild.
```

## Step 5 — first real post

1. Open prod, describe your next side-project
2. Pick a seed channel
3. Generate draft
4. Tweak
5. Actually post it

If step 5 produces a lead/sub/signup, the registry works. If not, the registry doesn't work — adjust.

## Commands cheat sheet

| Task | Command |
|---|---|
| Reader dev | `bun run dev` |
| Reader build | `bun run build` |
| Reader tests | `bun test tests/` |
| Reader lint | `bun run lint` |
| Registry validate (offline) | `bun run scripts/validate.ts --no-fetch` |
| Registry validate (full) | `bun run scripts/validate.ts` |
| Registry tests | `bun test tests/` |
| Regenerate manifest | `bun run scripts/validate.ts --no-fetch` (writes `index.json`) |

## What's deferred to v0.2

- People layer (X-handles, email contacts)
- Live adapter (tgstat / reddit API) for channels not yet in the registry
- Auth / accounts
- Mobile app
- Analytics

## Where the design lives

- Design doc: `/Users/devall/.gstack/projects/distribution/devall-master-design-20260424-134549.md`
- Visual reference: `/Users/devall/.gstack/projects/distribution/designs/homepage-20260424/variant-C-linear.html`
- Design tokens: `DESIGN.md` in repo root
