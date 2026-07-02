import assert from "node:assert/strict";
import { test } from "node:test";
import { computeMetrics } from "./metrics.ts";
import { recommend } from "./recommendations.ts";
import { LIMITS } from "../config/limits.ts";
import type { DeviceRow } from "./types.ts";

const NOW = Date.parse("2026-07-02T18:00:00Z");
const D = 24 * 3600_000;

function mk(over: Partial<DeviceRow> = {}): DeviceRow {
  return {
    device: "dev-a",
    ts: new Date(NOW - D).toISOString(),
    model: "claude-sonnet-5",
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_tokens: 0,
    cache_read_tokens: 0,
    tool_calls: 0,
    session_id: "s1",
    ...over,
  };
}

test("clean data → no recommendations", () => {
  const rows = [
    mk({ device: "a", input_tokens: 100, cache_read_tokens: 900 }),
    mk({ device: "b", input_tokens: 100, cache_read_tokens: 900 }),
  ];
  const recs = recommend(computeMetrics(rows, NOW, LIMITS), LIMITS);
  assert.equal(recs.length, 0);
});

test("outlier device is flagged", () => {
  // Two normal devices + one whose median tokens/task is ≫ the cross-device median.
  const rows = [
    mk({ device: "a", input_tokens: 1000 }),
    mk({ device: "a", input_tokens: 1000 }),
    mk({ device: "b", input_tokens: 1000 }),
    mk({ device: "b", input_tokens: 1000 }),
    mk({ device: "c", input_tokens: 100_000 }),
    mk({ device: "c", input_tokens: 100_000 }),
  ];
  const recs = recommend(computeMetrics(rows, NOW, LIMITS), LIMITS);
  assert.ok(recs.some((r) => r.id === "outlier:c" && r.severity === "warning"));
});

test("low cache reuse is flagged", () => {
  const rows = [mk({ device: "a", input_tokens: 1000, cache_read_tokens: 0 })]; // hit rate 0
  const recs = recommend(computeMetrics(rows, NOW, LIMITS), LIMITS);
  assert.ok(recs.some((r) => r.id === "cache:a"));
});

test("approaching-limit fires when burn exceeds cap", () => {
  const rows = [mk({ ts: new Date(NOW - 30 * 60_000).toISOString(), output_tokens: 1000 })];
  const recs = recommend(computeMetrics(rows, NOW, { ...LIMITS, cap5hOverride: 10 }), { ...LIMITS, cap5hOverride: 10 });
  assert.ok(recs.some((r) => r.id === "approaching-limit"));
});
