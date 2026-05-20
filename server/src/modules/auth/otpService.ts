import { createHash, randomInt } from 'crypto';
import * as repo from './otpRepository';
import { sendOtpEmail } from '../../services/emailService';
import type { AuthError } from './types';

// Business logic for the phone-OTP concern.

const OTP_EXPIRY_MS = 10 * 60 * 1000;

// Fast hash — OTP is short-lived and rate-limited, so bcrypt's slowness is
// unnecessary. SHA-256 + a per-row salt (the phone number) for collision
// resistance.
const hashOtp = (otp: string, salt: string): string =>
  createHash('sha256').update(`${salt}:${otp}`).digest('hex');

const generateOTP = (): string => randomInt(100000, 999999).toString();

const maskPhone = (phone: string): string =>
  phone.slice(-4).padStart(phone.length, '*');

// Generates, stores and emails an OTP for the given phone. Shared by sendOTP
// and sendLoginOTP.
async function issueOtp(phone: string, emailLogLabel: string): Promise<void> {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();
  await repo.upsertOtp(phone, hashOtp(otp, phone), expiresAt);

  const profile = await repo.findEmailByPhone(phone);
  if (profile?.email) {
    sendOtpEmail(profile.email, otp).catch((e) => console.error(`${emailLogLabel}:`, e));
  }
}

export async function sendOTP(phone: string): Promise<string> {
  const normalizedPhone = phone.replace(/\D/g, '');
  await issueOtp(normalizedPhone, 'OTP email failed');
  return maskPhone(normalizedPhone);
}

// Called internally by login when isPhoneLogin=true.
export async function sendLoginOTP(phone: string): Promise<void> {
  const normalizedPhone = phone.replace(/\D/g, '');
  await issueOtp(normalizedPhone, 'Login OTP email failed');
}

export type VerifyOtpResult =
  | AuthError
  | { kind: 'ok'; user: { id: string; email: string | null; name: string | null; role: string } };

export async function verifyOTP(phone: string, otp: string): Promise<VerifyOtpResult> {
  const normalizedPhone = phone.replace(/\D/g, '');

  const record = await repo.findOtp(normalizedPhone);
  if (!record) return { kind: 'error', status: 400, message: 'OTP not found or expired' };

  if (new Date(record.expires_at) < new Date()) {
    await repo.deleteOtp(normalizedPhone);
    return { kind: 'error', status: 400, message: 'OTP expired' };
  }
  if ((record.attempts ?? 0) >= 5) {
    await repo.deleteOtp(normalizedPhone);
    return { kind: 'error', status: 429, message: 'Too many attempts. Request a new OTP.' };
  }
  if (hashOtp(otp, normalizedPhone) !== record.otp_hash) {
    await repo.incrementAttempts(normalizedPhone, record.attempts ?? 0);
    return { kind: 'error', status: 400, message: 'Invalid OTP' };
  }

  await repo.deleteOtp(normalizedPhone);

  const profile = await repo.markPhoneVerified(normalizedPhone);
  if (!profile) {
    return { kind: 'error', status: 404, message: 'User not found. Please register first.' };
  }

  // Phone OTP only verifies the number — the client must sign in with
  // email+password or Google to obtain a session.
  return {
    kind: 'ok',
    user: { id: profile.id, email: profile.email, name: profile.name, role: profile.role },
  };
}
