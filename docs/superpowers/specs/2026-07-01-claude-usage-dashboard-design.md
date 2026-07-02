# Claude usage dashboard — design spec

Date: 2026-07-01
Status: approved, pending implementation plan

## Problem

Taha runs Claude Code on 10+ devices, all sharing one Max20x subscription. There's no
visibility into which device is consuming how much of the shared quota, so it's easy to
get rate-limited without warning. Goal: a personal dashboard that shows real-time usage
across all devices against the plan's rate-limit windows, plus rule-based tips for using
tokens more efficiently.

## Scope

- Tracks Claude Code CLI usage only. The desktop/web/mobile chat apps don't expose
  per-task token counts anywhere a script can read them, so this only works for devices
  running Claude Code. All 10+ devices are Claude Code CLI going forward.
- Single user, personal tool. No auth, no multi-tenancy. Built as a personal Claude Code
  **plugin** (not a skill — skills only run when Claude decides they're relevant; this
  needs a `Stop` hook, which fires unconditionally after every task, so it has to live
  in a plugin). Values like device name and repo URL are hardcoded/config-file for
  Taha's own setup — not generalized for public distribution. Could be generalized into
  an installable plugin for others later, but that's explicitly deferred: it would need
  a setup wizard, input validation, and docs, none of which help the actual goal (don't
  get rate-limited) any faster.
- No task content (prompts/responses) is ever collected or stored — only usage metadata
  (token counts, model, tool-call counts). This is what allows the data repo to be public.

## Architecture

```
Claude Code (Stop hook, ×10+ devices)
        │  reads transcript usage block, appends to local queue
        ▼
Batched git push (every N minutes, per-device file)
        │
        ▼
GitHub repo (public) — data/<device>.ndjson + devices.json manifest
        │
        ▼
Dashboard on Taha's VPS — static HTML/JS, fetches raw files client-side
        │
        ▼
Charts + rule-based recommendations (all computed in the browser)
```

No backend, no database, no build step. The git repo is the datastore; the dashboard is
a static page that fetches live data on every load, so it's always current without
needing to rebuild anything when the repo changes.

## Data collection

A Claude Code plugin registers a `Stop` hook (fires when the agent finishes responding
to a task). On each firing, the hook:

1. Reads the `transcript_path` provided in the hook's JSON input.
2. Extracts the latest turn's usage block: `model`, `input_tokens`, `output_tokens`,
   `cache_creation_input_tokens`, `cache_read_input_tokens`, and a count of `tool_use`
   blocks in that turn.
3. Appends one NDJSON line to a local queue file (`~/.claude-usage/queue.ndjson`).

No message content is read for any purpose other than counting tool_use blocks — text
content of prompts/responses is never touched.

## Sync

The same `Stop` hook, after appending to the queue, checks a local state file for the
timestamp of the last push. If more than `PUSH_INTERVAL_MIN` (default 5) minutes have
elapsed:

1. `git pull --rebase` on the local clone of the data repo.
2. Append the queued lines to `data/<device-name>.ndjson` in the repo.
3. `git add . && git commit && git push`.
4. Clear the local queue and update the last-push timestamp.

Each device only ever writes to its own file, so concurrent pushes from many devices
don't produce merge conflicts. `device-name` defaults to hostname, overridable via a
config file. If a push fails (offline, conflict), the queue is retained and retried on
the next hook firing — no data loss, just delay.

## Storage format

Public GitHub repo, structure:

```
data/
  macbook-air.ndjson
  desktop-pc.ndjson
  ...
devices.json      # ["macbook-air", "desktop-pc", ...] — updated once per new device
```

Each line in a device file:

```json
{"ts": "2026-07-01T14:32:00Z", "model": "claude-opus-4-8", "input_tokens": 1200,
 "output_tokens": 340, "cache_creation_tokens": 800, "cache_read_tokens": 4200,
 "tool_calls": 2, "session_id": "abc123"}
```

## Dashboard

Single static HTML/JS page (Chart.js via CDN, no framework, no build step), deployed to
Taha's own VPS behind any web server. On load, it fetches `devices.json` then each
device's raw NDJSON file directly from `raw.githubusercontent.com`, and computes
everything client-side:

- **Quota gauge + burn-rate projection.** Sums tokens in the trailing 5-hour and 7-day
  windows across all devices; linearly extrapolates the last hour's rate to estimate
  time-to-cap. The exact Max20x token caps aren't published by Anthropic, so these are
  configurable constants that Taha calibrates empirically (e.g. from when rate limiting
  is first observed) rather than hardcoded from a spec.
- **Per-device breakdown + model mix.** Bar charts of tokens per device and share of
  tokens/tasks per model (Opus/Sonnet/Haiku).
- **Cache hit rate.** `cache_read / (cache_read + cache_creation + input)`, overall and
  per device — low reuse signals redundant context being resent.
- **Top expensive tasks.** The 5 highest single-task token totals in the last 7 days.
- **Trend line.** Tokens/hour bucketed over the last 30 days.
- **Recommendations feed.** See below.

## Recommendation rules (all pure JS, no external calls)

- **Outlier device**: flags a device whose median tokens/task is far above the rest
  (e.g. more than 2x the cross-device median).
- **Model-downgrade candidate**: computes a complexity score per task
  (`tool_calls + output_tokens`). Flags Opus tasks scoring below the 25th percentile of
  *all* logged tasks as likely Haiku/Sonnet-sufficient. Percentile is relative to Taha's
  own historical data, not a fixed magic number, so it adapts automatically.
- **Low cache reuse**: flags devices/sessions with cache hit rate below a threshold.
- **Approaching-limit warning**: surfaces when the burn-rate projection lands inside the
  current window's configured cap.

## Explicitly out of scope (v1)

- Push notifications/alerts — the dashboard is a page you check, not a service that
  pages you. Real infra for a real gain; candidate for v2 if the dashboard alone isn't
  enough.
- Dollar-cost estimates — Max is flat-rate, a $/token figure would be misleading.
- Any logging or display of prompt/response content — breaks the public-repo privacy
  model.
- An LLM-based judge for the model-downgrade recommendation (sending the actual prompt
  to Haiku for a real complexity judgment) — more accurate than the heuristic, but costs
  extra tokens per task and means content leaves the device. Noted as a v2 upgrade path
  if the metadata heuristic proves too noisy.
- GitHub Actions build step / server-rendered dashboard — unnecessary since the static
  page fetches live data on every load.

## Open items for the implementation plan

- Exact Max20x rate-limit window sizes and caps aren't publicly documented in exact
  token terms — the burn-rate/quota gauge ships with configurable constants Taha sets
  and tunes, not hardcoded figures.
- Naming/location of the Claude Code plugin, the data repo, and the VPS deployment path.
