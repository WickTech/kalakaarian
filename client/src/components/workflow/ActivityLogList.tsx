import { ActivityLogEntry } from '@/lib/api';
import { STAGE_LABELS, WorkflowStage } from '@/lib/workflow';

const ACTION_LABELS: Record<string, string> = {
  shortlist:            'Shortlisted',
  accept:               'Accepted',
  reject_workflow:      'Rejected',
  start_content:        'Started work',
  submit_content:       'Submitted content',
  auto_advance_review:  'Moved to review',
  approve:              'Approved',
  auto_approve:         'Auto-approved',
  request_revision:     'Requested revision',
  feedback:             'Sent feedback',
  mark_payment_pending: 'Marked payment pending',
  release_payment:      'Payment released',
};

const ROLE_LABELS: Record<string, string> = {
  brand:      'Brand',
  influencer: 'Creator',
  admin:      'Admin',
  system:     'System',
};

function stageLabel(s: string | null) {
  if (!s) return null;
  return STAGE_LABELS[s as WorkflowStage] ?? s;
}

interface Props {
  entries: ActivityLogEntry[];
  loading?: boolean;
}

export function ActivityLogList({ entries, loading }: Props) {
  if (loading) return <p className="text-chalk-dim text-sm">Loading activity…</p>;
  if (!entries.length) return <p className="text-chalk-dim text-sm">No activity yet.</p>;

  return (
    <ul className="space-y-3">
      {entries.map((e) => (
        <li key={e.id} className="flex gap-3">
          <div className="w-1 rounded-full bg-purple-500/30 shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-chalk">
                {ACTION_LABELS[e.action] ?? e.action}
              </span>
              <span className="text-xs text-chalk-dim shrink-0">
                {new Date(e.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-chalk-dim mt-0.5">
              by {ROLE_LABELS[e.actor_role ?? ''] ?? e.actor_role ?? 'unknown'}
              {e.from_stage && e.to_stage
                ? ` · ${stageLabel(e.from_stage)} → ${stageLabel(e.to_stage)}`
                : ''}
            </p>
            {e.details && e.action === 'submit_content' && (
              <div className="mt-1.5 text-xs text-chalk-dim">
                <span className="text-chalk font-medium">URL:</span>{' '}
                <a href={(e.details as {url?: string}).url} target="_blank" rel="noopener noreferrer"
                  className="text-gold underline break-all">
                  {(e.details as {url?: string}).url}
                </a>
                {(e.details as {platform?: string}).platform && (
                  <> · {(e.details as {platform?: string}).platform}</>
                )}
              </div>
            )}
            {e.details && (e.action === 'request_revision' || e.action === 'feedback') && (
              <div className="mt-1.5 space-y-1 text-xs text-chalk-dim">
                <p>
                  <span className="capitalize">{(e.details as {category?: string}).category}</span>
                  {' '}·{' '}
                  <span className="capitalize">{(e.details as {severity?: string}).severity}</span>
                </p>
                {((e.details as {required_changes?: string[]}).required_changes ?? []).map((c, i) => (
                  <p key={i}>• {c}</p>
                ))}
                {(e.details as {notes?: string}).notes && (
                  <p className="italic">{(e.details as {notes?: string}).notes}</p>
                )}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
