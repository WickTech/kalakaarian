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
  };
  isOwnProfile: boolean;
  onImageUpload?: (file: File) => void;
  onStatusToggle?: (isOnline: boolean) => void;
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

  const handleStatusToggle = () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    onStatusToggle?.(newStatus);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload?.(file);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Profile Image */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-border">
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
        <div className="flex rounded-xl border border-border overflow-hidden shrink-0 self-start min-w-[180px]">
          <div className="flex flex-col items-center justify-center gap-1 px-4 py-3 bg-card">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={`text-lg ${s <= Math.round(profile.avgRating ?? 0) ? 'text-green-500' : 'text-muted-foreground/30'}`}>★</span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {profile.avgRating ? profile.avgRating.toFixed(1) : '—'} ({profile.ratingCount ?? 0})
            </p>
          </div>
          <div className="w-px bg-border" />
          <div className="flex items-center justify-center px-4 py-3 bg-card">
            <p className="text-sm font-semibold text-foreground text-center">{getRatingLabel(profile.avgRating)}</p>
          </div>
        </div>

        {/* Edit Button */}
        {isOwnProfile && (
          <div className="flex items-start">
            <a
              href="/profile/edit"
              className="px-4 py-2 border border-border rounded-md hover:bg-secondary transition-colors text-sm font-medium"
            >
              Edit Profile
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
