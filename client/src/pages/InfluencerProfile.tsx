import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Loader2, Upload, BarChart2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, InfluencerProfile as InfluencerProfileData, VideoItem, SocialStats } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ProfileHeader } from '@/components/ProfileHeader';
import { AnalyticsCard } from '@/components/AnalyticsCard';
import { MembershipUpgradeCard } from '@/components/MembershipBadge';
import { VideoGrid } from '@/components/VideoGrid';
import { SocialConnect } from '@/components/SocialConnect';
import { InfluencerTrustSection } from '@/components/InfluencerTrustSection';
import { BadgeStrip } from '@/components/BadgeStrip';
import { SimilarProfiles } from '@/components/SimilarProfiles';
import { CelebCallbackModal } from '@/components/CelebCallbackModal';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { PerformanceBarChart, GenderPieChart } from '@/components/SocialMediaCharts';

export default function InfluencerProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const navigate = useNavigate();
  const isOwnProfile = user?.id === id;
  const [showCelebModal, setShowCelebModal] = useState(false);

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

  const MOCK_IG = { followers: 18_400, following: 620, posts: 94, engagementRate: 4.8 };
  const ig = socialStats?.instagram;
  const displayIg = ig ?? MOCK_IG;

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
    <>
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        <ProfileHeader
          profile={{
            name: profile.name || 'Unknown',
            handle: `@${profile.socialHandles?.instagram || 'user'}`,
            profileImage: profile.profileImage || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
            tier: membership.tier as 'gold' | 'silver' | 'regular',
            influencerTier: profile.tier,
            avgRating: profile.avgRating,
            ratingCount: profile.ratingCount,
            city: profile.city,
            socialHandles: profile.socialHandles,
            isOnline: profile.isOnline,
          }}
          isOwnProfile={isOwnProfile}
          onStatusToggle={handleStatusToggle}
        />

        {isOwnProfile && (
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/influencer/dashboard?tab=upload')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-sm text-chalk-dim hover:text-chalk hover:border-white/20 transition-all"
            >
              <Upload className="w-4 h-4" /> Submit Content
            </button>
            <button
              onClick={() => navigate('/influencer/dashboard?tab=analytics')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-sm text-chalk-dim hover:text-chalk hover:border-white/20 transition-all"
            >
              <BarChart2 className="w-4 h-4" /> My Analytics
            </button>
          </div>
        )}

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

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Performance</h2>
          <PerformanceBarChart ig={displayIg} isMock={!ig} />
          <GenderPieChart />
        </div>

        {isOwnProfile && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Membership</h2>
            <MembershipUpgradeCard currentTier={membership.tier as 'gold' | 'silver' | 'regular'} onUpgrade={handleMembershipUpgrade} />
          </div>
        )}

        {(isOwnProfile || videos.length > 0) && (
          <VideoGrid videos={videos} isOwnProfile={isOwnProfile} onUpload={handleVideoUpload} />
        )}

        {profile.tier === 'celeb' && !isOwnProfile && (
          <div className="bento-card p-5 text-center space-y-3">
            <p className="text-sm text-chalk-dim">Interested in collaborating with {profile.name}?</p>
            <button onClick={() => setShowCelebModal(true)} className="gold-pill px-8 py-2.5 text-sm">
              Get In Touch
            </button>
          </div>
        )}

        <SimilarProfiles currentId={id!} />
      </div>
    </div>

    {showCelebModal && profile && (
      <CelebCallbackModal
        influencerId={id!}
        influencerName={profile.name || 'this creator'}
        onClose={() => setShowCelebModal(false)}
      />
    )}
    </>
  );
}
