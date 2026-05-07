import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, InfluencerProfile as InfluencerProfileData, VideoItem, SocialStats } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigateBack } from '@/hooks/useNavigateBack';
import { ProfileHeader } from '@/components/ProfileHeader';
import { AnalyticsCard } from '@/components/AnalyticsCard';
import { MembershipUpgradeCard } from '@/components/MembershipBadge';
import { VideoGrid } from '@/components/VideoGrid';
import { SocialConnect } from '@/components/SocialConnect';
import { InfluencerTrustSection } from '@/components/InfluencerTrustSection';
import { BadgeStrip } from '@/components/BadgeStrip';
import { SimilarProfiles } from '@/components/SimilarProfiles';
import { openRazorpayCheckout } from '@/lib/razorpay';

export default function InfluencerProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { goBack } = useNavigateBack('/marketplace');
  const qc = useQueryClient();

  const isOwnProfile = user?.id === id;

  const { data: profile, isLoading } = useQuery<InfluencerProfileData>({
    queryKey: ['influencer-profile', id],
    queryFn: () => api.getInfluencerById(id!),
    enabled: !!id,
  });

  const { data: membership = { tier: 'regular' } } = useQuery({
    queryKey: ['membership-status'],
    queryFn: () => api.getMembershipStatus(),
    enabled: !!id && isOwnProfile,
  });

  const { data: videos = [] as VideoItem[] } = useQuery({
    queryKey: ['my-videos'],
    queryFn: () => api.getMyVideos(),
    enabled: !!id && isOwnProfile,
  });

  const { data: socialStats } = useQuery({
    queryKey: ['social-stats', id, profile?.userId],
    queryFn: () => api.getSocialStats(profile?.userId || id!),
    enabled: !!id && !!profile,
  });

  const analytics = (socialStats as SocialStats & { analytics?: { engagementRate?: number; avgViews?: number; totalFollowers?: number; reachEstimate?: number; source?: string; authenticityScore?: number } })?.analytics || null;

  const handleStatusToggle = async (isOnline: boolean) => {
    try { await api.updatePresence(isOnline); }
    catch { toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' }); }
  };

  const handleMembershipUpgrade = async (tier: 'gold' | 'silver') => {
    try {
      const order = await api.createMembershipOrder(tier);
      if (!order.orderId || !order.keyId) {
        await api.purchaseMembership(tier);
        qc.invalidateQueries({ queryKey: ['membership-status'] });
        toast({ title: 'Success', description: `Upgraded to ${tier} membership!` });
        return;
      }
      await openRazorpayCheckout({
        orderId: order.orderId, amount: order.amount, currency: order.currency, keyId: order.keyId,
        name: `Kalakaarian ${tier.charAt(0).toUpperCase() + tier.slice(1)} Membership`,
        prefill: { name: user?.name, email: user?.email },
        onSuccess: async (paymentId, orderId, signature) => {
          await api.purchaseMembership(tier, { razorpayOrderId: orderId, razorpayPaymentId: paymentId, razorpaySignature: signature });
          qc.invalidateQueries({ queryKey: ['membership-status'] });
          toast({ title: 'Payment successful!', description: `${tier} membership activated.` });
        },
        onDismiss: () => toast({ title: 'Payment cancelled' }),
      });
    } catch { toast({ title: 'Error', description: 'Failed to process payment', variant: 'destructive' }); }
  };

  const handleVideoUpload = async (videoUrl: string, platform: string) => {
    try {
      await api.uploadVideo(videoUrl, platform);
      qc.invalidateQueries({ queryKey: ['my-videos'] });
      toast({ title: 'Success', description: 'Video uploaded successfully' });
    } catch { toast({ title: 'Error', description: 'Failed to upload video', variant: 'destructive' }); }
  };

  const handleSocialConnect = async (platform: 'instagram' | 'youtube', handle: string) => {
    try {
      await api.connectSocialMedia(platform, handle);
      qc.invalidateQueries({ queryKey: ['influencer-profile', id] });
      toast({ title: 'Success', description: `${platform} connected successfully!` });
    } catch { toast({ title: 'Error', description: 'Failed to connect social media', variant: 'destructive' }); }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p>Influencer not found</p>
        <Link to="/marketplace" className="text-primary hover:underline">Back to Marketplace</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-3 flex items-center gap-4">
        <button onClick={goBack} className="p-2 border border-border rounded-md hover:bg-secondary">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold">Profile</h1>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        <ProfileHeader
          profile={{
            name: profile.name || 'Unknown',
            handle: `@${profile.socialHandles?.instagram || 'user'}`,
            profileImage: profile.profileImage || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
            tier: membership.tier as 'gold' | 'silver' | 'regular',
            city: profile.city,
            socialHandles: profile.socialHandles,
            isOnline: profile.isOnline,
          }}
          isOwnProfile={isOwnProfile}
          onStatusToggle={handleStatusToggle}
        />

        <div>
          <h2 className="text-lg font-semibold mb-4">Analytics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnalyticsCard title="Engagement Rate" value={`${analytics?.engagementRate || 0}%`} icon="er"
              subtitle={analytics?.source ? `Based on ${analytics.source}` : undefined} />
            <AnalyticsCard title="Avg Views" value={(analytics?.avgViews || 0).toLocaleString()} icon="views" />
            <AnalyticsCard title="Total Followers" value={(analytics?.totalFollowers || 0).toLocaleString()} icon="fake" />
            <AnalyticsCard title="Reach Estimate" value={(analytics?.reachEstimate || 0).toLocaleString()} icon="views"
              subtitle={analytics?.authenticityScore ? `Authenticity: ${analytics.authenticityScore}%` : undefined} />
          </div>
        </div>

        <InfluencerTrustSection
          influencerId={id!}
          avgRating={profile.avgRating}
          ratingCount={profile.ratingCount}
        />

        <BadgeStrip influencerId={id!} />

        <div>
          <h2 className="text-lg font-semibold mb-4">Social Media</h2>
          <SocialConnect
            socialHandles={profile.socialHandles || {}}
            stats={socialStats || null}
            isOwnProfile={isOwnProfile}
            onConnect={handleSocialConnect}
          />
        </div>

        {isOwnProfile && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Membership</h2>
            <MembershipUpgradeCard currentTier={membership.tier as 'gold' | 'silver' | 'regular'} onUpgrade={handleMembershipUpgrade} />
          </div>
        )}

        <VideoGrid videos={videos} isOwnProfile={isOwnProfile} onUpload={handleVideoUpload} />

        <SimilarProfiles currentId={id!} />
      </div>
    </div>
  );
}
