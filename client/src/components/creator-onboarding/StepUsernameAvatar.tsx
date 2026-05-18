import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { CreatorFormState } from './types';
import { avatarForGender } from './genericAvatars';

interface Props {
  form: CreatorFormState;
  setField: <K extends keyof CreatorFormState>(k: K, v: CreatorFormState[K]) => void;
}

export default function StepUsernameAvatar({ form, setField }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);

  const previewSrc = form.profileImage || avatarForGender(form.gender);

  const handleFile = (file: File) => {
    setErr(null);
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setErr('PNG, JPEG, or WEBP only.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErr('Image must be under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') setField('profileImage', result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-chalk">Your Profile</h2>
        <p className="text-sm text-chalk-dim mt-1">Pick a username and upload a photo — or use a generic avatar.</p>
      </div>

      <div>
        <label className="block text-sm text-chalk-dim mb-1.5">Username *</label>
        <div className="flex overflow-hidden rounded-md border border-white/10">
          <span className="px-3 py-3 text-sm text-chalk-dim border-r border-white/10 bg-white/5 shrink-0">@</span>
          <input
            value={form.username}
            onChange={(e) => setField('username', e.target.value.replace(/^@/, '').toLowerCase())}
            placeholder="priyasharma"
            className="dark-input flex-1 px-3 py-3 text-sm border-0"
          />
        </div>
        <p className="text-[11px] text-chalk-faint mt-1">Letters, numbers, _ and . only. Min 3 chars.</p>
      </div>

      <div>
        <label className="block text-sm text-chalk-dim mb-2">Profile Photo</label>
        <div className="flex items-center gap-4">
          <img
            src={previewSrc}
            alt="avatar preview"
            className="w-20 h-20 rounded-full object-cover border border-white/10 bg-white/5"
          />
          <div className="flex-1 space-y-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-sm text-chalk-dim hover:text-chalk hover:border-white/30 transition-colors"
            >
              <Upload className="w-4 h-4" /> Upload Photo
            </button>
            <p className="text-[11px] text-chalk-faint">PNG/JPEG/WEBP, max 2 MB. Skip to use a generic avatar based on gender.</p>
            {err && <p className="text-xs text-red-400">{err}</p>}
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>
    </div>
  );
}
