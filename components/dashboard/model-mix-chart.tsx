"use client";

import { Cell, Pie, PieChart } from "recharts";
import type { ModelMetric } from "@/lib/metrics";
import { fmtTokens, pct } from "@/lib/format";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const COLORS: Record<string, string> = {
  Opus: "var(--chart-3)",
  Sonnet: "var(--chart-1)",
  Haiku: "var(--chart-5)",
  Other: "var(--chart-4)",
};

export default function ModelMixChart({ models }: { models: ModelMetric[] }) {
  const data = models.map((m) => ({ name: m.model, tokens: m.tokens, share: m.tokenShare }));
  const config: ChartConfig = Object.fromEntries(
    models.map((m) => [m.model, { label: m.model, color: COLORS[m.model] }]),
  );

  return (
    <div className="flex items-center gap-3">
      <ChartContainer config={config} className="aspect-square h-32">
        <PieChart>
          <ChartTooltip
            content={<ChartTooltipContent nameKey="name" formatter={(v) => fmtTokens(Number(v))} />}
          />
          <Pie data={data} dataKey="tokens" nameKey="name" innerRadius={34} outerRadius={56} strokeWidth={2} stroke="var(--background)">
            {data.map((d) => (
              <Cell key={d.name} fill={COLORS[d.name] ?? "var(--chart-2)"} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="flex flex-col gap-1.5 text-xs">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ background: COLORS[d.name] ?? "var(--chart-2)" }}
            />
            <span className="w-14">{d.name}</span>
            <span className="tabular-nums text-muted-foreground">{pct(d.share)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
