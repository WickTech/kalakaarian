export const BASE_DELAY_MS = 200;
export const MAX_ATTEMPTS = 5;

export function backoffDelay(attempt: number): number {
  const base = BASE_DELAY_MS * Math.pow(2, attempt);
  const jitter = (Math.random() * 0.4 - 0.2) * base;
  return Math.max(0, Math.round(base + jitter));
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
