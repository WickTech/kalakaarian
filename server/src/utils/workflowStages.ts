export const WORKFLOW_STAGES = [
  'shortlisted',
  'accepted',
  'content_in_progress',
  'submitted',
  'under_review',
  'approved',
  'payment_pending',
  'payment_released',
  'rejected_workflow',
] as const;

export type WorkflowStage = typeof WORKFLOW_STAGES[number];

export const STAGE_LABELS: Record<WorkflowStage, string> = {
  shortlisted:          'Shortlisted',
  accepted:             'Accepted',
  content_in_progress:  'Content In Progress',
  submitted:            'Submitted',
  under_review:         'Under Review',
  approved:             'Approved',
  payment_pending:      'Payment Pending',
  payment_released:     'Payment Released',
  rejected_workflow:    'Rejected',
};

export const TERMINAL_STAGES: WorkflowStage[] = ['rejected_workflow', 'payment_released'];

export const ACTIVE_TIMELINE_STAGES: WorkflowStage[] = [
  'shortlisted',
  'accepted',
  'content_in_progress',
  'under_review',
  'approved',
  'payment_released',
];

type TransitionKey = `${WorkflowStage | 'null'}->${WorkflowStage}`;

const ALLOWED_TRANSITIONS = new Set<TransitionKey>([
  'null->shortlisted',
  'shortlisted->accepted',
  'shortlisted->rejected_workflow',
  'accepted->content_in_progress',
  'content_in_progress->submitted',
  'submitted->under_review',
  'under_review->approved',
  'under_review->content_in_progress',
  'approved->payment_pending',
  'payment_pending->payment_released',
  'shortlisted->rejected_workflow',
  'accepted->rejected_workflow',
  'content_in_progress->rejected_workflow',
  'submitted->rejected_workflow',
  'under_review->rejected_workflow',
  'approved->rejected_workflow',
  'payment_pending->rejected_workflow',
]);

type ActorRole = 'brand' | 'influencer' | 'admin' | 'system';

const ROLE_TRANSITIONS: Partial<Record<TransitionKey, ActorRole[]>> = {
  'null->shortlisted':              ['brand'],
  'shortlisted->accepted':          ['brand'],
  'shortlisted->rejected_workflow': ['brand'],
  'accepted->content_in_progress':  ['influencer'],
  'content_in_progress->submitted': ['influencer'],
  'submitted->under_review':        ['system'],
  'under_review->approved':         ['brand', 'system'],
  'under_review->content_in_progress': ['brand'],
  'approved->payment_pending':      ['admin'],
  'payment_pending->payment_released': ['admin', 'system'],
  'accepted->rejected_workflow':           ['brand'],
  'content_in_progress->rejected_workflow':['brand'],
  'submitted->rejected_workflow':          ['brand'],
  'under_review->rejected_workflow':       ['brand'],
  'approved->rejected_workflow':           ['brand'],
  'payment_pending->rejected_workflow':    ['brand'],
};

export function canTransition(
  from: WorkflowStage | null,
  to: WorkflowStage,
  role: ActorRole,
): boolean {
  const key: TransitionKey = `${from ?? 'null'}->${to}`;
  if (!ALLOWED_TRANSITIONS.has(key)) return false;
  const roles = ROLE_TRANSITIONS[key];
  return roles ? roles.includes(role) : false;
}

export const ACTIONS_BY_ROLE: Record<ActorRole, Partial<Record<WorkflowStage | 'null', string[]>>> = {
  brand: {
    null:                  ['shortlist'],
    shortlisted:           ['accept', 'reject_workflow'],
    under_review:          ['approve', 'request_revision', 'feedback'],
    accepted:              ['reject_workflow'],
    content_in_progress:   ['reject_workflow'],
    submitted:             ['reject_workflow'],
    approved:              ['reject_workflow'],
    payment_pending:       ['reject_workflow'],
  },
  influencer: {
    accepted:              ['start_content'],
    content_in_progress:   ['submit_content'],
  },
  admin: {
    approved:              ['mark_payment_pending'],
    payment_pending:       ['release_payment'],
  },
  system: {
    submitted:             ['auto_advance_review'],
    under_review:          ['auto_approve'],
  },
};
