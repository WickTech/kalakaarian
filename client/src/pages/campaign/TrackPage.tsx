import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
import { api, Proposal } from '@/lib/api';
import { CampaignProgressTracker } from '@/components/CampaignProgressTracker';

const STAGE_COLOR: Record<string, string> = {
  shortlisted: 'text-amber-400 border-amber-400/30',
  accepted: 'text-blue-400 border-blue-400/30',
  content_in_progress: 'text-purple-400 border-purple-400/30',
  submitted: 'text-cyan-400 border-cyan-400/30',
  under_review: 'text-orange-400 border-orange-400/30',
  approved: 'text-emerald-400 border-emerald-400/30',
  payment_pending: 'text-yellow-400 border-yellow-400/30',
  payment_released: 'text-teal-400 border-teal-400/30',
  rejected_workflow: 'text-red-400 border-red-400/30',
};

const STAGE_SHORT: Record<string, string> = {
  shortlisted: 'Notified', accepted: 'Scripts OK',
  content_in_progress: 'Creating', submitted: 'Submitted',
  under_review: 'In Review', approved: 'Delivered',
  payment_pending: 'Pending Pay', payment_released: 'Paid',
  rejected_workflow: 'Rejected',
};

export default function CampaignTrackPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => { document.title = 'Campaign Tracking · Kalakaarian'; }, []);

  const { data: proposals = [], isLoading, dataUpdatedAt, refetch } = useQuery<Proposal[]>({
    queryKey: ['campaignProposals', id],
    queryFn: () => api.getProposalsForCampaign(id!),
    enabled: !!id,
    refetchInterval: 15_000,
  });

  const active = proposals.filter((p) => p.workflow_stage && p.workflow_stage !== 'rejected_workflow');
  const rejected = proposals.filter((p) => p.workflow_stage === 'rejected_workflow');
  const paid = proposals.filter((p) => p.workflow_stage === 'payment_released').length;
  const delivered = proposals.filter((p) => ['approved', 'payment_pending', 'payment_released'].includes(p.workflow_stage ?? '')).length;
  const isRevision = (p: Proposal) => p.workflow_stage === 'under_review';

  return (
    <main className="min-h-screen bg-obsidian text-chalk">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-chalk-dim hover:text-chalk transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
            <button onClick={() => refetch()} className="p-1.5 rounded-md hover:bg-white/5 transition-colors text-chalk-dim hover:text-chalk">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-1">Campaign Tracking</h1>
        <p className="text-xs text-chalk-dim mb-6">
          {dataUpdatedAt ? `Updated ${new Date(dataUpdatedAt).toLocaleTimeString()}` : 'Loading…'}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total', value: proposals.length, color: 'text-chalk' },
            { label: 'Active', value: active.length,   color: 'text-purple-400' },
            { label: 'Delivered', value: delivered,    color: 'text-emerald-400' },
            { label: 'Paid', value: paid,              color: 'text-teal-400' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.03] p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-chalk-dim mt-0.5 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Creator cards */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          </div>
        ) : active.length === 0 && rejected.length === 0 ? (
          <p className="text-center text-chalk-dim text-sm py-16">No creators in workflow yet.</p>
        ) : (
          <div className="space-y-3">
            {[...active, ...rejected].map((p) => (
              <div key={p._id} className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
                {/* Creator header */}
                <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-purple-600/25 flex items-center justify-center shrink-0 text-xs font-bold text-purple-300">
                      {(p.influencerName || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-chalk truncate">{p.influencerName}</p>
                      <p className="text-xs text-chalk-dim">₹{p.bidAmount?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STAGE_COLOR[p.workflow_stage ?? ''] ?? 'text-chalk-dim border-white/15'}`}>
                      {STAGE_SHORT[p.workflow_stage ?? ''] ?? '—'}
                    </span>
                    <Link to={`/proposals/${p._id}`} className="p-1 rounded hover:bg-white/8 transition-colors text-chalk-dim hover:text-chalk">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
                {/* Tracker */}
                <div className="px-4 pb-4">
                  <CampaignProgressTracker
                    currentStage={p.workflow_stage ?? null}
                    updatedAt={p.workflow_stage_updated_at ?? null}
                    isRevision={isRevision(p)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
