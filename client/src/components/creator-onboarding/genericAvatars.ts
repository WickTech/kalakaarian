import { Gender } from './types';

export const GENDER_AVATARS: Record<Gender, string> = {
  male: '/avatars/male.svg',
  female: '/avatars/female.svg',
  non_binary: '/avatars/non-binary.svg',
  prefer_not_to_say: '/avatars/prefer-not-to-say.svg',
};

export function avatarForGender(g: Gender | ''): string {
  if (!g) return GENDER_AVATARS.prefer_not_to_say;
  return GENDER_AVATARS[g] ?? GENDER_AVATARS.prefer_not_to_say;
}
