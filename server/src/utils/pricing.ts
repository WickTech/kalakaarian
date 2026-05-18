// Platform commercial margin applied to brand-facing prices.
// Stored prices are the raw influencer ask; we multiply by (1 + margin) on read.
export const PLATFORM_MARGIN_RATE = 0.05;

// Additional platform fee charged at checkout (on top of margin-inclusive prices).
export const PLATFORM_FEE_RATE = 0.08;

// GST rate applied on (subtotal + platform fee) for Indian regulatory compliance.
export const GST_RATE = 0.18;

// Creator commercial fee applied on top of raw influencer ask for commercial/branded content.
export const CREATOR_COMMERCIAL_RATE = 0.05;

type Pricing = {
  story?: number;
  reel?: number;
  video?: number;
  post?: number;
  shorts?: number;
} | undefined | null;

const markup = (n?: number) =>
  typeof n === 'number' && Number.isFinite(n)
    ? Math.round(n * (1 + PLATFORM_MARGIN_RATE))
    : undefined;

/**
 * Returns the brand-facing pricing object with the platform margin applied.
 * Leaves the raw stored values untouched.
 */
export const applyPlatformMargin = (pricing: Pricing) => {
  if (!pricing) return undefined;
  return {
    story: markup(pricing.story),
    reel: markup(pricing.reel),
    video: markup(pricing.video),
    post: markup(pricing.post),
    shorts: markup(pricing.shorts),
  };
};
