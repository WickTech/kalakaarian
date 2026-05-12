import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

interface YTCreator {
  name: string;
  email: string;
  username: string;
  password: string;
  bio: string;
  city: string;
  phone?: string;
  niches: string[];
  platforms: string[];
  tier: 'nano' | 'micro' | 'macro' | 'celeb';
  gender: 'male' | 'female' | 'non_binary';
  followerCount: number;
  avatarSeed: string;
  youtubeHandle: string;
  pricing: { video?: number; short?: number; post?: number };
}

const CREATORS: YTCreator[] = [
  {
    name: 'Shenaz Treasury',
    email: 'shenaz.treasury@kalakaarian.test',
    username: 'shenaztreasury',
    password: 'Seed@1234',
    bio: 'Travel & lifestyle creator exploring India and the world. Based in Mumbai with a passion for culture, food, and adventure.',
    city: 'Mumbai',
    phone: '8928746439',
    niches: ['travel', 'lifestyle', 'entertainment'],
    platforms: ['youtube', 'instagram'],
    tier: 'macro',
    gender: 'female',
    followerCount: 1200000,
    avatarSeed: 'shenaz',
    youtubeHandle: 'UC0T40jBqqcdotcPMsz0cYkA',
    pricing: { video: 150000, short: 60000, post: 80000 },
  },
  {
    name: 'CarryMinati',
    email: 'carryminati@kalakaarian.test',
    username: 'carryminati',
    password: 'Seed@1234',
    bio: 'India\'s iconic roast and comedy creator. Known for viral rants, gaming content, and unfiltered entertainment.',
    city: 'Faridabad',
    niches: ['comedy', 'gaming', 'entertainment'],
    platforms: ['youtube', 'instagram'],
    tier: 'celeb',
    gender: 'male',
    followerCount: 40000000,
    avatarSeed: 'carry',
    youtubeHandle: 'CarryMinati',
    pricing: { video: 2000000, short: 800000, post: 1200000 },
  },
  {
    name: 'Ashika Gowda',
    email: 'ashika.gowda@kalakaarian.test',
    username: 'aashikagowda',
    password: 'Seed@1234',
    bio: 'Bengaluru-based beauty and lifestyle creator. Sharing makeup tutorials, skincare routines, and fashion inspiration.',
    city: 'Bengaluru',
    phone: '9353959029',
    niches: ['beauty', 'lifestyle', 'fashion'],
    platforms: ['youtube', 'instagram'],
    tier: 'macro',
    gender: 'female',
    followerCount: 1100000,
    avatarSeed: 'ashika',
    youtubeHandle: 'AashikaGowda',
    pricing: { video: 130000, short: 50000, post: 80000 },
  },
  {
    name: 'Keerti Shrathah',
    email: 'keerti.shrathah@kalakaarian.test',
    username: 'keerthishrathah',
    password: 'Seed@1234',
    bio: 'Chennai-based fitness and wellness creator. Yoga, home workouts, and healthy living for modern Indians.',
    city: 'Chennai',
    phone: '9094214810',
    niches: ['fitness', 'wellness', 'yoga'],
    platforms: ['youtube', 'instagram'],
    tier: 'macro',
    gender: 'female',
    followerCount: 520000,
    avatarSeed: 'keerti',
    youtubeHandle: 'KeerthiShrathah',
    pricing: { video: 70000, short: 25000, post: 45000 },
  },
  {
    name: 'Prableen Kaur Bhomrah',
    email: 'prableen.kaur@kalakaarian.test',
    username: 'prableenkaurbhomrah',
    password: 'Seed@1234',
    bio: 'Nutritionist and wellness creator from Mumbai. Science-backed diet tips, gut health, and sustainable lifestyle habits.',
    city: 'Mumbai',
    phone: '9769338480',
    niches: ['nutrition', 'wellness', 'fitness'],
    platforms: ['youtube', 'instagram'],
    tier: 'macro',
    gender: 'female',
    followerCount: 1500000,
    avatarSeed: 'prableen',
    youtubeHandle: 'PrableenKaurBhomrah',
    pricing: { video: 160000, short: 65000, post: 90000 },
  },
  {
    name: 'Gagan Choudhary',
    email: 'gagan.choudhary@kalakaarian.test',
    username: 'gaganchoudhary',
    password: 'Seed@1234',
    bio: 'Jaipur-based comedy and entertainment creator. Desi humour, relatable skits, and slice-of-life content.',
    city: 'Jaipur',
    phone: '9413181293',
    niches: ['comedy', 'entertainment', 'lifestyle'],
    platforms: ['youtube', 'instagram'],
    tier: 'macro',
    gender: 'male',
    followerCount: 900000,
    avatarSeed: 'gagan',
    youtubeHandle: 'GaganChoudhary',
    pricing: { video: 100000, short: 40000, post: 60000 },
  },
  {
    name: 'Mridul Sharma',
    email: 'mridul.sharma@kalakaarian.test',
    username: 'mridul_sharmaa',
    password: 'Seed@1234',
    bio: 'Maharashtra-based food and travel creator. Documenting the best local eats, street food trails, and hidden gems.',
    city: 'Pune',
    phone: '8879018121',
    niches: ['food', 'travel', 'lifestyle'],
    platforms: ['youtube', 'instagram'],
    tier: 'macro',
    gender: 'male',
    followerCount: 1000000,
    avatarSeed: 'mridul',
    youtubeHandle: 'mridul_sharmaa',
    pricing: { video: 120000, short: 45000, post: 70000 },
  },
  {
    name: 'Radhika Seth',
    email: 'radhika.seth@kalakaarian.test',
    username: 'radhikasethh',
    password: 'Seed@1234',
    bio: 'Mumbai-based fashion and lifestyle creator. Styling tips, OOTD lookbooks, and behind-the-scenes of the fashion world.',
    city: 'Mumbai',
    phone: '9326696762',
    niches: ['fashion', 'lifestyle', 'beauty'],
    platforms: ['youtube', 'instagram'],
    tier: 'macro',
    gender: 'female',
    followerCount: 480000,
    avatarSeed: 'radhika_seth',
    youtubeHandle: 'RadhikaSethh',
    pricing: { video: 65000, short: 25000, post: 40000 },
  },
  {
    name: 'Malvika Sitlani',
    email: 'malvika.sitlani@kalakaarian.test',
    username: 'malvikasitlani',
    password: 'Seed@1234',
    bio: 'Delhi-based beauty and fashion influencer. Luxury skincare, editorial makeup, and premium fashion content.',
    city: 'Delhi',
    phone: '8850124175',
    niches: ['beauty', 'fashion', 'luxury'],
    platforms: ['youtube', 'instagram'],
    tier: 'macro',
    gender: 'female',
    followerCount: 650000,
    avatarSeed: 'malvika',
    youtubeHandle: 'malvikasitlaniofficial',
    pricing: { video: 85000, short: 35000, post: 55000 },
  },
  {
    name: 'Rebel Kid',
    email: 'rebelkid@kalakaarian.test',
    username: 'the_rebelkid',
    password: 'Seed@1234',
    bio: 'Mumbai-based fashion and lifestyle creator. Bold style choices, travel diaries, and unapologetically authentic content.',
    city: 'Mumbai',
    phone: '9711400033',
    niches: ['fashion', 'lifestyle', 'travel'],
    platforms: ['youtube', 'instagram'],
    tier: 'macro',
    gender: 'female',
    followerCount: 540000,
    avatarSeed: 'rebelkid',
    youtubeHandle: 'the.rebelkid',
    pricing: { video: 70000, short: 28000, post: 45000 },
  },
  {
    name: 'Ankush Bahuguna',
    email: 'ankush.bahuguna@kalakaarian.test',
    username: 'ankushbahuguna',
    password: 'Seed@1234',
    bio: 'Mumbai-based men\'s beauty and lifestyle creator. Breaking stereotypes with honest skincare reviews and grooming tips.',
    city: 'Mumbai',
    phone: '7838085408',
    niches: ['beauty', 'grooming', 'lifestyle'],
    platforms: ['youtube', 'instagram'],
    tier: 'macro',
    gender: 'male',
    followerCount: 780000,
    avatarSeed: 'ankush',
    youtubeHandle: 'ankushbahuguna',
    pricing: { video: 95000, short: 38000, post: 60000 },
  },
  {
    name: 'Manoj Saru',
    email: 'manoj.saru.techgyan@kalakaarian.test',
    username: 'technologygyan',
    password: 'Seed@1234',
    bio: 'Technology Gyan — India\'s leading Hindi tech channel. Smartphone reviews, tips, tricks, and consumer tech for masses.',
    city: 'Delhi',
    phone: '7011794363',
    niches: ['tech', 'gadgets', 'education'],
    platforms: ['youtube'],
    tier: 'celeb',
    gender: 'male',
    followerCount: 14000000,
    avatarSeed: 'manoj_saru',
    youtubeHandle: 'TechnologyGyan',
    pricing: { video: 800000, short: 300000, post: 500000 },
  },
  {
    name: 'Sunil Kumar',
    email: 'sunil.kumar.basicgyaan@kalakaarian.test',
    username: 'basicgyaan',
    password: 'Seed@1234',
    bio: 'Basic Gyaan — Delhi-based tech educator. Budget smartphone reviews, app tutorials, and digital literacy in Hindi.',
    city: 'Delhi',
    phone: '7015885404',
    niches: ['tech', 'gadgets', 'education'],
    platforms: ['youtube'],
    tier: 'macro',
    gender: 'male',
    followerCount: 2200000,
    avatarSeed: 'sunil_basic',
    youtubeHandle: 'BasicGyaan',
    pricing: { video: 200000, short: 80000, post: 130000 },
  },
  {
    name: 'Suraj Kumar',
    email: 'suraj.kumar.review@kalakaarian.test',
    username: 'surajkumarreview',
    password: 'Seed@1234',
    bio: 'Detailed gadget and smartphone reviewer. Honest long-term usage reviews and value-for-money picks.',
    city: 'Delhi',
    niches: ['tech', 'gadgets', 'reviews'],
    platforms: ['youtube'],
    tier: 'micro',
    gender: 'male',
    followerCount: 85000,
    avatarSeed: 'suraj_review',
    youtubeHandle: 'SurajKumarReview',
    pricing: { video: 20000, short: 7000, post: 12000 },
  },
  {
    name: 'Richi Jain',
    email: 'richi.jain@kalakaarian.test',
    username: 'richishah18',
    password: 'Seed@1234',
    bio: 'Mumbai-based beauty creator. Affordable makeup hauls, everyday skincare, and beauty routines for Indian skin.',
    city: 'Mumbai',
    phone: '9769960380',
    niches: ['beauty', 'skincare', 'lifestyle'],
    platforms: ['youtube', 'instagram'],
    tier: 'macro',
    gender: 'female',
    followerCount: 430000,
    avatarSeed: 'richi',
    youtubeHandle: 'richishah18',
    pricing: { video: 60000, short: 22000, post: 38000 },
  },
  {
    name: 'Mohit Balani',
    email: 'mohit.balani@kalakaarian.test',
    username: 'mohitbalani',
    password: 'Seed@1234',
    bio: 'Jabalpur-based lifestyle and fashion creator. Men\'s fashion, travel vlogs, and motivational content.',
    city: 'Jabalpur',
    phone: '8839288393',
    niches: ['fashion', 'lifestyle', 'travel'],
    platforms: ['youtube', 'instagram'],
    tier: 'macro',
    gender: 'male',
    followerCount: 320000,
    avatarSeed: 'mohit_balani',
    youtubeHandle: 'MohitBalani',
    pricing: { video: 45000, short: 16000, post: 28000 },
  },
  {
    name: 'Rohina Anand',
    email: 'rohina.anand@kalakaarian.test',
    username: 'rohina_anand',
    password: 'Seed@1234',
    bio: 'Lifestyle and wellness creator sharing everyday inspiration, mental health tips, and mindful living.',
    city: 'Mumbai',
    phone: '9326742737',
    niches: ['lifestyle', 'wellness', 'mental health'],
    platforms: ['youtube', 'instagram'],
    tier: 'micro',
    gender: 'female',
    followerCount: 65000,
    avatarSeed: 'rohina',
    youtubeHandle: 'rohina_anand',
    pricing: { video: 15000, short: 5000, post: 9000 },
  },
  {
    name: 'Anuj Dhingra',
    email: 'anuj.dhingra@kalakaarian.test',
    username: 'gadgetgig',
    password: 'Seed@1234',
    bio: 'Gadget Gig — Noida-based tech reviewer. Comprehensive gadget comparisons, tips and tricks, and value tech picks.',
    city: 'Noida',
    phone: '9716161602',
    niches: ['tech', 'gadgets', 'reviews'],
    platforms: ['youtube', 'instagram'],
    tier: 'macro',
    gender: 'male',
    followerCount: 510000,
    avatarSeed: 'anuj_dhingra',
    youtubeHandle: 'GadgetGig',
    pricing: { video: 70000, short: 25000, post: 42000 },
  },
  {
    name: 'Meghna Kaur',
    email: 'meghna.kaur@kalakaarian.test',
    username: 'shetroublemakerr',
    password: 'Seed@1234',
    bio: 'She Trouble Maker — Mumbai-based comedy and lifestyle creator. Relatable skits, honest conversations, and fun challenges.',
    city: 'Mumbai',
    phone: '9650645645',
    niches: ['comedy', 'lifestyle', 'entertainment'],
    platforms: ['youtube', 'instagram'],
    tier: 'macro',
    gender: 'female',
    followerCount: 460000,
    avatarSeed: 'meghna_kaur',
    youtubeHandle: 'SheTroubleMaker',
    pricing: { video: 62000, short: 23000, post: 38000 },
  },
  {
    name: 'Neha Chatlani',
    email: 'neha.chatlani@kalakaarian.test',
    username: 'nehachatlani',
    password: 'Seed@1234',
    bio: 'Bengaluru-based fashion and travel creator. Curating everyday style inspo, luxury travel, and brand collabs.',
    city: 'Bengaluru',
    phone: '8105557839',
    niches: ['fashion', 'travel', 'lifestyle'],
    platforms: ['youtube', 'instagram'],
    tier: 'micro',
    gender: 'female',
    followerCount: 190000,
    avatarSeed: 'neha_chatlani',
    youtubeHandle: 'nehachatlani',
    pricing: { video: 28000, short: 10000, post: 18000 },
  },
  {
    name: 'Papri Ganguly',
    email: 'papri.ganguly@kalakaarian.test',
    username: 'papriganguly',
    password: 'Seed@1234',
    bio: 'Kolkata-based comedy and entertainment creator. Bengali humour, relatable family skits, and slice-of-life content.',
    city: 'Kolkata',
    phone: '7278529414',
    niches: ['comedy', 'entertainment', 'lifestyle'],
    platforms: ['youtube', 'instagram'],
    tier: 'macro',
    gender: 'female',
    followerCount: 500000,
    avatarSeed: 'papri',
    youtubeHandle: 'Paprigangulyofficial',
    pricing: { video: 68000, short: 25000, post: 42000 },
  },
  {
    name: 'Jahnavi Dasetty',
    email: 'jahnavi.dasetty@kalakaarian.test',
    username: 'mahathalli',
    password: 'Seed@1234',
    bio: 'Mahathalli — Hyderabad\'s beloved Telugu comedy creator. Slice-of-life humour, women-centric narratives, and heartwarming content.',
    city: 'Hyderabad',
    phone: '9885340538',
    niches: ['comedy', 'entertainment', 'lifestyle'],
    platforms: ['youtube', 'instagram'],
    tier: 'macro',
    gender: 'female',
    followerCount: 2400000,
    avatarSeed: 'jahnavi',
    youtubeHandle: 'Mahathalli',
    pricing: { video: 220000, short: 90000, post: 140000 },
  },
  {
    name: 'Radhika Bose',
    email: 'radhika.bose@kalakaarian.test',
    username: 'yogasini',
    password: 'Seed@1234',
    bio: 'Yogasini — Delhi-based yoga and wellness educator. Traditional yoga practices, pranayama, and holistic health.',
    city: 'Delhi',
    phone: '9625541581',
    niches: ['yoga', 'wellness', 'fitness'],
    platforms: ['youtube', 'instagram'],
    tier: 'macro',
    gender: 'female',
    followerCount: 580000,
    avatarSeed: 'radhika_bose',
    youtubeHandle: 'Yogasini',
    pricing: { video: 75000, short: 28000, post: 48000 },
  },
  {
    name: 'Barsha Basu',
    email: 'barsha.basu@kalakaarian.test',
    username: 'barshabasu',
    password: 'Seed@1234',
    bio: 'Kolkata-based lifestyle and beauty creator. Bengali beauty secrets, affordable skincare, and everyday style.',
    city: 'Kolkata',
    phone: '8961426216',
    niches: ['beauty', 'lifestyle', 'fashion'],
    platforms: ['youtube', 'instagram'],
    tier: 'micro',
    gender: 'female',
    followerCount: 220000,
    avatarSeed: 'barsha',
    youtubeHandle: 'barshabasu',
    pricing: { video: 30000, short: 11000, post: 20000 },
  },
  {
    name: 'Nidhi Chaudhary',
    email: 'nidhi.chaudhary@kalakaarian.test',
    username: 'thenidhichaudhary',
    password: 'Seed@1234',
    bio: 'Delhi-based fashion and lifestyle creator. Everyday OOTD, affordable fashion, and life in the capital.',
    city: 'Delhi',
    phone: '9873723587',
    niches: ['fashion', 'lifestyle', 'beauty'],
    platforms: ['youtube', 'instagram'],
    tier: 'macro',
    gender: 'female',
    followerCount: 350000,
    avatarSeed: 'nidhi',
    youtubeHandle: 'thenidhichaudhary',
    pricing: { video: 50000, short: 18000, post: 32000 },
  },
  {
    name: 'Kabita Singh',
    email: 'kabita.singh@kalakaarian.test',
    username: 'kabitaskitchen',
    password: 'Seed@1234',
    bio: 'Kabita\'s Kitchen — India\'s most-watched home cooking channel. Authentic regional recipes, quick meals, and festive dishes.',
    city: 'Delhi',
    phone: '9762014037',
    niches: ['food', 'cooking', 'lifestyle'],
    platforms: ['youtube'],
    tier: 'celeb',
    gender: 'female',
    followerCount: 12500000,
    avatarSeed: 'kabita',
    youtubeHandle: 'KabitasKitchen',
    pricing: { video: 700000, short: 280000, post: 450000 },
  },
  {
    name: 'Gopali Tiwari',
    email: 'gopali.tiwari@kalakaarian.test',
    username: 'gopali',
    password: 'Seed@1234',
    bio: 'Beauty and skincare creator sharing easy tutorials, product reviews, and glow-up tips for everyday Indians.',
    city: 'Mumbai',
    phone: '9870433439',
    niches: ['beauty', 'skincare', 'lifestyle'],
    platforms: ['youtube', 'instagram'],
    tier: 'micro',
    gender: 'female',
    followerCount: 210000,
    avatarSeed: 'gopali',
    youtubeHandle: 'Gopali',
    pricing: { video: 28000, short: 10000, post: 18000 },
  },
  {
    name: 'Prachi',
    email: 'prachi.superwowstyle@kalakaarian.test',
    username: 'superwowstyle',
    password: 'Seed@1234',
    bio: 'SuperWowStyle — Bengaluru-based hair and beauty creator. Viral hairstyle tutorials, DIY hair care, and beauty hacks.',
    city: 'Bengaluru',
    phone: '9903743593',
    niches: ['beauty', 'hair', 'fashion'],
    platforms: ['youtube', 'instagram'],
    tier: 'celeb',
    gender: 'female',
    followerCount: 2100000,
    avatarSeed: 'prachi',
    youtubeHandle: 'SuperWowstyle',
    pricing: { video: 200000, short: 80000, post: 130000 },
  },
  {
    name: 'Cherry Jain',
    email: 'cherry.jain@kalakaarian.test',
    username: 'cherryjain',
    password: 'Seed@1234',
    bio: 'Delhi-based fashion and lifestyle creator. Trendy hauls, styling sessions, and candid life in Delhi.',
    city: 'Delhi',
    phone: '9899095159',
    niches: ['fashion', 'lifestyle', 'beauty'],
    platforms: ['youtube', 'instagram'],
    tier: 'macro',
    gender: 'female',
    followerCount: 310000,
    avatarSeed: 'cherry',
    youtubeHandle: 'CherryJain',
    pricing: { video: 45000, short: 16000, post: 28000 },
  },
  {
    name: 'Isheeta Yadav',
    email: 'isheeta.yadav@kalakaarian.test',
    username: 'isheetayadav',
    password: 'Seed@1234',
    bio: 'Delhi-based lifestyle and fashion creator. Day-in-my-life vlogs, thrift hauls, and budget styling inspiration.',
    city: 'Delhi',
    phone: '8800468232',
    niches: ['fashion', 'lifestyle', 'travel'],
    platforms: ['youtube', 'instagram'],
    tier: 'micro',
    gender: 'female',
    followerCount: 180000,
    avatarSeed: 'isheeta',
    youtubeHandle: 'IsheetaYadav',
    pricing: { video: 25000, short: 9000, post: 15000 },
  },
  {
    name: 'Arsh Goyal',
    email: 'arsh.goyal@kalakaarian.test',
    username: 'arshgoyal',
    password: 'Seed@1234',
    bio: 'Bengaluru-based coding and tech education creator. DSA, system design, placement prep, and career growth for engineers.',
    city: 'Bengaluru',
    phone: '9914047037',
    niches: ['tech', 'education', 'coding'],
    platforms: ['youtube', 'instagram'],
    tier: 'macro',
    gender: 'male',
    followerCount: 620000,
    avatarSeed: 'arsh',
    youtubeHandle: 'ArshGoyal',
    pricing: { video: 80000, short: 30000, post: 50000 },
  },
];

async function seed() {
  console.log(`Seeding ${CREATORS.length} YouTube creators...\n`);
  let created = 0;
  let skipped = 0;

  for (const c of CREATORS) {
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('email', c.email)
      .maybeSingle();

    if (existing) {
      console.log(`  ↩  skip  ${c.email}`);
      skipped++;
      continue;
    }

    // 1. Auth user
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: c.email,
      password: c.password,
      email_confirm: true,
    });

    if (authErr || !authData.user) {
      console.error(`  ✗ auth  ${c.email}: ${authErr?.message}`);
      continue;
    }

    const userId = authData.user.id;
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.avatarSeed}`;

    // 2. Profile
    const { error: profErr } = await admin.from('profiles').insert({
      id: userId,
      email: c.email,
      name: c.name,
      username: c.username,
      role: 'influencer',
      avatar_url: avatarUrl,
      ...(c.phone ? { phone: c.phone } : {}),
    });

    if (profErr) {
      console.error(`  ✗ profile ${c.email}: ${profErr.message}`);
      continue;
    }

    // 3. Influencer profile
    const { error: ipErr } = await admin.from('influencer_profiles').insert({
      id: userId,
      bio: c.bio,
      city: c.city,
      niches: c.niches,
      platforms: c.platforms,
      tier: c.tier,
      gender: c.gender,
      followers_count: c.followerCount,
      youtube_handle: c.youtubeHandle,
    });

    if (ipErr) {
      console.error(`  ✗ inf_profile ${c.email}: ${ipErr.message}`);
      continue;
    }

    // 4. Pricing
    const pricingRows = [
      { content_type: 'video', price: c.pricing.video },
      { content_type: 'short', price: c.pricing.short },
      { content_type: 'post',  price: c.pricing.post },
    ]
      .filter(r => r.price != null)
      .map(r => ({ influencer_id: userId, platform: 'youtube', ...r }));

    if (pricingRows.length > 0) {
      const { error: priceErr } = await admin.from('influencer_pricing').insert(pricingRows);
      if (priceErr) {
        console.error(`  ✗ pricing ${c.email}: ${priceErr.message}`);
        continue;
      }
    }

    console.log(`  ✓ ${c.tier.padEnd(5)} | ${c.name}`);
    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
