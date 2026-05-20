import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { keys } from '@/lib/queryKeys';
import { hasRealtime } from '@/lib/supabase';
import { useRealtimeCampaignCreator } from '@/hooks/useRealtimeCampaignCreator';
import {
  getWorkflow,
  getActivityLog,
  workflowAction,
  WorkflowProposal,
  ActivityLogEntry,
} from '@/lib/api';

// Realtime channel pushes updates; polling stays as fallback when
// VITE_SUPABASE_URL/ANON_KEY are unset.
export function useProposalWorkflow(id: string) {
  useRealtimeCampaignCreator({ campaignCreatorId: id, enabled: !!id });
  return useQuery<WorkflowProposal>({
    queryKey: keys.workflow.detail(id),
    queryFn: () => getWorkflow(id),
    enabled: !!id,
    staleTime: 10_000,
    refetchInterval: hasRealtime() ? false : 60_000,
  });
}

export function useActivityLog(id: string) {
  // Subscription is attached by useProposalWorkflow at the same scope —
  // no need to double-subscribe; both queries share the channel.
  return useQuery<ActivityLogEntry[]>({
    queryKey: keys.workflow.activity(id),
    queryFn: () => getActivityLog(id),
    enabled: !!id,
    staleTime: 10_000,
    refetchInterval: hasRealtime() ? false : 60_000,
  });
}

const ACTION_STAGE: Record<string, string> = {
  shortlist: 'shortlisted',
  accept: 'accepted',
  start_content: 'content_in_progress',
  submit_content: 'submitted',
  approve: 'approved',
  request_revision: 'submitted',
  mark_payment_pending: 'payment_pending',
  release_payment: 'payment_released',
  reject_workflow: 'rejected_workflow',
};

export function useWorkflowAction(id: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation<WorkflowProposal, Error, { action: string; body?: Record<string, unknown> }>({
    mutationFn: ({ action, body }) => workflowAction(id, action, body),
    onMutate: async ({ action }) => {
      const key = keys.workflow.detail(id);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<WorkflowProposal>(key);
      const nextStage = ACTION_STAGE[action];
      if (nextStage && previous) {
        qc.setQueryData<WorkflowProposal>(key, { ...previous, workflow_stage: nextStage });
      }
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(keys.workflow.detail(id), ctx.previous);
      const status = (err as { status?: number }).status;
      if (status === 409) {
        toast({ title: 'Stage conflict', description: 'Refresh and try again.', variant: 'destructive' });
      } else if (status === 403) {
        toast({ title: 'Forbidden', description: err.message, variant: 'destructive' });
      } else {
        toast({ title: 'Action failed', description: err.message, variant: 'destructive' });
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.workflow.detail(id) });
      qc.invalidateQueries({ queryKey: keys.workflow.activity(id) });
    },
  });
}
