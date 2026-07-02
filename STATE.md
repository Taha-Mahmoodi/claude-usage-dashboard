# STATE

> First file a fresh session reads. On resume: `git status` → read this → re-run last passing build/test → continue.
> Update at the end of every session (or every ~30 min in a long one).

## Current phase

**Phase 3 — dashboard components against fixture data** (build order step 3). Phases 0–2 complete.

## Last completed

- Phase 0 setup: repos created, `prod`+`dev` branches, data repo seeded, STATE.md.
- Phase 1 scaffold (`feat/scaffold`, **PR #1 → dev, awaiting Taha's merge**): Next 16 + React 19 + Tailwind v4 + shadcn glass shell. Verified clean.
- Phase 2 data layer (`feat/data-layer`, stacked on `feat/scaffold`, **PR #2**):
  - `lib/types.ts` (raw schema), `lib/metrics.ts` (pure: totalTokens, complexity, modelFamily, percentile/median, sumWindow, cacheHitRate, `computeMetrics` → windows/devices/models/topTasks/trend/burn/downgrade), `lib/recommendations.ts` (4 rules), `lib/fetch-usage.ts` (`fetchUsage` + defensive `parseNdjson`), `config/limits.ts` (calibratable caps, placeholders).
  - `__fixtures__/generate.mjs` → `sample-device.ndjson` (176 rows, deterministic, 30d + 5h burst).
  - Tests: `lib/*.test.ts` run via `node --test` (Node 26 native TS). 10 pass. `npm test` wired.
  - `tsconfig` excludes `**/*.test.ts` (they use `.ts`-extension imports the app compiler rejects). Verified: tests/tsc/eslint/build all clean.

## Next task

Phase 3: build the 8 components in `components/dashboard/` against fixture data (quota-gauge, burn-rate-card, device-breakdown, model-mix-chart, cache-hit-rate, top-tasks-table, trend-chart, recommendations-feed). Feed them `computeMetrics(rows, now, LIMITS)` + `recommend(...)`. Need a fixture loader that shifts the fixture's `2026-07-02T18:00Z` ref to real `now` so windows include data. Charts = shadcn (Recharts), dynamically imported `ssr:false` per the perf rule. Virtualize top-tasks only if >50 rows (it's 5, so skip). Branch `feat/dashboard-components` off `feat/data-layer` (stacked) until PRs #1/#2 merge.

## Perf-rule note (still owed)

Capture the route-size table once charts land (Phase 3+) and check ≤200KB/route gzip. Next 16 turbopack build table omits per-route JS — may need `next build` analysis or `@next/bundle-analyzer` to get real numbers.

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
