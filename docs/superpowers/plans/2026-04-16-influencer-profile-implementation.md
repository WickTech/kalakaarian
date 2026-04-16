# Influencer Profile Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive Influencer Profile Page accessible from the Marketplace with analytics, premium membership, video upload, and refer & earn system.

**Architecture:** React frontend with Express backend. Profile page fetches from API, displays analytics from mock calculations, membership with mock payment flow, and video uploads stored in MongoDB.

**Tech Stack:** React 18, TypeScript, Express, MongoDB/Mongoose, Tailwind CSS, Lucide icons

---

## File Structure

```
server/src/
├── models/
│   ├── Membership.ts         (create)
│   ├── CampaignVideo.ts      (create)
│   ├── Referral.ts           (create)
│   └── InfluencerAnalytics.ts (create)
├── routes/
│   ├── membership.ts         (create)
│   ├── videos.ts             (create)
│   └── referrals.ts          (create)
└── index.ts                  (modify - add routes)

client/src/
├── pages/
│   ├── InfluencerProfile.tsx (create)
│   └── MembershipPage.tsx    (create)
├── components/
│   ├── ProfileHeader.tsx     (create)
│   ├── AnalyticsCard.tsx     (create)
│   ├── MembershipBadge.tsx   (create)
│   ├── VideoGrid.tsx         (create)
│   └── ReferralCard.tsx      (create)
└── App.tsx                   (modify - add routes)
```

---

## Task 1: Create Backend Models

**Files:**
- Create: `server/src/models/Membership.ts`
- Create: `server/src/models/CampaignVideo.ts`
- Create: `server/src/models/Referral.ts`
- Create: `server/src/models/InfluencerAnalytics.ts`

- [ ] **Step 1: Create Membership model**

```typescript
// server/src/models/Membership.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IMembership {
  influencerId: Schema.Types.ObjectId;
  tier: 'gold' | 'silver' | 'regular';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentId?: string;
}

interface IMembershipDocument extends IMembership, Document {}

const membershipSchema = new Schema(
  {
    influencerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tier: { type: String, enum: ['gold', 'silver', 'regular'], default: 'regular' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    autoRenew: { type: Boolean, default: false },
    paymentId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IMembershipDocument>('Membership', membershipSchema);
```

- [ ] **Step 2: Create CampaignVideo model**

```typescript
// server/src/models/CampaignVideo.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ICampaignVideo {
  influencerId: Schema.Types.ObjectId;
  campaignId: Schema.Types.ObjectId;
  videoUrl: string;
  platform: 'instagram' | 'youtube' | 'file' | 'drive';
  status: 'pending' | 'approved' | 'revision';
  feedback?: string;
  uploadedAt: Date;
}

interface ICampaignVideoDocument extends ICampaignVideo, Document {}

const campaignVideoSchema = new Schema(
  {
    influencerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    videoUrl: { type: String, required: true },
    platform: { type: String, enum: ['instagram', 'youtube', 'file', 'drive'], default: 'file' },
    status: { type: String, enum: ['pending', 'approved', 'revision'], default: 'pending' },
    feedback: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<ICampaignVideoDocument>('CampaignVideo', campaignVideoSchema);
```

- [ ] **Step 3: Create Referral model**

```typescript
// server/src/models/Referral.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IReferral {
  referrerId: Schema.Types.ObjectId;
  referredId: Schema.Types.ObjectId;
  referralCode: string;
  rewardType: 'gold_year' | 'silver_free' | null;
  used: boolean;
  createdAt: Date;
}

interface IReferralDocument extends IReferral, Document {}

const referralSchema = new Schema(
  {
    referrerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    referredId: { type: Schema.Types.ObjectId, ref: 'User' },
    referralCode: { type: String, required: true, unique: true },
    rewardType: { type: String, enum: ['gold_year', 'silver_free', null], default: null },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

referralSchema.index({ referralCode: 1 });
referralSchema.index({ referrerId: 1 });

export default mongoose.model<IReferralDocument>('Referral', referralSchema);
```

- [ ] **Step 4: Create InfluencerAnalytics model**

```typescript
// server/src/models/InfluencerAnalytics.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IInfluencerAnalytics {
  influencerId: Schema.Types.ObjectId;
  ER: number;              // Engagement Rate percentage
  avgViews: number;
  cpv: number;             // Cost Per View
  fakeFollowersPercent: number;
  totalFollowers: number;
  lastUpdated: Date;
}

interface IInfluencerAnalyticsDocument extends IInfluencerAnalytics, Document {}

const influencerAnalyticsSchema = new Schema(
  {
    influencerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ER: { type: Number, default: 0 },
    avgViews: { type: Number, default: 0 },
    cpv: { type: Number, default: 0 },
    fakeFollowersPercent: { type: Number, default: 0 },
    totalFollowers: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

influencerAnalyticsSchema.index({ influencerId: 1 }, { unique: true });

export default mongoose.model<IInfluencerAnalyticsDocument>('InfluencerAnalytics', influencerAnalyticsSchema);
```

- [ ] **Step 5: Commit**

```bash
git add server/src/models/Membership.ts server/src/models/CampaignVideo.ts server/src/models/Referral.ts server/src/models/InfluencerAnalytics.ts
git commit -m "feat: add membership, video, referral, and analytics models"
```

---

## Task 2: Create Backend Routes

**Files:**
- Create: `server/src/routes/membership.ts`
- Create: `server/src/routes/videos.ts`
- Create: `server/src/routes/referrals.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: Create membership routes**

```typescript
// server/src/routes/membership.ts
import { Router, Request, Response } from 'express';
import Membership from '../models/Membership';
import auth from '../middleware/auth';

const router = Router();

router.post('/purchase', auth, async (req: Request, res: Response) => {
  try {
    const { tier, paymentId } = req.body;
    const userId = (req as any).userId;

    const membership = await Membership.findOneAndUpdate(
      { influencerId: userId },
      {
        influencerId: userId,
        tier,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        autoRenew: true,
        paymentId,
      },
      { upsert: true, new: true }
    );

    res.json(membership);
  } catch (error) {
    res.status(500).json({ message: 'Error purchasing membership' });
  }
});

router.get('/status', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const membership = await Membership.findOne({ influencerId: userId });
    
    res.json(membership || { tier: 'regular' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching membership status' });
  }
});

router.put('/cancel', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    await Membership.findOneAndUpdate(
      { influencerId: userId },
      { autoRenew: false }
    );
    
    res.json({ message: 'Auto-renew cancelled' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling membership' });
  }
});

export default router;
```

- [ ] **Step 2: Create videos routes**

```typescript
// server/src/routes/videos.ts
import { Router, Request, Response } from 'express';
import CampaignVideo from '../models/CampaignVideo';
import auth from '../middleware/auth';

const router = Router();

router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const { campaignId, videoUrl, platform } = req.body;
    const userId = (req as any).userId;

    const video = new CampaignVideo({
      influencerId: userId,
      campaignId,
      videoUrl,
      platform: platform || 'file',
    });

    await video.save();
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: 'Error uploading video' });
  }
});

router.get('/campaign/:campaignId', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const videos = await CampaignVideo.find({ 
      campaignId: req.params.campaignId,
      influencerId: userId 
    });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching videos' });
  }
});

router.get('/my', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const videos = await CampaignVideo.find({ influencerId: userId })
      .populate('campaignId', 'title');
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching videos' });
  }
});

router.put('/:id/review', auth, async (req: Request, res: Response) => {
  try {
    const { status, feedback } = req.body;
    const video = await CampaignVideo.findByIdAndUpdate(
      req.params.id,
      { status, feedback },
      { new: true }
    );
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: 'Error reviewing video' });
  }
});

export default router;
```

- [ ] **Step 3: Create referrals routes**

```typescript
// server/src/routes/referrals.ts
import { Router, Request, Response } from 'express';
import Referral from '../models/Referral';
import User from '../models/User';
import auth from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

router.post('/generate', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    let referral = await Referral.findOne({ referrerId: userId });
    
    if (!referral) {
      const code = crypto.randomBytes(6).toString('hex').toUpperCase();
      referral = new Referral({
        referrerId: userId,
        referralCode: code,
      });
      await referral.save();
    }
    
    res.json({ code: referral.referralCode });
  } catch (error) {
    res.status(500).json({ message: 'Error generating referral code' });
  }
});

router.post('/use', auth, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const userId = (req as any).userId;
    
    const referral = await Referral.findOne({ referralCode: code });
    
    if (!referral) {
      return res.status(404).json({ message: 'Invalid referral code' });
    }
    
    if (referral.used || referral.referredId) {
      return res.status(400).json({ message: 'Referral already used' });
    }
    
    if (referral.referrerId.toString() === userId.toString()) {
      return res.status(400).json({ message: 'Cannot use your own referral code' });
    }
    
    referral.referredId = userId;
    referral.used = true;
    await referral.save();
    
    res.json({ message: 'Referral applied successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error using referral code' });
  }
});

router.get('/stats', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const referral = await Referral.findOne({ referrerId: userId });
    const usedCount = await Referral.countDocuments({ referrerId: userId, used: true });
    
    res.json({
      code: referral?.referralCode || null,
      usedCount,
      goldUnlocked: usedCount >= 10,
      silverUnlocked: usedCount >= 1,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching referral stats' });
  }
});

export default router;
```

- [ ] **Step 4: Register routes in index.ts**

Add to `server/src/index.ts`:
```typescript
import membershipRoutes from './routes/membership';
import videoRoutes from './routes/videos';
import referralRoutes from './routes/referrals';

app.use('/api/membership', membershipRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/referrals', referralRoutes);
```

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/membership.ts server/src/routes/videos.ts server/src/routes/referrals.ts server/src/index.ts
git commit -m "feat: add membership, video, and referral API routes"
```

---

## Task 3: Create Profile Header Component

**Files:**
- Create: `client/src/components/ProfileHeader.tsx`

- [ ] **Step 1: Create ProfileHeader component**

```tsx
// client/src/components/ProfileHeader.tsx
import { useState } from 'react';
import { Camera, MapPin, Instagram, Youtube, Wifi, WifiOff } from 'lucide-react';

interface ProfileHeaderProps {
  profile: {
    name: string;
    handle: string;
    profileImage: string;
    tier: 'gold' | 'silver' | 'regular';
    city: string;
    socialHandles?: { instagram?: string; youtube?: string };
    isOnline?: boolean;
  };
  isOwnProfile: boolean;
  onImageUpload?: (file: File) => void;
  onStatusToggle?: (isOnline: boolean) => void;
}

const tierStyles = {
  gold: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900',
  silver: 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800',
  regular: 'bg-secondary text-secondary-foreground',
};

export function ProfileHeader({ profile, isOwnProfile, onImageUpload, onStatusToggle }: ProfileHeaderProps) {
  const [isOnline, setIsOnline] = useState(profile.isOnline || false);

  const handleStatusToggle = () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    onStatusToggle?.(newStatus);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload?.(file);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Profile Image */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-border">
            <img
              src={profile.profileImage}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </div>
          {isOwnProfile && (
            <label className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
              <Camera className="w-4 h-4 text-primary-foreground" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          )}
          {/* Online Indicator */}
          {isOwnProfile && (
            <button
              onClick={handleStatusToggle}
              className="absolute top-0 right-0 p-2 rounded-full bg-card border-2 border-border hover:border-primary transition-colors"
              title={isOnline ? 'Online' : 'Offline'}
            >
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-gray-400" />
              )}
            </button>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${tierStyles[profile.tier]}`}>
              {profile.tier === 'gold' ? '★ Gold' : profile.tier === 'silver' ? '◇ Silver' : profile.tier}
            </span>
          </div>
          <p className="text-muted-foreground mb-3">{profile.handle}</p>

          <div className="flex flex-wrap gap-4 text-sm">
            {profile.city && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {profile.city}
              </span>
            )}
            {profile.socialHandles?.instagram && (
              <a
                href={`https://instagram.com/${profile.socialHandles.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-accent hover:underline"
              >
                <Instagram className="w-4 h-4" />
                {profile.socialHandles.instagram}
              </a>
            )}
            {profile.socialHandles?.youtube && (
              <a
                href={`https://youtube.com/@${profile.socialHandles.youtube}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-destructive hover:underline"
              >
                <Youtube className="w-4 h-4" />
                {profile.socialHandles.youtube}
              </a>
            )}
          </div>
        </div>

        {/* Edit Button */}
        {isOwnProfile && (
          <div className="flex items-start">
            <a
              href="/profile/edit"
              className="px-4 py-2 border border-border rounded-md hover:bg-secondary transition-colors text-sm font-medium"
            >
              Edit Profile
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ProfileHeader.tsx
git commit -m "feat: add ProfileHeader component"
```

---

## Task 4: Create Analytics Card Component

**Files:**
- Create: `client/src/components/AnalyticsCard.tsx`

- [ ] **Step 1: Create AnalyticsCard component**

```tsx
// client/src/components/AnalyticsCard.tsx
import { TrendingUp, Eye, DollarSign, Users } from 'lucide-react';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: 'er' | 'views' | 'cpv' | 'fake';
  trend?: { value: number; positive: boolean };
}

const iconMap = {
  er: TrendingUp,
  views: Eye,
  cpv: DollarSign,
  fake: Users,
};

const iconColors = {
  er: 'text-blue-500 bg-blue-500/10',
  views: 'text-purple-500 bg-purple-500/10',
  cpv: 'text-green-500 bg-green-500/10',
  fake: 'text-red-500 bg-red-500/10',
};

export function AnalyticsCard({ title, value, subtitle, icon, trend }: AnalyticsCardProps) {
  const Icon = iconMap[icon];

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${iconColors[icon]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/AnalyticsCard.tsx
git commit -m "feat: add AnalyticsCard component"
```

---

## Task 5: Create Membership Badge Component

**Files:**
- Create: `client/src/components/MembershipBadge.tsx`

- [ ] **Step 1: Create MembershipBadge component**

```tsx
// client/src/components/MembershipBadge.tsx
import { Star, Shield } from 'lucide-react';

interface MembershipBadgeProps {
  tier: 'gold' | 'silver' | 'regular';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const tierConfig = {
  gold: {
    icon: Star,
    bg: 'bg-gradient-to-r from-yellow-400 to-amber-500',
    text: 'text-yellow-900',
    border: 'border-yellow-500',
    label: 'Gold Member',
    perks: ['Top banner placement', 'Profile boost', 'Highest visibility'],
  },
  silver: {
    icon: Shield,
    bg: 'bg-gradient-to-r from-gray-300 to-gray-400',
    text: 'text-gray-800',
    border: 'border-gray-400',
    label: 'Silver Member',
    perks: ['2-3x selection chances', 'Profile visibility boost'],
  },
  regular: {
    icon: null,
    bg: 'bg-secondary',
    text: 'text-secondary-foreground',
    border: 'border-border',
    label: 'Free Member',
    perks: ['Basic profile', 'Standard visibility'],
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2',
};

export function MembershipBadge({ tier, size = 'md', showLabel = true }: MembershipBadgeProps) {
  const config = tierConfig[tier];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border ${config.bg} ${config.border} ${sizeClasses[size]}`}>
      {Icon && <Icon className={`w-4 h-4 ${config.text}`} />}
      {showLabel && <span className={`font-medium ${config.text}`}>{config.label}</span>}
    </div>
  );
}

export function MembershipUpgradeCard({ currentTier, onUpgrade }: {
  currentTier: 'gold' | 'silver' | 'regular';
  onUpgrade: (tier: 'gold' | 'silver') => void;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-lg font-semibold mb-4">Upgrade Your Membership</h3>
      
      <div className="grid gap-4 md:grid-cols-2">
        {/* Silver Plan */}
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-gray-600" />
            <span className="font-semibold">Silver</span>
            <span className="ml-auto text-sm text-muted-foreground">Free</span>
          </div>
          <ul className="text-sm space-y-1 text-muted-foreground mb-4">
            <li>✓ 2-3x selection chances</li>
            <li>✓ Profile visibility boost</li>
          </ul>
          {currentTier === 'regular' && (
            <button
              onClick={() => onUpgrade('silver')}
              className="w-full py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              Activate Silver
            </button>
          )}
        </div>

        {/* Gold Plan */}
        <div className="border border-yellow-500 rounded-lg p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-bl-lg">
            POPULAR
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-yellow-600" />
            <span className="font-semibold">Gold</span>
            <span className="ml-auto text-sm font-medium">₹149/mo</span>
          </div>
          <ul className="text-sm space-y-1 text-muted-foreground mb-4">
            <li>✓ Top banner placement</li>
            <li>✓ Profile boost</li>
            <li>✓ Highest visibility</li>
          </ul>
          {currentTier !== 'gold' && (
            <button
              onClick={() => onUpgrade('gold')}
              className="w-full py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 rounded-md hover:opacity-90 transition-opacity text-sm font-medium"
            >
              Upgrade to Gold
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Cancel anytime. Auto-renews monthly.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/MembershipBadge.tsx
git commit -m "feat: add MembershipBadge and upgrade components"
```

---

## Task 6: Create Video Grid Component

**Files:**
- Create: `client/src/components/VideoGrid.tsx`

- [ ] **Step 1: Create VideoGrid component**

```tsx
// client/src/components/VideoGrid.tsx
import { useState } from 'react';
import { Upload, Play, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Video {
  _id: string;
  videoUrl: string;
  platform: 'instagram' | 'youtube' | 'file' | 'drive';
  status: 'pending' | 'approved' | 'revision';
  feedback?: string;
  campaignId?: { title: string };
  uploadedAt: string;
}

interface VideoGridProps {
  videos: Video[];
  isOwnProfile: boolean;
  onUpload: (videoUrl: string, platform: string, campaignId?: string) => void;
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-500 bg-yellow-500/10', label: 'Pending Review' },
  approved: { icon: CheckCircle, color: 'text-green-500 bg-green-500/10', label: 'Approved' },
  revision: { icon: XCircle, color: 'text-red-500 bg-red-500/10', label: 'Needs Revision' },
};

export function VideoGrid({ videos, isOwnProfile, onUpload }: VideoGridProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [platform, setPlatform] = useState<'instagram' | 'youtube' | 'file' | 'drive'>('file');

  const handleUpload = () => {
    if (videoUrl) {
      onUpload(videoUrl, platform);
      setVideoUrl('');
      setUploadOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Uploaded Videos</h2>
        {isOwnProfile && (
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Campaign Video</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Video URL / Link</label>
                  <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Platform</label>
                  <div className="flex gap-2">
                    {(['instagram', 'youtube', 'file', 'drive'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPlatform(p)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          platform === p
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleUpload} className="w-full">
                  Upload
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No videos uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map((video) => {
            const status = statusConfig[video.status];
            const StatusIcon = status.icon;
            
            return (
              <div key={video._id} className="relative group">
                <div className="aspect-video bg-card rounded-lg border border-border overflow-hidden">
                  {video.platform === 'file' ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-muted-foreground" />
                    </div>
                  ) : (
                    <img
                      src={video.videoUrl}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                    >
                      <ExternalLink className="w-5 h-5 text-white" />
                    </a>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </div>

                {/* Feedback */}
                {video.feedback && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{video.feedback}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/VideoGrid.tsx
git commit -m "feat: add VideoGrid component for campaign videos"
```

---

## Task 7: Create Referral Card Component

**Files:**
- Create: `client/src/components/ReferralCard.tsx`

- [ ] **Step 1: Create ReferralCard component**

```tsx
// client/src/components/ReferralCard.tsx
import { useState } from 'react';
import { Copy, Gift, Users, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ReferralStats {
  code: string | null;
  usedCount: number;
  goldUnlocked: boolean;
  silverUnlocked: boolean;
}

interface ReferralCardProps {
  stats: ReferralStats;
  isOwnProfile: boolean;
  onGenerateCode: () => void;
  onUseCode: (code: string) => void;
}

export function ReferralCard({ stats, isOwnProfile, onGenerateCode, onUseCode }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  const handleCopy = async () => {
    if (stats.code) {
      await navigator.clipboard.writeText(stats.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUseCode = () => {
    if (referralCode) {
      onUseCode(referralCode);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Refer & Earn</h2>
      </div>

      {isOwnProfile ? (
        <>
          {/* Show referral code if exists */}
          {stats.code ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-secondary rounded-md font-mono text-lg text-center">
                  {stats.code}
                </div>
                <Button onClick={handleCopy} variant="outline" size="sm">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{stats.usedCount}</p>
                  <p className="text-xs text-muted-foreground">Referrals</p>
                </div>
                <div>
                  <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center ${stats.silverUnlocked ? 'bg-gray-400' : 'bg-gray-200'}`}>
                    {stats.silverUnlocked && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Silver Unlocked</p>
                </div>
                <div>
                  <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center ${stats.goldUnlocked ? 'bg-yellow-500' : 'bg-gray-200'}`}>
                    {stats.goldUnlocked && <Star className="w-4 h-4 text-white" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Gold Unlocked</p>
                </div>
              </div>

              {/* Rewards Info */}
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• 10 Gold referrals = 1 free year Gold membership</p>
                <p>• Silver referrals = free Silver membership</p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <Users className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Generate your referral code and share with friends</p>
              <Button onClick={onGenerateCode} className="w-full">
                Generate Referral Code
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Use referral code */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Have a referral code? Enter it below:</p>
            <div className="flex gap-2">
              <Input
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="font-mono"
              />
              <Button onClick={handleUseCode}>Apply</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ReferralCard.tsx
git commit -m "feat: add ReferralCard component"
```

---

## Task 8: Create InfluencerProfile Page

**Files:**
- Create: `client/src/pages/InfluencerProfile.tsx`
- Modify: `client/src/App.tsx`
- Modify: `client/src/lib/api.ts`

- [ ] **Step 1: Add API methods to api.ts**

Add to `client/src/lib/api.ts`:

```typescript
// Membership
getMembershipStatus: async (): Promise<{ tier: string }> => {
  return request<{ tier: string }>('/api/membership/status');
},

purchaseMembership: async (tier: string): Promise<any> => {
  return request<any>('/api/membership/purchase', {
    method: 'POST',
    body: JSON.stringify({ tier }),
  });
},

cancelMembership: async (): Promise<void> => {
  return request<void>('/api/membership/cancel', { method: 'PUT' });
},

// Videos
getMyVideos: async (): Promise<any[]> => {
  return request<any[]>('/api/videos/my');
},

uploadVideo: async (videoUrl: string, platform: string, campaignId?: string): Promise<any> => {
  return request<any>('/api/videos', {
    method: 'POST',
    body: JSON.stringify({ videoUrl, platform, campaignId }),
  });
},

// Referrals
generateReferralCode: async (): Promise<{ code: string }> => {
  return request<{ code: string }>('/api/referrals/generate', { method: 'POST' });
},

useReferralCode: async (code: string): Promise<any> => {
  return request<any>('/api/referrals/use', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
},

getReferralStats: async (): Promise<{ code: string | null; usedCount: number; goldUnlocked: boolean; silverUnlocked: boolean }> => {
  return request('/api/referrals/stats');
},
```

- [ ] **Step 2: Create InfluencerProfile page**

```tsx
// client/src/pages/InfluencerProfile.tsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ProfileHeader } from '@/components/ProfileHeader';
import { AnalyticsCard } from '@/components/AnalyticsCard';
import { MembershipBadge, MembershipUpgradeCard } from '@/components/MembershipBadge';
import { VideoGrid } from '@/components/VideoGrid';
import { ReferralCard } from '@/components/ReferralCard';

export default function InfluencerProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [membership, setMembership] = useState<{ tier: string }>({ tier: 'regular' });
  const [analytics, setAnalytics] = useState({ ER: 0, avgViews: 0, cpv: 0, fakeFollowersPercent: 0 });
  const [videos, setVideos] = useState<any[]>([]);
  const [referralStats, setReferralStats] = useState({ code: null as string | null, usedCount: 0, goldUnlocked: false, silverUnlocked: false });
  const [loading, setLoading] = useState(true);

  const isOwnProfile = user?._id === id || user?.role === 'influencer';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, membershipData, videosData, referralData] = await Promise.all([
          api.getInfluencerById(id!),
          isOwnProfile ? api.getMembershipStatus() : Promise.resolve({ tier: 'regular' }),
          isOwnProfile ? api.getMyVideos() : Promise.resolve([]),
          isOwnProfile ? api.getReferralStats() : Promise.resolve({ code: null, usedCount: 0, goldUnlocked: false, silverUnlocked: false }),
        ]);

        setProfile(profileData);
        setMembership(membershipData);
        setVideos(videosData);
        setReferralStats(referralData);

        // Mock analytics (in real app, this would come from API)
        setAnalytics({
          ER: Math.floor(Math.random() * 8) + 2,
          avgViews: Math.floor(Math.random() * 50000) + 5000,
          cpv: (Math.random() * 0.5 + 0.1).toFixed(2) as any,
          fakeFollowersPercent: Math.floor(Math.random() * 15) + 5,
        });
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, isOwnProfile]);

  const handleStatusToggle = async (isOnline: boolean) => {
    // API call to update status
    console.log('Status toggled:', isOnline);
  };

  const handleMembershipUpgrade = async (tier: 'gold' | 'silver') => {
    try {
      await api.purchaseMembership(tier);
      setMembership({ tier });
      toast({ title: 'Success', description: `Upgraded to ${tier} membership!` });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to upgrade membership', variant: 'destructive' });
    }
  };

  const handleVideoUpload = async (videoUrl: string, platform: string) => {
    try {
      const newVideo = await api.uploadVideo(videoUrl, platform);
      setVideos([newVideo, ...videos]);
      toast({ title: 'Success', description: 'Video uploaded successfully' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to upload video', variant: 'destructive' });
    }
  };

  const handleGenerateReferral = async () => {
    try {
      const { code } = await api.generateReferralCode();
      setReferralStats({ ...referralStats, code });
      toast({ title: 'Success', description: 'Referral code generated!' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to generate code', variant: 'destructive' });
    }
  };

  const handleUseReferral = async (code: string) => {
    try {
      await api.useReferralCode(code);
      toast({ title: 'Success', description: 'Referral code applied!' });
    } catch (err) {
      toast({ title: 'Error', description: 'Invalid or already used code', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p>Influencer not found</p>
        <Link to="/marketplace" className="text-primary hover:underline">Back to Marketplace</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 border border-border rounded-md hover:bg-secondary">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold">Profile</h1>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Profile Header */}
        <ProfileHeader
          profile={{
            name: profile.name || 'Unknown',
            handle: `@${profile.socialHandles?.instagram || profile.username || 'user'}`,
            profileImage: profile.profileImage || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
            tier: membership.tier as 'gold' | 'silver' | 'regular',
            city: profile.city,
            socialHandles: profile.socialHandles,
          }}
          isOwnProfile={isOwnProfile}
          onStatusToggle={handleStatusToggle}
        />

        {/* Analytics Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Analytics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnalyticsCard
              title="Engagement Rate"
              value={`${analytics.ER}%`}
              icon="er"
            />
            <AnalyticsCard
              title="Avg Views"
              value={analytics.avgViews.toLocaleString()}
              icon="views"
            />
            <AnalyticsCard
              title="Cost Per View"
              value={`₹${analytics.cpv}`}
              icon="cpv"
            />
            <AnalyticsCard
              title="Fake Followers"
              value={`${analytics.fakeFollowersPercent}%`}
              subtitle="Estimated"
              icon="fake"
            />
          </div>
        </div>

        {/* Membership Section */}
        {isOwnProfile && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Membership</h2>
            <MembershipUpgradeCard
              currentTier={membership.tier as 'gold' | 'silver' | 'regular'}
              onUpgrade={handleMembershipUpgrade}
            />
          </div>
        )}

        {/* Videos Section */}
        <VideoGrid
          videos={videos}
          isOwnProfile={isOwnProfile}
          onUpload={handleVideoUpload}
        />

        {/* Referral Section */}
        <ReferralCard
          stats={referralStats}
          isOwnProfile={isOwnProfile}
          onGenerateCode={handleGenerateReferral}
          onUseCode={handleUseReferral}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add route to App.tsx**

Add import and route:

```tsx
import InfluencerProfile from './pages/InfluencerProfile';

// Add route in App.tsx
<Route
  path="/influencer/:id"
  element={<InfluencerProfile />}
/>
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/InfluencerProfile.tsx client/src/App.tsx client/src/lib/api.ts
git commit -m "feat: add InfluencerProfile page with all components"
```

---

## Task 9: Update InfluencerCard to Navigate to Profile

**Files:**
- Modify: `client/src/components/InfluencerCard.tsx`

- [ ] **Step 1: Update InfluencerCard to navigate**

```tsx
// Add useNavigate import
import { useNavigate } from 'react-router-dom';

// Add navigate hook
const navigate = useNavigate();

// Modify the card click handler
<div 
  className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all group animate-scale-in cursor-pointer"
  onClick={() => navigate(`/influencer/${influencer.id}`)}
>
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/InfluencerCard.tsx
git commit -m "feat: add navigation to influencer profile on card click"
```

---

## Task 10: Add Profile Image Upload API

**Files:**
- Modify: `server/src/routes/influencers.ts`

- [ ] **Step 1: Add image upload endpoint**

Add to influencers routes:
```typescript
router.put('/:id/image', auth, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    const profile = await InfluencerProfile.findOneAndUpdate(
      { userId: req.params.id },
      { profileImage: imageUrl },
      { new: true }
    );
    
    res.json({ profileImage: imageUrl });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading image' });
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add server/src/routes/influencers.ts
git commit -m "feat: add profile image upload endpoint"
```

---

## Summary

**Files Created:** 10
**Files Modified:** 3
**Tasks:** 10

### Completed Features
1. ✅ Backend models (Membership, CampaignVideo, Referral, InfluencerAnalytics)
2. ✅ Backend routes (membership, videos, referrals)
3. ✅ ProfileHeader component
4. ✅ AnalyticsCard component
5. ✅ MembershipBadge component
6. ✅ VideoGrid component
7. ✅ ReferralCard component
8. ✅ InfluencerProfile page
9. ✅ InfluencerCard navigation
10. ✅ Profile image upload API
