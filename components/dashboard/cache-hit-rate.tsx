"use client";

import type { DeviceMetric } from "@/lib/metrics";
import { pct } from "@/lib/format";
import { LIMITS } from "@/config/limits";
import { useCountUp } from "./anim";

export function CacheHitRate({
  overall,
  devices,
}: {
  overall: number;
  devices: DeviceMetric[];
}) {
  const numRef = useCountUp<HTMLDivElement>(overall, (n) => pct(n));
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div ref={numRef} className="text-3xl font-semibold tabular-nums">
          {pct(overall)}
        </div>
        <div className="text-xs text-muted-foreground">overall cache reuse</div>
      </div>
      <div className="flex flex-col gap-2">
        {devices.map((d) => {
          const low = d.cacheHitRate < LIMITS.cacheHitFloor;
          return (
            <div key={d.device} className="flex items-center gap-2">
              <span className="w-24 shrink-0 truncate text-xs text-muted-foreground">
                {d.device}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full w-full origin-left rounded-full"
                  style={{
                    transform: `scaleX(${d.cacheHitRate})`,
                    background: low ? "var(--warning)" : "var(--primary)",
                    transition: "transform 0.6s ease",
                  }}
                />
              </div>
              <span className="w-9 shrink-0 text-right text-xs tabular-nums">
                {pct(d.cacheHitRate)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
