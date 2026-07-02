// Generates fake usage for building the UI before real devices push.
// Writes a multi-device set the app fetches exactly like the real data repo:
//   public/fixtures/devices.json + public/fixtures/data/<device>.ndjson
// Also writes __fixtures__/sample-device.ndjson (one device) for reference/tests.
// Deterministic (seeded LCG) so re-running is a no-op diff.
// Run: node __fixtures__/generate.mjs
import { writeFileSync, mkdirSync } from "node:fs";

const REF = Date.parse("2026-07-02T18:00:00Z"); // anchor "now"; the app shifts this to real now
const HOUR = 3600_000;
const DAY = 24 * HOUR;

let seed = 1337;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (lo, hi) => Math.floor(lo + rand() * (hi - lo));

const MODELS = ["claude-opus-4-8", "claude-sonnet-5", "claude-haiku-4-5"];

// Per-device profiles so the recommendations light up realistically.
const DEVICES = [
  { name: "macbook-air", scale: 1, cache: "normal", burst: false, models: MODELS },
  { name: "desktop-pc", scale: 4, cache: "normal", burst: true, models: ["claude-opus-4-8", "claude-opus-4-8", "claude-sonnet-5"] }, // outlier + burst
  { name: "mac-studio", scale: 1.2, cache: "normal", burst: false, models: MODELS },
  { name: "thinkpad", scale: 1, cache: "low", burst: false, models: ["claude-sonnet-5", "claude-haiku-4-5"] }, // low cache reuse
];

function row(tsMs, dev) {
  const model = pick(dev.models);
  const heavy = model.includes("opus");
  const s = dev.scale;
  return {
    ts: new Date(tsMs).toISOString(),
    model,
    input_tokens: between(400, (heavy ? 4000 : 1500) * s),
    output_tokens: between(100, (heavy ? 1800 : 700) * s),
    cache_creation_tokens: between(0, 1200),
    cache_read_tokens: dev.cache === "low" ? between(0, 300) : between(0, (heavy ? 9000 : 3000) * s),
    tool_calls: between(0, heavy ? 8 : 3),
    session_id: `s${between(1000, 9999)}`,
  };
}

const root = new URL("../", import.meta.url);
mkdirSync(new URL("public/fixtures/data/", root), { recursive: true });

const manifest = [];
for (const dev of DEVICES) {
  const rows = [];
  for (let d = 30; d >= 1; d--) {
    const tasks = between(2, Math.round(10 * dev.scale));
    for (let i = 0; i < tasks; i++) rows.push(row(REF - d * DAY + between(0, DAY), dev));
  }
  if (dev.burst) {
    for (let i = 0; i < 18; i++) rows.push(row(REF - between(0, 5 * HOUR), dev));
  } else {
    for (let i = 0; i < between(1, 5); i++) rows.push(row(REF - between(0, 5 * HOUR), dev));
  }
  rows.sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
  const ndjson = rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
  writeFileSync(new URL(`public/fixtures/data/${dev.name}.ndjson`, root), ndjson);
  manifest.push(dev.name);
  if (dev.name === "macbook-air") {
    writeFileSync(new URL("__fixtures__/sample-device.ndjson", root), ndjson);
  }
}
writeFileSync(new URL("public/fixtures/devices.json", root), JSON.stringify(manifest) + "\n");
console.log(`wrote ${manifest.length} device files → public/fixtures/ (ref ${new Date(REF).toISOString()})`);
