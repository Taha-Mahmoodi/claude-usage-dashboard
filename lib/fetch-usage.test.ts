import assert from "node:assert/strict";
import { test } from "node:test";
import { parseNdjson } from "./fetch-usage.ts";

test("parseNdjson: valid rows get device attached; junk is skipped", () => {
  const text = [
    JSON.stringify({ ts: "2026-07-02T10:00:00Z", model: "claude-opus-4-8", input_tokens: 100, output_tokens: 10, cache_creation_tokens: 0, cache_read_tokens: 0, tool_calls: 1, session_id: "s1" }),
    "", // blank line
    "not json", // malformed
    JSON.stringify({ model: "x", input_tokens: "nope" }), // wrong shape
    JSON.stringify({ ts: "2026-07-02T11:00:00Z", model: "claude-haiku-4-5", input_tokens: 50, output_tokens: 5, cache_creation_tokens: 0, cache_read_tokens: 0, tool_calls: 0, session_id: "s2" }),
  ].join("\n");

  const rows = parseNdjson(text, "macbook-air");
  assert.equal(rows.length, 2);
  assert.equal(rows[0].device, "macbook-air");
  assert.equal(rows[1].session_id, "s2");
});
