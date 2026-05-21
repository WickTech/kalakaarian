// Shared types for the auth module. No Express types here.

export interface RegisterInput {
  email?: string;
  username?: string;
  phone?: string;
  password?: string;
  name?: string;
  role?: string;
  companyName?: string;
  industry?: string;
  website?: string;
  city?: string;
  state?: string;
  niches?: string[];
  platform?: string[];
  tier?: string;
  bio?: string;
  pricing?: Record<string, unknown>;
  gender?: string;
  termsAccepted?: boolean;
  socialHandles?: { instagram?: string; youtube?: string };
  profileImage?: string;
}

export interface LoginInput {
  email?: string;
  username?: string;
  password?: string;
  phone?: string;
  isPhoneLogin?: boolean;
}

export interface OnboardingInput {
  role?: string;
  companyName?: string;
  industry?: string;
  website?: string;
  city?: string;
  state?: string;
  niches?: unknown;
  platform?: unknown;
  tier?: string;
  gender?: string;
  bio?: string;
  pricing?: Record<string, unknown>;
  phone?: string;
  username?: string;
  profileImageUrl?: string;
  instagramHandle?: string;
  youtubeHandle?: string;
}

// Result shape returned by services to controllers — keeps HTTP status/body
// decisions out of the service layer.
export type AuthError = { kind: 'error'; status: number; message: string };
