# UI design plan (v0.1)

**Source review:** `/plan-design-review` on 2026-04-23. Complements `LANDSCAPE.md`, `docs/adapter-venue-spec.md`, `docs/telegram-strategy.md`. No `DESIGN.md` in repo; treat this file as the **v0.1** UI contract until `/design-consultation` or a system lands.

**Classifier:** **App / tool first.** Primary job is a task flow (describe project, get places to post, copy drafts, track checklist), not a marketing site. A short product identity at the top is enough; avoid hero-first “SaaS landing as first impression” unless you explicitly choose that in a later decision.

**Step 0 (design completeness):** initial **3/10** (strong intent in `LANDSCAPE.md`, almost no screen-level spec) → **target 8/10** after the tables below. **10/10** would add approved mockup paths under `~/.gstack/projects/distribution/designs/` and a `DESIGN.md` token set.

**Visual mockups (next):** the gstack designer is available. After you lock **Home layout** (see Open decision), run `design variants` with a brief pulled from this doc and save under `~/.gstack/projects/distribution/designs/…` (not in-repo). This doc can list approved paths when they exist.

---

## 1) Information architecture

**Before → after:** 3/10 → **8/10** (structure explicit).

**What the user should see, in order, on the primary flow:**

1. **Context:** one line what the tool does (not a manifesto).  
2. **Project brief** inputs: title, summary, language, links, tags, optional audience. **Primary action:** get recommendations.  
3. **Results** as a **ranked list** of venues, each with: name, `type` (human label), **why (evidence bullets)**, **provenance** (curated vs `adapter:telegram` over curated data), **rules / stale** if applicable, **one primary** “copy draft” or expand to drafts.  
4. **Checklist** either per row (accordion) or a **single** checklist for the first selected venue, but not both without clarity (pick in Open decision or default: **per-venue** checklist items from `Recommendation` in spec).  
5. **Disclaimers** (Telegram): fixed block from `adapter-venue-spec.md` §5.3, always visible in results, not a footnote.

**Site map (v0.1, minimal):**

```text
/                 Brief + results (single page is OK for v0.1)
/health?          optional adapter health for ops; hide from main nav for users
```

**Navigation:** no heavy nav. If you add a header: **Product name** + link **How it works** (optional anchor) + **GitHub** (if OSS). No 7-link marketing bar.

**ASCII: primary page regions**

```text
+-- header (48–56px): logo + name, optional one link
+-- main
|     +-- one-line value prop
|     +-- form: brief (clear required markers)
|     +-- [ Get recommendations ]  (primary button)
|     +-- (loading / partial / empty / error regions — see §2)
|     +-- results: list (NOT a decorative card grid as first impression; see §4)
|     +-- disclaimer block (results area)
+-- footer: privacy, data retention one-liner when you have it
```

---

## 2) Interaction state coverage

**Before → after:** 2/10 → **8/10** (all paths named for the main feature).

| Feature / surface | LOADING | EMPTY | ERROR | SUCCESS | PARTIAL (timeout) |
|-------------------|---------|-------|-------|---------|-------------------|
| Submit brief, fetch recommendations | Skeleton on results area; button shows spinner and `aria-busy` | N/A (always have brief) | Inline alert under button + retry; if API returns code, show short message, **no** raw stack | List renders with at least 0 items shown explicitly if empty (see cell) | List shows **what we have** + banner: “Some sources did not finish in time” + `AdapterSearchResult.status=partial` if modeled |
| Results list | same as above | **Designed empty state:** “No venues match yet” + 2–3 **next steps** (broaden language, add tags, check back after seed grows) + link to how data is sourced | | Rows with evidence, drafts, checklist as per spec | same as PARTIAL row |
| Copy draft to clipboard | Micro-toast or “Copied” on button | — | Show “Copy failed” on permission failure | Confirmed copy | — |
| Per-venue checklist | — | — | — | Persist in session or local draft (v0.1: **session or localStorage**; document which) | — |

**Empty is a feature** (principle 1): empty state must be warm, explain **why**, and give a **next action**, not a bare “No results.”

---

## 3) User journey and emotional arc

| Step | User does | User should feel | Plan / UI support |
|------|------------|------------------|-------------------|
| 1 | Lands on page | “This is a tool, not a funnel of hype” | Plain header, no stock hero, task-first layout |
| 2 | Fills brief | In control, form is legible | Required fields, honest labels, no dark patterns |
| 3 | Clicks get recommendations | Action got a response; not abandoned | Loading state; if slow, show progress, not a blank main |
| 4 | Sees list | **Trust,** not FOMO spam | Provenance, rules link, no “post everywhere” vibe |
| 5 | Reads draft, copies | Relief, not shame | Checklist reminds **read rules** before post |
| 6 | If error | Treated with respect | Short copy, recovery (retry, edit brief) |

**5-second / 5-minute / 5-year:** visceral = instant clarity of the task. Behavioral = one successful end-to-end run. Reflective = trust in the product’s honesty (Telegram, moderation).

---

## 4) AI slop risk and hard rules

**Rating:** 4/10 (plan did not name UI) → **8/10** after this section.

- **Classify** as **App UI** for the main page: calm surfaces, one accent, **no** default “3-column feature grid with icon circles” as the core layout. If you add **three** value props, they must be **one row max** and prove they are not a template. Prefer **no** feature grid in v0.1.
- **No** blue-purple gradient as the default background. **No** Inter as the only named font if you can avoid it; if you use a system stack, name it in `DESIGN.md` later. Prefer **one** distinctive UI font for headings and a neutral text face.
- **Cards:** use a **row / list** pattern for venues. Cards **only** if a row **is** a single interactive object (expand, copy). Avoid **stacked cards of cards** for the same entity.
- **First viewport** is a **task**, not a full-bleed lifestyle photo. A single subtle texture or off-white is fine; avoid busy art behind the form.
- **Motion:** 0 or 1 purposeful transition (e.g. results enter). No gratuitous parallax.
- **Copy:** avoid “Unlock the power of” / “All-in-one solution.” Prefer utility language: “Where to post,” “For your project,” “Read rules first.”

**If you generate mockups,** run the gstack `check` (or human review) against the slop blacklist in the `plan-design-review` skill.

---

## 5) Design system alignment

**Rating:** 0/10 (no `DESIGN.md`) → **4/10** (tokens stubbed) → **10/10** after `/design-consultation` + `DESIGN.md`.

**Interim (until `DESIGN.md`):**

- **Color:** CSS variables, e.g. `--bg`, `--text`, `--muted`, `--accent`, `--border`, `--danger` (for errors). Light mode first; document dark as later.  
- **Type:** at most two families. Example direction (not final): **Söhne, Satoshi, or Euclid** for display + **IBM Plex Sans** or **Source Sans 3** for body, not unnamed “system” only.  
- **Radius:** one scale (e.g. 6px for inputs, 8px for panels), not “everything 16px.”  
- **Provenance and trust:** a **-badge** or text treatment for `curated` vs `adapter:telegram`, not the same as category.

---

## 6) Responsive and accessibility

**Rating:** 2/10 → **7/10** (targets set).

- **Viewports:** single column for brief + list up to 768px; from `md` up, optional two-column: form left, sticky summary or tips right (optional; can stay one column in v0.1). **Not** “just stack with no order change”: keep **form before results** always.  
- **Touch:** minimum **44×44px** hit targets for primary and copy actions.  
- **Keyboard:** all interactive elements tab-order logical; list items copy buttons focusable.  
- **Screen readers:** `h1` for product name, `h2` for “Your project” / “Recommendations,” list markup for the venue list, `aria-live="polite"` for result updates.  
- **Contrast:** text vs background **at least 4.5:1** for body; large text 3:1. **Do not** only use color to convey state (use icon + text for error).

---

## 7) Unresolved design decisions (for implementation)

| Decision | If deferred, what happens |
|----------|----------------------------|
| **Home pattern** (tool-first vs light marketing strip) | **Locked 2026-04-23:** **1A — Tool-first** (header + one-line value prop + form + results on one page). |
| Single page vs **detail** for one venue | Default v0.1: **inline expand** per row; separate `/venue/[slug]` is optional. |
| Checklist persistence | If unspecified: session-only. User may want **local only**; document in privacy. |
| Stale / cache copy | `LANDSCAPE.md` asks for it; place near provenance, not a tooltip that nobody reads. |

---

## NOT in scope (this doc)

- Full **brand** system and marketing site.  
- **Auto-post** UI, OAuth, Telegram in-client flows.  
- **Illustration** or **mascot** (unless you add in a later pass).  
- **Dark mode** (optional follow-up).  
- **Gatsby-level** content pages; start with one working screen.

## What already exists to align with

- `LANDSCAPE.md`: trust, typed venues, no mass outreach, Telegram honesty.  
- `docs/adapter-venue-spec.md`: `Recommendation` shape, disclaimers, checklist, draft arrays.  
- `docs/telegram-strategy.md`: no global search promise.

## Approved mockups (optional)

| Screen | Path | Notes |
|--------|------|--------|
| — | — | Add after `design compare` in `~/.gstack/projects/distribution/designs/` |

---

*End of v0.1 UI design plan. Re-run `/plan-design-review` after `DESIGN.md` or after mockup approval to re-rate toward 10/10.*
