import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { resolveTestEnv } from './env';
import { generateToken, hashToken } from '../../../utils/passwordResetTokens';

// Service-role client for the test project — used to seed + clean up rows
// that the HTTP endpoints cannot produce or read directly (hashed OTPs,
// hashed reset tokens, teardown).

let client: SupabaseClient | undefined;

export function testAdminClient(): SupabaseClient {
  if (client) return client;
  const env = resolveTestEnv();
  client = createClient(env.supabaseUrl as string, env.serviceKey as string, {
    auth: { persistSession: false },
  });
  return client;
}

// ---- unique fixture data ---------------------------------------------------

export const uniqueEmail = (): string =>
  `it-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@kalakaarian-test.dev`;

export const uniquePhone = (): string =>
  `9${Math.floor(100_000_000 + Math.random() * 899_999_999)}`;

// ---- user lifecycle / teardown --------------------------------------------

const createdUserIds = new Set<string>();
const createdOtpPhones = new Set<string>();

export function trackUser(id: string | undefined | null): void {
  if (id) createdUserIds.add(id);
}

export function trackOtpPhone(phone: string): void {
  createdOtpPhones.add(phone);
}

// Deletes every auth user + otp row created during the run. Deleting the auth
// user cascades to profiles / brand_profiles / influencer_profiles /
// password_reset_tokens via their FK constraints.
export async function cleanup(): Promise<void> {
  const c = testAdminClient();
  for (const id of createdUserIds) {
    await c.auth.admin.deleteUser(id).catch(() => undefined);
  }
  for (const phone of createdOtpPhones) {
    await c.from('otp_codes').delete().eq('phone', phone);
  }
  createdUserIds.clear();
  createdOtpPhones.clear();
}

// ---- OTP seeding -----------------------------------------------------------

// Mirrors otpController.hashOtp — SHA-256 over `${phone}:${otp}`.
const hashOtp = (otp: string, phone: string): string =>
  createHash('sha256').update(`${phone}:${otp}`).digest('hex');

export async function seedOtp(
  phone: string,
  otp: string,
  opts: { attempts?: number; expiresInMs?: number } = {},
): Promise<void> {
  const expiresInMs = opts.expiresInMs ?? 10 * 60 * 1000;
  await testAdminClient()
    .from('otp_codes')
    .upsert(
      {
        phone,
        otp_hash: hashOtp(otp, phone),
        expires_at: new Date(Date.now() + expiresInMs).toISOString(),
        attempts: opts.attempts ?? 0,
      },
      { onConflict: 'phone' },
    );
  trackOtpPhone(phone);
}

export async function getOtpRow(
  phone: string,
): Promise<{ attempts: number | null } | null> {
  const { data } = await testAdminClient()
    .from('otp_codes')
    .select('attempts')
    .eq('phone', phone)
    .maybeSingle();
  return data;
}

// ---- password-reset token seeding -----------------------------------------

// Inserts a reset token row directly and returns the plaintext token. Uses the
// real generateToken/hashToken utils so the hash matches what the route reads.
export async function seedResetToken(
  userId: string,
  opts: { used?: boolean; expiresInMs?: number } = {},
): Promise<string> {
  const token = generateToken();
  const expiresInMs = opts.expiresInMs ?? 20 * 60 * 1000;
  await testAdminClient()
    .from('password_reset_tokens')
    .insert({
      user_id: userId,
      token_hash: hashToken(token),
      expires_at: new Date(Date.now() + expiresInMs).toISOString(),
      used_at: opts.used ? new Date().toISOString() : null,
    });
  return token;
}
