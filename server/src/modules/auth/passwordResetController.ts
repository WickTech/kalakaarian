import { Request, Response } from 'express';
import * as service from './passwordResetService';

// Thin HTTP handlers for the password-reset concern. The controller owns the
// request-bound bits (client IP + user-agent); the service owns the rest.

const clientIp = (req: Request): string => {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string') return xff.split(',')[0].trim();
  return req.ip || 'unknown';
};

const clientUa = (req: Request): string =>
  (req.headers['user-agent'] as string | undefined)?.slice(0, 500) || 'unknown';

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  // Same generic 200 for both found and unknown emails — the service handles
  // the work + timing jitter and never throws.
  await service.forgotPassword(req.body?.email, clientIp(req), clientUa(req));
  res.status(200).json({ message: 'If an account exists, we sent a password reset link.' });
};

export const validateResetToken = async (req: Request, res: Response): Promise<void> => {
  const result = await service.validateResetToken(req.query.token as string | undefined);
  res.status(200).json(result);
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    const result = await service.resetPassword(token, password, clientIp(req), clientUa(req));
    if (result.kind === 'error') {
      res.status(result.status).json({ message: result.message });
      return;
    }
    res.status(200).json({ message: result.message });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
