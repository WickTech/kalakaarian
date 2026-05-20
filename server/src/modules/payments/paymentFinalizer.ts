import * as repo from './repository';
import type { CartSnapshotItem } from './types';

// Post-payment finalize: persist transactions, attach creators to the campaign
// workflow, transition the workflow stage, and clear the cart. Called from the
// Razorpay webhook AND from the checkout bypass branch when Razorpay is not
// configured, so the brand still sees creators on their campaign after the
// local "free checkout" path.
export async function finalizeCartPayment(
  brandId: string,
  campaignId: string | null,
  snapshot: CartSnapshotItem[],
  paymentRef: string,
  razorpayOrderId: string | null,
): Promise<void> {
  for (const item of snapshot) {
    await repo.insertTransaction({
      brand_id: brandId,
      influencer_id: item.influencer_id,
      campaign_id: campaignId,
      amount: item.price,
      status: 'completed',
      payment_method: 'razorpay',
      transaction_id: paymentRef,
    });

    if (!campaignId) continue;

    // Find existing row, or create one — brand-paid checkout is now the sole
    // way a campaign_creators row appears. New rows enter at 'approved' so the
    // next transitions are payment_pending -> payment_released.
    let ccRow = await repo.findCampaignCreator(item.influencer_id, campaignId);
    if (!ccRow) {
      ccRow = await repo.insertCampaignCreator({
        campaign_id: campaignId,
        influencer_id: item.influencer_id,
        agreed_price: item.price,
        status: 'accepted',
        workflow_stage: 'approved',
        workflow_stage_updated_at: new Date().toISOString(),
      });
    }

    if (ccRow) {
      const rpcBase = {
        p_campaign_creator_id: ccRow.id,
        p_actor_id: null as unknown as string,
        p_actor_role: 'system',
        p_details: { transaction_ref: paymentRef, razorpay_order_id: razorpayOrderId } as Record<string, unknown>,
        p_auto_approve_hours: 72,
      };
      if (ccRow.workflow_stage === 'approved') {
        await repo.transitionWorkflowStage({
          ...rpcBase, p_expected_stage: 'approved', p_to_stage: 'payment_pending', p_action: 'mark_payment_pending',
        });
      }
      await repo.transitionWorkflowStage({
        ...rpcBase, p_expected_stage: 'payment_pending', p_to_stage: 'payment_released', p_action: 'release_payment',
      });
    }
  }

  // Attach creators to the campaign workflow so the brand UI lists them.
  if (campaignId) {
    const newIds = Array.from(new Set(snapshot.map((s) => s.influencer_id)));
    const wf = await repo.getCampaignWorkflow(campaignId);
    if (wf) {
      const merged = Array.from(new Set([...(wf.selected_creators ?? []), ...newIds]));
      await repo.updateWorkflowSelectedCreators(wf.id, merged);
    } else {
      await repo.insertCampaignWorkflow(campaignId, newIds);
    }
  }

  await repo.deleteCartScoped(brandId, campaignId);
}
