// Max20x limits. Anthropic does NOT publish these in token terms — and this dashboard
// counts cache-read tokens at full weight while Anthropic's limit doesn't — so the only
// coherent yardstick is YOUR OWN observed usage. Caps therefore auto-calibrate to your
// observed peak (see lib/metrics computeMetrics), overridable below once you learn your
// real throttle point. Reset times use the real window structure:
//   - 5h: a session BLOCK that opens on your first prompt and runs 5h (then a fresh block).
//   - weekly: resets at a fixed day/hour assigned to your account (set it below).

export interface Limits {
  window5hMs: number;
  window7dMs: number;

  // Set once you know your real throttle point (in THIS dashboard's token metric).
  // null → auto-calibrate from observed peak usage.
  cap5hOverride: number | null;
  cap7dOverride: number | null;

  // Auto-calibration when no override: cap = max(floor, peak × (1 + autoHeadroom)).
  autoHeadroom: number;
  cap5hFloor: number;
  cap7dFloor: number;

  // Weekly reset, in the viewer's LOCAL time (whatever tz the browser is in).
  // Find yours on the Claude app (it shows the exact reset day/time).
  weeklyResetDay: number; // 0=Sun … 6=Sat
  weeklyResetHour: number; // 0–23 local
  weeklyResetMinute: number; // 0–59 local

  cacheHitFloor: number;
  outlierFactor: number;
  downgradePercentile: number;
}

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

export const LIMITS: Limits = {
  window5hMs: 5 * HOUR,
  window7dMs: 7 * DAY,

  // Calibrated from the Claude app on 2026-07-02: cost-weighted usage of ~146k read as
  // 11% of the 5h limit and 4% of the weekly limit → cap ≈ used / fraction. These are in
  // COST-WEIGHTED tokens (cache reads ×0.1), matching lib/metrics costTokens.
  // Re-derive if the app % and this dashboard's % drift apart.
  cap5hOverride: 1_330_000,
  cap7dOverride: 3_650_000,

  autoHeadroom: 0.25,
  cap5hFloor: 1_000_000,
  cap7dFloor: 20_000_000,

  weeklyResetDay: 4, // Thursday (Taha's account) — set to yours from the Claude app
  weeklyResetHour: 22,
  weeklyResetMinute: 29,

  cacheHitFloor: 0.3,
  outlierFactor: 2,
  downgradePercentile: 0.25,
};
