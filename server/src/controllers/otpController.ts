import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import OtpCode from '../models/OtpCode';
import { generateToken } from '../utils/jwt';
import { sendOtpEmail } from '../services/emailService';

const OTP_EXPIRY_MS = 10 * 60 * 1000;

const generateOTP = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const sendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ message: 'Phone number is required' });
      return;
    }
    const normalizedPhone = phone.replace(/\D/g, '');
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await OtpCode.findOneAndReplace(
      { phone: normalizedPhone },
      { phone: normalizedPhone, otpHash, expiresAt, attempts: 0 },
      { upsert: true }
    );

    // Email fallback: send OTP to user's email if RESEND_API_KEY is set
    const user = await User.findOne({ phone: normalizedPhone }).select('email');
    if (user?.email) {
      sendOtpEmail(user.email, otp).catch((e) => console.error('OTP email failed:', e));
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
    if (!phone || !otp) {
      res.status(400).json({ message: 'Phone and OTP are required' });
      return;
    }
    const normalizedPhone = phone.replace(/\D/g, '');
    const record = await OtpCode.findOne({ phone: normalizedPhone });

    if (!record) {
      res.status(400).json({ message: 'OTP not found or expired' });
      return;
    }
    if (record.expiresAt < new Date()) {
      await OtpCode.deleteOne({ phone: normalizedPhone });
      res.status(400).json({ message: 'OTP expired' });
      return;
    }
    const isMatch = await bcrypt.compare(otp, record.otpHash);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid OTP' });
      return;
    }
    await OtpCode.deleteOne({ phone: normalizedPhone });

    const user = await User.findOne({ phone: normalizedPhone });
    if (!user) {
      res.status(404).json({ message: 'User not found. Please register first.' });
      return;
    }
    user.phoneVerified = true;
    await user.save();

    const token = generateToken(user._id.toString(), user.role);
    res.json({
      message: 'OTP verified successfully',
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
      token,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendLoginOTP = async (phone: string): Promise<void> => {
  const normalizedPhone = phone.replace(/\D/g, '');
  const otp = generateOTP();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  await OtpCode.findOneAndReplace(
    { phone: normalizedPhone },
    { phone: normalizedPhone, otpHash, expiresAt, attempts: 0 },
    { upsert: true }
  );
  const user = await User.findOne({ phone: normalizedPhone }).select('email');
  if (user?.email) {
    sendOtpEmail(user.email, otp).catch((e) => console.error('Login OTP email failed:', e));
  }
};
