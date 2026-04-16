import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import serverless from 'serverless-http';
import authRoutes from './routes/auth';
import influencerRoutes from './routes/influencers';
import campaignRoutes from './routes/campaigns';
import proposalRoutes from './routes/proposals';
import cartRoutes from './routes/cart';
import messageRoutes from './routes/messages';
import analyticsRoutes from './routes/analytics';
import membershipRoutes from './routes/membership';
import videoRoutes from './routes/videos';
import referralRoutes from './routes/referrals';
import campaignFilesRoutes from './routes/campaignFiles';
import campaignWorkflowRoutes from './routes/campaignWorkflow';

dotenv.config();

let isConnected = false;
let connectionPromise: Promise<void> | null = null;

const connectDB = async (): Promise<void> => {
  if (isConnected) return;
  
  if (connectionPromise) return connectionPromise;
  
  connectionPromise = (async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI!, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      isConnected = true;
      console.log('MongoDB connected');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      connectionPromise = null;
    }
  })();
  
  return connectionPromise;
};

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://kalakaarian.vercel.app',
  ].concat(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(async (req, res, next) => {
  if (!process.env.MONGODB_URI) {
    console.log('No MONGODB_URI, skipping DB connection');
    return next();
  }
  try {
    await Promise.race([
      connectDB(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB connection timeout')), 3000))
    ]);
  } catch (e) {
    console.error('DB connection timed out, continuing anyway');
  }
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', dbConnected: isConnected });
});

app.get('/debug/cors', (req, res) => {
  res.json({
    origin: req.headers.origin,
    corsOrigin: process.env.CORS_ORIGIN,
    dbConnected: isConnected,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/influencers', influencerRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/campaigns', campaignFilesRoutes);
app.use('/api/campaigns', campaignWorkflowRoutes);

const handler = serverless(app);
export { handler };