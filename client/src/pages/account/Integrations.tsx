import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PlatformConnectCard } from '@/components/PlatformConnectCard';
import { SectionHeader } from './components/SectionHeader';
import { CreditCard } from 'lucide-react';

export default function Integrations() {
  useEffect(() => { document.title = 'Connected Apps — Kalakaarian'; }, []);

  const { data: platforms, isLoading } = useQuery({
    queryKey: ['connected-platforms'],
    queryFn: () => api.getConnectedPlatforms(),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      <SectionHeader title="Connected Apps & Services" subtitle="Manage platform connections and OAuth integrations" />

      <div className="space-y-3">
        <p className="text-xs font-semibold text-chalk-dim uppercase tracking-wide">Social Platforms</p>
        {isLoading ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-chalk-dim">Loading…</div>
        ) : (
          <>
            <PlatformConnectCard platform="instagram" status={platforms?.instagram} />
            <PlatformConnectCard platform="youtube" status={platforms?.youtube} />
          </>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-chalk-dim uppercase tracking-wide">Payments</p>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-chalk">Razorpay</p>
            <p className="text-xs text-green-400">Linked — payment gateway active</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 text-center">
        <p className="text-xs text-chalk-faint">More integrations coming soon</p>
      </div>
    </div>
  );
}
