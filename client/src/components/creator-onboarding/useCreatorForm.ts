import { useCallback, useState } from 'react';
import { CreatorFormState, initialForm } from './types';

type FieldVal = CreatorFormState[keyof CreatorFormState];

export function useCreatorForm(seed?: Partial<CreatorFormState>) {
  const [form, setForm] = useState<CreatorFormState>({ ...initialForm, ...(seed ?? {}) });

  const setField = useCallback(<K extends keyof CreatorFormState>(key: K, value: CreatorFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const onInput =
    (key: keyof CreatorFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value as FieldVal }));

  const toggleGenre = useCallback((g: string) => {
    setForm(prev => ({
      ...prev,
      genres: prev.genres.includes(g) ? prev.genres.filter(x => x !== g) : [...prev.genres, g],
    }));
  }, []);

  const validateStep = useCallback(
    (step: number, googleMode: boolean): string | null => {
      if (step === 0) {
        if (!form.name || !form.phone || !form.gender) return 'Name, phone, and gender are required.';
        if (!googleMode) {
          if (!form.email || !form.password || !form.confirmPassword) return 'All fields are required.';
          if (form.password.length < 8) return 'Password must be at least 8 characters.';
          if (form.password !== form.confirmPassword) return 'Passwords do not match.';
        }
      }
      if (step === 1) {
        if (!form.username || form.username.length < 3) return 'Username must be at least 3 characters.';
        if (!/^[a-zA-Z0-9_.]+$/.test(form.username)) return 'Username can only contain letters, numbers, _ and .';
      }
      if (step === 2 && form.genres.length === 0) return 'Select at least one genre.';
      if (step === 3 && !form.instagram && !form.youtube) return 'At least one platform handle is required.';
      if (step === 5 && (!form.city || !form.state)) return 'City and state are required.';
      return null;
    },
    [form],
  );

  return { form, setForm, setField, onInput, toggleGenre, validateStep };
}
