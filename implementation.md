# Implementation — build prompt for Claude Code

You are building the Claude usage dashboard described in `brief.md` and
`docs/superpowers/specs/2026-07-01-claude-usage-dashboard-design.md`. Read both
before writing code. Follow `handling-protocols.md` and `github-workflow.md` for
*how* to work, not just what to build — they're not optional background reading.

## Tech stack (fixed, do not substitute)

- Next.js 14+, App Router, TypeScript
- Tailwind CSS
- shadcn/ui for component primitives (cards, tabs, dialogs; shadcn's chart
  components wrap Recharts — use those instead of a separate charting library)
- GSAP for scroll-triggered/entrance animations
- anime.js for micro-interactions (hover states, number count-ups, gauge fills)
- No backend framework, no database, no server-side API routes for data — the app
  fetches the public data repo's raw files directly (client component or a server
  component with a short revalidate window). No custom persistence layer.

## Hardcoded performance rule (non-negotiable)

Not configurable, not relaxed for convenience:

1. Every route scores ≥95 on Lighthouse performance, First Contentful Paint under
   1.5s on a throttled mid-tier mobile / 4G profile.
2. GSAP, anime.js, and the Recharts-based chart components are dynamically imported
   with `next/dynamic` and `ssr: false` — never in the initial server-rendered
   bundle.
3. All derived/aggregated data (percentiles, rolling windows, burn-rate
   projections) is computed with `useMemo`, recomputed only when the underlying
   fetched data changes — never on every render.
4. Any list/table with more than 50 rows is virtualized.
5. Initial route JS payload ≤200KB gzipped. Check the `next build` output before
   every commit; if a change pushes a route over budget, fix it before committing,
   not after.
6. Images/icons: `next/image` or inline SVG only, no unoptimized `<img>`.

Run `next build` locally before opening any PR and paste the route size table into
the PR description (see `handling-protocols.md`, sandbox test protocol).

## Project structure

```
app/
  layout.tsx             # theme provider, fonts, global glass background
  page.tsx                # dashboard home (server component, shell only)
  loading.tsx
  globals.css              # tailwind + glassmorphism utility classes
components/
  dashboard/
    quota-gauge.tsx
    burn-rate-card.tsx
    device-breakdown.tsx
    model-mix-chart.tsx
    cache-hit-rate.tsx
    top-tasks-table.tsx
    trend-chart.tsx
    recommendations-feed.tsx
  ui/                       # shadcn-generated primitives, do not hand-edit
lib/
  fetch-usage.ts            # pulls devices.json + per-device ndjson from the data repo
  metrics.ts                 # pure functions: rolling windows, percentiles, cache hit rate, complexity score
  recommendations.ts         # rule-based tips from the design spec
  types.ts
config/
  limits.ts                 # configurable Max20x window/cap constants (see design spec "open items")
public/
__fixtures__/
  sample-device.ndjson        # fake data for building UI before real devices push
```

(The four planning docs and `docs/superpowers/specs/` stay at the repo root where
they already are — don't move them under `app/` or `lib/`.)

## Data flow

1. `lib/fetch-usage.ts` fetches `devices.json`, then each `data/<device>.ndjson`,
   from `raw.githubusercontent.com` on the public data repo — no auth.
2. `lib/metrics.ts` turns raw rows into: rolling 5h/7d totals, per-device/model
   aggregates, cache hit rate, complexity-score percentiles, burn-rate projection.
3. `lib/recommendations.ts` runs the rule set from the design spec against those
   metrics.
4. Dashboard components render the results as props — no component talks to the
   network directly.

## Visual spec

- Background: deep charcoal/navy gradient (e.g. `#0b0e14` → `#12161f`), never
  `#000000`.
- Cards: `backdrop-blur-xl`, translucent surface (`bg-white/5`, `border-white/10`),
  soft glow on hover.
- Motion: GSAP for page-load entrance (stagger cards in), anime.js for the quota
  gauge fill and number count-ups, shadcn/Radix's built-in transitions for
  tabs/dialogs — don't hand-roll what shadcn already animates.
- Typography: clean sans, generous spacing, restrained color — accent color used
  sparingly, for warnings only (e.g. amber when the burn-rate projection lands
  inside the current window).

## Build order

1. Scaffold Next.js + Tailwind + shadcn, theme + glass shell, no data yet.
2. `lib/fetch-usage.ts` + `lib/metrics.ts` against `__fixtures__/sample-device.ndjson`
   so the UI can be built without waiting on real devices to push.
3. Build each dashboard component against the fixture data.
4. Wire in GSAP/anime.js animations last, once layout is stable — animating a
   layout that's still moving just means re-tuning it twice.
5. Swap the fixture for the real fetch, verify against the live public data repo.
