# STATE

> First file a fresh session reads. On resume: `git status` → read this → re-run last passing build/test → continue.
> Update at the end of every session (or every ~30 min in a long one).

## Current phase

**ALL PHASES COMPLETE.** Build finished; 6 stacked PRs open awaiting Taha's merges (#1→#6, merge in order). Then promote `dev → prod` and deploy to the VPS (needs the VPS path — still owed).

### Phase 6 done (`feat/collector-plugin`, stacked, PR #6)
- `plugin/` — Claude Code Stop-hook collector. `hooks/collect.mjs` (no deps): extracts latest assistant `usage` block + tool_use count from the transcript, appends to `~/.claude-usage/queue.ndjson`, and every `pushIntervalMin` does a **transactional** pull→append→commit→push (queue cleared only on push success; any failure hard-resets to `@{u}` and retains the queue — no loss, no double-write). `plugin.json` + `hooks/hooks.json` register the Stop hook; `README.md` has per-device install.
- Verified: 3 unit tests (extraction), plus end-to-end runs — happy path (2 rows pushed, queue cleared, devices.json updated), pull-fail (queue retained), and **push-rejected-after-commit** (HEAD rolled back, queue retained, no orphan row). tsc/eslint/build clean, 13 tests total pass.

### Phase 5 done (`feat/real-fetch`, stacked, PR #5)
- `dashboard.tsx` defaults to real `fetchUsage()`; fixtures only when `NEXT_PUBLIC_USE_FIXTURES=1` (set in `.env.development`, so dev shows fixtures, prod fetches real). Added `Notice` empty state.
- Verified against the **live** public repo: prod build (no flag) → real fetch → empty repo → "No usage data yet" empty state; dev (flag) → full fixture dashboard. tsc/eslint/build/tests all clean.

### Phase 4 done (`feat/animations`, stacked, PR #4)
- `components/dashboard/anim.ts`: `useEntrance` (GSAP stagger) + `useCountUp` (anime.js). GSAP + anime.js imported **dynamically inside effects** — confirmed still lazy (initial JS 195.5KB, +0.6KB only). Both respect `prefers-reduced-motion`; content visible without JS.
- QuotaGauge drives arc fill + number via anime.js; CacheHitRate counts up; grid panels stagger in via GSAP.
- Verified: tsc/eslint/build clean, 10 tests pass, settled layout matches Phase 3, no new console errors.

### Earlier phases
- Phases 0–2: repos, branches, scaffold (**PR #1**), data layer + tests (**PR #2**). Awaiting Taha's merge.
- Phase 3 (`feat/dashboard-components`, **PR #3**): 8 components + orchestrator, Recharts charts dynamic `ssr:false`, multi-device fixtures, chart palette, demo-tuned caps. Initial JS 195KB < 200KB. Verified.

## Next task

Phase 5: swap the fixture source for the real fetch. Default the dashboard to `fetchUsage()` (real repo, no shift); keep fixtures behind `NEXT_PUBLIC_USE_FIXTURES=1` for dev. Add a graceful empty state (real repo has no device data yet → "install the hook" message). Verify against the live public repo. Branch `feat/real-fetch` off `feat/animations` (stacked).

Then **Phase 6** (data-collection side, from the design spec): the Claude Code plugin — a `Stop` hook that reads `transcript_path`, extracts the latest usage block (model, input/output/cache tokens, tool_use count), appends to `~/.claude-usage/queue.ndjson`, and batches a `git pull/append/commit/push` to the data repo every `PUSH_INTERVAL_MIN`. Device name = hostname (config override). Must be safe to re-run and never lose the queue on push failure. One assert-based test on the transcript-extraction logic.

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
