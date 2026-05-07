import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { adminClient } from '../config/supabase';
import { validationResult } from 'express-validator';

const WORKFLOW_ENABLED = process.env.WORKFLOW_V2_ENABLED === 'true';
const AUTO_APPROVE_HOURS = Number(process.env.WORKFLOW_AUTO_APPROVE_HOURS) || 72;

function featureGate(res: Response): boolean {
  if (!WORKFLOW_ENABLED) { res.status(404).json({ message: 'Workflow v2 not enabled' }); return true; }
  return false;
}

function handleValidation(req: AuthRequest, res: Response): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return true; }
  return false;
}

function mapRpcError(code: string | undefined, message: string): { status: number; body: string } {
  if (code === '23P01') return { status: 409, body: message };
  if (code === 'P0002') return { status: 404, body: message };
  if (code === 'P0001') return { status: 422, body: message };
  return { status: 500, body: message };
}

async function callRpc(
  proposalId: string,
  actorId: string,
  actorRole: string,
  expectedStage: string | null,
  toStage: string,
  action: string,
  details: Record<string, unknown> | null,
  res: Response,
  autoApproveHours?: number,
): Promise<unknown> {
  const { data, error } = await adminClient.rpc('transition_workflow_stage', {
    p_proposal_id: proposalId,
    p_actor_id: actorId,
    p_actor_role: actorRole,
    p_expected_stage: expectedStage,
    p_to_stage: toStage,
    p_action: action,
    p_details: details,
    p_auto_approve_hours: autoApproveHours ?? AUTO_APPROVE_HOURS,
  });
  if (error) {
    const { status, body } = mapRpcError(error.code, error.message);
    res.status(status).json({ message: body });
    return null;
  }
  return data;
}

export async function shortlist(req: AuthRequest, res: Response): Promise<void> {
  if (featureGate(res) || handleValidation(req, res)) return;
  const { id } = req.params;
  if (req.user!.role !== 'brand') { res.status(403).json({ message: 'Brands only' }); return; }
  const data = await callRpc(id, req.user!.userId, 'brand', null, 'shortlisted', 'shortlist', null, res);
  if (data) res.json({ proposal: data });
}

export async function acceptWorkflow(req: AuthRequest, res: Response): Promise<void> {
  if (featureGate(res) || handleValidation(req, res)) return;
  const { id } = req.params;
  if (req.user!.role !== 'brand') { res.status(403).json({ message: 'Brands only' }); return; }
  const data = await callRpc(id, req.user!.userId, 'brand', 'shortlisted', 'accepted', 'accept', null, res);
  if (data) res.json({ proposal: data });
}

export async function startContent(req: AuthRequest, res: Response): Promise<void> {
  if (featureGate(res) || handleValidation(req, res)) return;
  const { id } = req.params;
  if (req.user!.role !== 'influencer') { res.status(403).json({ message: 'Creators only' }); return; }

  // Brief gate: campaign must have budget + deadline before creator can start
  const { data: prop } = await adminClient.from('proposals').select('campaign_id').eq('id', id).single();
  if (!prop) { res.status(404).json({ message: 'Proposal not found' }); return; }
  const { data: camp } = await adminClient.from('campaigns').select('budget, deadline').eq('id', prop.campaign_id).single();
  if (!camp || !(camp.budget > 0) || !camp.deadline) {
    res.status(400).json({ message: 'Campaign brief incomplete. Brand must set budget and deadline first.' }); return;
  }

  const data = await callRpc(id, req.user!.userId, 'influencer', 'accepted', 'content_in_progress', 'start_content', null, res);
  if (data) res.json({ proposal: data });
}

export async function submitContent(req: AuthRequest, res: Response): Promise<void> {
  if (featureGate(res) || handleValidation(req, res)) return;
  const { id } = req.params;
  if (req.user!.role !== 'influencer') { res.status(403).json({ message: 'Creators only' }); return; }
  const { url, platform, notes } = req.body as { url: string; platform: string; notes?: string };
  const submission = { url, platform, notes: notes ?? null, submittedAt: new Date().toISOString() };

  const step1 = await callRpc(id, req.user!.userId, 'influencer', 'content_in_progress', 'submitted', 'submit_content', submission, res);
  if (!step1) return;

  const step2 = await callRpc(id, req.user!.userId, 'system', 'submitted', 'under_review', 'auto_advance_review', null, res, AUTO_APPROVE_HOURS);
  if (!step2) {
    // step1 committed; return it with a warning rather than failing
    res.json({ proposal: step1, warning: 'stuck_in_submitted' });
    return;
  }
  res.json({ proposal: step2 });
}

export async function approveContent(req: AuthRequest, res: Response): Promise<void> {
  if (featureGate(res) || handleValidation(req, res)) return;
  const { id } = req.params;
  if (req.user!.role !== 'brand') { res.status(403).json({ message: 'Brands only' }); return; }
  const data = await callRpc(id, req.user!.userId, 'brand', 'under_review', 'approved', 'approve', null, res);
  if (data) res.json({ proposal: data });
}

export async function requestRevision(req: AuthRequest, res: Response): Promise<void> {
  if (featureGate(res) || handleValidation(req, res)) return;
  const { id } = req.params;
  if (req.user!.role !== 'brand') { res.status(403).json({ message: 'Brands only' }); return; }
  const { category, severity, required_changes, notes } = req.body as {
    category: string; severity: string; required_changes: string[]; notes?: string;
  };
  const details = { category, severity, required_changes, notes: notes ?? null };
  const data = await callRpc(id, req.user!.userId, 'brand', 'under_review', 'content_in_progress', 'request_revision', details, res);
  if (data) res.json({ proposal: data });
}

export async function sendFeedback(req: AuthRequest, res: Response): Promise<void> {
  if (featureGate(res) || handleValidation(req, res)) return;
  const { id } = req.params;
  if (req.user!.role !== 'brand') { res.status(403).json({ message: 'Brands only' }); return; }
  const { category, severity, required_changes, notes } = req.body as {
    category: string; severity: string; required_changes: string[]; notes?: string;
  };
  // feedback = log only, no stage transition
  const { error } = await adminClient.from('proposal_activity_log').insert({
    proposal_id: id,
    actor_id: req.user!.userId,
    actor_role: 'brand',
    action: 'feedback',
    from_stage: null,
    to_stage: null,
    details: { category, severity, required_changes, notes: notes ?? null },
  });
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json({ ok: true });
}

export async function markPaymentPending(req: AuthRequest, res: Response): Promise<void> {
  if (featureGate(res) || handleValidation(req, res)) return;
  const { id } = req.params;
  if (!req.user!.isAdmin) { res.status(403).json({ message: 'Admin only' }); return; }
  const { transaction_ref } = req.body as { transaction_ref: string };
  const data = await callRpc(id, req.user!.userId, 'admin', 'approved', 'payment_pending', 'mark_payment_pending', { transaction_ref }, res);
  if (data) res.json({ proposal: data });
}

export async function releasePayment(req: AuthRequest, res: Response): Promise<void> {
  if (featureGate(res) || handleValidation(req, res)) return;
  const { id } = req.params;
  if (!req.user!.isAdmin) { res.status(403).json({ message: 'Admin only' }); return; }
  const { transaction_ref } = req.body as { transaction_ref: string };
  const data = await callRpc(id, req.user!.userId, 'admin', 'payment_pending', 'payment_released', 'release_payment', { transaction_ref }, res);
  if (data) res.json({ proposal: data });
}

export async function rejectWorkflow(req: AuthRequest, res: Response): Promise<void> {
  if (featureGate(res) || handleValidation(req, res)) return;
  const { id } = req.params;
  if (req.user!.role !== 'brand') { res.status(403).json({ message: 'Brands only' }); return; }
  const { current_stage } = req.body as { current_stage: string };
  const data = await callRpc(id, req.user!.userId, 'brand', current_stage, 'rejected_workflow', 'reject_workflow', null, res);
  if (data) res.json({ proposal: data });
}
