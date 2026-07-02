"use client";

import { useMemo } from "react";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/lib/metrics";
import { fmtTokens } from "@/lib/format";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const config = {
  tokens: { label: "Tokens", color: "var(--chart-1)" },
} satisfies ChartConfig;

const DAY = 24 * 3600_000;

// Roll the 720 hourly buckets up to daily for a readable 30-day line.
function toDaily(trend: TrendPoint[]) {
  const byDay = new Map<number, number>();
  for (const p of trend) {
    const day = Math.floor(p.t / DAY) * DAY;
    byDay.set(day, (byDay.get(day) ?? 0) + p.tokens);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, tokens]) => ({
      label: new Date(t).toLocaleDateString(undefined, { month: "numeric", day: "numeric" }),
      tokens,
    }));
}

export default function TrendChart({ trend }: { trend: TrendPoint[] }) {
  const data = useMemo(() => toDaily(trend), [trend]);
  return (
    <ChartContainer config={config} className="h-full max-h-40 w-full">
      <AreaChart accessibilityLayer data={data} margin={{ left: 4, right: 8, top: 4 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-tokens)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="var(--color-tokens)" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          minTickGap={40}
          tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
        />
        <YAxis hide />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent formatter={(v) => fmtTokens(Number(v))} />}
        />
        <Area
          dataKey="tokens"
          type="monotone"
          stroke="var(--color-tokens)"
          strokeWidth={2}
          fill="url(#trendFill)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
