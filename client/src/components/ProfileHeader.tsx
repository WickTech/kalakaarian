import { useState } from 'react';
import { Camera, MapPin, Instagram, Youtube, Wifi, WifiOff } from 'lucide-react';

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
    socialHandles?: { instagram?: string; youtube?: string };
    isOnline?: boolean;
    onlineSince?: string | null;
    lastSeenAt?: string | null;
  };
  isOwnProfile: boolean;
  onImageUpload?: (file: File) => void;
  onStatusToggle?: (isOnline: boolean) => void;
}

function fmtRelative(iso?: string | null): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

const tierStyles = {
  gold: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900',
  silver: 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800',
  regular: 'bg-secondary text-secondary-foreground',
};

const getRatingLabel = (r: number | null | undefined) => {
  if (!r) return 'No Ratings';
  if (r < 2) return 'Below Average';
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

export function ProfileHeader({ profile, isOwnProfile, onImageUpload, onStatusToggle }: ProfileHeaderProps) {
  const [isOnline, setIsOnline] = useState(profile.isOnline || false);
  const [onlineSince, setOnlineSince] = useState<string | null>(profile.onlineSince ?? null);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(profile.lastSeenAt ?? null);

  const handleStatusToggle = () => {
    const newStatus = !isOnline;
    const now = new Date().toISOString();
    setIsOnline(newStatus);
    if (newStatus) { setOnlineSince(now); setLastSeenAt(null); }
    else { setLastSeenAt(now); setOnlineSince(null); }
    onStatusToggle?.(newStatus);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload?.(file);
    }
  };

  return (
    <div className="premium-card p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Profile Image */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden ring-2 ring-white/10 shadow-premium">
            <img
              src={profile.profileImage}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </div>
          {isOwnProfile && (
            <label className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
              <Camera className="w-4 h-4 text-primary-foreground" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          )}
          {/* Online Indicator */}
          {isOwnProfile && (
            <button
              onClick={handleStatusToggle}
              className="absolute top-0 right-0 p-2 rounded-full bg-card border-2 border-border hover:border-primary transition-colors"
              title={isOnline ? 'Online' : 'Offline'}
            >
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-gray-400" />
              )}
            </button>
          )}
          {isOwnProfile && (
            <p className={`mt-2 text-[11px] text-center ${isOnline ? 'text-green-400' : 'text-chalk-faint'}`}>
              {isOnline ? `Active since ${fmtRelative(onlineSince)}` : `Offline since ${fmtRelative(lastSeenAt)}`}
            </p>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            {profile.influencerTier && INFLUENCER_TIER_CLASS[profile.influencerTier] && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${INFLUENCER_TIER_CLASS[profile.influencerTier]}`}>
                {INFLUENCER_TIER_LABEL[profile.influencerTier] ?? profile.influencerTier}
              </span>
            )}
            {profile.tier !== 'regular' && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${tierStyles[profile.tier]}`}>
                {profile.tier === 'gold' ? '★ Gold' : '◇ Silver'}
              </span>
            )}
          </div>
          <p className="text-muted-foreground mb-3">{profile.handle}</p>

          <div className="flex flex-wrap gap-4 text-sm">
            {profile.city && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {profile.city}
              </span>
            )}
            {profile.socialHandles?.instagram && (
              <a
                href={`https://instagram.com/${profile.socialHandles.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-accent hover:underline"
              >
                <Instagram className="w-4 h-4" />
                {profile.socialHandles.instagram}
              </a>
            )}
            {profile.socialHandles?.youtube && (
              <a
                href={`https://youtube.com/@${profile.socialHandles.youtube}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-destructive hover:underline"
              >
                <Youtube className="w-4 h-4" />
                {profile.socialHandles.youtube}
              </a>
            )}
          </div>
        </div>

        {/* Rating Box */}
        <div className="glass-card flex overflow-hidden shrink-0 self-start min-w-[180px] rounded-2xl">
          <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-3.5">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={`text-lg ${s <= Math.round(profile.avgRating ?? 0) ? 'text-gold' : 'text-white/15'}`}>★</span>
              ))}
            </div>
            <p className="text-[11px] text-chalk-dim">
              {profile.avgRating ? profile.avgRating.toFixed(1) : '—'} ({profile.ratingCount ?? 0})
            </p>
          </div>
          <div className="w-px bg-white/5" />
          <div className="flex items-center justify-center px-4 py-3.5">
            <p className="text-sm font-medium text-chalk text-center">{getRatingLabel(profile.avgRating)}</p>
          </div>
        </div>

        {/* Edit Button */}
        {isOwnProfile && (
          <div className="flex items-start">
            <a href="/profile/edit" className="btn-outline px-4 py-2 text-sm">
              Edit Profile
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
