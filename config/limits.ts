// Max20x rate-limit windows + thresholds. The exact token caps are NOT published
// by Anthropic — these are calibration knobs Taha tunes empirically (e.g. from when
// throttling is first observed), not values read from a spec.
// ponytail: placeholder caps; tune cap5h/cap7d once real rate-limiting is seen.

export interface Limits {
  window5hMs: number;
  window7dMs: number;
  cap5h: number; // token cap for the trailing 5h window
  cap7d: number; // token cap for the trailing 7d window
  cacheHitFloor: number; // cache hit rate below this → low-reuse warning (0..1)
  outlierFactor: number; // device median > factor × cross-device median → outlier
  downgradePercentile: number; // Opus tasks below this complexity percentile → downgrade candidate (0..1)
}

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

export const LIMITS: Limits = {
  window5hMs: 5 * HOUR,
  window7dMs: 7 * DAY,
  // ponytail: demo placeholders sized so the fixture data reads meaningfully
  // (gauges fill, approaching-limit fires). RECALIBRATE for real usage — the true
  // Max20x token caps are unpublished; tune from when throttling is first observed.
  cap5h: 500_000,
  cap7d: 6_000_000,
  cacheHitFloor: 0.3,
  outlierFactor: 2,
  downgradePercentile: 0.25,
};
