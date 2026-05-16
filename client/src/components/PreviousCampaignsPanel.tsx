import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Download, Instagram, Youtube, ExternalLink, FileText } from 'lucide-react';
import { api, BrandTransaction } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type CampaignVideo = Awaited<ReturnType<typeof api.getCampaignVideosAdmin>>[number];

const PAYMENT_BADGE: Record<string, string> = {
  completed: 'text-green-400 border-green-400/30 bg-green-400/5',
  pending:   'text-amber-400 border-amber-400/30 bg-amber-400/5',
  none:      'text-chalk-dim border-white/10',
};

function CampaignRow({
  campaign, onDownload,
}: {
  campaign: { id: string; title: string; createdAt: string; status: string; accepted: number; completed: number; totalSpend: number };
  onDownload: (txn: BrandTransaction) => void;
}) {
  const [open, setOpen] = useState(false);

  const { data: videos = [] } = useQuery<CampaignVideo[]>({
    queryKey: ['campaign-videos-admin', campaign.id],
    queryFn: () => api.getCampaignVideosAdmin(campaign.id),
    enabled: open,
    staleTime: 60_000,
  });

  const { data: txnData } = useQuery({
    queryKey: ['brand-transactions', { campaignId: campaign.id }],
    queryFn: () => api.getBrandTransactions({ campaignId: campaign.id }),
    enabled: open,
    staleTime: 60_000,
  });

  const transactions = txnData?.transactions ?? [];

  const creators = Array.from(
    new Map(videos.map((v) => [v.influencer_id, v.profiles?.name ?? 'Creator'])).entries()
  ).map(([id, name]) => ({ id, name }));

  const overallStatus =
    transactions.length === 0 ? 'none' :
    transactions.every((t) => t.status === 'completed') ? 'completed' : 'pending';

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
      <button onClick={() => setOpen((o) => !o)}
              className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors text-left">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-chalk truncate">{campaign.title}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium capitalize ${PAYMENT_BADGE[overallStatus]}`}>
              {overallStatus === 'none' ? 'No payment' : overallStatus}
            </span>
          </div>
          <p className="text-[11px] text-chalk-dim mt-0.5">
            {new Date(campaign.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' · '}{campaign.accepted} creator{campaign.accepted !== 1 ? 's' : ''}
            {' · '}{campaign.completed} delivered
            {' · '}₹{campaign.totalSpend.toLocaleString('en-IN')}
          </p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-chalk-dim shrink-0" /> : <ChevronDown className="w-4 h-4 text-chalk-dim shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-white/6 px-4 py-4 space-y-4">
          <div>
            <p className="text-[10px] text-chalk-faint uppercase tracking-wide mb-2">Creators</p>
            {creators.length === 0 ? (
              <p className="text-xs text-chalk-dim">No creators yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {creators.map((c) => (
                  <span key={c.id} className="text-[11px] px-2 py-1 rounded-full bg-white/5 text-chalk">{c.name}</span>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-[10px] text-chalk-faint uppercase tracking-wide mb-2">Deliverables</p>
            {videos.length === 0 ? (
              <p className="text-xs text-chalk-dim">No deliverables uploaded.</p>
            ) : (
              <div className="space-y-1.5">
                {videos.map((v) => (
                  <div key={v.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02]">
                    <p className="text-xs text-chalk flex-1 truncate min-w-0">
                      {v.profiles?.name ?? 'Creator'}
                      <span className="text-chalk-dim ml-1">· {v.platform}</span>
                    </p>
                    <a href={v.video_url} target="_blank" rel="noopener noreferrer"
                       title="Original upload"
                       className="p-1 rounded hover:bg-white/8 text-chalk-dim hover:text-purple-400">
                      <FileText className="w-3.5 h-3.5" />
                    </a>
                    {v.live_post_url && v.live_post_platform === 'instagram' && (
                      <a href={v.live_post_url} target="_blank" rel="noopener noreferrer"
                         title="Live Instagram post"
                         className="p-1 rounded hover:bg-white/8 text-chalk-dim hover:text-pink-400">
                        <Instagram className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {v.live_post_url && v.live_post_platform === 'youtube' && (
                      <a href={v.live_post_url} target="_blank" rel="noopener noreferrer"
                         title="Live YouTube post"
                         className="p-1 rounded hover:bg-white/8 text-chalk-dim hover:text-red-400">
                        <Youtube className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border capitalize ${
                      v.status === 'approved' ? 'text-green-400 border-green-400/30' :
                      v.status === 'revision' ? 'text-amber-400 border-amber-400/30' :
                      'text-chalk-dim border-white/15'
                    }`}>{v.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {transactions.length > 0 && (
            <div>
              <p className="text-[10px] text-chalk-faint uppercase tracking-wide mb-2">Payments</p>
              <div className="space-y-1.5">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02]">
                    <p className="text-xs text-chalk flex-1 truncate min-w-0">
                      {t.influencerName || 'Creator'}
                      <span className="text-chalk-dim ml-1">· {t.invoiceNumber || '—'}</span>
                    </p>
                    <p className="text-xs font-semibold text-chalk">₹{t.amount.toLocaleString('en-IN')}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border capitalize ${PAYMENT_BADGE[t.status] ?? 'text-chalk-dim border-white/10'}`}>
                      {t.status}
                    </span>
                    <button
                      onClick={() => onDownload(t)}
                      disabled={t.status !== 'completed'}
                      title="Download invoice"
                      className="p-1 rounded hover:bg-purple-500/10 text-purple-400 disabled:opacity-30 disabled:hover:bg-transparent">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <a href={`/brand/campaigns/${campaign.id}/track`}
             className="inline-flex items-center gap-1 text-xs text-purple-400 hover:underline">
            View full tracker <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}

export function PreviousCampaignsPanel() {
  const { toast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ['brand-campaign-history'],
    queryFn: () => api.getBrandCampaignHistory(),
    staleTime: 60_000,
  });

  const campaigns = data?.campaigns ?? [];

  const handleDownload = async (txn: BrandTransaction) => {
    try { await api.downloadInvoice(txn.id, txn.invoiceNumber); }
    catch { toast({ title: 'Download failed', variant: 'destructive' }); }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <div key={i} className="bento-card h-16 animate-pulse bg-white/5 rounded-xl" />)}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return <p className="bento-card p-8 text-center text-sm text-chalk-dim">No previous campaigns yet.</p>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-display font-bold text-chalk">Previous Campaigns</h3>
      {campaigns.map((c) => (
        <CampaignRow key={c.id} campaign={c} onDownload={handleDownload} />
      ))}
    </div>
  );
}
