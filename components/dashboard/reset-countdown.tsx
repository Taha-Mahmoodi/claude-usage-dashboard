"use client";

import { useEffect, useState } from "react";
import { fmtDurationMs } from "@/lib/format";

// Live "resets in Xh Ym" ticker. Only mounts client-side (after data loads), so the
// build-time prerender never sees a time — no hydration mismatch.
export function ResetCountdown({ resetAt }: { resetAt: number | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (resetAt == null) {
    return <span className="text-[11px] text-muted-foreground">full allowance</span>;
  }
  return (
    <span className="text-[11px] text-muted-foreground tabular-nums">
      resets in {fmtDurationMs(resetAt - now)}
    </span>
  );
}
