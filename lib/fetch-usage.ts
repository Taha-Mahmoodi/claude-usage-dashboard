// The one allowed side-effecting function: pulls the public data repo's raw files.
// parseNdjson is pure and defensive — a single malformed line must never break the dashboard.
import type { UsageRow, DeviceRow } from "./types";

export const DATA_BASE =
  "https://raw.githubusercontent.com/Taha-Mahmoodi/claude-usage-data/main/";

export function parseNdjson(text: string, device: string): DeviceRow[] {
  const out: DeviceRow[] = [];
  for (const line of text.split("\n")) {
    const s = line.trim();
    if (!s) continue;
    try {
      const r = JSON.parse(s) as UsageRow;
      // Trust-boundary shape guard: skip rows missing required fields.
      if (typeof r.ts !== "string" || typeof r.input_tokens !== "number") continue;
      out.push({ ...r, device });
    } catch {
      // skip malformed line
    }
  }
  return out;
}

export async function fetchUsage(base: string = DATA_BASE): Promise<DeviceRow[]> {
  // Cache-bust so every load is current — GitHub's raw CDN edge-caches by URL for ~5 min,
  // which a plain fetch can't bypass. A unique query param forces a fresh origin read.
  const bust = () => `?t=${Date.now()}`;
  const devices: string[] = await fetch(`${base}devices.json${bust()}`, {
    cache: "no-store",
  }).then((r) => r.json());
  const perDevice = await Promise.all(
    devices.map(async (d) => {
      const res = await fetch(`${base}data/${encodeURIComponent(d)}.ndjson${bust()}`, {
        cache: "no-store",
      });
      if (!res.ok) return [] as DeviceRow[];
      return parseNdjson(await res.text(), d);
    }),
  );
  return perDevice.flat();
}
