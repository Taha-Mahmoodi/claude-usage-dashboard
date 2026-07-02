// Fixture-only glue: the sample data is anchored to a fixed reference time, so the
// trailing 5h/7d windows would exclude it. Shift every row by (now - ref) so the
// dashboard has recent-looking data. Removed in Phase 5 when real data is fetched.
import type { DeviceRow } from "./types";

export const FIXTURE_REF = Date.parse("2026-07-02T18:00:00Z");
export const FIXTURE_BASE = "/fixtures/";

export function shiftToNow(rows: DeviceRow[], now: number): DeviceRow[] {
  const delta = now - FIXTURE_REF;
  return rows.map((r) => ({
    ...r,
    ts: new Date(Date.parse(r.ts) + delta).toISOString(),
  }));
}
