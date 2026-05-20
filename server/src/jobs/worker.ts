import * as repo from './repository';
import { handlers } from './handlers';
import { backoffMs } from './backoff';

export interface WorkerResult {
  claimed: number;
  processed: number;
  retried: number;
  failed: number;
}

// Claims a batch of due jobs and runs each handler. A handler that throws is
// retried with exponential backoff until max_attempts, then marked 'failed'.
// claim_jobs() already incremented `attempts`, so job.attempts reflects the
// attempt that just ran.
export async function processDueJobs(batchSize = 20): Promise<WorkerResult> {
  const jobs = await repo.claimJobs(batchSize);
  const result: WorkerResult = { claimed: jobs.length, processed: 0, retried: 0, failed: 0 };

  for (const job of jobs) {
    const handler = handlers[job.type];
    if (!handler) {
      await repo.failJob(job.id, `no handler registered for job type "${job.type}"`);
      result.failed++;
      continue;
    }

    try {
      await handler(job.payload);
      await repo.completeJob(job.id);
      result.processed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (job.attempts >= job.max_attempts) {
        await repo.failJob(job.id, message);
        result.failed++;
      } else {
        await repo.rescheduleJob(job.id, new Date(Date.now() + backoffMs(job.attempts)), message);
        result.retried++;
      }
      console.error(`job ${job.id} (${job.type}) attempt ${job.attempts} failed:`, message);
    }
  }

  return result;
}
