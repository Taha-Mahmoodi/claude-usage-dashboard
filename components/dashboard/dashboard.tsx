"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { DeviceRow } from "@/lib/types";
import { fetchUsage } from "@/lib/fetch-usage";
import { shiftToNow, FIXTURE_BASE } from "@/lib/fixture";
import { computeMetrics } from "@/lib/metrics";
import { recommend } from "@/lib/recommendations";
import { LIMITS } from "@/config/limits";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEntrance } from "./anim";
import { QuotaGauge } from "./quota-gauge";
import { BurnRateCard } from "./burn-rate-card";
import { CacheHitRate } from "./cache-hit-rate";
import { TopTasksTable } from "./top-tasks-table";
import { RecommendationsFeed } from "./recommendations-feed";

// Recharts is heavy — keep it out of the initial bundle (perf rule #2).
const chartLoading = () => <Skeleton className="h-full min-h-32 w-full" />;
const DeviceBreakdown = dynamic(() => import("./device-breakdown"), { ssr: false, loading: chartLoading });
const ModelMixChart = dynamic(() => import("./model-mix-chart"), { ssr: false, loading: chartLoading });
const TrendChart = dynamic(() => import("./trend-chart"), { ssr: false, loading: chartLoading });

function Panel({
  title,
  sub,
  className = "",
  children,
}: {
  title: string;
  sub?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={`dash-panel glass glass-hover gap-3 p-5 ${className}`}>
      <div>
        <div className="text-sm font-medium text-foreground/90">{title}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </Card>
  );
}

export function Dashboard() {
  const [now] = useState(() => Date.now());
  const [rows, setRows] = useState<DeviceRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    // Phase 3: fixture source. Phase 5 swaps to fetchUsage() against the real repo.
    fetchUsage(FIXTURE_BASE)
      .then((raw) => alive && setRows(shiftToNow(raw, now)))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, [now]);

  const metrics = useMemo(
    () => (rows ? computeMetrics(rows, now, LIMITS) : null),
    [rows, now],
  );
  const recs = useMemo(() => (metrics ? recommend(metrics, LIMITS) : []), [metrics]);
  const gridRef = useEntrance<HTMLDivElement>(".dash-panel");

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4"
    >
      <Panel
        title="Quota & burn-rate"
        sub="trailing 5h / 7d windows"
        className="md:col-span-2 lg:col-span-2"
      >
        {metrics ? (
          <div className="flex flex-wrap items-center justify-around gap-4">
            <QuotaGauge used={metrics.window5h.total} cap={metrics.burn.cap5h} label="5h" />
            <QuotaGauge used={metrics.window7d.total} cap={LIMITS.cap7d} label="7d" />
            <div className="min-w-40 flex-1">
              <BurnRateCard burn={metrics.burn} />
            </div>
          </div>
        ) : (
          <Skeleton className="h-36 w-full" />
        )}
      </Panel>

      <Panel title="Recommendations" sub="rule-based tips" className="md:col-span-2 lg:col-span-2">
        {error ? (
          <p className="text-sm text-destructive">Failed to load usage data.</p>
        ) : metrics ? (
          <RecommendationsFeed recs={recs} />
        ) : (
          <Skeleton className="h-24 w-full" />
        )}
      </Panel>

      <Panel title="Per-device breakdown" sub="tokens per device" className="lg:col-span-2">
        {metrics ? <DeviceBreakdown devices={metrics.devices} /> : <Skeleton className="h-40 w-full" />}
      </Panel>

      <Panel title="Model mix" sub="share of tokens (7d)">
        {metrics ? <ModelMixChart models={metrics.models} /> : <Skeleton className="h-32 w-full" />}
      </Panel>

      <Panel title="Cache hit rate" sub="reuse vs resend">
        {metrics ? (
          <CacheHitRate overall={metrics.cacheHitRate} devices={metrics.devices} />
        ) : (
          <Skeleton className="h-32 w-full" />
        )}
      </Panel>

      <Panel title="Trend" sub="tokens / day · 30d" className="md:col-span-2 lg:col-span-3">
        {metrics ? <TrendChart trend={metrics.trend} /> : <Skeleton className="h-40 w-full" />}
      </Panel>

      <Panel title="Top tasks" sub="5 priciest · 7d" className="lg:col-span-1">
        {metrics ? <TopTasksTable tasks={metrics.topTasks} /> : <Skeleton className="h-40 w-full" />}
      </Panel>
    </div>
  );
}
