"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import type { DeviceMetric } from "@/lib/metrics";
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

export default function DeviceBreakdown({ devices }: { devices: DeviceMetric[] }) {
  const data = devices.map((d) => ({ device: d.device, tokens: d.tokens }));
  return (
    <ChartContainer config={config} className="h-full max-h-56 w-full">
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ left: 8, right: 16 }}
      >
        <YAxis
          dataKey="device"
          type="category"
          tickLine={false}
          axisLine={false}
          width={78}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
        />
        <XAxis type="number" hide />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent formatter={(v) => fmtTokens(Number(v))} />}
        />
        <Bar dataKey="tokens" fill="var(--color-tokens)" radius={5} />
      </BarChart>
    </ChartContainer>
  );
}
