// Pure metric functions — no React, no side effects. All windowing takes an
// explicit `now` (epoch ms) so results are deterministic and testable.
import type { DeviceRow } from "./types";
import type { Limits } from "../config/limits";

// Kept local (not imported) so every cross-lib import stays type-only — lets Node's
// native .ts test runner load this module without extensionless-import resolution.
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function totalTokens(r: {
  input_tokens: number;
  output_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
}): number {
  return (
    r.input_tokens + r.output_tokens + r.cache_creation_tokens + r.cache_read_tokens
  );
}

// One task = one Stop-hook firing = one row. Complexity heuristic from the spec.
export function complexity(r: { tool_calls: number; output_tokens: number }): number {
  return r.tool_calls + r.output_tokens;
}

export function modelFamily(model: string): "Opus" | "Sonnet" | "Haiku" | "Other" {
  const m = model.toLowerCase();
  if (m.includes("opus")) return "Opus";
  if (m.includes("sonnet")) return "Sonnet";
  if (m.includes("haiku")) return "Haiku";
  return "Other";
}

// Linear-interpolated percentile. `p` in [0,1]. Values need not be pre-sorted.
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  if (s.length === 1) return s[0];
  const idx = p * (s.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return s[lo];
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

export function median(values: number[]): number {
  return percentile(values, 0.5);
}

function inWindow(rows: DeviceRow[], now: number, windowMs: number): DeviceRow[] {
  const cutoff = now - windowMs;
  return rows.filter((r) => {
    const t = Date.parse(r.ts);
    return !Number.isNaN(t) && t > cutoff && t <= now;
  });
}

export interface WindowSum {
  total: number;
  input: number;
  output: number;
  cacheCreation: number;
  cacheRead: number;
  count: number;
}

export function sumWindow(rows: DeviceRow[], now: number, windowMs: number): WindowSum {
  const w = inWindow(rows, now, windowMs);
  const acc: WindowSum = {
    total: 0,
    input: 0,
    output: 0,
    cacheCreation: 0,
    cacheRead: 0,
    count: w.length,
  };
  for (const r of w) {
    acc.input += r.input_tokens;
    acc.output += r.output_tokens;
    acc.cacheCreation += r.cache_creation_tokens;
    acc.cacheRead += r.cache_read_tokens;
    acc.total += totalTokens(r);
  }
  return acc;
}

// cache_read / (cache_read + cache_creation + input). Low reuse ⇒ redundant context resent.
export function cacheHitRate(rows: DeviceRow[]): number {
  let read = 0;
  let denom = 0;
  for (const r of rows) {
    read += r.cache_read_tokens;
    denom += r.cache_read_tokens + r.cache_creation_tokens + r.input_tokens;
  }
  return denom === 0 ? 0 : read / denom;
}

function groupBy<T, K extends string>(items: T[], key: (t: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const it of items) {
    const k = key(it);
    const arr = m.get(k);
    if (arr) arr.push(it);
    else m.set(k, [it]);
  }
  return m;
}

export interface DeviceMetric {
  device: string;
  tokens: number;
  tasks: number;
  medianTokensPerTask: number;
  cacheHitRate: number;
}

export interface ModelMetric {
  model: "Opus" | "Sonnet" | "Haiku" | "Other";
  tokens: number;
  tasks: number;
  tokenShare: number; // 0..1
  taskShare: number; // 0..1
}

export interface TrendPoint {
  t: number; // bucket start, epoch ms
  tokens: number;
}

export interface BurnRate {
  ratePerHour: number; // tokens in the trailing hour
  used5h: number;
  cap5h: number;
  remaining: number;
  hoursToCap: number; // Infinity if idle
  hitsWithinWindow: boolean;
}

export interface WindowQuota {
  used: number;
  cap: number;
  ratio: number; // used / cap, clamped 0..1
  calibrated: boolean; // true = cap came from observed peak (no manual override)
  resetAt: number | null; // epoch ms of next reset; null = no active window (full allowance)
}

export interface Quota {
  block5h: WindowQuota; // current 5h session block
  week: WindowQuota; // current weekly window
}

export interface Metrics {
  now: number;
  window5h: WindowSum;
  window7d: WindowSum;
  quota: Quota;
  devices: DeviceMetric[];
  crossDeviceMedianTokensPerTask: number;
  models: ModelMetric[];
  cacheHitRate: number;
  topTasks: DeviceRow[];
  trend: TrendPoint[];
  burn: BurnRate;
  downgrade: { threshold: number; candidates: number };
}

function deviceMetrics(rows: DeviceRow[]): DeviceMetric[] {
  const byDevice = groupBy(rows, (r) => r.device);
  const out: DeviceMetric[] = [];
  for (const [device, rs] of byDevice) {
    const perTask = rs.map(totalTokens);
    out.push({
      device,
      tokens: perTask.reduce((a, b) => a + b, 0),
      tasks: rs.length,
      medianTokensPerTask: median(perTask),
      cacheHitRate: cacheHitRate(rs),
    });
  }
  return out.sort((a, b) => b.tokens - a.tokens);
}

function modelMetrics(rows: DeviceRow[]): ModelMetric[] {
  const totalTok = rows.reduce((a, r) => a + totalTokens(r), 0);
  const totalTasks = rows.length;
  const byModel = groupBy(rows, (r) => modelFamily(r.model));
  const out: ModelMetric[] = [];
  for (const [model, rs] of byModel) {
    const tokens = rs.reduce((a, r) => a + totalTokens(r), 0);
    out.push({
      model,
      tokens,
      tasks: rs.length,
      tokenShare: totalTok === 0 ? 0 : tokens / totalTok,
      taskShare: totalTasks === 0 ? 0 : rs.length / totalTasks,
    });
  }
  return out.sort((a, b) => b.tokens - a.tokens);
}

function trendBuckets(
  rows: DeviceRow[],
  now: number,
  spanMs: number,
  bucketMs: number,
): TrendPoint[] {
  const start = now - spanMs;
  const nBuckets = Math.ceil(spanMs / bucketMs);
  const buckets: TrendPoint[] = Array.from({ length: nBuckets }, (_, i) => ({
    t: start + i * bucketMs,
    tokens: 0,
  }));
  for (const r of rows) {
    const t = Date.parse(r.ts);
    if (Number.isNaN(t) || t <= start || t > now) continue;
    const i = Math.min(nBuckets - 1, Math.floor((t - start) / bucketMs));
    buckets[i].tokens += totalTokens(r);
  }
  return buckets;
}

interface Block {
  start: number;
  end: number;
  total: number;
}

// 5h session blocks: a block opens on the first prompt and runs blockMs; the next
// prompt at/after the block ends opens a fresh block (Anthropic's real model).
function sessionBlocks(rows: DeviceRow[], blockMs: number): Block[] {
  const times = rows
    .map((r) => ({ t: Date.parse(r.ts), tok: totalTokens(r) }))
    .filter((x) => !Number.isNaN(x.t))
    .sort((a, b) => a.t - b.t);
  const blocks: Block[] = [];
  for (const { t, tok } of times) {
    const last = blocks[blocks.length - 1];
    if (!last || t >= last.end) blocks.push({ start: t, end: t + blockMs, total: tok });
    else last.total += tok;
  }
  return blocks;
}

// Most recent weekly-reset boundary (UTC) at or before `now`.
function lastWeeklyReset(now: number, day: number, hour: number): number {
  const d = new Date(now);
  let boundary = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour);
  boundary -= ((new Date(boundary).getUTCDay() - day + 7) % 7) * DAY;
  if (boundary > now) boundary -= 7 * DAY;
  return boundary;
}

function quotaOf(
  used: number,
  override: number | null,
  peak: number,
  floor: number,
  headroom: number,
  resetAt: number | null,
): WindowQuota {
  const calibrated = override == null;
  const cap = calibrated ? Math.max(floor, Math.ceil(peak * (1 + headroom))) : override;
  return { used, cap, ratio: cap > 0 ? Math.min(1, used / cap) : 0, calibrated, resetAt };
}

export function computeMetrics(
  rows: DeviceRow[],
  now: number,
  limits: Limits,
): Metrics {
  const window5h = sumWindow(rows, now, limits.window5hMs);
  const window7d = sumWindow(rows, now, limits.window7dMs);
  const devices = deviceMetrics(rows);

  // --- 5h session block ---
  const blocks = sessionBlocks(rows, limits.window5hMs);
  const peakBlock = blocks.reduce((m, b) => Math.max(m, b.total), 0);
  const active = blocks[blocks.length - 1];
  const blockActive = active != null && now < active.end;
  const used5h = blockActive ? active.total : 0;
  const reset5hAt = blockActive ? active.end : null;
  const block5h = quotaOf(
    used5h,
    limits.cap5hOverride,
    peakBlock,
    limits.cap5hFloor,
    limits.autoHeadroom,
    reset5hAt,
  );

  // --- weekly window (fixed reset) ---
  const weekStart = lastWeeklyReset(now, limits.weeklyResetDay, limits.weeklyResetHour);
  const weekByBoundary = new Map<number, number>();
  let usedWeek = 0;
  for (const r of rows) {
    const t = Date.parse(r.ts);
    if (Number.isNaN(t)) continue;
    const b = lastWeeklyReset(t, limits.weeklyResetDay, limits.weeklyResetHour);
    weekByBoundary.set(b, (weekByBoundary.get(b) ?? 0) + totalTokens(r));
    if (b === weekStart) usedWeek += totalTokens(r);
  }
  const peakWeek = [...weekByBoundary.values()].reduce((m, v) => Math.max(m, v), 0);
  const week = quotaOf(
    usedWeek,
    limits.cap7dOverride,
    peakWeek,
    limits.cap7dFloor,
    limits.autoHeadroom,
    weekStart + 7 * DAY,
  );

  // --- burn rate against the 5h block ---
  const lastHour = sumWindow(rows, now, HOUR).total;
  const remaining = Math.max(0, block5h.cap - used5h);
  const hoursToCap = lastHour > 0 ? remaining / lastHour : Infinity;
  const burn: BurnRate = {
    ratePerHour: lastHour,
    used5h,
    cap5h: block5h.cap,
    remaining,
    hoursToCap,
    hitsWithinWindow: used5h >= block5h.cap || hoursToCap <= 5,
  };

  // Downgrade rule inputs: 25th-pct complexity over ALL tasks; count Opus tasks below it.
  const last7d = inWindow(rows, now, limits.window7dMs);
  const threshold = percentile(last7d.map(complexity), limits.downgradePercentile);
  const candidates = last7d.filter(
    (r) => modelFamily(r.model) === "Opus" && complexity(r) < threshold,
  ).length;

  const topTasks = [...last7d]
    .sort((a, b) => totalTokens(b) - totalTokens(a))
    .slice(0, 5);

  return {
    now,
    window5h,
    window7d,
    quota: { block5h, week },
    devices,
    crossDeviceMedianTokensPerTask: median(devices.map((d) => d.medianTokensPerTask)),
    models: modelMetrics(last7d),
    cacheHitRate: cacheHitRate(rows),
    topTasks,
    trend: trendBuckets(rows, now, 30 * DAY, HOUR),
    burn,
    downgrade: { threshold, candidates },
  };
}
