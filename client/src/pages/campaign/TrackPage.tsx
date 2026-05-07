import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, Proposal } from '@/lib/api';
import { STAGE_LABELS, WorkflowStage } from '@/lib/workflow';
import { Badge } from '@/components/ui/badge';

const STAGE_COLORS: Record<string, string> = {
  shortlisted: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  accepted: 'bg-green-500/20 text-green-300 border-green-500/30',
  content_in_progress: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  submitted: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  under_review: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  payment_pending: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  payment_released: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  rejected_workflow: 'bg-red-500/20 text-red-300 border-red-500/30',
};

function stageBadge(stage: string | null | undefined) {
  if (!stage) return <span className="text-xs text-chalk-dim">—</span>;
  const label = STAGE_LABELS[stage as WorkflowStage] ?? stage;
  const color = STAGE_COLORS[stage] ?? 'bg-white/10 text-chalk-dim border-white/20';
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${color}`}>{label}</span>;
}

export default function CampaignTrackPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: proposals = [], isLoading } = useQuery<Proposal[]>({
    queryKey: ['campaignProposals', id],
    queryFn: () => api.getProposalsForCampaign(id!),
    enabled: !!id,
    refetchInterval: 15_000,
  });

  useEffect(() => { document.title = 'Campaign Tracking · Kalakaarian'; }, []);

  const stageCounts = proposals.reduce<Record<string, number>>((acc, p) => {
    const s = p.workflow_stage ?? 'no_workflow';
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const workflowProposals = proposals.filter((p) => p.workflow_stage);
  const progressPct = workflowProposals.length === 0 ? 0
    : Math.round((workflowProposals.filter((p) => ['approved', 'payment_pending', 'payment_released'].includes(p.workflow_stage ?? '')).length / workflowProposals.length) * 100);

  return (
    <main className="min-h-screen bg-onyx text-chalk px-4 py-8 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-chalk-dim text-sm mb-6 hover:text-chalk transition-colors">
        ← Back
      </button>

      <div className="flex items-center gap-2 mb-6">
        <h1 className="font-display text-2xl font-bold">Campaign Tracking</h1>
        <span className="flex items-center gap-1 text-xs text-green-400 font-medium ml-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
          Live
        </span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bento-card-dark p-3 rounded-xl text-center">
          <p className="text-2xl font-bold text-chalk">{proposals.length}</p>
          <p className="text-xs text-chalk-dim mt-0.5">Total</p>
        </div>
        <div className="bento-card-dark p-3 rounded-xl text-center">
          <p className="text-2xl font-bold text-amber-400">{workflowProposals.length}</p>
          <p className="text-xs text-chalk-dim mt-0.5">In workflow</p>
        </div>
        <div className="bento-card-dark p-3 rounded-xl text-center">
          <p className="text-2xl font-bold text-emerald-400">{stageCounts['approved'] ?? 0}</p>
          <p className="text-xs text-chalk-dim mt-0.5">Approved</p>
        </div>
        <div className="bento-card-dark p-3 rounded-xl text-center">
          <p className="text-2xl font-bold text-teal-400">{stageCounts['payment_released'] ?? 0}</p>
          <p className="text-xs text-chalk-dim mt-0.5">Paid</p>
        </div>
      </div>

      {workflowProposals.length > 0 && (
        <div className="bento-card-dark p-4 rounded-xl mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-chalk-dim uppercase tracking-wider">Overall progress</p>
            <p className="text-xs text-chalk font-medium">{progressPct}%</p>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {/* Proposal list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700" />
        </div>
      ) : proposals.length === 0 ? (
        <p className="text-chalk-dim text-sm text-center py-12">No proposals yet for this campaign.</p>
      ) : (
        <div className="space-y-2">
          {proposals.map((p) => (
            <div key={p.id} className="bento-card-dark p-4 rounded-xl flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-chalk truncate">{p.influencerName}</p>
                <p className="text-xs text-chalk-dim mt-0.5">₹{p.bidAmount?.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {stageBadge(p.workflow_stage)}
                {import.meta.env.VITE_WORKFLOW_V2_ENABLED === 'true' && p.workflow_stage && (
                  <Link to={`/proposals/${p.id}`} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                    View →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
