"use client";

import { useLayoutEffect, useRef } from "react";
import { fmtTokens, pct } from "@/lib/format";
import { prefersReducedMotion } from "./anim";

// 270° arc gauge. Blue under 80%, amber 80–100%, red at/over cap.
// anime.js fills the arc and counts the number up on mount (perf rule: lib is lazy).
export function QuotaGauge({
  used,
  cap,
  label,
  calibrated = false,
}: {
  used: number;
  cap: number;
  label: string;
  calibrated?: boolean;
}) {
  const ratio = cap > 0 ? Math.min(1, used / cap) : 0;
  const over = cap > 0 && used >= cap;
  const size = 132;
  const stroke = 11;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const arc = 0.75; // fraction of the circle the gauge spans (270°)
  const track = circ * arc;
  const finalOffset = track * (1 - ratio);
  const color = over
    ? "var(--destructive)"
    : ratio > 0.8
      ? "var(--warning)"
      : "var(--primary)";

  const fillRef = useRef<SVGCircleElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return; // leave rendered-final state
    const fill = fillRef.current;
    const num = numRef.current;
    if (!fill || !num) return;
    fill.style.strokeDashoffset = String(track); // start empty
    num.textContent = "0%";
    let cancelled = false;
    const obj = { p: 0 };
    import("animejs")
      .then(({ animate }) => {
        if (cancelled) return;
        animate(obj, {
          p: 1,
          duration: 950,
          ease: "outCubic",
          onUpdate: () => {
            if (fillRef.current)
              fillRef.current.style.strokeDashoffset = String(track * (1 - ratio * obj.p));
            if (numRef.current) numRef.current.textContent = pct(ratio * obj.p);
          },
        });
      })
      .catch(() => {
        if (fillRef.current) fillRef.current.style.strokeDashoffset = String(finalOffset);
        if (numRef.current) numRef.current.textContent = pct(ratio);
      });
    return () => {
      cancelled = true;
    };
  }, [ratio, track, finalOffset]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(135deg)" }}>
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
            ref={fillRef}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${track} ${circ}`}
            strokeDashoffset={finalOffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            ref={numRef}
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
        {calibrated && (
          <span className="ml-1 text-[10px] opacity-70" title="Auto-calibrated to your observed peak — set a real cap in config/limits.ts">
            est
          </span>
        )}
      </div>
    </div>
  );
}
