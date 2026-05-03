import './env'; // MUST be first — loads dotenv before Supabase client initializes
import * as Sentry from '@sentry/node';
import express from 'express';
import cors from 'cors';
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
import campaignFilesRoutes from './routes/campaignFiles';
import notificationRoutes from './routes/notifications';
import campaignWorkflowRoutes from './routes/campaignWorkflow';
import whatsappRoutes from './routes/whatsapp';
import socialStatsRoutes from './routes/socialStats';
import contactRoutes from './routes/contact';
import uploadRoutes from './routes/upload';
import feedRoutes from './routes/feed';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.2,
  });
}

// Fail fast on boot if truly critical env vars are missing
(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const).forEach((k) => {
  if (!process.env[k]) throw new Error(`Missing required env var: ${k}`);
});
if (!process.env.CORS_ORIGINS) {
  console.warn('CORS_ORIGINS not set — all browser origins will be blocked');
}

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
const isDev = process.env.NODE_ENV !== 'production';
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // server-to-server, curl
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // Allow any localhost port in dev (Vite may pick 5173, 5174, etc.)
    if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  credentials: true,
}));

// Raw body for Razorpay webhook signature verification (must precede express.json())
app.use('/api/membership/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
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
app.use('/api/campaigns', campaignFilesRoutes);
app.use('/api/campaigns', campaignWorkflowRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/social', socialStatsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/feed', feedRoutes);

if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

const handler = serverless(app);

if (process.env.LOCAL_LISTEN === '1') {
  const port = Number(process.env.PORT) || 4000;
  app.listen(port, () => console.log(`local: http://localhost:${port}`));
}

export { handler };
