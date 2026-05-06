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

export const TIMELINE_STAGES: WorkflowStage[] = [
  'shortlisted',
  'accepted',
  'content_in_progress',
  'under_review',
  'approved',
  'payment_released',
];

export const TERMINAL_STAGES: WorkflowStage[] = ['rejected_workflow', 'payment_released'];

export function nextActionsFor(
  role: 'brand' | 'influencer' | 'admin',
  stage: WorkflowStage | null,
): string[] {
  const s = stage ?? 'null';
  const map: Record<string, Record<string, string[]>> = {
    brand: {
      null:                 ['shortlist'],
      shortlisted:          ['accept', 'reject_workflow'],
      under_review:         ['approve', 'request_revision', 'feedback'],
      accepted:             ['reject_workflow'],
      content_in_progress:  ['reject_workflow'],
      submitted:            ['reject_workflow'],
      approved:             ['reject_workflow'],
      payment_pending:      ['reject_workflow'],
    },
    influencer: {
      accepted:             ['start_content'],
      content_in_progress:  ['submit_content'],
    },
    admin: {
      approved:             ['mark_payment_pending'],
      payment_pending:      ['release_payment'],
    },
  };
  return map[role]?.[s] ?? [];
}
