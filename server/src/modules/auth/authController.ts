import { Request, Response } from 'express';
import * as service from './authService';

// Thin HTTP handlers for the register/login concern.

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await service.register(req.body);
    if (result.kind === 'error') {
      res.status(result.status).json({ message: result.message });
      return;
    }
    res.status(201).json({
      message: 'User registered successfully',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await service.login(req.body);
    if (result.kind === 'error') {
      res.status(result.status).json({ message: result.message });
      return;
    }
    if (result.kind === 'otp') {
      res.json({ message: 'OTP sent for login', phone: result.phone, isNewUser: false });
      return;
    }
    res.json({ message: 'Login successful', user: result.user, token: result.token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
