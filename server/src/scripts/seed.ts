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

    // Brands
    const brand1 = await User.create({
      email: 'brand@techcorp.com',
      password: hashedPassword,
      name: 'TechCorp India',
      role: 'brand',
    });

    const brand2 = await User.create({
      email: 'brand@fashionhub.com',
      password: hashedPassword,
      name: 'Fashion Hub',
      role: 'brand',
    });

    await BrandProfile.create({
      userId: brand1._id,
      companyName: 'TechCorp India',
      industry: 'Technology',
      website: 'https://techcorp.in',
      description: 'Leading tech company specializing in smartphones and gadgets.',
    });

    await BrandProfile.create({
      userId: brand2._id,
      companyName: 'Fashion Hub',
      industry: 'Fashion',
      website: 'https://fashionhub.in',
      description: 'Trendy fashion brand for modern lifestyle.',
    });

    // Influencers
    const influencers = [
      { email: 'sarah@creator.com', name: 'Priya Sharma', bio: 'Tech enthusiast and gadget reviewer.', city: 'Mumbai', niches: ['Technology', 'Gadgets'], instagram: 'priyasharma_tech', tier: 'micro', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' },
      { email: 'raj@creator.com', name: 'Raj Patel', bio: 'Fashion blogger sharing daily style tips.', city: 'Delhi', niches: ['Fashion', 'Beauty'], instagram: 'rajpatel_style', tier: 'micro', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop' },
      { email: 'anita@creator.com', name: 'Anita Singh', bio: 'Travel photographer exploring hidden gems.', city: 'Surat', niches: ['Travel', 'Photography'], instagram: 'anitatravels', tier: 'nano', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop' },
      { email: 'vikram@creator.com', name: 'Vikram Mehta', bio: 'Fitness coach and health enthusiast.', city: 'Pune', niches: ['Fitness', 'Health'], instagram: 'vikramfitness', tier: 'nano', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop' },
      { email: 'neha@creator.com', name: 'Neha Kapoor', bio: 'Food lover exploring flavors and recipes.', city: 'Mumbai', niches: ['Food', 'Cooking'], instagram: 'nehacooks', tier: 'micro', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop' },
      { email: 'sambhav@creator.com', name: 'Sambhav Khatang', bio: 'Content creator from Surat, Gujarat.', city: 'Surat', niches: ['Lifestyle', 'Entertainment'], instagram: 'imazikyt', tier: 'micro', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop' },
      { email: 'kaksha@creator.com', name: 'Kaksha Sarvani', bio: 'Lifestyle and fashion content creator.', city: 'Surat', niches: ['Fashion', 'Lifestyle'], instagram: 'kakshaaaaaa', tier: 'micro', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' },
      { email: 'dhruvisha@creator.com', name: 'Dhruvisha Jariwala', bio: 'Trendy content creator from Surat.', city: 'Surat', niches: ['Lifestyle', 'Fashion'], instagram: 'thedhruvishajariwala', tier: 'micro', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop' },
      { email: 'riya@creator.com', name: 'Riya Lekhadiya', bio: 'Beauty and fashion enthusiast.', city: 'Surat', niches: ['Beauty', 'Fashion'], instagram: 'ria_aarel', tier: 'nano', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop' },
      { email: 'heer@creator.com', name: 'Heer Darshan', bio: 'Lifestyle content creator.', city: 'Surat', niches: ['Lifestyle', 'Fashion'], instagram: 'heer_darshan', tier: 'micro', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop' },
      { email: 'jiya@creator.com', name: 'Jiya Khurana', bio: 'Fashion and lifestyle blogger.', city: 'Surat', niches: ['Fashion', 'Lifestyle'], instagram: 'jiyakhuranaa', tier: 'micro', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' },
      { email: 'jaydip@creator.com', name: 'Jaydip Patel', bio: 'Content creator and influencer.', city: 'Surat', niches: ['Lifestyle', 'Entertainment'], instagram: 'jaydip.123', tier: 'nano', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop' },
      { email: 'aarvi@creator.com', name: 'Aarvi Arnav', bio: 'Dynamic duo creating content together.', city: 'Surat', niches: ['Lifestyle', 'Comedy'], instagram: 'arnav__aarvi', tier: 'micro', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop' },
      { email: 'drishti@creator.com', name: 'Drishti Patel', bio: 'Beauty and lifestyle content creator.', city: 'Surat', niches: ['Beauty', 'Lifestyle'], instagram: 'drashti.ghanva', tier: 'nano', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop' },
    ];

    const createdInfluencers = [];
    for (const inf of influencers) {
      const user = await User.create({
        email: inf.email,
        password: hashedPassword,
        name: inf.name,
        role: 'influencer',
      });

      const profile = await InfluencerProfile.create({
        userId: user._id,
        bio: inf.bio,
        city: inf.city,
        niches: inf.niches,
        socialHandles: { instagram: inf.instagram },
        profileImage: inf.photo,
        platform: ['instagram'],
        tier: inf.tier,
        pricing: {
          story: 300,
          reel: 1000,
          video: 2000,
          post: 800,
        },
        verified: Math.random() > 0.5,
      });
      createdInfluencers.push({ user, profile });
    }

    // Campaigns
    const campaign1 = await Campaign.create({
      brandId: brand1._id,
      title: 'TechCorp Smartphone Launch',
      description: 'Launch campaign for our new flagship smartphone with amazing camera features.',
      deliverables: '3 Instagram reels, 2 YouTube videos',
      genre: ['Technology', 'Gadgets'],
      platform: ['instagram', 'youtube'],
      budget: 15000,
      deadline: new Date('2026-05-15'),
      requirements: 'Must have genuine tech audience.',
      status: 'open',
    });

    const campaign2 = await Campaign.create({
      brandId: brand2._id,
      title: 'Summer Collection 2026',
      description: 'Promote our new summer fashion collection.',
      deliverables: '4 Instagram reels, 6 Instagram posts',
      genre: ['Fashion', 'Lifestyle'],
      platform: ['instagram'],
      budget: 20000,
      deadline: new Date('2026-04-30'),
      requirements: 'Fashion-forward content creators.',
      status: 'open',
    });

    const campaign3 = await Campaign.create({
      brandId: brand1._id,
      title: 'Tech Accessories Review',
      description: 'Review our new line of wireless earbuds.',
      deliverables: '1 YouTube review, 2 Instagram reels',
      genre: ['Technology', 'Reviews'],
      platform: ['instagram', 'youtube'],
      budget: 8000,
      deadline: new Date('2026-04-25'),
      requirements: 'Tech-focused creator.',
      status: 'open',
    });

    // Proposals
    await Proposal.create({
      campaignId: campaign1._id,
      influencerId: createdInfluencers[0].profile._id,
      message: 'Hi! I love reviewing tech products.',
      bidAmount: 8000,
      timeline: '2 weeks',
      status: 'pending',
    });

    await Proposal.create({
      campaignId: campaign2._id,
      influencerId: createdInfluencers[1].profile._id,
      message: 'Fashion is my passion!',
      bidAmount: 12000,
      timeline: '3 weeks',
      status: 'pending',
    });

    console.log('\n✅ Seed data created successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Brands: 2`);
    console.log(`   Influencers: ${createdInfluencers.length}`);
    console.log(`   Campaigns: 3`);
    console.log(`   Proposals: 2`);
    console.log('\n🔑 Test Accounts:');
    console.log('   Brand: brand@techcorp.com / password123');
    console.log('   Influencer: sarah@creator.com / password123');
    console.log('   Influencer: sambhav@creator.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
