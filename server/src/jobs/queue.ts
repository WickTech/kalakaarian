import * as repo from './repository';
import type { EnqueueOptions } from './types';

// Public entry point for adding work to the background-job queue. Services call
// this instead of doing slow/failable async work inline — the worker picks it
// up (see worker.ts) with retries + idempotency.
export async function enqueueJob(
  type: string,
  payload: Record<string, unknown>,
  opts: EnqueueOptions = {},
): Promise<void> {
  await repo.enqueue({
    type,
    payload,
    run_after: (opts.runAfter ?? new Date()).toISOString(),
    max_attempts: opts.maxAttempts ?? 5,
    idempotency_key: opts.idempotencyKey ?? null,
  });
}
