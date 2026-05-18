import { Instagram, Youtube, Lock } from 'lucide-react';
import { InfluencerProfile } from '@/lib/api';

interface Props {
  profile: InfluencerProfile;
  commercialsLocked: boolean;
}

const fmt = (v: number | undefined): string =>
  v && v > 0 ? `₹${Number(v).toLocaleString('en-IN')}` : '—';

export function CommercialsView({ profile, commercialsLocked }: Props) {
  const p = profile.pricing ?? {};
  const unlockDate = profile.createdAt
    ? new Date(new Date(profile.createdAt).getTime() + 180 * 86_400_000)
    : null;
  const hasAny = (p.reel || p.story || p.video || p.shorts || p.post) > 0;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wide text-chalk-faint">Commercials</p>
        {commercialsLocked && unlockDate && (
          <span className="inline-flex items-center gap-1 text-[10px] text-amber-200/90 bg-amber-500/10 border border-amber-400/20 rounded-full px-2 py-0.5">
            <Lock className="w-3 h-3" />
            Locked · unlocks {unlockDate.toLocaleDateString('en-IN')}
          </span>
        )}
      </div>

      {!hasAny && (
        <p className="text-xs text-chalk-faint">
          No rates set yet. Add them from your <a href="/profile/edit" className="text-purple-400 hover:underline">profile</a>.
        </p>
      )}

      {/* Instagram */}
      <div className="rounded-lg border border-pink-500/20 bg-pink-500/5 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Instagram className="w-4 h-4 text-pink-400" />
          <h4 className="text-xs font-semibold text-chalk uppercase tracking-wide">Instagram</h4>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between rounded-md bg-white/5 px-3 py-2">
            <span className="text-chalk-dim">Reel (short video)</span>
            <span className="text-chalk font-semibold">{fmt(p.reel)}</span>
          </div>
          <div className="flex justify-between rounded-md bg-white/5 px-3 py-2">
            <span className="text-chalk-dim">Story</span>
            <span className="text-chalk font-semibold">{fmt(p.story)}</span>
          </div>
        </div>
      </div>

      {/* YouTube */}
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Youtube className="w-4 h-4 text-red-400" />
          <h4 className="text-xs font-semibold text-chalk uppercase tracking-wide">YouTube</h4>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between rounded-md bg-white/5 px-3 py-2">
            <span className="text-chalk-dim">Long Video</span>
            <span className="text-chalk font-semibold">{fmt(p.video)}</span>
          </div>
          <div className="flex justify-between rounded-md bg-white/5 px-3 py-2">
            <span className="text-chalk-dim">Shorts</span>
            <span className="text-chalk font-semibold">{fmt(p.shorts)}</span>
          </div>
        </div>
      </div>

      <a
        href="/profile/edit"
        className="block text-center text-xs text-purple-300 hover:text-purple-200 hover:underline pt-1"
      >
        {commercialsLocked && hasAny ? 'View on profile →' : 'Edit rates on profile →'}
      </a>
    </div>
  );
}
