import * as repo from './passwordResetRepository';
import {
  generateToken,
  hashToken,
  TOKEN_TTL_MS,
  STRONG_PASSWORD_RE,
} from '../../utils/passwordResetTokens';
import { sendPasswordResetEmail, sendPasswordChangedEmail } from '../../services/emailService';
import type { AuthError } from './types';

// Business logic for the password-reset concern. No Express types here — the
// controller passes the already-extracted client IP / user-agent strings.

const HOURLY_PER_EMAIL_LIMIT = 5;
const HEX_64 = /^[a-f0-9]{64}$/;

// Timing jitter on the miss paths so a caller cannot distinguish a known from
// an unknown email by response latency.
const jitter = (): Promise<void> =>
  new Promise((r) => setTimeout(r, 100 + Math.floor(Math.random() * 150)));

const buildResetUrl = (token: string): string => {
  const base = process.env.CLIENT_URL || 'http://localhost:5173';
  return `${base.replace(/\/$/, '')}/reset-password?token=${token}`;
};

// Always resolves — the controller returns the same generic 200 either way.
export async function forgotPassword(
  email: string | undefined,
  ip: string,
  ua: string,
): Promise<void> {
  try {
    if (!email || typeof email !== 'string') {
      await jitter();
      return;
    }
    const profile = await repo.findProfileByEmail(email.trim().toLowerCase());
    if (!profile) {
      await jitter();
      return;
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recent = await repo.countRecentTokens(profile.id, oneHourAgo);
    if (recent >= HOURLY_PER_EMAIL_LIMIT) {
      // Still respond generically — do not signal throttling per-account.
      await jitter();
      return;
    }

    await repo.invalidatePriorTokens(profile.id);

    const token = generateToken();
    const ok = await repo.insertResetToken({
      user_id: profile.id,
      token_hash: hashToken(token),
      expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
      ip_address: ip,
      user_agent: ua,
    });
    if (!ok) return;

    try {
      await sendPasswordResetEmail(profile.email, profile.name ?? '', buildResetUrl(token));
    } catch (mailErr) {
      console.error('forgotPassword email error:', mailErr);
    }
  } catch (err) {
    console.error('forgotPassword error:', err);
  }
}

export interface ValidationResult {
  valid: boolean;
  reason?: 'invalid' | 'used' | 'expired';
}

export async function validateResetToken(token: string | undefined): Promise<ValidationResult> {
  try {
    const trimmed = token?.trim();
    if (!trimmed || !HEX_64.test(trimmed)) return { valid: false, reason: 'invalid' };

    const row = await repo.findTokenByHash(hashToken(trimmed));
    if (!row) return { valid: false, reason: 'invalid' };
    if (row.used_at) return { valid: false, reason: 'used' };
    if (new Date(row.expires_at).getTime() < Date.now()) return { valid: false, reason: 'expired' };
    return { valid: true };
  } catch (err) {
    console.error('validateResetToken error:', err);
    return { valid: false, reason: 'invalid' };
  }
}

export type ResetResult = AuthError | { kind: 'ok'; message: string };

export async function resetPassword(
  token: string | undefined,
  password: string | undefined,
  ip: string,
  ua: string,
): Promise<ResetResult> {
  if (!token || !password || !HEX_64.test(token)) {
    return { kind: 'error', status: 400, message: 'Invalid request' };
  }
  if (!STRONG_PASSWORD_RE.test(password)) {
    return {
      kind: 'error',
      status: 400,
      message:
        'Password must be at least 8 chars and include uppercase, lowercase, number, and special character.',
    };
  }

  const row = await repo.findTokenByHash(hashToken(token));
  if (!row || row.used_at || new Date(row.expires_at).getTime() < Date.now()) {
    return { kind: 'error', status: 400, message: 'Reset link is invalid or expired. Request a new one.' };
  }

  // Atomic single-use — only continue if this call claimed the token.
  const claimed = await repo.markTokenUsed(row.id);
  if (!claimed) {
    return { kind: 'error', status: 400, message: 'Reset link is invalid or expired. Request a new one.' };
  }

  const updated = await repo.updateUserPassword(row.user_id, password);
  if (!updated) {
    return { kind: 'error', status: 500, message: 'Failed to update password. Try again.' };
  }

  // Notify the user (best-effort). Supabase Auth invalidates refresh tokens on
  // password change server-side.
  try {
    const prof = await repo.getProfileContact(row.user_id);
    if (prof?.email) {
      await sendPasswordChangedEmail(prof.email, prof.name ?? '', ip, ua);
    }
  } catch (mailErr) {
    console.error('resetPassword changed-email error:', mailErr);
  }

  return { kind: 'ok', message: 'Password updated. Please log in.' };
}
