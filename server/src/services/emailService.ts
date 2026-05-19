import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM || 'Kalakaarian <noreply@kalakaarian.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@kalakaarian.com';

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

export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  resetUrl: string
): Promise<void> => {
  const r = getClient();
  if (!r) return;
  const safeName = (name || 'there').replace(/[<>&"']/g, '');
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#0b0b0e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e8e6df">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0e;padding:32px 16px">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#15151a;border:1px solid #2a2a31;border-radius:14px;overflow:hidden">
      <tr><td style="padding:28px 32px;border-bottom:1px solid #2a2a31">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#FFB300;letter-spacing:0.5px">Kalakaarian</div>
      </td></tr>
      <tr><td style="padding:32px">
        <h1 style="margin:0 0 16px;font-size:22px;color:#e8e6df">Hi ${safeName},</h1>
        <p style="margin:0 0 16px;line-height:1.6;color:#cfcdc4">We received a request to reset your Kalakaarian account password.</p>
        <p style="margin:0 0 24px;line-height:1.6;color:#cfcdc4">Click the button below to create a new password:</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px">
          <tr><td style="background:#FFB300;border-radius:10px">
            <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;color:#0b0b0e;font-weight:700;text-decoration:none;font-size:15px">Reset Password</a>
          </td></tr>
        </table>
        <p style="margin:0 0 12px;line-height:1.6;color:#a8a69d;font-size:14px">This link will expire in <strong style="color:#cfcdc4">20 minutes</strong> for security reasons.</p>
        <p style="margin:0 0 12px;line-height:1.6;color:#a8a69d;font-size:14px">If you did not request a password reset, you can safely ignore this email. Your account will remain secure.</p>
        <p style="margin:0 0 24px;line-height:1.6;color:#a8a69d;font-size:14px">For security reasons, this link can only be used once.</p>
        <hr style="border:none;border-top:1px solid #2a2a31;margin:24px 0">
        <p style="margin:0;color:#8a887f;font-size:12px;word-break:break-all">If the button does not work, copy and paste this URL into your browser:<br><span style="color:#a8a69d">${resetUrl}</span></p>
      </td></tr>
      <tr><td style="padding:20px 32px;background:#0f0f13;color:#8a887f;font-size:12px;text-align:center">— Team Kalakaarian</td></tr>
    </table>
  </td></tr>
</table></body></html>`;
  const text = `Hi ${safeName},\n\nWe received a request to reset your Kalakaarian account password.\n\nReset link (expires in 20 minutes, single-use):\n${resetUrl}\n\nIf you did not request this, ignore this email.\n\n— Team Kalakaarian`;
  await r.emails.send({ from: FROM, to, subject: 'Reset your Kalakaarian password', html, text });
};

export const sendPasswordChangedEmail = async (
  to: string,
  name: string,
  ip: string,
  userAgent: string
): Promise<void> => {
  const r = getClient();
  if (!r) return;
  const safeName = (name || 'there').replace(/[<>&"']/g, '');
  const safeIp = (ip || 'unknown').replace(/[<>&"']/g, '');
  const safeUa = (userAgent || 'unknown').replace(/[<>&"']/g, '');
  await r.emails.send({
    from: FROM,
    to,
    subject: 'Your Kalakaarian password was changed',
    html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif"><h2>Password updated</h2><p>Hi ${safeName}, your Kalakaarian password was just changed.</p><p><strong>IP:</strong> ${safeIp}<br><strong>Device:</strong> ${safeUa}</p><p>If this was not you, reset your password immediately and contact support.</p><p>— Team Kalakaarian</p></div>`,
    text: `Hi ${safeName},\n\nYour Kalakaarian password was just changed.\nIP: ${safeIp}\nDevice: ${safeUa}\n\nIf this was not you, reset your password immediately and contact support.\n\n— Team Kalakaarian`,
  });
};

export const sendAdminAlertEmail = async (subject: string, body: string): Promise<void> => {
  const r = getClient();
  if (!r) return;
  await r.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `[Kalakaarian Admin] ${subject}`,
    html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
  });
};
