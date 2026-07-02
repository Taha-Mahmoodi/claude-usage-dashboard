"use client";

import { fmtTokens, pct } from "@/lib/format";

// 270° arc gauge. Blue under 80%, amber 80–100%, red at/over cap.
export function QuotaGauge({
  used,
  cap,
  label,
}: {
  used: number;
  cap: number;
  label: string;
}) {
  const ratio = cap > 0 ? Math.min(1, used / cap) : 0;
  const over = cap > 0 && used >= cap;
  const size = 132;
  const stroke = 11;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const arc = 0.75; // fraction of the circle the gauge spans (270°)
  const track = circ * arc;
  const offset = track * (1 - ratio);
  const color = over
    ? "var(--destructive)"
    : ratio > 0.8
      ? "var(--warning)"
      : "var(--primary)";

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          // rotate so the 90° gap sits at the bottom
          style={{ transform: "rotate(135deg)" }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--border)"
            strokeWidth={stroke}
            strokeDasharray={`${track} ${circ}`}
            strokeLinecap="round"
          />
          <circle
            data-gauge-fill
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${track} ${circ}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.4s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-2xl font-semibold tabular-nums"
            style={{ color: over ? "var(--destructive)" : undefined }}
          >
            {pct(ratio)}
          </span>
          <span className="text-[11px] text-muted-foreground">{label}</span>
        </div>
      </div>
      <div className="mt-1 text-xs text-muted-foreground tabular-nums">
        {fmtTokens(used)} / {fmtTokens(cap)}
      </div>
    </div>
  );
}
