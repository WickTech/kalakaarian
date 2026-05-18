import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { WalletTab } from '@/components/WalletTab';
import { MembershipTab } from '@/components/InfluencerDashboardPanels';
import { BrandTransactionsPanel } from '@/components/BrandTransactionsPanel';
import { SectionHeader } from './components/SectionHeader';

export default function Payments() {
  const { user, isSuperAdmin, viewAs } = useAuth();
  const role = isSuperAdmin ? (viewAs ?? user?.role) : user?.role;
  const isCreator = role === 'influencer';

  useEffect(() => { document.title = 'Payments — Kalakaarian'; }, []);

  const { data: analytics } = useQuery({
    queryKey: ['influencer-analytics'],
    queryFn: () => api.getInfluencerAnalytics().catch(() => null),
    enabled: isCreator,
  });

  const { data: membershipStatus = null } = useQuery({
    queryKey: ['membership-status'],
    queryFn: () => api.getMembershipStatus().catch(() => null),
    enabled: isCreator,
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Payments & Subscriptions"
        subtitle={isCreator ? 'Wallet, earnings, payouts, and membership' : 'Campaign payments and invoice history'}
      />

      {isCreator ? (
        <div className="space-y-6">
          <WalletTab
            earnings={analytics?.totalEarnings ?? 0}
            pendingTotal={analytics?.pendingPayouts ?? 0}
          />
          <MembershipTab membershipStatus={membershipStatus} />
        </div>
      ) : (
        <BrandTransactionsPanel />
      )}
    </div>
  );
}
