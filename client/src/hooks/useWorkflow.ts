import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getWorkflow,
  getActivityLog,
  workflowAction,
  WorkflowProposal,
  ActivityLogEntry,
} from '@/lib/api';

export function useProposalWorkflow(id: string) {
  return useQuery<WorkflowProposal>({
    queryKey: ['workflow', id],
    queryFn: () => getWorkflow(id),
    enabled: !!id,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useActivityLog(id: string) {
  return useQuery<ActivityLogEntry[]>({
    queryKey: ['activityLog', id],
    queryFn: () => getActivityLog(id),
    enabled: !!id,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useWorkflowAction(id: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation<WorkflowProposal, Error, { action: string; body?: Record<string, unknown> }>({
    mutationFn: ({ action, body }) => workflowAction(id, action, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflow', id] });
      qc.invalidateQueries({ queryKey: ['activityLog', id] });
    },
    onError: (err) => {
      const status = (err as { status?: number }).status;
      if (status === 409) {
        toast({ title: 'Stage conflict', description: 'Refresh and try again.', variant: 'destructive' });
      } else if (status === 403) {
        toast({ title: 'Forbidden', description: err.message, variant: 'destructive' });
      } else {
        toast({ title: 'Action failed', description: err.message, variant: 'destructive' });
      }
    },
  });
}
