# GitHub workflow

## Setup (one-time)

- Create a new **private** GitHub repository for the app code (separate from the
  public data repo described in the design spec — see `brief.md` for why they're
  split).
- `gh auth login` once on whichever machine drives this. No GitHub MCP connector is
  available in this workspace (checked the connector registry), so repo/branch/
  PR/issue actions run through the `gh` CLI, not an MCP tool.
- Two long-lived branches: `dev` (integration) and `prod` (deployed to the VPS,
  protected — no direct pushes).

## Per-change workflow

1. Branch off `dev`: `git checkout -b <type>/<short-description>` (e.g.
   `feat/quota-gauge`, `fix/cache-hit-calc`).
2. Do the work, committing at checkpoints per `handling-protocols.md`.
3. Push the branch, open a PR into `dev`: `gh pr create --base dev`. PR
   description: what changed, why, and — if UI — a screenshot per the visual test
   protocol.
4. Self-review the diff in GitHub before merging, as if reviewing someone else's
   code, not just re-reading what was just written.
5. If review turns up a real problem: open a GitHub Issue describing it
   (`gh issue create`), push fix commits to the same PR branch, reference the issue
   in the commit message (`fixes #N`) so it auto-closes on merge.
6. Once the PR is clean (sandbox tests pass, visual test done if UI, no open
   issues against it), merge into `dev`.
7. Delete the feature branch after merge.

## Promoting to prod

- Only promote once `dev` has been running/tested and is stable — not after every
  single merge.
- Open a PR from `dev` → `prod`, one-line description of what's being promoted
  (list of merged PRs/features since the last promotion).
- Merge, then deploy `prod` to the VPS.
- Tag the merge commit (`vX.Y.Z`) so there's a clear rollback point if the deploy
  misbehaves.

## Commit messages

- Imperative mood, one-line summary ≤72 chars, body only if the "why" isn't
  obvious from the diff.
- Reference issues where relevant (`fixes #N`, `refs #N`).
