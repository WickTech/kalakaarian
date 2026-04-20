import Referral from '../models/Referral';
import Membership from '../models/Membership';

const GOLD_THRESHOLD = 10;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const AUTO_PAYMENT_ID = 'auto:referral-gold-reward';

/**
 * Trigger on Gold-tier purchase by a buyer. If the buyer was referred,
 * check whether the referrer has now reached the Gold-referral threshold
 * (>= 10 referred users who own an active Gold membership). If so, grant
 * the referrer a 1-year free Gold membership. Idempotent.
 */
export const checkAndGrantGoldReward = async (buyerUserId: string): Promise<void> => {
  // 1. Was this buyer referred by anyone?
  const referral = await Referral.findOne({ referredId: buyerUserId });
  if (!referral) return;
  const referrerId = referral.referrerId;
  if (!referrerId) return;

  // 2. Count how many of this referrer's referred users hold a Gold membership.
  const referrerReferrals = await Referral.find({ referrerId }).select('referredId');
  const referredIds = referrerReferrals.map((r) => r.referredId).filter(Boolean);
  if (referredIds.length < GOLD_THRESHOLD) return;

  const goldCount = await Membership.countDocuments({
    influencerId: { $in: referredIds },
    tier: 'gold',
    endDate: { $gt: new Date() },
  });
  if (goldCount < GOLD_THRESHOLD) return;

  // 3. Idempotency: skip if referrer already has an active auto-granted Gold reward.
  const existing = await Membership.findOne({
    influencerId: referrerId,
    tier: 'gold',
    paymentId: AUTO_PAYMENT_ID,
    endDate: { $gt: new Date() },
  });
  if (existing) return;

  // 4. Grant / extend the referrer's Gold membership for one year.
  await Membership.findOneAndUpdate(
    { influencerId: referrerId },
    {
      influencerId: referrerId,
      tier: 'gold',
      startDate: new Date(),
      endDate: new Date(Date.now() + ONE_YEAR_MS),
      autoRenew: false,
      paymentId: AUTO_PAYMENT_ID,
    },
    { upsert: true, new: true }
  );
};
