# claude-usage-collector

A Claude Code `Stop` hook that records **usage metadata** after every task and
batch-pushes it to the public [`claude-usage-data`](https://github.com/Taha-Mahmoodi/claude-usage-data)
repo, which the dashboard reads. Install it on each device sharing the Max20x plan.

**Privacy:** only token counts, model, and a tool-call count are recorded. No prompt
or response text is ever read (tool_use blocks are counted, not inspected).

## What it does, per task

1. Reads `transcript_path` from the hook input, extracts the latest assistant turn's
   `usage` block (`input`/`output`/`cache_creation`/`cache_read` tokens) + tool_use count.
2. Appends one NDJSON row to `~/.claude-usage/queue.ndjson`.
3. Every `pushIntervalMin` (default 5): `git pull --rebase`, append the queue to
   `data/<device>.ndjson`, commit, push. The push is **transactional** — the queue is
   cleared only on a fully successful push; any failure hard-resets to the remote and
   keeps the queue, so nothing is lost or double-written (offline is fine, it retries).

Each device writes only its own file, so concurrent pushes from many devices never conflict.

## Install (per device)

```sh
# 1. Clone the data repo to the default location the hook expects.
#    Make sure `git push` works from here (gh auth login, SSH key, or a PAT).
git clone https://github.com/Taha-Mahmoodi/claude-usage-data \
  ~/.claude-usage/claude-usage-data

# 2. (Optional) name this device — defaults to the hostname otherwise.
mkdir -p ~/.claude-usage
echo '{ "device": "macbook-air", "pushIntervalMin": 5 }' > ~/.claude-usage/config.json

# 3. Register the Stop hook. Simplest: add to ~/.claude/settings.json.
#    (Point the path at wherever you cloned the dashboard repo.)
```

Add to `~/.claude/settings.json` (merge with any existing `hooks`):

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node /absolute/path/to/plugin/hooks/collect.mjs",
            "async": true
          }
        ]
      }
    ]
  }
}
```

That's it — usage starts flowing to the data repo, and the dashboard picks it up on its next load.

## Config (`~/.claude-usage/config.json`, all optional)

| key              | default                              | notes                                  |
| ---------------- | ------------------------------------ | -------------------------------------- |
| `device`         | hostname                             | sanitized to `[A-Za-z0-9._-]`          |
| `dataRepoPath`   | `~/.claude-usage/claude-usage-data`  | **absolute path** (no `~` expansion)   |
| `pushIntervalMin`| `5`                                  | minutes between pushes; `0` = every task |

Env overrides: `CLAUDE_USAGE_DIR`, `CLAUDE_USAGE_DEVICE`, `CLAUDE_USAGE_REPO`.

## Files it manages (`~/.claude-usage/`)

- `queue.ndjson` — pending rows not yet pushed.
- `state.json` — `{ "lastPush": <epoch ms> }`.
- `config.json` — your settings (above).
