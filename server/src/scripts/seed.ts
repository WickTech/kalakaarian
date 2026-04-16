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

    const brand3 = await User.create({
      email: 'brand@foodie.com',
      password: hashedPassword,
      name: 'Mumbai Foodie',
      role: 'brand',
    });

    const influencer1 = await User.create({
      email: 'sarah@creator.com',
      password: hashedPassword,
      name: 'Priya Sharma',
      role: 'influencer',
    });

    const influencer2 = await User.create({
      email: 'raj@creator.com',
      password: hashedPassword,
      name: 'Raj Patel',
      role: 'influencer',
    });

    const influencer3 = await User.create({
      email: 'anita@creator.com',
      password: hashedPassword,
      name: 'Anita Singh',
      role: 'influencer',
    });

    const influencer4 = await User.create({
      email: 'vikram@creator.com',
      password: hashedPassword,
      name: 'Vikram Mehta',
      role: 'influencer',
    });

    const influencer5 = await User.create({
      email: 'neha@creator.com',
      password: hashedPassword,
      name: 'Neha Kapoor',
      role: 'influencer',
    });

    const brandProfile1 = await BrandProfile.create({
      userId: brand1._id,
      companyName: 'TechCorp India',
      industry: 'Technology',
      website: 'https://techcorp.in',
      description: 'Leading tech company specializing in smartphones and gadgets.',
    });

    const brandProfile2 = await BrandProfile.create({
      userId: brand2._id,
      companyName: 'Fashion Hub',
      industry: 'Fashion',
      website: 'https://fashionhub.in',
      description: 'Trendy fashion brand for modern lifestyle.',
    });

    const brandProfile3 = await BrandProfile.create({
      userId: brand3._id,
      companyName: 'Mumbai Foodie',
      industry: 'Food & Dining',
      website: 'https://mumbaifoodie.in',
      description: 'Discover the best food spots in Mumbai.',
    });

    const influencerProfile1 = await InfluencerProfile.create({
      userId: influencer1._id,
      bio: 'Tech enthusiast and gadget reviewer. Helping you make smart buying decisions!',
      city: 'Mumbai',
      niches: ['Technology', 'Gadgets', 'Reviews'],
      socialHandles: {
        instagram: 'priyasharma_tech',
        youtube: 'PriyaSharmaTech',
      },
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      platform: ['instagram', 'youtube'],
      tier: 'micro',
      pricing: {
        story: 500,
        reel: 2000,
        video: 3500,
        post: 1500,
      },
      verified: true,
    });

    const influencerProfile2 = await InfluencerProfile.create({
      userId: influencer2._id,
      bio: 'Fashion blogger sharing daily style tips and outfit inspiration.',
      city: 'Delhi',
      niches: ['Fashion', 'Beauty', 'Lifestyle'],
      socialHandles: {
        instagram: 'rajpatel_style',
        youtube: 'RajStyleOfficial',
      },
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      platform: ['instagram', 'youtube'],
      tier: 'micro',
      pricing: {
        story: 600,
        reel: 2500,
        video: 4000,
        post: 1800,
      },
      verified: true,
    });

    const influencerProfile3 = await InfluencerProfile.create({
      userId: influencer3._id,
      bio: 'Travel photographer exploring hidden gems across India.',
      city: 'Bangalore',
      niches: ['Travel', 'Photography', 'Adventure'],
      socialHandles: {
        instagram: 'anitatravels',
        youtube: 'AnitaTravels',
      },
      profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
      platform: ['instagram', 'youtube'],
      tier: 'micro',
      pricing: {
        story: 400,
        reel: 1800,
        video: 3000,
        post: 1200,
      },
      verified: false,
    });

    const influencerProfile4 = await InfluencerProfile.create({
      userId: influencer4._id,
      bio: 'Fitness coach and health enthusiast. Transform your body and mind!',
      city: 'Pune',
      niches: ['Fitness', 'Health', 'Lifestyle'],
      socialHandles: {
        instagram: 'vikramfitness',
        youtube: 'VikramFitness',
      },
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      platform: ['instagram', 'youtube'],
      tier: 'nano',
      pricing: {
        story: 300,
        reel: 1000,
        video: 2000,
        post: 800,
      },
      verified: false,
    });

    const influencerProfile5 = await InfluencerProfile.create({
      userId: influencer5._id,
      bio: 'Food lover exploring flavors and sharing delicious recipes.',
      city: 'Mumbai',
      niches: ['Food', 'Cooking', 'Lifestyle'],
      socialHandles: {
        instagram: 'nehacooks',
        youtube: 'NehaCooks',
      },
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
      platform: ['instagram', 'youtube'],
      tier: 'micro',
      pricing: {
        story: 450,
        reel: 1500,
        video: 2800,
        post: 1000,
      },
      verified: true,
    });

    const campaign1 = await Campaign.create({
      brandId: brand1._id,
      title: 'TechCorp Smartphone Launch',
      description: 'Launch campaign for our new flagship smartphone with amazing camera features.',
      deliverables: '3 Instagram reels showcasing phone features, 2 YouTube review videos',
      genre: ['Technology', 'Gadgets'],
      platform: ['instagram', 'youtube'],
      budget: 15000,
      deadline: new Date('2026-05-15'),
      requirements: 'Must have genuine tech audience. Authentic content only.',
      status: 'open',
    });

    const campaign2 = await Campaign.create({
      brandId: brand2._id,
      title: 'Summer Collection 2026',
      description: 'Promote our new summer fashion collection with trendy styles.',
      deliverables: '4 Instagram reels, 6 Instagram posts, 2 YouTube videos',
      genre: ['Fashion', 'Lifestyle'],
      platform: ['instagram', 'youtube'],
      budget: 20000,
      deadline: new Date('2026-04-30'),
      requirements: 'Fashion-forward content with high engagement.',
      status: 'open',
    });

    const campaign3 = await Campaign.create({
      brandId: brand3._id,
      title: 'Mumbai Food Trail',
      description: 'Explore and review best street food spots in Mumbai.',
      deliverables: '3 Instagram reels, 2 YouTube vlogs',
      genre: ['Food', 'Travel'],
      platform: ['instagram', 'youtube'],
      budget: 12000,
      deadline: new Date('2026-05-01'),
      requirements: 'Must be based in Mumbai or willing to travel.',
      status: 'open',
    });

    const campaign4 = await Campaign.create({
      brandId: brand1._id,
      title: 'Tech Accessories Review',
      description: 'Review our new line of wireless earbuds and accessories.',
      deliverables: '1 YouTube review, 2 Instagram reels',
      genre: ['Technology', 'Gadgets'],
      platform: ['instagram', 'youtube'],
      budget: 8000,
      deadline: new Date('2026-04-25'),
      requirements: 'Tech-focused creator with minimum 10K followers.',
      status: 'open',
    });

    await Proposal.create({
      campaignId: campaign1._id,
      influencerId: influencer1._id,
      message: 'Hi! I love reviewing tech products and my audience trusts my recommendations. Would love to collaborate!',
      bidAmount: 8000,
      timeline: '2 weeks',
      status: 'pending',
    });

    await Proposal.create({
      campaignId: campaign1._id,
      influencerId: influencer2._id,
      message: 'Excited about this campaign! I can create engaging tech content.',
      bidAmount: 7000,
      timeline: '10 days',
      status: 'pending',
    });

    await Proposal.create({
      campaignId: campaign2._id,
      influencerId: influencer2._id,
      message: 'Fashion is my passion! I can showcase your summer collection beautifully.',
      bidAmount: 12000,
      timeline: '3 weeks',
      status: 'pending',
    });

    await Proposal.create({
      campaignId: campaign2._id,
      influencerId: influencer5._id,
      message: 'Love fashion content! Your collection looks amazing.',
      bidAmount: 10000,
      timeline: '2 weeks',
      status: 'pending',
    });

    await Proposal.create({
      campaignId: campaign3._id,
      influencerId: influencer3._id,
      message: 'As a travel photographer, food and travel content is my specialty!',
      bidAmount: 6000,
      timeline: '1 week',
      status: 'pending',
    });

    console.log('\n✅ Seed data created successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   Brands: ${await BrandProfile.countDocuments()}`);
    console.log(`   Influencers: ${await InfluencerProfile.countDocuments()}`);
    console.log(`   Campaigns: ${await Campaign.countDocuments()}`);
    console.log(`   Proposals: ${await Proposal.countDocuments()}`);
    console.log('\n🔑 Test Accounts:');
    console.log('   Brand: brand@techcorp.com / password123');
    console.log('   Influencer: sarah@creator.com / password123');
    console.log('   Influencer: raj@creator.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
