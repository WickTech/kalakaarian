import { useEffect, useRef, useState } from 'react';
import { useParams, Link, Navigate, useLocation } from 'react-router-dom';
import { Loader2, Upload, FolderClock, Crown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api, InfluencerProfile as InfluencerProfileData, SocialStats } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useCartContext } from '@/contexts/CartContext';
import { ProfileHeader } from '@/components/ProfileHeader';
import { InfluencerTrustSection } from '@/components/InfluencerTrustSection';
import { BadgeStrip } from '@/components/BadgeStrip';
import { CelebCallbackModal } from '@/components/CelebCallbackModal';
import { SocialPlatformPanel } from '@/components/profile/SocialPlatformPanel';
import { AnalyticsSection } from '@/components/profile/AnalyticsSection';
import { ProfileGallery } from '@/components/profile/ProfileGallery';
import { OwnerActionsBar } from '@/components/profile/OwnerActionsBar';
import { WalletModal } from '@/components/WalletModal';
import { Influencer } from '@/lib/store';

export default function InfluencerProfile() {
  const { id } = useParams<{ id: string }>();
  const { hash } = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addToCart, isInCart } = useCartContext();
  const socialRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);

  const isOwnProfile = user?.id === id;
  const isBrand = user?.role === 'brand';
  const [showCelebModal, setShowCelebModal] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [gallery, setGallery] = useState<string[]>([]);
  const highlightSocial = hash === '#social';

  const { data: profile, isLoading } = useQuery<InfluencerProfileData>({
    queryKey: ['influencer-profile', id],
    queryFn: () => api.getInfluencerById(id!),
    enabled: !!id,
  });

  const { data: socialStats } = useQuery({
    queryKey: ['social-stats', id, profile?.userId],
    queryFn: () => api.getSocialStats(profile?.userId || id!),
    enabled: !!id && !!profile,
  });

  const serverAnalytics =
    (socialStats as SocialStats & { analytics?: { engagementRate?: number; avgViews?: number; totalFollowers?: number; reachEstimate?: number; source?: string; authenticityScore?: number } })?.analytics ?? null;

  useEffect(() => {
    if (profile?.galleryImages) setGallery(profile.galleryImages);
  }, [profile?.galleryImages]);

  useEffect(() => {
    if (highlightSocial && socialRef.current) {
      const t = setTimeout(() => socialRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
      return () => clearTimeout(t);
    }
  }, [highlightSocial, profile?.id]);

  useEffect(() => {
    if (hash === '#analytics' && analyticsRef.current) {
      const t = setTimeout(() => analyticsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
      return () => clearTimeout(t);
    }
  }, [hash, profile?.id]);

  const handlePlatformAddToCart = async (totalPrice: number, platforms: Array<'instagram' | 'youtube'>) => {
    if (!profile || !id) return;
    if (isInCart(id)) {
      try { await api.updateCartItem(id, '', totalPrice); } catch { /* non-fatal */ }
      toast({ title: 'Cart updated', description: `${platforms.length} platform${platforms.length > 1 ? 's' : ''} — ₹${totalPrice.toLocaleString('en-IN')}` });
      return;
    }
    const inf: Influencer = {
      id, name: profile.name || 'Kalakaar',
      handle: profile.socialHandles?.instagram || profile.socialHandles?.youtube || '',
      photo: profile.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`,
      platform: platforms[0] ?? 'instagram',
      tier: (profile.tier as Influencer['tier']) || 'micro',
      genre: profile.niches?.[0] || '', city: profile.city || '',
      followers: profile.followerCount || 0, activeFollowers: 0, fakeFollowers: 0,
      avgViews: 0, avgLikes: 0, genderSplit: { male: 45, female: 52, other: 3 },
      price: totalPrice, avgRating: profile.avgRating ?? null, ratingCount: profile.ratingCount ?? 0,
    };
    await addToCart(inf);
    toast({ title: 'Added to cart', description: `Total: ₹${totalPrice.toLocaleString('en-IN')}` });
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (user?.role === 'influencer' && !isOwnProfile) {
    return <Navigate to={`/influencer/${user.id}`} replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p>Kalakaar not found</p>
        <Link to="/marketplace" className="text-primary hover:underline">Back to Marketplace</Link>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
          {isOwnProfile && (
            <OwnerActionsBar
              isOnline={!!profile.isOnline}
              onlineSince={profile.onlineSince}
              lastSeenAt={profile.lastSeenAt}
              onOpenWallet={() => setShowWallet(true)}
              onScrollAnalytics={() => analyticsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            />
          )}

          <ProfileHeader
            profile={{
              name: profile.name || 'Unknown',
              handle: `@${profile.socialHandles?.instagram || 'user'}`,
              profileImage: profile.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`,
              tier: 'regular',
              influencerTier: profile.tier,
              avgRating: profile.avgRating,
              ratingCount: profile.ratingCount,
              city: profile.city || '',
              state: profile.state || '',
              socialHandles: profile.socialHandles,
              bio: profile.bio,
              niches: profile.niches,
            }}
          />

          {isOwnProfile && (
            <div className="grid grid-cols-3 gap-2">
              <Link
                to="/campaigns"
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-xs sm:text-sm text-chalk hover:bg-white/[0.06] transition-all"
              >
                <Upload className="w-4 h-4 text-purple-400" /> Upload Video
              </Link>
              <Link
                to="/campaigns?tab=completed"
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-xs sm:text-sm text-chalk hover:bg-white/[0.06] transition-all"
              >
                <FolderClock className="w-4 h-4 text-chalk-dim" /> Past Campaigns
              </Link>
              <Link
                to="/influencer/dashboard?tab=membership"
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-xs sm:text-sm text-chalk hover:bg-white/[0.06] transition-all"
              >
                <Crown className="w-4 h-4 text-gold" /> Membership
              </Link>
            </div>
          )}

          {isBrand && !isOwnProfile && profile.tier !== 'celeb' && (
            <button
              onClick={() => socialRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="w-full py-3 rounded-xl purple-pill font-semibold text-sm"
            >
              Select Kalakaar — Choose Platforms
            </button>
          )}

          <ProfileGallery
            images={gallery}
            isOwnProfile={isOwnProfile}
            onChange={(next) => setGallery(next)}
          />

          <div ref={socialRef} id="social" className="scroll-mt-20">
            <h2 className="text-lg font-semibold mb-4">Social Media</h2>
            <SocialPlatformPanel
              socialHandles={profile.socialHandles || {}}
              pricing={profile.pricing}
              socialStats={socialStats}
              followerCount={profile.followerCount || 0}
              inCart={isInCart(id!)}
              initiallyHighlight={highlightSocial}
              isCelebTier={profile.tier === 'celeb' || isOwnProfile || !isBrand}
              onAddToCart={handlePlatformAddToCart}
            />
          </div>

          <div ref={analyticsRef} id="analytics" className="scroll-mt-20">
            <AnalyticsSection socialStats={socialStats} serverAnalytics={serverAnalytics} socialHandles={profile.socialHandles || {}} />
          </div>

          <InfluencerTrustSection influencerId={id!} avgRating={profile.avgRating} ratingCount={profile.ratingCount} />
          <BadgeStrip influencerId={id!} />

          {profile.tier === 'celeb' && !isOwnProfile && (
            <div className="bento-card p-5 text-center space-y-3">
              <p className="text-sm text-chalk-dim">Interested in collaborating with {profile.name}?</p>
              <button onClick={() => setShowCelebModal(true)} className="gold-pill px-8 py-2.5 text-sm">Get In Touch</button>
            </div>
          )}
        </div>
      </div>

      {showCelebModal && profile && (
        <CelebCallbackModal influencerId={id!} influencerName={profile.name || 'this Kalakaar'} onClose={() => setShowCelebModal(false)} />
      )}

      <WalletModal open={showWallet} onClose={() => setShowWallet(false)} />
    </>
  );
}
