// Input guards for the admin module.

const CAMPAIGN_STATUSES = ['open', 'closed', 'archived'];

export const isValidCampaignStatus = (s: unknown): s is string =>
  typeof s === 'string' && CAMPAIGN_STATUSES.includes(s);
