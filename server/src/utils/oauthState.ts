import crypto from 'crypto';

const TTL_MS = 15 * 60 * 1000;

function getSecret(secret?: string): string {
  const s = secret || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error('oauthState: no secret available');
  return s;
}

export function buildOAuthState(userId: string, secret?: string): string {
  const payload = Buffer.from(`${userId}:${Date.now()}`).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret(secret)).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifyOAuthState(state: string, secret?: string): string | null {
  if (!state) return null;
  const dot = state.lastIndexOf('.');
  if (dot === -1) return null;
  const payload = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  const expected = crypto.createHmac('sha256', getSecret(secret)).update(payload).digest('hex');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const decoded = Buffer.from(payload, 'base64url').toString();
  const colonIdx = decoded.lastIndexOf(':');
  if (colonIdx === -1) return null;
  const userId = decoded.slice(0, colonIdx);
  const ts = parseInt(decoded.slice(colonIdx + 1), 10);
  if (!userId || isNaN(ts) || Date.now() - ts > TTL_MS) return null;
  return userId;
}
