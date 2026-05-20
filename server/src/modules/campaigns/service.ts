import * as repo from './repository';
import { formatInfluencer } from '../influencers/format';
import type {
  CreateCampaignInput,
  UpdateCampaignInput,
  ListCampaignsQuery,
  Pagination,
} from './types';

// Business logic for the campaigns domain. No Express types here — handlers
// in controller.ts adapt HTTP to these calls.

export async function listCampaigns(
  brandId: string,
  query: ListCampaignsQuery,
): Promise<{ campaigns: unknown[]; pagination: Pagination }> {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const from = (page - 1) * limit;
  const { rows, count } = await repo.listByBrand(
    brandId,
    { status: query.status, genre: query.genre, platform: query.platform },
    { from, to: from + limit - 1 },
  );
  return {
    campaigns: rows,
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
  };
}

export function getCampaign(id: string): Promise<unknown | null> {
  return repo.findById(id);
}

export function createCampaign(brandId: string, input: CreateCampaignInput): Promise<unknown | null> {
  return repo.insert({
    brand_id: brandId,
    title: input.title,
    description: input.description || '',
    niches: input.genre || [],
    platforms: input.platform || [],
    budget: input.budget || null,
    deadline: input.deadline || null,
    requirements: input.requirements || '',
    status: 'open',
  });
}

export function updateCampaign(
  id: string,
  brandId: string,
  input: UpdateCampaignInput,
): Promise<unknown | null> {
  const patch: Record<string, unknown> = {};
  if (input.title) patch.title = input.title;
  if (input.description) patch.description = input.description;
  if (input.genre) patch.niches = input.genre;
  if (input.platform) patch.platforms = input.platform;
  if (input.budget) patch.budget = input.budget;
  if (input.deadline) patch.deadline = input.deadline;
  if (input.requirements !== undefined) patch.requirements = input.requirements;
  if (input.status) patch.status = input.status;
  return repo.updateOwned(id, brandId, patch);
}

export function deleteCampaign(id: string, brandId: string): Promise<boolean> {
  return repo.deleteOwned(id, brandId);
}

export async function getCampaignInfluencers(
  campaignId: string,
  brandId: string,
): Promise<Record<string, unknown>[]> {
  const [txRows, cartRows] = await Promise.all([
    repo.listCampaignTransactions(campaignId, brandId),
    repo.listCampaignCartItems(campaignId, brandId),
  ]);

  const paidMap = new Map<string, number>();
  for (const r of txRows) paidMap.set(r.influencer_id, r.amount);

  const pendingMap = new Map<string, number>();
  for (const r of cartRows) {
    if (!paidMap.has(r.influencer_id)) pendingMap.set(r.influencer_id, r.price);
  }

  const allIds = [...paidMap.keys(), ...pendingMap.keys()];
  if (!allIds.length) return [];

  const profiles = await repo.listInfluencerProfiles(allIds);
  return profiles.map((row) => {
    const id = row.id as string;
    return {
      ...formatInfluencer(row),
      cartPrice: paidMap.get(id) ?? pendingMap.get(id) ?? 0,
      paymentStatus: paidMap.has(id) ? 'paid' : 'pending',
    };
  });
}
