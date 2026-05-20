import { Request, Response } from 'express';
import { processDueJobs } from './worker';

// Worker endpoint — driven by pg_cron (POST /api/internal/jobs/process every
// minute). Guarded by the cron-secret check in routes/internal.ts.
export async function processJobs(_req: Request, res: Response): Promise<void> {
  try {
    const result = await processDueJobs();
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('processJobs error:', err);
    res.status(500).json({ ok: false, message: 'Job processing failed' });
  }
}
