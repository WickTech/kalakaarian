import { Request, Response } from 'express';
import { adminClient } from '../config/supabase';
import {
  generateToken,
  hashToken,
  TOKEN_TTL_MS,
  STRONG_PASSWORD_RE,
} from '../utils/passwordResetTokens';
import { sendPasswordResetEmail, sendPasswordChangedEmail } from '../services/emailService';

const HOURLY_PER_EMAIL_LIMIT = 5;

const jitter = () => new Promise(r => setTimeout(r, 100 + Math.floor(Math.random() * 150)));

const clientIp = (req: Request): string => {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string') return xff.split(',')[0].trim();
  return req.ip || 'unknown';
};

const clientUa = (req: Request): string =>
  (req.headers['user-agent'] as string | undefined)?.slice(0, 500) || 'unknown';

const buildResetUrl = (token: string): string => {
  const base = process.env.CLIENT_URL || 'http://localhost:5173';
  return `${base.replace(/\/$/, '')}/reset-password?token=${token}`;
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };
  const generic = { message: 'If an account exists, we sent a password reset link.' };

  try {
    if (!email || typeof email !== 'string') {
      await jitter();
      res.status(200).json(generic); return;
    }
    const normalized = email.trim().toLowerCase();

    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, name, email')
      .eq('email', normalized)
      .maybeSingle();

    if (!profile) {
      await jitter();
      res.status(200).json(generic); return;
    }

    // Per-email throttle: count requests in last hour.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await adminClient
      .from('password_reset_tokens')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .gte('created_at', oneHourAgo);
    if ((count ?? 0) >= HOURLY_PER_EMAIL_LIMIT) {
      // Still respond generically — do not signal throttling per-account.
      await jitter();
      res.status(200).json(generic); return;
    }

    // Invalidate prior unused tokens.
    await adminClient
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', profile.id)
      .is('used_at', null);

    const token = generateToken();
    const token_hash = hashToken(token);
    const expires_at = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

    const { error: insErr } = await adminClient.from('password_reset_tokens').insert({
      user_id: profile.id,
      token_hash,
      expires_at,
      ip_address: clientIp(req),
      user_agent: clientUa(req),
    });
    if (insErr) {
      console.error('forgotPassword insert error:', insErr);
      res.status(200).json(generic); return;
    }

    try {
      await sendPasswordResetEmail(profile.email, profile.name ?? '', buildResetUrl(token));
    } catch (mailErr) {
      console.error('forgotPassword email error:', mailErr);
    }
    res.status(200).json(generic);
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(200).json(generic);
  }
};

export const validateResetToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = (req.query.token as string | undefined)?.trim();
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      res.status(200).json({ valid: false, reason: 'invalid' }); return;
    }
    const { data } = await adminClient
      .from('password_reset_tokens')
      .select('id, used_at, expires_at')
      .eq('token_hash', hashToken(token))
      .maybeSingle();
    if (!data) { res.status(200).json({ valid: false, reason: 'invalid' }); return; }
    if (data.used_at) { res.status(200).json({ valid: false, reason: 'used' }); return; }
    if (new Date(data.expires_at).getTime() < Date.now()) {
      res.status(200).json({ valid: false, reason: 'expired' }); return;
    }
    res.status(200).json({ valid: true });
  } catch (err) {
    console.error('validateResetToken error:', err);
    res.status(200).json({ valid: false, reason: 'invalid' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token || !password || !/^[a-f0-9]{64}$/.test(token)) {
      res.status(400).json({ message: 'Invalid request' }); return;
    }
    if (!STRONG_PASSWORD_RE.test(password)) {
      res.status(400).json({
        message: 'Password must be at least 8 chars and include uppercase, lowercase, number, and special character.',
      });
      return;
    }
    const token_hash = hashToken(token);
    const { data: row } = await adminClient
      .from('password_reset_tokens')
      .select('id, user_id, used_at, expires_at')
      .eq('token_hash', token_hash)
      .maybeSingle();
    if (!row || row.used_at || new Date(row.expires_at).getTime() < Date.now()) {
      res.status(400).json({ message: 'Reset link is invalid or expired. Request a new one.' }); return;
    }

    // Atomic single-use: mark used first, only continue if affected.
    const { data: marked, error: markErr } = await adminClient
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', row.id)
      .is('used_at', null)
      .select('id')
      .maybeSingle();
    if (markErr || !marked) {
      res.status(400).json({ message: 'Reset link is invalid or expired. Request a new one.' }); return;
    }

    const { error: pwErr } = await adminClient.auth.admin.updateUserById(row.user_id, { password });
    if (pwErr) {
      console.error('resetPassword updateUserById error:', pwErr);
      res.status(500).json({ message: 'Failed to update password. Try again.' }); return;
    }

    // Supabase Auth invalidates all refresh tokens on password change server-side.
    // Existing access tokens stay valid until their JTI expiry (≤1h) — acceptable.

    // Notify user (best-effort).
    try {
      const { data: prof } = await adminClient
        .from('profiles')
        .select('email, name')
        .eq('id', row.user_id)
        .maybeSingle();
      if (prof?.email) {
        await sendPasswordChangedEmail(prof.email, prof.name ?? '', clientIp(req), clientUa(req));
      }
    } catch (mailErr) {
      console.error('resetPassword changed-email error:', mailErr);
    }

    res.status(200).json({ message: 'Password updated. Please log in.' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
