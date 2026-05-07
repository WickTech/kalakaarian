import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM || 'Kalakaarian <noreply@kalakaarian.com>';

let client: Resend | null = null;
function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export const sendOtpEmail = async (to: string, otp: string): Promise<void> => {
  const r = getClient();
  if (!r) return;
  await r.emails.send({
    from: FROM,
    to,
    subject: 'Your Kalakaarian login code',
    html: `<p>Your one-time login code is: <strong style="font-size:24px;letter-spacing:4px">${otp}</strong></p><p>Expires in 10 minutes. Do not share this code.</p>`,
  });
};

export const sendWelcomeEmail = async (to: string, name: string, role: string): Promise<void> => {
  const r = getClient();
  if (!r) return;
  const isInfluencer = role === 'influencer';
  await r.emails.send({
    from: FROM,
    to,
    subject: `Welcome to Kalakaarian, ${name}!`,
    html: `<h2>Welcome, ${name}!</h2><p>Your ${isInfluencer ? 'influencer' : 'brand'} account is ready.</p>${isInfluencer ? '<p>Complete your profile to start appearing in brand searches.</p>' : '<p>Create your first campaign to start collaborating with influencers.</p>'}`,
  });
};

export const sendMembershipInvoice = async (
  to: string,
  name: string,
  tier: string,
  expiresAt: Date
): Promise<void> => {
  const r = getClient();
  if (!r) return;
  const tierPrices: Record<string, number> = { silver: 499, gold: 999 };
  const price = tierPrices[tier] ?? 0;
  await r.emails.send({
    from: FROM,
    to,
    subject: `Kalakaarian ${tier.charAt(0).toUpperCase() + tier.slice(1)} membership — receipt`,
    html: `<h2>Membership activated</h2><table style="border-collapse:collapse"><tr><td style="padding:4px 12px">Plan</td><td style="padding:4px 12px"><strong>${tier}</strong></td></tr><tr><td style="padding:4px 12px">Amount</td><td style="padding:4px 12px">₹${price}</td></tr><tr><td style="padding:4px 12px">Expires</td><td style="padding:4px 12px">${expiresAt.toDateString()}</td></tr></table><p>Thanks, ${name}!</p>`,
  });
};

export const sendWithdrawalRequestEmail = async (
  influencerName: string,
  influencerEmail: string,
  amount: number,
  upiId: string
): Promise<void> => {
  const r = getClient();
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@kalakaarian.com';
  if (!r) return;
  await r.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `Withdrawal request — ₹${amount} from ${influencerName}`,
    html: `<h2>Withdrawal Request</h2><table style="border-collapse:collapse"><tr><td style="padding:4px 12px">Influencer</td><td style="padding:4px 12px"><strong>${influencerName}</strong></td></tr><tr><td style="padding:4px 12px">Email</td><td style="padding:4px 12px">${influencerEmail}</td></tr><tr><td style="padding:4px 12px">Amount</td><td style="padding:4px 12px">₹${amount}</td></tr><tr><td style="padding:4px 12px">UPI ID</td><td style="padding:4px 12px"><strong>${upiId}</strong></td></tr></table><p>Please process within 5–7 business days.</p>`,
  });
};

export const sendProposalStatusEmail = async (
  to: string,
  name: string,
  campaignTitle: string,
  status: 'accepted' | 'rejected'
): Promise<void> => {
  const r = getClient();
  if (!r) return;
  const accepted = status === 'accepted';
  await r.emails.send({
    from: FROM,
    to,
    subject: `Your proposal was ${status} — ${campaignTitle}`,
    html: `<h2>Proposal ${accepted ? 'Accepted 🎉' : 'Update'}</h2><p>Hi ${name},</p><p>Your proposal for <strong>${campaignTitle}</strong> has been <strong>${status}</strong>.</p>${accepted ? '<p>The brand will reach out shortly with next steps.</p>' : ''}`,
  });
};
