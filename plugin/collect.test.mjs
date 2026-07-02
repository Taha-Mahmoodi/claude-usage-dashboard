import assert from "node:assert/strict";
import { test } from "node:test";
import { extractUsage } from "./hooks/collect.mjs";

const asst = (over) =>
  JSON.stringify({
    type: "assistant",
    message: {
      role: "assistant",
      model: "claude-opus-4-8",
      content: [
        { type: "text", text: "hi" },
        { type: "tool_use", id: "a", name: "Bash", input: {} },
        { type: "tool_use", id: "b", name: "Read", input: {} },
      ],
      usage: {
        input_tokens: 1200,
        output_tokens: 340,
        cache_creation_input_tokens: 800,
        cache_read_input_tokens: 4200,
      },
      ...over,
    },
  });

test("extracts the latest assistant usage block + tool_use count", () => {
  const transcript = [
    JSON.stringify({ type: "user", message: { role: "user", content: "go" } }),
    asst(),
    JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "tool_result" }] } }),
  ].join("\n");

  const u = extractUsage(transcript);
  assert.deepEqual(u, {
    model: "claude-opus-4-8",
    input_tokens: 1200,
    output_tokens: 340,
    cache_creation_tokens: 800,
    cache_read_tokens: 4200,
    tool_calls: 2,
  });
});

test("picks the LAST assistant-with-usage, skips blank/malformed lines", () => {
  const transcript = [
    asst({ usage: { input_tokens: 1, output_tokens: 1 }, content: [] }),
    "",
    "not json",
    asst({ model: "claude-haiku-4-5", usage: { input_tokens: 9, output_tokens: 2 }, content: [] }),
  ].join("\n");

  const u = extractUsage(transcript);
  assert.equal(u.model, "claude-haiku-4-5");
  assert.equal(u.input_tokens, 9);
  assert.equal(u.tool_calls, 0);
});

test("no usage block → null", () => {
  const transcript = JSON.stringify({ type: "user", message: { role: "user", content: "hi" } });
  assert.equal(extractUsage(transcript), null);
});
