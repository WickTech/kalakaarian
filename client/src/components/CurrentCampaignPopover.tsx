import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { X, ArrowRight, BarChart2 } from 'lucide-react';
import { api, Campaign, Proposal } from '@/lib/api';
import { CampaignPhaseTracker } from './CampaignPhaseTracker';
import { keys } from '@/lib/queryKeys';

const STAGE_IDX: Record<string, number> = {
  shortlisted: 1, accepted: 2, content_in_progress: 3, submitted: 3,
  under_review: 4, approved: 5, payment_pending: 5, payment_released: 6,
};

interface Props {
  open: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

export function CurrentCampaignPopover({ open, onClose, anchorRef }: Props) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (anchorRef?.current?.contains(target)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorRef]);

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: keys.campaigns.byBrand(),
    queryFn: () => api.getCampaigns(),
    enabled: open,
    staleTime: 30_000,
  });

  const active = campaigns.filter((c) => c.status === 'open');
  const current = active[0] ?? null;

  const { data: proposals = [] } = useQuery<Proposal[]>({
    queryKey: keys.campaignCreators.byCampaign(current?.id),
    queryFn: () => api.getCampaignCreatorsForCampaign(current!.id),
    enabled: open && !!current,
    staleTime: 30_000,
    refetchInterval: open ? 20_000 : false,
  });

  if (!open) return null;

  const leadStage = proposals.length
    ? proposals.reduce<string | null>((best, p) => {
        const cur = p.workflow_stage;
        if (!cur || cur === 'rejected_workflow') return best;
        return (STAGE_IDX[cur] ?? 0) > (STAGE_IDX[best ?? ''] ?? 0) ? cur : best;
      }, null)
    : null;

  const activeCreators = proposals.filter((p) => p.workflow_stage && p.workflow_stage !== 'rejected_workflow').length;
  const paidCreators   = proposals.filter((p) => p.workflow_stage === 'payment_released').length;

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-obsidian shadow-2xl shadow-black/50 backdrop-blur-xl"
      role="dialog"
      aria-label="Current campaign"
    >
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-chalk">Current Campaign</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/5 text-chalk-dim hover:text-chalk">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-4 py-4 space-y-3">
        {!current ? (
          <div className="text-center py-6">
            <p className="text-xs text-chalk-dim">No active campaigns.</p>
            <Link to="/marketplace" onClick={onClose} className="inline-block mt-3 text-xs text-purple-400 hover:underline">
              Browse creators →
            </Link>
          </div>
        ) : (
          <>
            <div>
              <p className="text-sm font-semibold text-chalk truncate">{current.title}</p>
              <p className="text-[11px] text-chalk-dim mt-0.5">
                {activeCreators} creator{activeCreators !== 1 ? 's' : ''} active · {paidCreators} paid
                {current.deadline && ` · Due ${new Date(current.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
              </p>
            </div>

            <CampaignPhaseTracker currentStage={leadStage} compact />

            <div className="flex items-center gap-2 pt-1">
              <Link
                to={`/brand/campaigns/${current.id}/track`}
                onClick={onClose}
                className="flex-1 text-center text-xs px-3 py-2 rounded-lg border border-white/10 text-chalk-dim hover:text-chalk hover:border-purple-400/40 transition-colors"
              >
                Full Tracker
              </Link>
              <Link
                to="/brand/dashboard?tab=campaigns"
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-1 text-xs px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors"
              >
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
