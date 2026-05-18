import { MapPin, Instagram, Youtube } from 'lucide-react';

interface ProfileHeaderProps {
  profile: {
    name: string;
    handle: string;
    profileImage: string;
    tier: 'gold' | 'silver' | 'regular';
    influencerTier?: string;
    avgRating?: number | null;
    ratingCount?: number;
    city: string;
    state?: string;
    socialHandles?: { instagram?: string; youtube?: string };
    bio?: string | null;
    niches?: string[];
  };
}

const tierStyles = {
  gold: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900',
  silver: 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800',
  regular: 'bg-secondary text-secondary-foreground',
};

const getRatingLabel = (r: number | null | undefined) => {
  if (!r) return 'No Ratings';
  if (r < 2) return 'Below Avg';
  if (r < 3) return 'Average';
  if (r < 4) return 'Good';
  if (r < 4.5) return 'Very Good';
  return 'Excellent';
};

const INFLUENCER_TIER_CLASS: Record<string, string> = {
  nano: 'tier-nano', micro: 'tier-micro', macro: 'tier-macro', celeb: 'tier-celebrity',
};
const INFLUENCER_TIER_LABEL: Record<string, string> = {
  nano: 'Nano', micro: 'Micro', macro: 'Macro', celeb: 'Celebrity',
};

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const location = [profile.city, profile.state].filter(Boolean).join(', ');
  const igHandle = profile.socialHandles?.instagram
    ? profile.socialHandles.instagram.replace(/^@/, '')
    : '';
  const ytHandle = profile.socialHandles?.youtube
    ? profile.socialHandles.youtube.replace(/^@/, '')
    : '';

  return (
    <div className="premium-card p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Profile Image */}
        <div className="relative shrink-0">
          <div className="w-28 h-28 rounded-full overflow-hidden ring-2 ring-white/10 shadow-premium">
            <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            {profile.influencerTier && INFLUENCER_TIER_CLASS[profile.influencerTier] && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${INFLUENCER_TIER_CLASS[profile.influencerTier]}`}>
                {INFLUENCER_TIER_LABEL[profile.influencerTier] ?? profile.influencerTier}
              </span>
            )}
            {profile.tier !== 'regular' && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${tierStyles[profile.tier]}`}>
                {profile.tier === 'gold' ? '★ Gold' : '◇ Silver'}
              </span>
            )}
          </div>

          {/* Social handles — always shown */}
          <div className="flex flex-wrap gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-sm">
              <Instagram className="w-4 h-4 text-pink-400 shrink-0" />
              {igHandle
                ? <span className="text-pink-400">@{igHandle}</span>
                : <span className="text-chalk-faint italic text-xs">not connected</span>}
            </span>
            <span className="flex items-center gap-1.5 text-sm">
              <Youtube className="w-4 h-4 text-red-400 shrink-0" />
              {ytHandle
                ? <span className="text-red-400">@{ytHandle}</span>
                : <span className="text-chalk-faint italic text-xs">not connected</span>}
            </span>
          </div>

          {/* Location */}
          {location && (
            <div className="flex items-center gap-1 mt-1.5 text-sm text-chalk-dim">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{location}</span>
            </div>
          )}

          {profile.niches && profile.niches.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {profile.niches.map((n) => (
                <span
                  key={n}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-chalk-dim capitalize"
                >
                  {n}
                </span>
              ))}
            </div>
          )}

          {profile.bio && (
            <p className="text-sm text-chalk-dim mt-3 leading-relaxed">{profile.bio}</p>
          )}
        </div>

        {/* Rating Box — orange + white, compact */}
        <div className="flex overflow-hidden shrink-0 self-start rounded-xl min-w-[130px]">
          <div className="flex flex-col items-center justify-center gap-1 px-3 py-2.5 bg-orange-500">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={`text-sm ${s <= Math.round(profile.avgRating ?? 0) ? 'text-white' : 'text-white/30'}`}>★</span>
              ))}
            </div>
            <p className="text-[10px] text-white/80">
              {profile.avgRating ? profile.avgRating.toFixed(1) : '—'} ({profile.ratingCount ?? 0})
            </p>
          </div>
          <div className="flex items-center justify-center px-3 py-2.5 bg-white/5">
            <p className="text-xs font-medium text-chalk text-center leading-tight">{getRatingLabel(profile.avgRating)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
