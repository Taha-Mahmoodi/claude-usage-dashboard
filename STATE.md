# STATE

> First file a fresh session reads. On resume: `git status` → read this → re-run last passing build/test → continue.
> Update at the end of every session (or every ~30 min in a long one).

## Current phase

**Phase 1 — Next.js scaffold + glass shell** (build order step 1). Foundation (Phase 0) complete.

## Last completed

- Phase 0 setup done:
  - Planning docs + design spec committed (baseline `c5857bc`), `.gitignore` added.
  - App repo (private): https://github.com/Taha-Mahmoodi/claude-usage-dashboard — branches `prod` (deployed) + `dev` (default/integration), both pushed.
  - Data repo (public): https://github.com/Taha-Mahmoodi/claude-usage-data — branch `main`, seeded with `devices.json` (`[]`) + `data/` + README.

## Next task

Scaffold Next.js 14+ (App Router, TS) + Tailwind + shadcn/ui into THIS folder (planning docs stay at root). Theme provider, fonts, glass background shell, no data yet. Do it on branch `feat/scaffold` off `dev`, PR into `dev`.

## Blockers / open items

- **Max20x caps unknown** → `config/limits.ts` ships configurable constants Taha calibrates empirically. Not hardcoded from a spec.
- **VPS deploy path** — needed only at the prod-deploy step (last). Not yet provided.
- **prod branch protection** not enforced via API (kept as behavioral discipline: promote only via `dev → prod` PR). Optional: enable a GitHub branch-protection rule later.

## Resolved decisions

- **Account:** `Taha-Mahmoodi` (repo git identity set locally).
- **Tech stack:** Next.js + Tailwind + shadcn/ui + GSAP + anime.js + Recharts (shadcn charts). The four planning docs override the design spec's "static HTML + Chart.js" — `implementation.md` marks the stack "fixed, do not substitute." The spec stays authoritative for the data pipeline (hook, sync, schema, recommendation rules).
- **Data fetch base URL:** `https://raw.githubusercontent.com/Taha-Mahmoodi/claude-usage-data/main/` → `devices.json` then `data/<device>.ndjson`. No auth (public repo).
- **App builds in this folder** alongside the planning docs (per `implementation.md` structure note).

## Build order (implementation.md)

1. Scaffold + theme + glass shell, no data. ← **HERE**
2. `lib/fetch-usage.ts` + `lib/metrics.ts` against `__fixtures__/sample-device.ndjson`.
3. Dashboard components against fixture data.
4. GSAP / anime.js animations (last, once layout stable).
5. Swap fixture → real fetch against live data repo.
6. (Data side) Claude Code plugin: `Stop` hook + batched sync — design spec §Data collection/Sync.

## Workflow reminders

- Commit at every logical checkpoint; never >15 min uncommitted (power-outage risk).
- Feature branch off `dev` → PR into `dev` (`gh pr create --base dev`). Promote `dev → prod` only when stable.
- Before any PR: `next build` clean + route-size table vs perf budget (≤200KB/route gzip, ≥95 Lighthouse), `next lint` + `tsc --noEmit` clean, `lib/` pure fns have assert tests.
- Note: intermittent `.git/*.lock` files appear in this repo — clear stale locks (`rm -f .git/HEAD.lock .git/index.lock`) after checking no real `git` process runs.
