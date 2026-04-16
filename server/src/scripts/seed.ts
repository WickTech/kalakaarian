import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import BrandProfile from '../models/BrandProfile';
import InfluencerProfile from '../models/InfluencerProfile';
import Campaign from '../models/Campaign';
import Proposal from '../models/Proposal';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kalakaarian';

const seedData = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await BrandProfile.deleteMany({});
    await InfluencerProfile.deleteMany({});
    await Campaign.deleteMany({});
    await Proposal.deleteMany({});
    console.log('Cleared existing data');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create brands
    const brand1 = await User.create({
      email: 'brand@techcorp.com',
      password: hashedPassword,
      name: 'TechCorp India',
      role: 'brand',
    });

    await BrandProfile.create({
      userId: brand1._id,
      companyName: 'TechCorp India',
      industry: 'Technology',
      website: 'https://techcorp.in',
      description: 'Leading tech company specializing in smartphones and gadgets.',
    });

    // Create 2 test influencers with login
    const influencer1 = await User.create({
      email: 'sarah@creator.com',
      password: hashedPassword,
      name: 'Priya Sharma',
      role: 'influencer',
    });

    await InfluencerProfile.create({
      userId: influencer1._id,
      bio: 'Tech enthusiast and gadget reviewer.',
      city: 'Mumbai',
      niches: ['Technology', 'Gadgets'],
      socialHandles: { instagram: 'priyasharma_tech' },
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      platform: ['instagram'],
      tier: 'micro',
      pricing: { story: 500, reel: 2000, video: 3500, post: 1500 },
      verified: true,
    });

    const influencer2 = await User.create({
      email: 'raj@creator.com',
      password: hashedPassword,
      name: 'Raj Patel',
      role: 'influencer',
    });

    await InfluencerProfile.create({
      userId: influencer2._id,
      bio: 'Fashion blogger sharing daily style tips.',
      city: 'Delhi',
      niches: ['Fashion', 'Beauty'],
      socialHandles: { instagram: 'rajpatel_style' },
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      platform: ['instagram'],
      tier: 'micro',
      pricing: { story: 600, reel: 2500, video: 4000, post: 1800 },
      verified: true,
    });

    // Display-only influencers (no login)
    const displayInfluencers = [
      { name: 'Sambhav Khatang', bio: 'Content creator from Surat, Gujarat.', city: 'Surat', niches: ['Lifestyle', 'Entertainment'], instagram: 'imazikyt', tier: 'micro', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop' },
      { name: 'Kaksha Sarvani', bio: 'Lifestyle and fashion content creator.', city: 'Surat', niches: ['Fashion', 'Lifestyle'], instagram: 'kakshaaaaaa', tier: 'micro', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' },
      { name: 'Dhruvisha Jariwala', bio: 'Trendy content creator from Surat.', city: 'Surat', niches: ['Lifestyle', 'Fashion'], instagram: 'thedhruvishajariwala', tier: 'micro', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop' },
      { name: 'Riya Lekhadiya', bio: 'Beauty and fashion enthusiast.', city: 'Surat', niches: ['Beauty', 'Fashion'], instagram: 'ria_aarel', tier: 'nano', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop' },
      { name: 'Heer Darshan', bio: 'Lifestyle content creator.', city: 'Surat', niches: ['Lifestyle', 'Fashion'], instagram: 'heer_darshan', tier: 'micro', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop' },
      { name: 'Jiya Khurana', bio: 'Fashion and lifestyle blogger.', city: 'Surat', niches: ['Fashion', 'Lifestyle'], instagram: 'jiyakhuranaa', tier: 'micro', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' },
      { name: 'Jaydip Patel', bio: 'Content creator and influencer.', city: 'Surat', niches: ['Lifestyle', 'Entertainment'], instagram: 'jaydip.123', tier: 'nano', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop' },
      { name: 'Aarvi Arnav', bio: 'Dynamic duo creating content together.', city: 'Surat', niches: ['Lifestyle', 'Comedy'], instagram: 'arnav__aarvi', tier: 'micro', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop' },
      { name: 'Drishti Patel', bio: 'Beauty and lifestyle content creator.', city: 'Surat', niches: ['Beauty', 'Lifestyle'], instagram: 'drashti.ghanva', tier: 'nano', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop' },
      { name: 'Anita Singh', bio: 'Travel photographer exploring hidden gems.', city: 'Surat', niches: ['Travel', 'Photography'], instagram: 'anitatravels', tier: 'nano', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop' },
      { name: 'Vikram Mehta', bio: 'Fitness coach and health enthusiast.', city: 'Pune', niches: ['Fitness', 'Health'], instagram: 'vikramfitness', tier: 'nano', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop' },
      { name: 'Neha Kapoor', bio: 'Food lover exploring flavors and recipes.', city: 'Mumbai', niches: ['Food', 'Cooking'], instagram: 'nehacooks', tier: 'micro', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop' },
    ];

    for (const inf of displayInfluencers) {
      await InfluencerProfile.create({
        userId: new mongoose.Types.ObjectId(),
        bio: inf.bio,
        city: inf.city,
        niches: inf.niches,
        socialHandles: { instagram: inf.instagram },
        profileImage: inf.photo,
        platform: ['instagram'],
        tier: inf.tier,
        pricing: { story: 300, reel: 1000, video: 2000, post: 800 },
        verified: false,
      });
    }

    // Create campaigns
    const campaign1 = await Campaign.create({
      brandId: brand1._id,
      title: 'TechCorp Smartphone Launch',
      description: 'Launch campaign for our new flagship smartphone.',
      deliverables: '3 Instagram reels, 2 YouTube videos',
      genre: ['Technology', 'Gadgets'],
      platform: ['instagram'],
      budget: 15000,
      deadline: new Date('2026-05-15'),
      requirements: 'Must have genuine tech audience.',
      status: 'open',
    });

    await Proposal.create({
      campaignId: campaign1._id,
      influencerId: influencer1._id,
      message: 'Hi! I love reviewing tech products.',
      bidAmount: 8000,
      timeline: '2 weeks',
      status: 'pending',
    });

    const totalInfluencers = await InfluencerProfile.countDocuments();

    console.log('\n✅ Seed data created successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Brands: 1`);
    console.log(`   Influencers: ${totalInfluencers}`);
    console.log(`   Campaigns: 1`);
    console.log(`   Proposals: 1`);
    console.log('\n🔑 Test Account:');
    console.log('   Brand: brand@techcorp.com / password123');
    console.log('   Influencer (login): sarah@creator.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
