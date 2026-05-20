import { Request, Response } from 'express';
import * as service from './otpService';

// Thin HTTP handlers for the phone-OTP concern.

export const sendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ message: 'Phone number is required' });
      return;
    }
    const maskedPhone = await service.sendOTP(phone);
    res.json({ message: 'OTP sent successfully', phone: maskedPhone });
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
    const result = await service.verifyOTP(phone, otp);
    if (result.kind === 'error') {
      res.status(result.status).json({ message: result.message });
      return;
    }
    res.json({
      message: 'Phone verified successfully. Please sign in to continue.',
      user: result.user,
      phoneVerified: true,
      token: '',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
