import { adminClient } from '../config/supabase';

const GOLD_THRESHOLD = 10;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const AUTO_PAYMENT_ID = 'auto:referral-gold-reward';

export const checkAndGrantGoldReward = async (buyerUserId: string): Promise<void> => {
  // 1. Was this buyer referred?
  const { data: referral } = await adminClient.from('referrals').select('referrer_id').eq('referred_id', buyerUserId).single();
  if (!referral?.referrer_id) return;
  const referrerId = referral.referrer_id;

  // 2. Get all users referred by this referrer
  const { data: referred } = await adminClient.from('referrals').select('referred_id').eq('referrer_id', referrerId);
  const referredIds = (referred ?? []).map((r: { referred_id: string }) => r.referred_id).filter(Boolean);
  if (referredIds.length < GOLD_THRESHOLD) return;

  // 3. Count how many hold active Gold
  const now = new Date().toISOString();
  const { count: goldCount } = await adminClient.from('memberships')
    .select('id', { count: 'exact', head: true })
    .in('user_id', referredIds)
    .eq('tier', 'gold')
    .eq('status', 'active')
    .gt('ends_at', now);
  if ((goldCount ?? 0) < GOLD_THRESHOLD) return;

  // 4. Idempotency: skip if already rewarded
  const { data: existing } = await adminClient.from('memberships')
    .select('id')
    .eq('user_id', referrerId)
    .eq('tier', 'gold')
    .eq('payment_id', AUTO_PAYMENT_ID)
    .gt('ends_at', now)
    .single();
  if (existing) return;

  // 5. Grant 1-year Gold
  const endsAt = new Date(Date.now() + ONE_YEAR_MS).toISOString();
  await adminClient.from('memberships').insert({
    user_id: referrerId,
    tier: 'gold',
    status: 'active',
    starts_at: new Date().toISOString(),
    ends_at: endsAt,
    auto_renew: false,
    payment_id: AUTO_PAYMENT_ID,
  });
};
