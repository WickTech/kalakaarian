import { INDIA_STATES } from '@/lib/constants';
import { CreatorFormState } from './types';

interface Props {
  form: CreatorFormState;
  onInput: (k: keyof CreatorFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export default function StepLocation({ form, onInput }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold text-chalk">Your Location</h2>
      <div>
        <label className="block text-sm text-chalk-dim mb-1.5">City *</label>
        <input
          value={form.city}
          onChange={onInput('city')}
          className="dark-input w-full px-4 py-3 text-sm"
          placeholder="Mumbai"
        />
      </div>
      <div>
        <label className="block text-sm text-chalk-dim mb-1.5">State *</label>
        <select
          value={form.state}
          onChange={onInput('state')}
          className="dark-select w-full px-4 py-3 text-sm"
        >
          <option value="">Select state</option>
          {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <p className="text-xs text-chalk-faint">Country: India</p>
    </div>
  );
}
