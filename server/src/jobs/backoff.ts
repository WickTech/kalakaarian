// Exponential backoff between job retries: 1m, 2m, 4m, 8m, ... capped at 1h.
// `attempt` is the attempt count that just failed (1-based).
export const backoffMs = (attempt: number): number =>
  Math.min(60_000 * 2 ** Math.max(0, attempt - 1), 60 * 60_000);
