// Rule-based tips — pure. Reads a computed Metrics object (never the network).
import type { Metrics } from "./metrics";
import type { Limits } from "../config/limits";

export type Severity = "info" | "warning";

export interface Recommendation {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${Math.round(n)}`;
}
const pct = (x: number) => `${Math.round(x * 100)}%`;

export function recommend(m: Metrics, limits: Limits): Recommendation[] {
  const out: Recommendation[] = [];
  const cross = m.crossDeviceMedianTokensPerTask;

  // Outlier device: median tokens/task far above the cross-device median.
  for (const d of m.devices) {
    if (cross > 0 && d.medianTokensPerTask > limits.outlierFactor * cross) {
      out.push({
        id: `outlier:${d.device}`,
        severity: "warning",
        title: `${d.device} is a usage outlier`,
        detail: `Median ${fmt(d.medianTokensPerTask)} tokens/task — over ${limits.outlierFactor}× the cross-device median (${fmt(cross)}).`,
      });
    }
  }

  // Model-downgrade candidates: low-complexity Opus tasks.
  if (m.downgrade.candidates > 0) {
    out.push({
      id: "downgrade",
      severity: "info",
      title: `${m.downgrade.candidates} Opus task${m.downgrade.candidates === 1 ? "" : "s"} likely fine on Haiku/Sonnet`,
      detail: `Scored below the ${Math.round(limits.downgradePercentile * 100)}th-percentile complexity (${fmt(m.downgrade.threshold)}) of all logged tasks.`,
    });
  }

  // Low cache reuse per device.
  for (const d of m.devices) {
    if (d.tasks > 0 && d.cacheHitRate < limits.cacheHitFloor) {
      out.push({
        id: `cache:${d.device}`,
        severity: "info",
        title: `${d.device}: low cache reuse`,
        detail: `Cache hit rate ${pct(d.cacheHitRate)} < ${pct(limits.cacheHitFloor)} — context may be getting resent instead of reused.`,
      });
    }
  }

  // Approaching the 5h cap at the current burn rate.
  if (m.burn.hitsWithinWindow) {
    out.push({
      id: "approaching-limit",
      severity: "warning",
      title: "Approaching the 5h cap",
      detail:
        m.burn.hoursToCap === Infinity
          ? "Already at or over the configured 5h token cap."
          : `At the last hour's pace you'd hit the 5h cap in ~${m.burn.hoursToCap.toFixed(1)}h.`,
    });
  }

  return out;
}
