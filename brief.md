# Claude usage dashboard — project brief

## What this is

A personal dashboard that tracks Claude Code token usage across Taha's 10+ devices,
all sharing one Max20x subscription, so usage can be watched against the plan's
rate-limit windows before getting throttled, with rule-based tips for using tokens
more efficiently.

## Problem

No visibility into which device is consuming how much of a shared quota across 10+
machines. Easy to get rate-limited with no warning.

## Goals / success criteria

- See live combined usage across all devices against the Max20x rate-limit windows,
  with a burn-rate projection ("time until you hit the cap at this pace").
- Get concrete, low-noise recommendations: which device is an outlier, which tasks
  probably didn't need Opus, where cache isn't being reused.

## Non-goals (v1)

Auth/multi-tenancy, push notifications/alerts, dollar-cost estimates, any logging or
display of prompt/response content, an LLM-based judge for model-downgrade detection.
Full reasoning for each is in the design spec linked below.

## Two repos, two different visibility levels

- **Data repo** (public): holds only usage metadata (`data/<device>.ndjson`), pushed
  by a Claude Code hook on every device. Public so the dashboard can fetch it with a
  plain unauthenticated `fetch()` — no server, no token to manage. Never contains
  prompt/response content.
- **App repo** (private): the Next.js dashboard source code. Private by default —
  no reason to expose it. Uses the `dev`/`prod` branch + PR workflow in
  `github-workflow.md`.

## Visual direction

Dark theme, not pure black — glassmorphism (translucent, blurred cards over a soft
dark gradient), clean and classy rather than busy, animated transitions throughout.

## Tech stack

Next.js (App Router, TypeScript), Tailwind CSS, shadcn/ui, GSAP, anime.js, Recharts
(shadcn's chart components are built on Recharts, so it's the natural pairing).
Deployed to Taha's own VPS.

## Documents in this set

- `implementation.md` — the build prompt for Claude Code: stack, structure,
  hardcoded performance rule, build order.
- `handling-protocols.md` — operational rules: file/folder conventions,
  context-loss recovery, power-outage resume, multi-agent orchestration, testing,
  token discipline.
- `github-workflow.md` — repo setup, branching, PR/issue process.
- `docs/superpowers/specs/2026-07-01-claude-usage-dashboard-design.md` — the
  original architecture/data-pipeline spec (hook, sync, data schema, recommendation
  rules). Still authoritative for anything not covered in the four docs above.

## Tooling note

No MCP server exists for GSAP, or a generic GitHub connector, in this workspace —
checked the connector registry directly. GSAP and anime.js are plain npm
dependencies, nothing to connect. Repo/branch/PR/issue actions run through the `gh`
CLI (`gh auth login` once), not an MCP tool. The `ui-ux-pro-max` skill has a
shadcn/ui MCP integration for component search/examples — use that skill when
picking or building components, rather than assuming a standalone "shadcn MCP."
