import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { adminClient } from '../config/supabase';

const WORKFLOW_ENABLED = process.env.WORKFLOW_V2_ENABLED === 'true';

function featureGate(res: Response): boolean {
  if (!WORKFLOW_ENABLED) {
    res.status(404).json({ message: 'Workflow v2 not enabled' });
    return true;
  }
  return false;
}

async function getProposalParties(proposalId: string): Promise<{ influencer_id: string; brand_id: string } | null> {
  const { data } = await adminClient
    .from('proposals')
    .select('influencer_id, campaign_id, campaigns(brand_id)')
    .eq('id', proposalId)
    .single();
  if (!data) return null;
  const brand_id = (data.campaigns as unknown as { brand_id: string } | null)?.brand_id ?? '';
  return { influencer_id: data.influencer_id, brand_id };
}

export async function getWorkflow(req: AuthRequest, res: Response): Promise<void> {
  if (featureGate(res)) return;
  const userId = req.user!.userId;
  const { id } = req.params;

  const parties = await getProposalParties(id);
  if (!parties) { res.status(404).json({ message: 'Proposal not found' }); return; }
  if (userId !== parties.influencer_id && userId !== parties.brand_id) {
    res.status(403).json({ message: 'Forbidden' }); return;
  }

  const { data, error } = await adminClient
    .from('proposals')
    .select('id, status, workflow_stage, workflow_stage_updated_at, auto_approve_at, current_submission, transaction_ref')
    .eq('id', id)
    .single();

  if (error || !data) { res.status(404).json({ message: 'Proposal not found' }); return; }
  res.json({ proposal: data });
}

export async function getActivityLog(req: AuthRequest, res: Response): Promise<void> {
  if (featureGate(res)) return;
  const userId = req.user!.userId;
  const { id } = req.params;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;

  const parties = await getProposalParties(id);
  if (!parties) { res.status(404).json({ message: 'Proposal not found' }); return; }
  if (userId !== parties.influencer_id && userId !== parties.brand_id) {
    res.status(403).json({ message: 'Forbidden' }); return;
  }

  const { data, error } = await adminClient
    .from('proposal_activity_log')
    .select('id, actor_role, action, from_stage, to_stage, details, created_at')
    .eq('proposal_id', id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json({ log: data });
}
