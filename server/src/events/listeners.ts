import { bus } from './bus';
import { enqueueJob } from '../jobs/queue';

// Wires domain events to background jobs. Called once at app startup.

let registered = false;

export function registerEventListeners(): void {
  if (registered) return;
  registered = true;

  // A new registration triggers a (retry-safe, deduped) welcome email.
  bus.on('user.registered', async (e) => {
    if (!e.email) return;
    await enqueueJob(
      'email.welcome',
      { email: e.email, name: e.name, role: e.role },
      { idempotencyKey: `email.welcome:${e.userId}` },
    );
  });
}
