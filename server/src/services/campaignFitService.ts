// Campaign-fit scoring (Phase 7). A pure, deterministic 0-100 heuristic that
// ranks how well a creator matches a campaign. No external services — same
// philosophy as authenticityScoreService.

export interface FitCampaign {
  niches: string[];
  platforms: string[];
  budget: number | null;
}

export interface FitCreator {
  niches: string[];
  platforms: string[];
  minPrice: number | null; // creator's cheapest content price
  avgRating: number | null; // 0-5
}

export interface FitResult {
  score: number; // 0-100
  breakdown: {
    niche: number; // 0-1 component scores
    platform: number;
    budget: number;
    rating: number;
  };
}

// Component weights — must sum to 1.
const WEIGHTS = { niche: 0.35, platform: 0.25, budget: 0.2, rating: 0.2 };

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

// Fraction of the campaign's wanted values that the creator covers. A campaign
// with no requirement for a dimension scores neutral (0.5) there.
const coverage = (wanted: string[], have: string[]): number => {
  if (wanted.length === 0) return 0.5;
  const haveSet = new Set(have.map((v) => v.toLowerCase()));
  const matched = wanted.filter((w) => haveSet.has(w.toLowerCase())).length;
  return clamp01(matched / wanted.length);
};

export function computeCampaignFit(campaign: FitCampaign, creator: FitCreator): FitResult {
  const niche = coverage(campaign.niches ?? [], creator.niches ?? []);
  const platform = coverage(campaign.platforms ?? [], creator.platforms ?? []);

  // Budget: the creator is affordable when their cheapest content price fits
  // the campaign budget. Unknown budget or price scores neutral.
  let budget = 0.5;
  if (campaign.budget != null && creator.minPrice != null && creator.minPrice > 0) {
    budget = campaign.budget >= creator.minPrice
      ? 1
      : clamp01(campaign.budget / creator.minPrice);
  }

  // Rating: 0-5 normalised. No ratings yet scores neutral.
  const rating = creator.avgRating != null ? clamp01(creator.avgRating / 5) : 0.5;

  const weighted =
    niche * WEIGHTS.niche +
    platform * WEIGHTS.platform +
    budget * WEIGHTS.budget +
    rating * WEIGHTS.rating;

  return {
    score: Math.round(weighted * 100),
    breakdown: { niche, platform, budget, rating },
  };
}
