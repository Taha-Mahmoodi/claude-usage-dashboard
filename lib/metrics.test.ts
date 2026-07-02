import assert from "node:assert/strict";
import { test } from "node:test";
import {
  totalTokens,
  complexity,
  modelFamily,
  percentile,
  median,
  sumWindow,
  cacheHitRate,
  computeMetrics,
} from "./metrics.ts";
import { LIMITS } from "../config/limits.ts";
import type { DeviceRow } from "./types.ts";

const NOW = Date.parse("2026-07-02T18:00:00Z");
const H = 3600_000;
const D = 24 * H;

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

test("scalars", () => {
  assert.equal(totalTokens({ input_tokens: 1, output_tokens: 2, cache_creation_tokens: 3, cache_read_tokens: 4 }), 10);
  assert.equal(complexity({ tool_calls: 2, output_tokens: 5 }), 7);
  assert.equal(modelFamily("claude-opus-4-8"), "Opus");
  assert.equal(modelFamily("claude-sonnet-5"), "Sonnet");
  assert.equal(modelFamily("claude-haiku-4-5"), "Haiku");
  assert.equal(modelFamily("gpt-9"), "Other");
});

test("percentile + median (linear interpolation)", () => {
  assert.equal(percentile([1, 2, 3, 4], 0.25), 1.75);
  assert.equal(percentile([5], 0.9), 5);
  assert.equal(percentile([], 0.5), 0);
  assert.equal(median([1, 2, 3]), 2);
  assert.equal(median([1, 2, 3, 4]), 2.5);
});

test("sumWindow respects the trailing window", () => {
  const rows = [
    mk({ ts: new Date(NOW - 1 * H).toISOString(), input_tokens: 100 }), // inside 5h
    mk({ ts: new Date(NOW - 10 * H).toISOString(), input_tokens: 100 }), // outside 5h
  ];
  const w = sumWindow(rows, NOW, 5 * H);
  assert.equal(w.count, 1);
  assert.equal(w.total, 100);
});

test("cacheHitRate = read / (read + creation + input)", () => {
  const rows = [mk({ input_tokens: 100, cache_creation_tokens: 100, cache_read_tokens: 800 })];
  assert.equal(cacheHitRate(rows), 0.8);
  assert.equal(cacheHitRate([]), 0);
});

test("computeMetrics: downgrade candidates + burn approaching cap", () => {
  const rows = [
    mk({ device: "a", ts: new Date(NOW - 1 * D).toISOString(), model: "claude-opus-4-8", output_tokens: 10, tool_calls: 0 }), // opus, complexity 10
    mk({ device: "a", ts: new Date(NOW - 1 * D).toISOString(), model: "claude-sonnet-5", output_tokens: 20, tool_calls: 0 }), // complexity 20
    mk({ device: "b", ts: new Date(NOW - 2 * D).toISOString(), model: "claude-opus-4-8", output_tokens: 30, tool_calls: 0 }), // opus, complexity 30
    mk({ device: "b", ts: new Date(NOW - 2 * D).toISOString(), model: "claude-haiku-4-5", output_tokens: 40, tool_calls: 0 }), // complexity 40
  ];
  // 25th-pct complexity of [10,20,30,40] = 17.5 → only the opus task at 10 qualifies.
  const m = computeMetrics(rows, NOW, LIMITS);
  assert.equal(m.downgrade.candidates, 1);
  assert.ok(m.topTasks.length <= 5);
  assert.equal(m.devices.length, 2);

  // Force the burn window over a tiny cap → hitsWithinWindow true.
  const hot = [mk({ ts: new Date(NOW - 30 * 60_000).toISOString(), output_tokens: 1000 })];
  const burnM = computeMetrics(hot, NOW, { ...LIMITS, cap5h: 10 });
  assert.equal(burnM.burn.hitsWithinWindow, true);
});
