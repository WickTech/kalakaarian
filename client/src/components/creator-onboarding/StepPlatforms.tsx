import { Instagram, Youtube } from 'lucide-react';
import { CreatorFormState } from './types';
import { parseIgHandle, parseYtHandle } from './handles';

interface Props {
  form: CreatorFormState;
  setField: <K extends keyof CreatorFormState>(k: K, v: CreatorFormState[K]) => void;
  onInput: (k: keyof CreatorFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export default function StepPlatforms({ form, setField, onInput }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-chalk">Connect Your Platforms</h2>
        <p className="text-sm text-chalk-dim mt-1">At least one required. Paste a profile URL or enter your handle.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
            <Instagram className="w-4 h-4 text-pink-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-chalk">Instagram</p>
            <p className="text-[11px] text-chalk-faint">Paste URL or @handle</p>
          </div>
        </div>
        <input
          value={form.instagram}
          onChange={onInput('instagram')}
          onBlur={() => setField('instagram', parseIgHandle(form.instagram))}
          className="dark-input w-full px-4 py-3 text-sm"
          placeholder="instagram.com/yourhandle or @yourhandle"
        />
        {form.instagram && (
          <p className="text-xs text-green-400">
            Handle: <span className="font-medium">@{form.instagram.replace(/^@/, '')}</span>
          </p>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
            <Youtube className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-chalk">YouTube</p>
            <p className="text-[11px] text-chalk-faint">Paste URL or @handle</p>
          </div>
        </div>
        <input
          value={form.youtube}
          onChange={onInput('youtube')}
          onBlur={() => setField('youtube', parseYtHandle(form.youtube))}
          className="dark-input w-full px-4 py-3 text-sm"
          placeholder="youtube.com/@yourhandle or @yourhandle"
        />
        {form.youtube && (
          <p className="text-xs text-green-400">
            Handle: <span className="font-medium">@{form.youtube.replace(/^@/, '')}</span>
          </p>
        )}
      </div>
    </div>
  );
}
