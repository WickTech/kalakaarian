// Platform commercial margin applied to brand-facing prices.
// Stored prices are the raw influencer ask; we multiply by (1 + margin) on read.
export const PLATFORM_MARGIN_RATE = 0.05;

type Pricing = {
  story?: number;
  reel?: number;
  video?: number;
  post?: number;
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
  };
};
