"use client";

import type { BurnRate } from "@/lib/metrics";
import { fmtTokens, fmtHours } from "@/lib/format";

export function BurnRateCard({ burn }: { burn: BurnRate }) {
  const warn = burn.hitsWithinWindow;
  return (
    <div className="flex flex-col justify-center gap-3">
      <Stat label="Rate (last hour)" value={`${fmtTokens(burn.ratePerHour)}/h`} />
      <Stat
        label="Est. time to 5h cap"
        value={fmtHours(burn.hoursToCap)}
        emphasis={warn}
      />
      <Stat label="5h window remaining" value={fmtTokens(burn.remaining)} />
      {warn && (
        <p className="text-xs font-medium text-warning">
          {burn.hoursToCap === Infinity
            ? "At or over the configured 5h cap."
            : "On pace to hit the 5h cap this window."}
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className="text-lg font-semibold tabular-nums"
        style={{ color: emphasis ? "var(--warning)" : undefined }}
      >
        {value}
      </span>
    </div>
  );
}
