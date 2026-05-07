import { Request, Response } from 'express';
import { createHash, randomInt } from 'crypto';
import { adminClient } from '../config/supabase';
import { sendOtpEmail } from '../services/emailService';

const OTP_EXPIRY_MS = 10 * 60 * 1000;

// Fast hash — OTP is short-lived and rate-limited so bcrypt's slowness is unnecessary.
// We use SHA-256 + a per-row salt (the phone number) for collision resistance.
const hashOtp = (otp: string, salt: string) =>
  createHash('sha256').update(`${salt}:${otp}`).digest('hex');

const generateOTP = (): string =>
  randomInt(100000, 999999).toString();

export const sendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    if (!phone) { res.status(400).json({ message: 'Phone number is required' }); return; }
    const normalizedPhone = phone.replace(/\D/g, '');

    const otp = generateOTP();
    const otpHash = hashOtp(otp, normalizedPhone);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();

    await adminClient.from('otp_codes').upsert(
      { phone: normalizedPhone, otp_hash: otpHash, expires_at: expiresAt, attempts: 0 },
      { onConflict: 'phone' }
    );

    // Send OTP to user's registered email
    const { data: profile } = await adminClient
      .from('profiles')
      .select('email')
      .eq('phone', normalizedPhone)
      .single();

    if (profile?.email) {
      sendOtpEmail(profile.email, otp).catch((e) => console.error('OTP email failed:', e));
    }

    res.json({
      message: 'OTP sent successfully',
      phone: normalizedPhone.slice(-4).padStart(normalizedPhone.length, '*'),
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) { res.status(400).json({ message: 'Phone and OTP are required' }); return; }
    const normalizedPhone = phone.replace(/\D/g, '');

    const { data: record } = await adminClient
      .from('otp_codes')
      .select('otp_hash, expires_at, attempts')
      .eq('phone', normalizedPhone)
      .single();

    if (!record) { res.status(400).json({ message: 'OTP not found or expired' }); return; }
    if (new Date(record.expires_at) < new Date()) {
      await adminClient.from('otp_codes').delete().eq('phone', normalizedPhone);
      res.status(400).json({ message: 'OTP expired' }); return;
    }
    if ((record.attempts ?? 0) >= 5) {
      await adminClient.from('otp_codes').delete().eq('phone', normalizedPhone);
      res.status(429).json({ message: 'Too many attempts. Request a new OTP.' }); return;
    }
    if (hashOtp(otp, normalizedPhone) !== record.otp_hash) {
      await adminClient.from('otp_codes').update({ attempts: (record.attempts ?? 0) + 1 }).eq('phone', normalizedPhone);
      res.status(400).json({ message: 'Invalid OTP' }); return;
    }

    await adminClient.from('otp_codes').delete().eq('phone', normalizedPhone);

    // Mark phone verified
    const { data: profile } = await adminClient
      .from('profiles')
      .update({ phone_verified: true })
      .eq('phone', normalizedPhone)
      .select('id, email, name, role')
      .single();

    if (!profile) { res.status(404).json({ message: 'User not found. Please register first.' }); return; }

    // Phone OTP only verifies the number — client should sign in with email+password or Google to get a session.
    res.json({
      message: 'Phone verified successfully. Please sign in to continue.',
      user: { id: profile.id, email: profile.email, name: profile.name, role: profile.role },
      phoneVerified: true,
      token: '',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Called internally by login when isPhoneLogin=true
export const sendLoginOTP = async (phone: string): Promise<void> => {
  const normalizedPhone = phone.replace(/\D/g, '');
  const otp = generateOTP();
  const otpHash = hashOtp(otp, normalizedPhone);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();

  await adminClient.from('otp_codes').upsert(
    { phone: normalizedPhone, otp_hash: otpHash, expires_at: expiresAt, attempts: 0 },
    { onConflict: 'phone' }
  );

  const { data: profile } = await adminClient
    .from('profiles')
    .select('email')
    .eq('phone', normalizedPhone)
    .single();

  if (profile?.email) {
    sendOtpEmail(profile.email, otp).catch((e) => console.error('Login OTP email failed:', e));
  }
};
