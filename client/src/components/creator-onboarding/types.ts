export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';

export interface CreatorFormState {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  gender: Gender | '';
  username: string;
  profileImage: string; // public URL or data URL
  genres: string[];
  instagram: string;
  youtube: string;
  reelRate: string;
  storyRate: string;
  longVideoRate: string;
  shortsRate: string;
  bio: string;
  city: string;
  state: string;
}

export const STEPS = [
  'Basic Info',
  'Profile',
  'Genre',
  'Platforms',
  'Rates',
  'Location',
] as const;

export const GENRES = [
  'Fashion', 'Lifestyle', 'Gaming', 'Tech', 'Fitness', 'Food',
  'Travel', 'Comedy', 'Education', 'Finance', 'Beauty', 'Automotive',
  'Music', 'Art', 'Sports', 'Dance', 'Acting', 'Singing',
  'Product Review', 'Photography & Videography', 'Art & Creativity',
  'Automobile & Mobility', 'Spiritual & Motivation', 'Regional & Cultural',
  'Pets & Animals', 'Kids & Family', 'Relationship Advisor',
];

export const initialForm: CreatorFormState = {
  name: '', email: '', phone: '', password: '', confirmPassword: '',
  gender: '', username: '', profileImage: '',
  genres: [], instagram: '', youtube: '',
  reelRate: '', storyRate: '', longVideoRate: '', shortsRate: '',
  bio: '', city: '', state: '',
};
