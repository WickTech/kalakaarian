// Audience Authenticity Score (0-100). Free heuristic — branded for users as
// "Audience Authenticity" not "fake follower %". Inputs are derived directly from
// platform APIs (no third-party service required).

export interface ScoreInput {
  followers: number | null;
  reach28d: number | null;
  avgLikes: number | null;
  avgComments: number | null;
  audienceCountry: Record<string, number> | null;     // country → share (0-1)
  audienceGenderAge: Record<string, number> | null;   // bucket → share (0-1)
}

export function computeAuthenticityScore(input: ScoreInput): number | null {
  const { followers, reach28d, avgLikes, avgComments, audienceCountry, audienceGenderAge } = input;
  if (!followers || followers < 100) return null;

  // 1. Reach rate — 40%. Healthy creators have reach > 30% of followers / 28d.
  const reachRate = reach28d != null ? Math.min(reach28d / followers, 1) : null;
  const reachComponent = reachRate != null ? clamp01(reachRate / 0.3) : 0.5;

  // 2. Engagement — 30%. Tiered: large accounts naturally drop below 1%.
  const er = ((avgLikes ?? 0) + (avgComments ?? 0)) / followers;
  let erComponent: number;
  if (followers > 500_000) erComponent = clamp01(er / 0.005);    // 0.5% = full
  else if (followers > 100_000) erComponent = clamp01(er / 0.01); // 1% = full
  else erComponent = clamp01(er / 0.03);                          // 3% = full

  // 3. Country distribution — 20%. Purchased followers cluster in one country.
  let countryComponent = 0.5;
  if (audienceCountry && Object.keys(audienceCountry).length > 0) {
    const topShare = Math.max(...Object.values(audienceCountry));
    // <60% = healthy concentration; >85% = suspicious mono-region
    countryComponent = clamp01((0.9 - topShare) / 0.3);
  }

  // 4. Demographic data quality — 10%. Bots have no gender/age data.
  let demoComponent = 0;
  if (audienceGenderAge && Object.keys(audienceGenderAge).length > 0) {
    const total = Object.values(audienceGenderAge).reduce((a, b) => a + b, 0);
    demoComponent = clamp01(total); // closer to 1 = more complete data
  }

  const score = reachComponent * 40 + erComponent * 30 + countryComponent * 20 + demoComponent * 10;
  return Math.round(clamp(score, 0, 100));
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function clamp01(n: number): number {
  return clamp(n, 0, 1);
}
