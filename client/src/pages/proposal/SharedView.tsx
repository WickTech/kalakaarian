import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPublicWorkflow, ActivityLogEntry } from '@/lib/api';
import { StageTimeline } from '@/components/workflow/StageTimeline';
import { STAGE_LABELS, WorkflowStage } from '@/lib/workflow';
import { formatDistanceToNow } from 'date-fns';

const ACTION_LABELS: Record<string, string> = {
  shortlist: 'Shortlisted', accept: 'Accepted', reject_workflow: 'Rejected',
  start_content: 'Work started', submit_content: 'Content submitted',
  auto_advance_review: 'Under review', approve: 'Approved', auto_approve: 'Auto-approved',
  request_revision: 'Revision requested', feedback: 'Feedback sent',
  mark_payment_pending: 'Payment pending', release_payment: 'Payment released',
};

const ROLE_LABELS: Record<string, string> = {
  brand: 'Brand', influencer: 'Creator', admin: 'Admin', system: 'System',
};

export default function SharedWorkflowView() {
  const { id } = useParams<{ id: string }>();
  const [countdown, setCountdown] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['publicWorkflow', id],
    queryFn: () => getPublicWorkflow(id!),
    enabled: !!id,
    refetchInterval: 15_000,
  });

  const stage = data?.proposal.workflow_stage as WorkflowStage | null ?? null;

  useEffect(() => {
    document.title = 'Proposal Status · Kalakaarian';
  }, []);

  useEffect(() => {
    if (!data?.proposal.auto_approve_at || stage !== 'under_review') return;
    const tick = () => {
      const s = Math.max(0, Math.floor((new Date(data.proposal.auto_approve_at!).getTime() - Date.now()) / 1000));
      setCountdown(s > 0 ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s` : 'Any moment…');
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [data?.proposal.auto_approve_at, stage]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700" />
    </div>;
  }

  if (error || !data) {
    return <main className="min-h-screen flex items-center justify-center text-chalk-dim">
      This proposal could not be found or the link has expired.
    </main>;
  }

  return (
    <main className="min-h-screen bg-onyx text-chalk px-4 py-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-chalk-dim uppercase tracking-wider">Shared Proposal Status</span>
          <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            Live
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold text-chalk">
          {stage ? STAGE_LABELS[stage] : 'Pending'}
        </h1>
        {countdown && <p className="text-xs text-amber-400 mt-1 font-mono">Auto-approves in {countdown}</p>}
      </div>

      <div className="bento-card-dark p-4 rounded-xl mb-6">
        <StageTimeline currentStage={stage} />
      </div>

      <div className="bento-card-dark p-4 rounded-xl">
        <p className="text-xs text-chalk-dim uppercase tracking-wider mb-3">Timeline</p>
        {data.log.length === 0 ? (
          <p className="text-sm text-chalk-dim">No activity yet.</p>
        ) : (
          <ol className="space-y-3">
            {data.log.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-chalk">
                    {ACTION_LABELS[entry.action] ?? entry.action}
                    {entry.actor_role && <span className="text-chalk-dim"> by {ROLE_LABELS[entry.actor_role] ?? entry.actor_role}</span>}
                  </p>
                  <p className="text-xs text-chalk-dim mt-0.5">
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <p className="text-center text-xs text-chalk-dim mt-8">
        Powered by <span className="text-gold">Kalakaarian</span> · Read-only view
      </p>
    </main>
  );
}
