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

  // Weekly reset (UTC). Find yours on claude.ai usage; adjust hour for your timezone.
  weeklyResetDay: number; // 0=Sun … 6=Sat
  weeklyResetHour: number; // 0–23 UTC

  cacheHitFloor: number;
  outlierFactor: number;
  downgradePercentile: number;
}

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

export const LIMITS: Limits = {
  window5hMs: 5 * HOUR,
  window7dMs: 7 * DAY,

  cap5hOverride: null,
  cap7dOverride: null,

  autoHeadroom: 0.25,
  cap5hFloor: 1_000_000,
  cap7dFloor: 20_000_000,

  weeklyResetDay: 3, // placeholder (Wed) — set to your account's weekly reset
  weeklyResetHour: 0,

  cacheHitFloor: 0.3,
  outlierFactor: 2,
  downgradePercentile: 0.25,
};
