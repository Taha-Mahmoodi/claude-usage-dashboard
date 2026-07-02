// Generates __fixtures__/sample-device.ndjson — fake usage for building the UI
// before real devices push. Deterministic (seeded LCG) so re-running is a no-op diff.
// Run: node __fixtures__/generate.mjs
import { writeFileSync } from "node:fs";

const REF = Date.parse("2026-07-02T18:00:00Z"); // anchor "now" for the fixture
const HOUR = 3600_000;
const DAY = 24 * HOUR;

// tiny seeded RNG
let seed = 1337;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (lo, hi) => Math.floor(lo + rand() * (hi - lo));

const MODELS = ["claude-opus-4-8", "claude-sonnet-5", "claude-haiku-4-5"];
const rows = [];

function row(tsMs, opts = {}) {
  const model = opts.model ?? pick(MODELS);
  const heavy = model.includes("opus");
  return {
    ts: new Date(tsMs).toISOString(),
    model,
    input_tokens: between(400, heavy ? 4000 : 1500),
    output_tokens: between(100, heavy ? 1800 : 700),
    cache_creation_tokens: between(0, 1200),
    cache_read_tokens: between(0, heavy ? 9000 : 3000),
    tool_calls: between(0, heavy ? 8 : 3),
    session_id: `s${between(1000, 9999)}`,
  };
}

// 30 days of scattered background activity
for (let d = 30; d >= 1; d--) {
  const tasks = between(2, 10);
  for (let i = 0; i < tasks; i++) {
    rows.push(row(REF - d * DAY + between(0, DAY)));
  }
}
// a burst in the trailing 5h (exercises burn-rate + approaching-limit)
for (let i = 0; i < 18; i++) {
  rows.push(row(REF - between(0, 5 * HOUR), { model: "claude-opus-4-8" }));
}

rows.sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
const out = rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
writeFileSync(new URL("./sample-device.ndjson", import.meta.url), out);
console.log(`wrote ${rows.length} rows to __fixtures__/sample-device.ndjson (ref ${new Date(REF).toISOString()})`);
