"use client";

import type { Recommendation } from "@/lib/recommendations";

export function RecommendationsFeed({ recs }: { recs: Recommendation[] }) {
  if (recs.length === 0) {
    return (
      <div className="flex h-full min-h-24 flex-col items-center justify-center gap-1 text-center">
        <span className="text-sm font-medium">All clear</span>
        <span className="text-xs text-muted-foreground">
          No usage concerns right now.
        </span>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2.5">
      {recs.map((r) => (
        <li
          key={r.id}
          className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3"
        >
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
            style={{
              background:
                r.severity === "warning" ? "var(--warning)" : "var(--primary)",
            }}
          />
          <div className="min-w-0">
            <div className="text-sm font-medium">{r.title}</div>
            <div className="text-xs leading-relaxed text-muted-foreground">
              {r.detail}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
