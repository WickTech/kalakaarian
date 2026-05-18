import { Instagram, Youtube } from 'lucide-react';
import { CreatorFormState } from './types';

interface Props {
  form: CreatorFormState;
  onInput: (k: keyof CreatorFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export default function StepRates({ form, onInput }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold text-chalk">Set Your Rates</h2>
      <p className="text-xs text-chalk-faint">Base rates. A 5% creator commercial fee applies on branded content.</p>

      {form.instagram && (
        <div>
          <p className="text-xs text-chalk-dim uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Instagram className="w-3 h-3 text-pink-400" /> Instagram
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-chalk-dim mb-1.5">Reels (₹)</label>
              <input type="number" value={form.reelRate} onChange={onInput('reelRate')}
                className="dark-input w-full px-3 py-2.5 text-sm" placeholder="15000" />
            </div>
            <div>
              <label className="block text-xs text-chalk-dim mb-1.5">Story (₹)</label>
              <input type="number" value={form.storyRate} onChange={onInput('storyRate')}
                className="dark-input w-full px-3 py-2.5 text-sm" placeholder="5000" />
            </div>
          </div>
        </div>
      )}

      {form.youtube && (
        <div>
          <p className="text-xs text-chalk-dim uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Youtube className="w-3 h-3 text-red-400" /> YouTube
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-chalk-dim mb-1.5">Video (₹)</label>
              <input type="number" value={form.longVideoRate} onChange={onInput('longVideoRate')}
                className="dark-input w-full px-3 py-2.5 text-sm" placeholder="25000" />
            </div>
            <div>
              <label className="block text-xs text-chalk-dim mb-1.5">Shorts (₹)</label>
              <input type="number" value={form.shortsRate} onChange={onInput('shortsRate')}
                className="dark-input w-full px-3 py-2.5 text-sm" placeholder="8000" />
            </div>
          </div>
        </div>
      )}

      {!form.instagram && !form.youtube && (
        <p className="text-sm text-amber-400">Go back and add at least one platform handle to set rates.</p>
      )}

      <div>
        <label className="block text-sm text-chalk-dim mb-1.5">Bio (optional)</label>
        <textarea value={form.bio} onChange={onInput('bio')} rows={3} maxLength={300}
          className="dark-input w-full px-4 py-3 text-sm resize-none"
          placeholder="Tell brands about your content style..." />
      </div>
    </div>
  );
}
