import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import User from '../models/User';
import InfluencerProfile from '../models/InfluencerProfile';

// Look for .env in repo root (one level above server/)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // fallback to cwd

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kalakaarian';

const AVATAR = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

const creators = [
  {
    name: 'Sambhav Khatang',
    email: 'sambhav@kalakaarian.internal',
    instagram: 'imazikyt',
    city: 'Surat',
    gender: 'male',
    niches: ['Lifestyle', 'Entertainment'],
    tier: 'micro',
    pricing: { story: 400, reel: 1500, post: 1000 },
  },
  {
    name: 'Kaksha Sarvani',
    email: 'kaksha@kalakaarian.internal',
    instagram: 'kakshaaaaaa',
    city: 'Surat',
    gender: 'female',
    niches: ['Fashion', 'Lifestyle'],
    tier: 'micro',
    pricing: { story: 450, reel: 1800, post: 1200 },
  },
  {
    name: 'Dhruvisha Jariwala',
    email: 'dhruvisha@kalakaarian.internal',
    instagram: 'thedhruvishajariwala',
    city: 'Surat',
    gender: 'female',
    niches: ['Lifestyle', 'Fashion'],
    tier: 'micro',
    pricing: { story: 400, reel: 1600, post: 1000 },
  },
  {
    name: 'Riya Lekhadiya',
    email: 'riya@kalakaarian.internal',
    instagram: 'ria_aarel',
    city: 'Surat',
    gender: 'female',
    niches: ['Beauty', 'Fashion'],
    tier: 'nano',
    pricing: { story: 300, reel: 1000, post: 700 },
  },
  {
    name: 'Heer Darshan',
    email: 'heer@kalakaarian.internal',
    instagram: 'heer_darshan',
    city: 'Surat',
    gender: 'female',
    niches: ['Lifestyle', 'Fashion'],
    tier: 'micro',
    pricing: { story: 400, reel: 1500, post: 900 },
  },
  {
    name: 'Jiya Khurana',
    email: 'jiya@kalakaarian.internal',
    instagram: 'jiyakhuranaa',
    city: 'Surat',
    gender: 'female',
    niches: ['Fashion', 'Lifestyle'],
    tier: 'micro',
    pricing: { story: 450, reel: 1800, post: 1100 },
  },
  {
    name: 'Jaydip Patel',
    email: 'jaydip@kalakaarian.internal',
    instagram: 'jaydip.123',
    city: 'Surat',
    gender: 'male',
    niches: ['Lifestyle', 'Entertainment'],
    tier: 'nano',
    pricing: { story: 250, reel: 900, post: 600 },
  },
  {
    name: 'Aarvi Arnav',
    email: 'aarvi@kalakaarian.internal',
    instagram: 'arnav__aarvi',
    city: 'Surat',
    gender: 'female',
    niches: ['Lifestyle', 'Comedy'],
    tier: 'micro',
    pricing: { story: 400, reel: 1400, post: 900 },
  },
  {
    name: 'Drishti Patel',
    email: 'drishti@kalakaarian.internal',
    instagram: 'drashti.ghanva',
    city: 'Surat',
    gender: 'female',
    niches: ['Beauty', 'Lifestyle'],
    tier: 'nano',
    pricing: { story: 300, reel: 1000, post: 700 },
  },
];

/**
 * SEED-ONLY accounts — these User documents have no password, googleId, or phone.
 * They cannot be authenticated via any login path and exist solely to back
 * the InfluencerProfile documents for marketplace display.
 * The @kalakaarian.internal domain is not a real domain; it is safe to use as
 * a namespace but will block legitimate registration if a real person tries the
 * same address. Keep these addresses consistent and do not reuse them for real users.
 */
const seed = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB:', MONGODB_URI.replace(/:([^:@]+)@/, ':****@'));

  let created = 0;
  let skipped = 0;

  for (const c of creators) {
    let user = await User.findOne({ email: c.email });
    if (!user) {
      user = await User.create({
        email: c.email,
        name: c.name,
        role: 'influencer',
      });
    }

    const existing = await InfluencerProfile.findOne({ userId: user._id });
    if (existing) {
      skipped++;
      console.log(`  SKIP  ${c.name} (already exists)`);
      continue;
    }

    await InfluencerProfile.create({
      userId: user._id,
      bio: `${c.niches.join(' and ')} content creator from ${c.city}.`,
      city: c.city,
      gender: c.gender,
      niches: c.niches,
      socialHandles: { instagram: c.instagram },
      profileImage: AVATAR(c.name),
      platform: ['instagram'],
      tier: c.tier,
      pricing: c.pricing,
      verified: false,
      isOnline: false,
    });
    created++;
    console.log(`  ADD   ${c.name} (@${c.instagram})`);
  }

  const total = await InfluencerProfile.countDocuments();
  console.log(`\nDone — ${created} added, ${skipped} skipped. Total in DB: ${total}`);
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect();
  process.exit(1);
});
