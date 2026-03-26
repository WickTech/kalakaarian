import mongoose from 'mongoose';
import dotenv from 'dotenv';
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

    const brand1 = await User.create({
      email: 'brand1@example.com',
      password: 'password123',
      name: 'TechCorp',
      role: 'brand',
    });

    const brand2 = await User.create({
      email: 'brand2@example.com',
      password: 'password123',
      name: 'FashionHub',
      role: 'brand',
    });

    const influencer1 = await User.create({
      email: 'influencer1@example.com',
      password: 'password123',
      name: 'Sarah Johnson',
      role: 'influencer',
    });

    const influencer2 = await User.create({
      email: 'influencer2@example.com',
      password: 'password123',
      name: 'Mike Chen',
      role: 'influencer',
    });

    const brandProfile1 = await BrandProfile.create({
      userId: brand1._id,
      companyName: 'TechCorp',
      industry: 'Technology',
      website: 'https://techcorp.example.com',
      description: 'Leading tech company specializing in innovative solutions.',
    });

    const brandProfile2 = await BrandProfile.create({
      userId: brand2._id,
      companyName: 'FashionHub',
      industry: 'Fashion',
      website: 'https://fashionhub.example.com',
      description: 'Trendy fashion brand for modern lifestyle.',
    });

    const influencerProfile1 = await InfluencerProfile.create({
      userId: influencer1._id,
      bio: 'Tech enthusiast and lifestyle content creator with a passion for reviews.',
      city: 'San Francisco',
      niches: ['Technology', 'Lifestyle', 'Reviews'],
      socialHandles: {
        instagram: '@sarahjohnson',
        youtube: 'SarahJohnsonTech',
        tiktok: '@sarahj',
      },
      followerCount: 50000,
      platform: ['instagram', 'youtube', 'tiktok'],
      tier: 'micro',
      followers: {
        instagram: 25000,
        youtube: 15000,
        tiktok: 10000,
      },
      pricing: {
        story: 150,
        reel: 500,
        video: 750,
        post: 300,
      },
    });

    const influencerProfile2 = await InfluencerProfile.create({
      userId: influencer2._id,
      bio: 'Fashion and beauty creator sharing daily style tips.',
      city: 'New York',
      niches: ['Fashion', 'Beauty', 'Lifestyle'],
      socialHandles: {
        instagram: '@mikechenfashion',
        youtube: 'MikeChenStyle',
      },
      followerCount: 75000,
      platform: ['instagram', 'youtube'],
      tier: 'micro',
      followers: {
        instagram: 50000,
        youtube: 25000,
      },
      pricing: {
        story: 200,
        reel: 600,
        video: 900,
        post: 400,
      },
    });

    const campaign1 = await Campaign.create({
      brandId: brand1._id,
      title: 'Product Launch Campaign',
      description: 'Launch campaign for our new smartphone featuring innovative technology.',
      deliverables: '3 Instagram reels, 2 YouTube videos, 5 Instagram stories',
      genre: ['Technology', 'Reviews'],
      platform: ['instagram', 'youtube'],
      budget: 5000,
      deadline: new Date('2026-04-30'),
      requirements: 'Creator must have genuine interest in tech products.',
      status: 'open',
    });

    const campaign2 = await Campaign.create({
      brandId: brand1._id,
      title: 'App Promotion Campaign',
      description: 'Promote our new mobile application to increase downloads.',
      deliverables: '2 Instagram reels, 3 Instagram posts',
      genre: ['Technology', 'Lifestyle'],
      platform: ['instagram'],
      budget: 3000,
      deadline: new Date('2026-05-15'),
      requirements: 'Must create authentic content.',
      status: 'open',
    });

    const campaign3 = await Campaign.create({
      brandId: brand2._id,
      title: 'Spring Collection Launch',
      description: 'Showcase our new spring fashion collection.',
      deliverables: '4 Instagram reels, 6 Instagram posts',
      genre: ['Fashion', 'Lifestyle'],
      platform: ['instagram', 'youtube'],
      budget: 8000,
      deadline: new Date('2026-04-20'),
      requirements: 'Fashion-forward content creators only.',
      status: 'open',
    });

    await Proposal.create({
      campaignId: campaign1._id,
      influencerId: influencer1._id,
      message: 'I would love to create authentic tech reviews for your product launch!',
      bidAmount: 2500,
      timeline: '2 weeks',
      status: 'pending',
    });

    await Proposal.create({
      campaignId: campaign1._id,
      influencerId: influencer2._id,
      message: 'Excited about this campaign! I can create engaging content.',
      bidAmount: 2800,
      timeline: '10 days',
      status: 'pending',
    });

    console.log('Seed data created successfully!');
    console.log({
      users: await User.countDocuments(),
      brandProfiles: await BrandProfile.countDocuments(),
      influencerProfiles: await InfluencerProfile.countDocuments(),
      campaigns: await Campaign.countDocuments(),
      proposals: await Proposal.countDocuments(),
    });

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
