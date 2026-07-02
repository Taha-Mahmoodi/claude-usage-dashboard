# STATE

> First file a fresh session reads. On resume: `git status` → read this → re-run last passing build/test → continue.
> Update at the end of every session (or every ~30 min in a long one).

## Current phase

**Phase 4 — animations (GSAP entrance + anime.js micro-interactions)** (build order step 4). Phases 0–3 complete.

## Last completed

- Phases 0–2: repos, branches, scaffold (**PR #1**), data layer + tests (**PR #2**). Both awaiting Taha's merge.
- Phase 3 components (`feat/dashboard-components`, stacked on `feat/data-layer`, **PR #3**):
  - 8 components in `components/dashboard/`: quota-gauge (SVG 270° arc), burn-rate-card, device-breakdown (Recharts bar), model-mix-chart (Recharts donut), cache-hit-rate (scaleX bars), top-tasks-table (shadcn Table), trend-chart (Recharts area, hourly→daily rollup), recommendations-feed.
  - `dashboard.tsx` orchestrator (client): fetches fixture via `fetchUsage(FIXTURE_BASE)` + `shiftToNow`, `useMemo` metrics + recs, grid layout. The 3 Recharts charts `next/dynamic` `ssr:false` (kept out of initial bundle).
  - `lib/fixture.ts` (shift ref→now), `lib/format.ts` (fmtTokens/pct/fmtHours). Multi-device fixtures in `public/fixtures/` (4 devices, one outlier + one low-cache) via updated `generate.mjs`.
  - Chart palette added to `globals.css` (`--chart-1..5`). Tuned `config/limits.ts` caps to demo-friendly values (gauges fill, approaching-limit fires) — flagged to recalibrate.
  - Verified: tsc/eslint/build clean, 10 tests pass, **initial route JS 195KB gzip < 200KB budget** (Recharts confirmed code-split out via ssr:false dynamic import), renders clean desktop + mobile, no console errors (one benign transient Recharts `width(0)` dev warning on first paint).

## Next task

Phase 4: GSAP entrance (stagger the panels in on load) + anime.js micro-interactions (quota-gauge fill count-up, number count-ups). Both **dynamically imported** so they stay out of the initial 195KB bundle (perf rule). Animate transform/opacity only (no layout props). shadcn/Radix handles its own transitions — don't hand-roll those. Branch `feat/animations` off `feat/dashboard-components` (stacked).

## Perf-rule status

MET for now: initial route JS **194.9KB gzip < 200KB** (measured from prod HTML's referenced chunks; Recharts is a separate lazy chunk). Still owed: a real Lighthouse ≥95 / FCP <1.5s run — best done against the deployed VPS build; architecture (static prerender + code-split heavy libs) supports it. Keep GSAP/anime.js dynamically imported so Phase 4 doesn't blow the budget.

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
