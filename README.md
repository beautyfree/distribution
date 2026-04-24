# distribution

Where to post your side-project.

An open registry of communities where AI builders ship and share — Telegram, Reddit, Discord, dev directories. Updated by the community.

**Live:** https://distribution-tau.vercel.app

## What it does

Three steps:

1. **Describe** what you built in a sentence.
2. **Find** the channels that actually fit — ranked by semantic match (with a topical keyword fallback if no embedding key is set). Filter by platform, language, or audience size.
3. **Generate** a draft post that respects each channel's tone, rules, and format.

The registry itself lives in a separate repo so anyone can PR a channel:
[beautyfree/distribution-registry](https://github.com/beautyfree/distribution-registry).

## Run locally

```bash
bun install
bun run dev
```

Open http://localhost:3000.

### Environment

Copy `.env.example` (if present) to `.env.local` and set whichever of these you have:

- `OPENROUTER_API_KEY` — chat (draft generation). Recommended for prod.
- `OPENAI_API_KEY` — chat + embeddings (semantic search). Without it, search falls back to topical keyword scoring.

### Local registry override

Point the reader at a local checkout of the registry instead of the remote
JSON feed:

```bash
REGISTRY_LOCAL_PATH=../distribution-registry bun run dev
```

## Scripts

| Command        | Purpose                          |
|----------------|----------------------------------|
| `bun run dev`  | Next.js dev server               |
| `bun run build`| Production build (prebuilds embeddings) |
| `bun run lint` | ESLint                           |
| `bun test tests/` | Unit tests                    |

## Contribute

Channels live in the registry repo. Open a PR or an issue there:
https://github.com/beautyfree/distribution-registry

Bug reports and shell improvements welcome in this repo.

## License

See [LICENSE](./LICENSE).
