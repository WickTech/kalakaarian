import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeAuthenticityScore } from '../authenticityScoreService';

test('null short-circuit when followers < 100', () => {
  assert.equal(
    computeAuthenticityScore({
      followers: 50, reach28d: 30, avgLikes: 5, avgComments: 1,
      audienceCountry: { IN: 0.8 }, audienceGenderAge: { 'F.25-34': 0.5 },
    }),
    null,
  );
});

test('null short-circuit when followers null', () => {
  assert.equal(
    computeAuthenticityScore({
      followers: null, reach28d: null, avgLikes: null, avgComments: null,
      audienceCountry: null, audienceGenderAge: null,
    }),
    null,
  );
});

test('healthy nano creator scores high', () => {
  const score = computeAuthenticityScore({
    followers: 10_000,
    reach28d: 4_000,                 // 40% reach — above 30% target
    avgLikes: 400, avgComments: 20,  // 4.2% ER — above 3% target
    audienceCountry: { IN: 0.55, US: 0.2, GB: 0.15, AE: 0.1 },
    audienceGenderAge: { 'F.18-24': 0.4, 'M.25-34': 0.4, 'F.25-34': 0.2 },
  });
  assert.ok(score != null);
  assert.ok(score >= 85, `expected >= 85, got ${score}`);
});

test('bot signature returns low score', () => {
  // hallmarks: very low reach, near-zero engagement, single-country audience, no demo data
  const score = computeAuthenticityScore({
    followers: 100_000,
    reach28d: 2_000,         // 2% reach (target 30%)
    avgLikes: 5, avgComments: 0,  // 0.005% ER
    audienceCountry: { IN: 0.98 },
    audienceGenderAge: null,
  });
  assert.ok(score != null);
  assert.ok(score <= 20, `expected <= 20, got ${score}`);
});

test('engagement tier scales with follower count', () => {
  const erRaw = 0.005; // 0.5% ER
  const nano = computeAuthenticityScore({
    followers: 10_000, reach28d: 3_000,
    avgLikes: 10_000 * erRaw, avgComments: 0,
    audienceCountry: { IN: 0.6 }, audienceGenderAge: { x: 1 },
  });
  const celeb = computeAuthenticityScore({
    followers: 1_000_000, reach28d: 300_000,
    avgLikes: 1_000_000 * erRaw, avgComments: 0,
    audienceCountry: { IN: 0.6 }, audienceGenderAge: { x: 1 },
  });
  // same raw ER: celeb threshold (0.5%) treats it as full, nano (3%) does not.
  assert.ok(celeb! > nano!, `celeb (${celeb}) should outscore nano (${nano}) at same ER`);
});

test('missing demo data caps score below 100', () => {
  const score = computeAuthenticityScore({
    followers: 10_000, reach28d: 5_000,
    avgLikes: 500, avgComments: 50,
    audienceCountry: { IN: 0.3, US: 0.3, GB: 0.2, AE: 0.2 },
    audienceGenderAge: null,
  });
  assert.ok(score != null);
  assert.ok(score < 100);
});

test('return value is integer in [0, 100]', () => {
  for (let i = 0; i < 20; i++) {
    const score = computeAuthenticityScore({
      followers: Math.floor(Math.random() * 1_000_000) + 200,
      reach28d: Math.floor(Math.random() * 500_000),
      avgLikes: Math.floor(Math.random() * 10_000),
      avgComments: Math.floor(Math.random() * 500),
      audienceCountry: { IN: Math.random() },
      audienceGenderAge: { x: Math.random() },
    });
    if (score == null) continue;
    assert.equal(Number.isInteger(score), true);
    assert.ok(score >= 0 && score <= 100);
  }
});
