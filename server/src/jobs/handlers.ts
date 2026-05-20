import { sendWelcomeEmail } from '../services/emailService';
import type { JobHandler } from './types';

// Job-handler registry. To add a job type, write a handler and register it
// here — the worker dispatches by `job.type`.
//
// Latency-sensitive emails (OTP, password-reset) are intentionally NOT queued:
// the worker runs once a minute, so they stay synchronous at their call sites.
// Durable, retry-worthy async work (welcome email, notifications, invoice
// generation, analytics sync, ...) belongs here.

const emailWelcome: JobHandler = async (payload) => {
  const { email, name, role } = payload as { email: string; name: string; role: string };
  if (!email) return;
  await sendWelcomeEmail(email, name, role);
};

export const handlers: Record<string, JobHandler> = {
  'email.welcome': emailWelcome,
};
