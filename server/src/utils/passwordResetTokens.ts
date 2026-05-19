import { randomBytes, createHash, timingSafeEqual } from 'crypto';

const TOKEN_BYTES = 32; // 256 bits

export const TOKEN_TTL_MS = 20 * 60 * 1000; // 20 minutes

const getPepper = (): string => {
  const p = process.env.RESET_TOKEN_PEPPER;
  if (!p || p.length < 32) {
    throw new Error('RESET_TOKEN_PEPPER missing or too short (need >=32 chars)');
  }
  return p;
};

export const generateToken = (): string => randomBytes(TOKEN_BYTES).toString('hex');

export const hashToken = (token: string): string =>
  createHash('sha256').update(`${token}${getPepper()}`).digest('hex');

export const safeEqualHex = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
};

// Password rule: ≥8 chars, upper, lower, digit, special.
export const STRONG_PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
