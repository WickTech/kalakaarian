import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ProfileHeader } from '@/components/ProfileHeader';
import { AnalyticsCard } from '@/components/AnalyticsCard';
import { MembershipUpgradeCard } from '@/components/MembershipBadge';
import { VideoGrid } from '@/components/VideoGrid';
import { ReferralCard } from '@/components/ReferralCard';

export default function InfluencerProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [membership, setMembership] = useState<{ tier: string }>({ tier: 'regular' });
  const [analytics, setAnalytics] = useState({ ER: 0, avgViews: 0, cpv: 0, fakeFollowersPercent: 0 });
  const [videos, setVideos] = useState<any[]>([]);
  const [referralStats, setReferralStats] = useState({ code: null as string | null, usedCount: 0, goldUnlocked: false, silverUnlocked: false });
  const [loading, setLoading] = useState(true);

  const isOwnProfile = user?._id === id || user?.role === 'influencer';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, membershipData, videosData, referralData] = await Promise.all([
          api.getInfluencerById(id!),
          isOwnProfile ? api.getMembershipStatus() : Promise.resolve({ tier: 'regular' }),
          isOwnProfile ? api.getMyVideos() : Promise.resolve([]),
          isOwnProfile ? api.getReferralStats() : Promise.resolve({ code: null, usedCount: 0, goldUnlocked: false, silverUnlocked: false }),
        ]);

        setProfile(profileData);
        setMembership(membershipData);
        setVideos(videosData);
        setReferralStats(referralData);

        setAnalytics({
          ER: Math.floor(Math.random() * 8) + 2,
          avgViews: Math.floor(Math.random() * 50000) + 5000,
          cpv: parseFloat((Math.random() * 0.5 + 0.1).toFixed(2)),
          fakeFollowersPercent: Math.floor(Math.random() * 15) + 5,
        });
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, isOwnProfile]);

  const handleStatusToggle = async (isOnline: boolean) => {
    console.log('Status toggled:', isOnline);
  };

  const handleMembershipUpgrade = async (tier: 'gold' | 'silver') => {
    try {
      await api.purchaseMembership(tier);
      setMembership({ tier });
      toast({ title: 'Success', description: `Upgraded to ${tier} membership!` });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to upgrade membership', variant: 'destructive' });
    }
  };

  const handleVideoUpload = async (videoUrl: string, platform: string) => {
    try {
      const newVideo = await api.uploadVideo(videoUrl, platform);
      setVideos([newVideo, ...videos]);
      toast({ title: 'Success', description: 'Video uploaded successfully' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to upload video', variant: 'destructive' });
    }
  };

  const handleGenerateReferral = async () => {
    try {
      const { code } = await api.generateReferralCode();
      setReferralStats({ ...referralStats, code });
      toast({ title: 'Success', description: 'Referral code generated!' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to generate code', variant: 'destructive' });
    }
  };

  const handleUseReferral = async (code: string) => {
    try {
      await api.useReferralCode(code);
      toast({ title: 'Success', description: 'Referral code applied!' });
    } catch (err) {
      toast({ title: 'Error', description: 'Invalid or already used code', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
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
        <button onClick={() => navigate(-1)} className="p-2 border border-border rounded-md hover:bg-secondary">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold">Profile</h1>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        <ProfileHeader
          profile={{
            name: profile.name || 'Unknown',
            handle: `@${profile.socialHandles?.instagram || profile.username || 'user'}`,
            profileImage: profile.profileImage || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
            tier: membership.tier as 'gold' | 'silver' | 'regular',
            city: profile.city,
            socialHandles: profile.socialHandles,
          }}
          isOwnProfile={isOwnProfile}
          onStatusToggle={handleStatusToggle}
        />

        <div>
          <h2 className="text-lg font-semibold mb-4">Analytics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnalyticsCard title="Engagement Rate" value={`${analytics.ER}%`} icon="er" />
            <AnalyticsCard title="Avg Views" value={analytics.avgViews.toLocaleString()} icon="views" />
            <AnalyticsCard title="Cost Per View" value={`₹${analytics.cpv}`} icon="cpv" />
            <AnalyticsCard title="Fake Followers" value={`${analytics.fakeFollowersPercent}%`} subtitle="Estimated" icon="fake" />
          </div>
        </div>

        {isOwnProfile && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Membership</h2>
            <MembershipUpgradeCard currentTier={membership.tier as 'gold' | 'silver' | 'regular'} onUpgrade={handleMembershipUpgrade} />
          </div>
        )}

        <VideoGrid videos={videos} isOwnProfile={isOwnProfile} onUpload={handleVideoUpload} />

        <ReferralCard stats={referralStats} isOwnProfile={isOwnProfile} onGenerateCode={handleGenerateReferral} onUseCode={handleUseReferral} />
      </div>
    </div>
  );
}
