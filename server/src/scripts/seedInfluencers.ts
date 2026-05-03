import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

interface Influencer {
  name: string;
  email: string;
  username: string;
  password: string;
  bio: string;
  city: string;
  niches: string[];
  platforms: string[];
  tier: 'nano' | 'micro' | 'macro' | 'mega';
  gender: 'male' | 'female' | 'non_binary';
  followerCount: number;
  avatarSeed: string;
  pricing: { reel?: number; story?: number; video?: number; post?: number };
}

const INFLUENCERS: Influencer[] = [
  // ── Nano (1K–10K followers) ──────────────────────────────────────────
  {
    name: 'Priya Sharma',
    email: 'priya.sharma.nano@kalakaarian.test',
    username: 'priyasharma_style',
    password: 'Seed@1234',
    bio: 'Delhi-based fashion lover sharing daily OOTD inspo & sustainable clothing picks. Micro-budget, maximum impact.',
    city: 'Delhi',
    niches: ['fashion', 'lifestyle'],
    platforms: ['instagram'],
    tier: 'nano',
    gender: 'female',
    followerCount: 6800,
    avatarSeed: 'priya',
    pricing: { reel: 2500, story: 800, post: 1500 },
  },
  {
    name: 'Arjun Mehta',
    email: 'arjun.mehta.nano@kalakaarian.test',
    username: 'arjun_eats',
    password: 'Seed@1234',
    bio: 'Mumbai street food enthusiast. Reviews hidden gems, budget dhabas & local food spots around the city.',
    city: 'Mumbai',
    niches: ['food', 'lifestyle'],
    platforms: ['instagram', 'youtube'],
    tier: 'nano',
    gender: 'male',
    followerCount: 9200,
    avatarSeed: 'arjun',
    pricing: { reel: 3000, story: 1000, video: 5000, post: 2000 },
  },
  {
    name: 'Sneha Iyer',
    email: 'sneha.iyer.nano@kalakaarian.test',
    username: 'sneha_travels',
    password: 'Seed@1234',
    bio: 'Solo traveller from Chennai exploring offbeat South India. Weekend warriors & budget travel tips.',
    city: 'Chennai',
    niches: ['travel', 'lifestyle'],
    platforms: ['instagram'],
    tier: 'nano',
    gender: 'female',
    followerCount: 4500,
    avatarSeed: 'sneha',
    pricing: { reel: 2000, story: 600, post: 1200 },
  },

  // ── Micro (10K–100K followers) ───────────────────────────────────────
  {
    name: 'Rohan Kapoor',
    email: 'rohan.kapoor.micro@kalakaarian.test',
    username: 'rohan_fitlife',
    password: 'Seed@1234',
    bio: 'Certified fitness trainer & nutrition consultant from Pune. Home workouts, protein meal prep & body transformation journeys.',
    city: 'Pune',
    niches: ['fitness', 'health'],
    platforms: ['instagram', 'youtube'],
    tier: 'micro',
    gender: 'male',
    followerCount: 48000,
    avatarSeed: 'rohan',
    pricing: { reel: 12000, story: 4000, video: 20000, post: 8000 },
  },
  {
    name: 'Aisha Khan',
    email: 'aisha.khan.micro@kalakaarian.test',
    username: 'aisha_beautybox',
    password: 'Seed@1234',
    bio: 'Hyderabad-based beauty creator. Drugstore dupes, bridal makeup tutorials & honest skincare reviews for Indian skin tones.',
    city: 'Hyderabad',
    niches: ['beauty', 'fashion'],
    platforms: ['instagram', 'youtube'],
    tier: 'micro',
    gender: 'female',
    followerCount: 72000,
    avatarSeed: 'aisha',
    pricing: { reel: 18000, story: 6000, video: 30000, post: 12000 },
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh.micro@kalakaarian.test',
    username: 'vikram_techwalah',
    password: 'Seed@1234',
    bio: 'Bangalore-based tech reviewer. Honest unboxings, budget smartphone comparisons & app reviews in Hindi & English.',
    city: 'Bangalore',
    niches: ['tech', 'gadgets'],
    platforms: ['youtube', 'instagram'],
    tier: 'micro',
    gender: 'male',
    followerCount: 35000,
    avatarSeed: 'vikram',
    pricing: { reel: 10000, story: 3500, video: 25000, post: 7000 },
  },

  // ── Macro (100K–1M followers) ────────────────────────────────────────
  {
    name: 'Nandita Rao',
    email: 'nandita.rao.macro@kalakaarian.test',
    username: 'nandita_wellness',
    password: 'Seed@1234',
    bio: 'Bangalore wellness coach with 400K+ community. Ayurvedic routines, mindfulness & sustainable living for modern Indians.',
    city: 'Bangalore',
    niches: ['wellness', 'lifestyle', 'fitness'],
    platforms: ['instagram', 'youtube'],
    tier: 'macro',
    gender: 'female',
    followerCount: 410000,
    avatarSeed: 'nandita',
    pricing: { reel: 75000, story: 25000, video: 120000, post: 50000 },
  },
  {
    name: 'Karan Malhotra',
    email: 'karan.malhotra.macro@kalakaarian.test',
    username: 'karan_comedyking',
    password: 'Seed@1234',
    bio: 'Delhi comedian & sketch writer. Viral Bollywood parodies, desi office humour & Gen-Z cultural commentary.',
    city: 'Delhi',
    niches: ['comedy', 'entertainment'],
    platforms: ['instagram', 'youtube'],
    tier: 'macro',
    gender: 'male',
    followerCount: 280000,
    avatarSeed: 'karan',
    pricing: { reel: 55000, story: 18000, video: 90000, post: 40000 },
  },

  // ── Mega / Celebrity (1M+ followers) ────────────────────────────────
  {
    name: 'Zara Oberoi',
    email: 'zara.oberoi.mega@kalakaarian.test',
    username: 'zara_luxestyle',
    password: 'Seed@1234',
    bio: 'India\'s top luxury lifestyle creator. Mumbai-based. Brand ambassador for premium fashion, travel & beauty. 2.1M community.',
    city: 'Mumbai',
    niches: ['luxury', 'fashion', 'travel'],
    platforms: ['instagram', 'youtube'],
    tier: 'mega',
    gender: 'female',
    followerCount: 2100000,
    avatarSeed: 'zara',
    pricing: { reel: 350000, story: 120000, video: 500000, post: 250000 },
  },
  {
    name: 'Dev Anand Pillai',
    email: 'dev.pillai.mega@kalakaarian.test',
    username: 'dev_gamingpro',
    password: 'Seed@1234',
    bio: 'India\'s top gaming & esports creator. Chennai native, 1.5M subscribers. BGMI, Valorant, Free Fire & game reviews.',
    city: 'Chennai',
    niches: ['gaming', 'tech', 'entertainment'],
    platforms: ['youtube', 'instagram'],
    tier: 'mega',
    gender: 'male',
    followerCount: 1500000,
    avatarSeed: 'dev',
    pricing: { reel: 280000, story: 90000, video: 450000, post: 200000 },
  },
];

async function seed() {
  console.log(`Seeding ${INFLUENCERS.length} influencers...\n`);
  let created = 0;
  let skipped = 0;

  for (const inf of INFLUENCERS) {
    // Idempotent: skip if email already exists in profiles
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('email', inf.email)
      .maybeSingle();

    if (existing) {
      console.log(`  ↩  skip  ${inf.email} (already exists)`);
      skipped++;
      continue;
    }

    // 1. Create auth user
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: inf.email,
      password: inf.password,
      email_confirm: true,
    });

    if (authErr || !authData.user) {
      console.error(`  ✗ auth  ${inf.email}: ${authErr?.message}`);
      continue;
    }

    const userId = authData.user.id;

    // 2. Insert profile
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${inf.avatarSeed}`;
    const { error: profErr } = await admin.from('profiles').insert({
      id: userId,
      email: inf.email,
      name: inf.name,
      username: inf.username,
      role: 'influencer',
      avatar_url: avatarUrl,
    });

    if (profErr) {
      console.error(`  ✗ profile ${inf.email}: ${profErr.message}`);
      continue;
    }

    // 3. Insert influencer_profile
    const { error: ipErr } = await admin.from('influencer_profiles').insert({
      id: userId,
      bio: inf.bio,
      city: inf.city,
      niches: inf.niches,
      platforms: inf.platforms,
      tier: inf.tier,
      gender: inf.gender,
      followers_count: inf.followerCount,
    });

    if (ipErr) {
      console.error(`  ✗ inf_profile ${inf.email}: ${ipErr.message}`);
      continue;
    }

    // 4. Insert pricing rows
    const pricingRows = [
      { content_type: 'reel',  price: inf.pricing.reel },
      { content_type: 'story', price: inf.pricing.story },
      { content_type: 'video', price: inf.pricing.video },
      { content_type: 'post',  price: inf.pricing.post },
    ]
      .filter(r => r.price != null)
      .map(r => ({ influencer_id: userId, platform: 'general', ...r }));

    if (pricingRows.length > 0) {
      const { error: priceErr } = await admin.from('influencer_pricing').insert(pricingRows);
      if (priceErr) {
        console.error(`  ✗ pricing ${inf.email}: ${priceErr.message}`);
        continue;
      }
    }

    console.log(`  ✓ created ${inf.tier.padEnd(5)} | ${inf.name} (${inf.email})`);
    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}, Total: ${INFLUENCERS.length}`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
