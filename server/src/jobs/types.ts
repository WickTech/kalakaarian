// Types for the background-job queue (Phase 3).

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Job {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  run_after: string;
  idempotency_key: string | null;
  last_error: string | null;
}

export interface EnqueueOptions {
  // Delay execution until this time (used for retries / scheduled work).
  runAfter?: Date;
  // Total attempts before the job is marked 'failed'. Defaults to 5.
  maxAttempts?: number;
  // When set, a second enqueue with the same key is silently ignored — gives
  // callers exactly-once semantics for a logical task.
  idempotencyKey?: string;
}

// A handler processes one job's payload. Throwing triggers a retry (or final
// failure once max_attempts is reached).
export type JobHandler = (payload: Record<string, unknown>) => Promise<void>;
