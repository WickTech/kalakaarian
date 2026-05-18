export const NICHES = [
  'Fashion','Lifestyle','Gaming','Tech','Fitness','Food','Travel','Comedy',
  'Education','Finance','Beauty','Automotive','Music','Art','Sports','Dance',
  'Acting','Singing','Product Review','Photography & Videography','Art & Creativity',
  'Automobile & Mobility','Spiritual & Motivation','Regional & Cultural','Pets & Animals',
];

export const NICHE_OPTIONS = NICHES.map(n => ({ value: n, label: n }));

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export function genderLabel(v: string): string {
  return GENDER_OPTIONS.find(g => g.value === v)?.label ?? '—';
}
