export function safeJsonParse(value: string): unknown {
  return JSON.parse(value) as unknown;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

