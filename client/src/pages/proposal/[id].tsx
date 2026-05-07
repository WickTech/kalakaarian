import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProposalWorkflow, useActivityLog, useWorkflowAction } from '@/hooks/useWorkflow';
import { StageTimeline } from '@/components/workflow/StageTimeline';
import { ActivityLogList } from '@/components/workflow/ActivityLogList';
import { SubmitContentDialog, FeedbackDialog } from '@/components/workflow/WorkflowDialogs';
import { RatingWidget } from '@/components/workflow/RatingWidget';
import { STAGE_LABELS, nextActionsFor, WorkflowStage } from '@/lib/workflow';
import { Button } from '@/components/ui/button';

const WORKFLOW_ENABLED = import.meta.env.VITE_WORKFLOW_V2_ENABLED === 'true';

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [submitOpen, setSubmitOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState('');

  const { data: proposal, isLoading, error } = useProposalWorkflow(id ?? '');
  const { data: log = [], isLoading: logLoading } = useActivityLog(id ?? '');
  const mutation = useWorkflowAction(id ?? '');

  useEffect(() => { document.title = 'Proposal · Kalakaarian'; }, []);

  const stage = proposal?.workflow_stage as WorkflowStage | null ?? null;

  useEffect(() => {
    if (!proposal?.auto_approve_at || stage !== 'under_review') return;
    const tick = () => {
      const s = Math.max(0, Math.floor((new Date(proposal.auto_approve_at!).getTime() - Date.now()) / 1000));
      setCountdown(s > 0 ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s` : 'Any moment…');
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [proposal?.auto_approve_at, stage]);

  if (!WORKFLOW_ENABLED) { navigate('/dashboard', { replace: true }); return null; }
  if (!id) return null;

  const role = user?.role as 'brand' | 'influencer' | undefined;
  function act(action: string, body?: Record<string, unknown>) { mutation.mutate({ action, body }); }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700" />
    </div>;
  }
  if (error || !proposal) {
    return <main className="min-h-screen flex items-center justify-center text-chalk-dim">
      Proposal not found or you do not have access.
    </main>;
  }

  const actions = role ? nextActionsFor(user!.isAdmin ? 'admin' : role, stage) : [];
  const pending = mutation.isPending;

  function copyShareLink() {
    navigator.clipboard.writeText(`${window.location.origin}/proposals/shared/${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="min-h-screen bg-onyx text-chalk px-4 py-8 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-chalk-dim text-sm mb-6 hover:text-chalk transition-colors">
        ← Back
      </button>

      <div className="flex items-start justify-between mb-2 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-chalk-dim uppercase tracking-wider">Proposal Workflow</span>
            <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              Live
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-chalk mt-1">
            {stage ? STAGE_LABELS[stage] : 'No workflow stage'}
          </h1>
          {countdown && (
            <p className="text-xs text-amber-400 mt-1 font-mono">Auto-approves in {countdown}</p>
          )}
          {proposal.auto_approve_at && stage === 'under_review' && !countdown && (
            <p className="text-xs text-chalk-dim mt-1">
              Auto-approves {new Date(proposal.auto_approve_at).toLocaleString()}
            </p>
          )}
        </div>
        <button onClick={copyShareLink}
          className="flex items-center gap-1 text-xs text-chalk-dim hover:text-chalk transition-colors shrink-0 mt-1">
          <Share2 className="w-3 h-3" />
          {copied ? 'Copied!' : 'Share'}
        </button>
      </div>

      <div className="bento-card-dark p-4 rounded-xl mb-6 mt-4">
        <StageTimeline currentStage={stage} />
      </div>

      {proposal.current_submission && (
        <div className="bento-card-dark p-4 rounded-xl mb-6">
          <p className="text-xs text-chalk-dim uppercase tracking-wider mb-2">Latest Submission</p>
          <a href={proposal.current_submission.url} target="_blank" rel="noopener noreferrer"
            className="text-gold text-sm underline break-all block">
            {proposal.current_submission.url}
          </a>
          <p className="text-xs text-chalk-dim mt-1">{proposal.current_submission.platform}</p>
          {proposal.current_submission.notes && (
            <p className="text-xs text-chalk-dim mt-1 italic">{proposal.current_submission.notes}</p>
          )}
        </div>
      )}

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {actions.includes('shortlist') && <Button onClick={() => act('shortlist')} disabled={pending} className="bg-purple-600 hover:bg-purple-700 text-white text-sm">Shortlist</Button>}
          {actions.includes('accept') && <Button onClick={() => act('accept')} disabled={pending} className="bg-green-600 hover:bg-green-700 text-white text-sm">Accept</Button>}
          {actions.includes('start_content') && <Button onClick={() => act('start_content')} disabled={pending} className="bg-purple-600 hover:bg-purple-700 text-white text-sm">Start Work</Button>}
          {actions.includes('submit_content') && <Button onClick={() => setSubmitOpen(true)} disabled={pending} className="bg-purple-600 hover:bg-purple-700 text-white text-sm">Submit Content</Button>}
          {actions.includes('approve') && <Button onClick={() => act('approve')} disabled={pending} className="bg-green-600 hover:bg-green-700 text-white text-sm">Approve</Button>}
          {actions.includes('request_revision') && <Button onClick={() => setRevisionOpen(true)} disabled={pending} variant="outline" className="border-amber-500/40 text-amber-400 text-sm hover:bg-amber-500/10">Request Revision</Button>}
          {actions.includes('feedback') && <Button onClick={() => setFeedbackOpen(true)} disabled={pending} variant="outline" className="border-white/20 text-chalk-dim text-sm hover:bg-white/5">Send Feedback</Button>}
          {actions.includes('mark_payment_pending') && (
            <Button onClick={() => { const r = prompt('Enter transaction reference:'); if (r) act('mark_payment_pending', { transaction_ref: r }); }}
              disabled={pending} className="bg-blue-600 hover:bg-blue-700 text-white text-sm">Mark Payment Pending</Button>
          )}
          {actions.includes('release_payment') && (
            <Button onClick={() => { const r = prompt('Confirm transaction reference:'); if (r) act('release_payment', { transaction_ref: r }); }}
              disabled={pending} className="bg-green-600 hover:bg-green-700 text-white text-sm">Release Payment</Button>
          )}
          {actions.includes('reject_workflow') && <Button onClick={() => act('reject_workflow', { current_stage: stage })} disabled={pending} variant="outline" className="border-red-500/40 text-red-400 text-sm hover:bg-red-500/10">Reject</Button>}
        </div>
      )}

      <div className="bento-card-dark p-4 rounded-xl">
        <p className="text-xs text-chalk-dim uppercase tracking-wider mb-3">Activity</p>
        <ActivityLogList entries={log} loading={logLoading} />
      </div>

      {role && <RatingWidget proposalId={id} role={role} stage={stage} />}

      <SubmitContentDialog open={submitOpen} onClose={() => setSubmitOpen(false)} loading={pending}
        onSubmit={(data) => { act('submit_content', data); setSubmitOpen(false); }} />
      <FeedbackDialog open={revisionOpen} title="Request Revision" onClose={() => setRevisionOpen(false)} loading={pending}
        onSubmit={(data) => { act('request_revision', data); setRevisionOpen(false); }} />
      <FeedbackDialog open={feedbackOpen} title="Send Feedback" onClose={() => setFeedbackOpen(false)} loading={pending}
        onSubmit={(data) => { act('feedback', data); setFeedbackOpen(false); }} />
    </main>
  );
}
