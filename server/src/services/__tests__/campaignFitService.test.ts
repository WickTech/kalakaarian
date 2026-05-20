import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeCampaignFit, FitCampaign, FitCreator } from '../campaignFitService';

const campaign: FitCampaign = {
  niches: ['Fashion', 'Beauty'],
  platforms: ['instagram'],
  budget: 10_000,
};

test('a perfect match scores 100', () => {
  const creator: FitCreator = {
    niches: ['Fashion', 'Beauty'],
    platforms: ['instagram'],
    minPrice: 5_000,
    avgRating: 5,
  };
  assert.equal(computeCampaignFit(campaign, creator).score, 100);
});

test('a total mismatch scores low', () => {
  const creator: FitCreator = {
    niches: ['Gaming'],
    platforms: ['youtube'],
    minPrice: 50_000,
    avgRating: 1,
  };
  const { score } = computeCampaignFit(campaign, creator);
  assert.ok(score < 30, `expected < 30, got ${score}`);
});

test('partial niche coverage scales the niche component', () => {
  const creator: FitCreator = {
    niches: ['Fashion'], // 1 of 2 wanted
    platforms: ['instagram'],
    minPrice: 5_000,
    avgRating: 5,
  };
  assert.equal(computeCampaignFit(campaign, creator).breakdown.niche, 0.5);
});

test('niche matching is case-insensitive', () => {
  const creator: FitCreator = {
    niches: ['fashion', 'BEAUTY'],
    platforms: ['instagram'],
    minPrice: 5_000,
    avgRating: 5,
  };
  assert.equal(computeCampaignFit(campaign, creator).breakdown.niche, 1);
});

test('a creator over budget scores the budget component below 1', () => {
  const creator: FitCreator = {
    niches: ['Fashion', 'Beauty'],
    platforms: ['instagram'],
    minPrice: 20_000, // 2x the 10k budget
    avgRating: 5,
  };
  assert.equal(computeCampaignFit(campaign, creator).breakdown.budget, 0.5);
});

test('unknown budget / price / rating score neutral (0.5)', () => {
  const noBudgetCampaign: FitCampaign = { niches: [], platforms: [], budget: null };
  const creator: FitCreator = { niches: [], platforms: [], minPrice: null, avgRating: null };
  const { breakdown } = computeCampaignFit(noBudgetCampaign, creator);
  assert.equal(breakdown.niche, 0.5);
  assert.equal(breakdown.platform, 0.5);
  assert.equal(breakdown.budget, 0.5);
  assert.equal(breakdown.rating, 0.5);
});
