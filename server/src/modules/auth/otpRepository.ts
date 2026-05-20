import { adminClient } from '../../config/supabase';

// Supabase DAO for the phone-OTP concern (otp_codes + profiles).

export interface OtpRow {
  otp_hash: string;
  expires_at: string;
  attempts: number | null;
}

export async function upsertOtp(
  phone: string,
  otpHash: string,
  expiresAt: string,
): Promise<void> {
  await adminClient
    .from('otp_codes')
    .upsert(
      { phone, otp_hash: otpHash, expires_at: expiresAt, attempts: 0 },
      { onConflict: 'phone' },
    );
}

export async function findOtp(phone: string): Promise<OtpRow | null> {
  const { data } = await adminClient
    .from('otp_codes')
    .select('otp_hash, expires_at, attempts')
    .eq('phone', phone)
    .single();
  return data as OtpRow | null;
}

export async function deleteOtp(phone: string): Promise<void> {
  await adminClient.from('otp_codes').delete().eq('phone', phone);
}

export async function incrementAttempts(phone: string, current: number): Promise<void> {
  await adminClient.from('otp_codes').update({ attempts: current + 1 }).eq('phone', phone);
}

export async function findEmailByPhone(phone: string): Promise<{ email: string | null } | null> {
  const { data } = await adminClient
    .from('profiles')
    .select('email')
    .eq('phone', phone)
    .single();
  return data;
}

export interface VerifiedProfile {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
}

// Marks the phone verified and returns the owning profile (or null if none).
export async function markPhoneVerified(phone: string): Promise<VerifiedProfile | null> {
  const { data } = await adminClient
    .from('profiles')
    .update({ phone_verified: true })
    .eq('phone', phone)
    .select('id, email, name, role')
    .single();
  return data as VerifiedProfile | null;
}
