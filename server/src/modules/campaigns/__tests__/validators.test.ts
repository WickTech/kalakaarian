import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCampaignSchema, updateCampaignSchema } from '../validators';

test('createCampaignSchema accepts a minimal valid payload', () => {
  const r = createCampaignSchema.safeParse({ title: 'Summer push', description: 'Reels' });
  assert.equal(r.success, true);
});

test('createCampaignSchema rejects missing title', () => {
  const r = createCampaignSchema.safeParse({ description: 'Reels' });
  assert.equal(r.success, false);
});

test('createCampaignSchema rejects empty description', () => {
  const r = createCampaignSchema.safeParse({ title: 'X', description: '' });
  assert.equal(r.success, false);
});

test('createCampaignSchema coerces a string budget to a number', () => {
  const r = createCampaignSchema.safeParse({ title: 'X', description: 'Y', budget: '5000' });
  assert.equal(r.success, true);
  assert.equal(r.success && r.data.budget, 5000);
});

test('createCampaignSchema accepts a null budget', () => {
  const r = createCampaignSchema.safeParse({ title: 'X', description: 'Y', budget: null });
  assert.equal(r.success, true);
  assert.equal(r.success && r.data.budget, null);
});

test('createCampaignSchema accepts genre and platform arrays', () => {
  const r = createCampaignSchema.safeParse({
    title: 'X',
    description: 'Y',
    genre: ['fashion', 'beauty'],
    platform: ['instagram'],
  });
  assert.equal(r.success, true);
});

test('updateCampaignSchema accepts an empty payload (all fields optional)', () => {
  const r = updateCampaignSchema.safeParse({});
  assert.equal(r.success, true);
});

test('updateCampaignSchema accepts a valid status', () => {
  const r = updateCampaignSchema.safeParse({ status: 'closed' });
  assert.equal(r.success, true);
});

test('updateCampaignSchema rejects an unknown status', () => {
  const r = updateCampaignSchema.safeParse({ status: 'paused' });
  assert.equal(r.success, false);
});
