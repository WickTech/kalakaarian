import { Request, Response } from 'express';
import { adminClient } from '../config/supabase';

const AUTO_APPROVE_HOURS = Number(process.env.WORKFLOW_AUTO_APPROVE_HOURS) || 72;

export async function autoApproveExpired(req: Request, res: Response): Promise<void> {
  const runId = (
    await adminClient.from('cron_runs').insert({ job: 'auto_approve' }).select('id').single()
  ).data?.id as string | undefined;

  let processed = 0;
  let errorMsg: string | null = null;

  try {
    const { data: candidates, error } = await adminClient
      .from('proposals')
      .select('id')
      .eq('workflow_stage', 'under_review')
      .lte('auto_approve_at', new Date().toISOString())
      .not('auto_approve_at', 'is', null);

    if (error) throw new Error(error.message);

    for (const row of candidates ?? []) {
      const { error: rpcError } = await adminClient.rpc('transition_workflow_stage', {
        p_proposal_id: row.id,
        p_actor_id: null,
        p_actor_role: 'system',
        p_expected_stage: 'under_review',
        p_to_stage: 'approved',
        p_action: 'auto_approve',
        p_details: null,
        p_auto_approve_hours: AUTO_APPROVE_HOURS,
      });
      if (rpcError) {
        console.error(`auto_approve failed for ${row.id}:`, rpcError.message);
      } else {
        processed++;
      }
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  if (runId) {
    await adminClient.from('cron_runs').update({
      finished_at: new Date().toISOString(),
      processed,
      error: errorMsg,
    }).eq('id', runId);
  }

  if (errorMsg) {
    res.status(500).json({ ok: false, error: errorMsg });
    return;
  }
  res.json({ ok: true, processed });
}
