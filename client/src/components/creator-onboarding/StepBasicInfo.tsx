import { CreatorFormState } from './types';

interface Props {
  form: CreatorFormState;
  onInput: (k: keyof CreatorFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  googleMode?: boolean;
}

export default function StepBasicInfo({ form, onInput, googleMode = false }: Props) {
  const visibleFields = googleMode
    ? ([
        { key: 'name', label: 'Full Name', type: 'text', ph: 'Priya Sharma' },
        { key: 'phone', label: 'WhatsApp Number', type: 'tel', ph: '+91 9876543210' },
      ] as const)
    : ([
        { key: 'name', label: 'Full Name', type: 'text', ph: 'Priya Sharma' },
        { key: 'email', label: 'Email', type: 'email', ph: 'priya@example.com' },
        { key: 'phone', label: 'WhatsApp Number', type: 'tel', ph: '+91 9876543210' },
        { key: 'password', label: 'Password', type: 'password', ph: 'Min 8 characters' },
        { key: 'confirmPassword', label: 'Confirm Password', type: 'password', ph: 'Re-enter password' },
      ] as const);

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold text-chalk">Basic Information</h2>
      {googleMode && (
        <p className="text-xs text-chalk-faint">
          You're signed in with Google. We just need a few more details.
        </p>
      )}
      {visibleFields.map(({ key, label, type, ph }) => (
        <div key={key}>
          <label className="block text-sm text-chalk-dim mb-1.5">{label} *</label>
          <input
            type={type}
            value={form[key] as string}
            onChange={onInput(key)}
            className="dark-input w-full px-4 py-3 text-sm"
            placeholder={ph}
          />
        </div>
      ))}
      <div>
        <label className="block text-sm text-chalk-dim mb-1.5">Gender *</label>
        <select
          value={form.gender}
          onChange={onInput('gender')}
          className="dark-select w-full px-4 py-3 text-sm"
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="non_binary">Non-binary</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
      </div>
    </div>
  );
}
