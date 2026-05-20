// Centralized TanStack Query key factory. Hierarchical so partial
// invalidation cascades (e.g. invalidating keys.campaignCreators.all
// invalidates every list and detail under it).
//
// Convention follows tkdodo's QueryKey-factory pattern:
//   <domain>.all                       — root for the whole domain
//   <domain>.lists()                   — root for every list view
//   <domain>.list(params)              — a specific list
//   <domain>.details()                 — root for every detail view
//   <domain>.detail(id)                — a specific detail
//
// All keys are `as const` so TS infers tuple literal types — TanStack
// Query then knows the exact shape at each call site.

export const keys = {
  campaigns: {
    all:        ['campaigns'] as const,
    lists:      () => [...keys.campaigns.all, 'list'] as const,
    list:       (params?: Record<string, unknown>) =>
                  params
                    ? [...keys.campaigns.lists(), params] as const
                    : keys.campaigns.lists(),
    byBrand:    () => ['brand-campaigns'] as const,
    history:    () => ['brand-campaign-history'] as const,
    tierCounts: () => ['tier-counts'] as const,
    details:    () => [...keys.campaigns.all, 'detail'] as const,
    detail:     (id: string) => [...keys.campaigns.details(), id] as const,
    influencers:(campaignId: string) =>
                  ['campaign-influencers', campaignId] as const,
    videosAdmin:(campaignId: string) =>
                  ['campaign-videos-admin', campaignId] as const,
  },

  campaignCreators: {
    all:        ['campaign-creators'] as const,
    my:         () => ['my-proposals'] as const,
    byCampaign: (campaignId: string) =>
                  ['campaign-proposals-track', campaignId] as const,
    rating:     (campaignCreatorId: string) =>
                  ['campaign-creator-rating', campaignCreatorId] as const,
  },

  workflow: {
    all:       ['workflow'] as const,
    detail:    (id: string) => ['workflow', id] as const,
    activity:  (id: string) => ['activityLog', id] as const,
    public:    (id: string) => ['publicWorkflow', id] as const,
  },

  creators: {
    all:         ['creators'] as const,
    marketplace: (params: Record<string, unknown>) =>
                   ['marketplace', params] as const,
    similar:     (id: string) => ['similar-influencers', id] as const,
    recommended: () => ['recommended-creators'] as const,
    risingStars: () => ['rising-stars'] as const,
    profile:     (id: string | undefined) =>
                   ['influencer-profile', id] as const,
    profileOwn:  () => ['influencer-profile-own'] as const,
    ratings:     (id: string) => ['influencer-ratings', id] as const,
    socialStats: (id: string, userId: string | undefined) =>
                   ['social-stats', id, userId] as const,
    publicBadges:(id: string) => ['public-badges', id] as const,
  },

  brand: {
    profile:           () => ['brand-profile'] as const,
    publicProfile:     (id: string | undefined) =>
                         ['brand-public', id] as const,
    analytics:         () => ['brand-analytics'] as const,
    deepAnalytics:     () => ['brand-deep-analytics'] as const,
    transactions:      (filters?: Record<string, unknown>) =>
                         filters
                           ? ['brand-transactions', filters] as const
                           : ['brand-transactions'] as const,
    transactionFilters:() => ['brand-transaction-filters'] as const,
    recommendedCampaigns: () => ['recommended-campaigns'] as const,
  },

  account: {
    preferences: () => ['account-preferences'] as const,
  },

  analytics: {
    influencer:      () => ['influencer-analytics'] as const,
    influencerDeep:  () => ['influencer-deep-analytics'] as const,
    monthly:         () => ['monthly-analytics'] as const,
  },

  gamification: {
    influencer: () => ['gamification-influencer'] as const,
  },

  platforms: {
    connected: () => ['connected-platforms'] as const,
    metrics:   (platform: string) => ['platform-metrics', platform] as const,
  },

  wallet: {
    transactions: () => ['wallet-transactions'] as const,
  },

  membership: {
    status: () => ['membership-status'] as const,
  },

  notifications: {
    all: () => ['notifications'] as const,
  },
} as const;

export type QueryKeyFactory = typeof keys;
