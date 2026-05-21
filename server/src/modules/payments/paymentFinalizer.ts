import * as repo from './repository';
import * as fin from './finalizerRepo';
import type { CartSnapshotItem } from './types';

// Post-payment finalize: persist transactions, attach creators to the campaign
// at the START of the delivery workflow, stamp the delivery window, notify the
// selected creators, and clear the cart. Called from the Razorpay webhook AND
// from the checkout bypass branch when Razorpay is not configured.
//
// Escrow model: the brand's payment is recorded here, but each creator enters
// at workflow_stage 'accepted' (not 'payment_released'). The creator can start
// content immediately; the payout is released later, after the brand approves
// the work (approved -> payment_pending -> payment_released, admin-driven).
export async function finalizeCartPayment(
  brandId: string,
  campaignId: string | null,
  snapshot: CartSnapshotItem[],
  paymentRef: string,
  razorpayOrderId: string | null,
): Promise<void> {
  const nowIso = new Date().toISOString();

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

    // Brand-paid checkout is the sole way a campaign_creators row appears.
    // A new row enters the workflow at 'accepted' so the creator can begin
    // content right away. An existing row is left untouched (re-checkout).
    const existing = await repo.findCampaignCreator(item.influencer_id, campaignId);
    if (existing) continue;

    const ccRow = await repo.insertCampaignCreator({
      campaign_id: campaignId,
      influencer_id: item.influencer_id,
      agreed_price: item.price,
      status: 'accepted',
      workflow_stage: 'accepted',
      workflow_stage_updated_at: nowIso,
      transaction_ref: paymentRef,
    });
    if (ccRow) {
      await fin.insertActivityLog({
        campaign_creator_id: ccRow.id,
        actor_id: null,
        actor_role: 'system',
        action: 'campaign_started',
        from_stage: null,
        to_stage: 'accepted',
        details: { transaction_ref: paymentRef, razorpay_order_id: razorpayOrderId },
      });
    }
  }

  if (campaignId) {
    const newIds = Array.from(new Set(snapshot.map((s) => s.influencer_id)));

    // Attach creators to the campaign workflow so the brand UI lists them.
    const wf = await repo.getCampaignWorkflow(campaignId);
    if (wf) {
      const merged = Array.from(new Set([...(wf.selected_creators ?? []), ...newIds]));
      await repo.updateWorkflowSelectedCreators(wf.id, merged);
    } else {
      await repo.insertCampaignWorkflow(campaignId, newIds);
    }

    // Start the delivery timeline (first checkout only) — 48h window.
    await fin.startCampaignDelivery(campaignId);

    // Notify every selected creator so they can start working.
    const meta = await fin.getCampaignBasics(campaignId);
    const title = meta?.title ?? 'a campaign';
    const brandName = meta?.brand_name ?? 'A brand';
    await fin.insertNotifications(
      newIds.map((influencerId) => ({
        user_id: influencerId,
        type: 'campaign',
        title: "You've been selected for a campaign 🎉",
        body: `${brandName} selected you for "${title}". Open My Campaigns to start creating.`,
        data: { link: '/campaigns', campaignId },
      })),
    );
  }

  await repo.deleteCartScoped(brandId, campaignId);
}
