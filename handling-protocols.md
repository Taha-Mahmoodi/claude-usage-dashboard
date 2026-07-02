# Handling protocols

Operational rules for whoever — human or agent — works on this project. These apply
regardless of which phase or feature is being built.

## File & folder handling

- kebab-case for files and folders (`quota-gauge.tsx`, not `QuotaGauge.tsx` — the
  component name inside the file is still PascalCase, only the filename is
  kebab-case).
- One component per file, no barrel `index.ts` files unless a folder has 3+
  siblings that are always imported together.
- `lib/` is pure functions only — no React, no side effects beyond the one fetch
  function. Anything touching the DOM/animation lives in `components/`.
- Fixtures live in `__fixtures__/`, never mixed into `lib/` or `components/`.
- Never commit real usage data into the app repo — it belongs in the separate
  public data repo, not here.

## Context handling (session/context loss)

- Maintain a single `STATE.md` at repo root, updated at the end of every work
  session (or every ~30 min during a long one): current phase, last completed
  task, next task, blockers. This is the first file a fresh Claude Code session
  reads before doing anything else.
- Decisions that matter go in `STATE.md` or the relevant doc, not just stated in
  chat — conversation memory doesn't survive a session loss.
- Each PR description restates what it does and why in one paragraph, so review
  doesn't depend on remembering the conversation that led to it.

## Failure & interruption / resume protocol

Power outages are a real, frequent risk here — assume any session can end
mid-task, without warning.

- Commit at every logical checkpoint, not at the end of a feature. A checkpoint is
  "this compiles and the change is self-contained," not "the feature is done."
- Never leave more than ~15 minutes of uncommitted work — uncommitted work doesn't
  exist after a power loss.
- On resume: `git status` first, then read `STATE.md`, then re-run the last
  test/build that was passing before continuing. Don't assume the last edit
  finished cleanly.
- Scripts that touch external state (git push, repo/branch creation) must be safe
  to re-run: check-then-act, not blind act — check whether a branch/PR already
  exists before creating one.

## Multi-tasking / multi-agent protocol

- One agent per independent, non-overlapping unit of work (e.g. one dashboard
  component each). Never two agents editing the same file concurrently.
- Phase-gate: don't start the next phase (e.g. animations) until the current phase
  (e.g. static layout against fixture data) is verified working, per the build
  order in `implementation.md`.
- A coordinating session owns `STATE.md` and merges; sub-agents report back what
  changed and where — they don't merge their own work into `dev` directly.
- Cap parallel agents at the number of genuinely independent tasks available.
  Spawning agents for tasks with shared dependencies just creates merge conflicts.

## Sandbox test protocol

Before any PR is opened:

- `next build` succeeds with no errors; the route-size table is checked against
  the performance rule in `implementation.md`.
- `next lint` and `tsc --noEmit` are both clean.
- Every pure function in `lib/` (metrics, recommendations) has a corresponding
  check that fails if the logic breaks — a plain assert-based test file is enough,
  no framework needed beyond what `next` scaffolds.

## Visual test protocol

Before any PR touching UI is opened, open the running dev server in a browser
(Claude in Chrome or Playwright) and check:

- Dark background is not pure black; glass/blur effect is visible on cards.
- No layout shift or overlap at both desktop and mobile widths.
- No console errors.
- Animations actually trigger — not just present in code.

Take a screenshot and include it in the PR description as evidence. "Looks right"
without a screenshot doesn't count as tested.

## Token optimization protocol

The irony of burning excess tokens to build a token-tracking tool isn't lost on
anyone — practice what this project preaches.

- Don't re-read files that haven't changed since they were last read this session.
- Prefer targeted diffs (`Edit`) over full-file rewrites (`Write`) for existing
  files.
- Batch independent tool calls (reads, greps, independent edits) into a single
  turn instead of one-by-one round trips.
- Use `grep`/`glob` to find the right lines before reading a whole file, especially
  anything over ~200 lines.
- Summarize long command output instead of dumping it verbatim into the next
  prompt.
- Keep commit messages and PR descriptions terse and factual — don't restate the
  whole diff in prose.
- When a sub-task is simple and well-specified (boilerplate component,
  straightforward function), don't over-deliberate: one pass, verify, move on.
