import { body, ValidationChain } from 'express-validator';

// express-validator chains for the auth routes. Kept as express-validator (not
// zod) to preserve the exact existing 400 error-response shape produced by the
// shared `validate` middleware.

export const registerValidators: ValidationChain[] = [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').notEmpty().withMessage('Name is required'),
  body('role').isIn(['brand', 'influencer']).withMessage('Role must be brand or influencer'),
];

export const loginValidators: ValidationChain[] = [
  body('email').optional().isEmail(),
  body('username').optional(),
  body('password').optional(),
  body('phone').optional(),
  body('isPhoneLogin').optional().isBoolean(),
];

export const sendOtpValidators: ValidationChain[] = [
  body('phone').notEmpty().withMessage('Phone number is required'),
];

export const verifyOtpValidators: ValidationChain[] = [
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('otp').notEmpty().withMessage('OTP is required'),
];

export const googleValidators: ValidationChain[] = [
  body('code').optional(),
  body('token').optional(),
];

export const completeOnboardingValidators: ValidationChain[] = [
  body('role').isIn(['brand', 'influencer']).withMessage('Role must be brand or influencer'),
];

export const changePasswordValidators: ValidationChain[] = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

export const forgotPasswordValidators: ValidationChain[] = [
  body('email').isEmail().withMessage('Valid email required'),
];

export const resetPasswordValidators: ValidationChain[] = [
  body('token').isString().isLength({ min: 64, max: 64 }).withMessage('Invalid token'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

export const deleteAccountValidators: ValidationChain[] = [
  body('confirmation').equals('delete').withMessage('Type delete to confirm'),
  body('password').optional({ nullable: true }).isString(),
];
