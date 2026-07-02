// Raw usage-metadata schema — one object per line in data/<device>.ndjson.
// Mirrors the stored format in the design spec. No prompt/response content, ever.
export interface UsageRow {
  ts: string; // ISO 8601
  model: string; // e.g. "claude-opus-4-8"
  input_tokens: number;
  output_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
  tool_calls: number;
  session_id: string;
}

// A row with its originating device attached (device comes from the filename).
export interface DeviceRow extends UsageRow {
  device: string;
}
