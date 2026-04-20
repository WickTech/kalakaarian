import { Router, Response } from 'express';
import { getInfluencers, getInfluencerById, searchInfluencers, updateInfluencerProfile, getTierCounts } from '../controllers/influencerController';
import { auth, optionalAuth, AuthRequest } from '../middleware/auth';
import InfluencerProfile from '../models/InfluencerProfile';

const router = Router();

router.get('/tier-counts', getTierCounts);

router.get('/', optionalAuth, getInfluencers);

router.get('/search', optionalAuth, searchInfluencers);

router.get('/:id', optionalAuth, getInfluencerById);

router.put('/profile', auth, updateInfluencerProfile);

// Heartbeat-style presence update — influencer marks self online/offline
router.put('/presence', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can update presence' });
      return;
    }
    const { isOnline } = req.body;
    const profile = await InfluencerProfile.findOneAndUpdate(
      { userId: req.user.userId },
      { isOnline: !!isOnline, lastSeenAt: new Date() },
      { new: true }
    );
    if (!profile) {
      res.status(404).json({ message: 'Influencer profile not found' });
      return;
    }
    res.json({ isOnline: profile.isOnline, lastSeenAt: profile.lastSeenAt });
  } catch (error) {
    console.error('Presence update error:', error);
    res.status(500).json({ message: 'Error updating presence' });
  }
});

router.put('/:id/image', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { profileImage } = req.body;
    const profile = await InfluencerProfile.findOneAndUpdate(
      { userId: req.params.id },
      { profileImage },
      { new: true }
    );
    res.json({ profileImage: profile?.profileImage });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading image' });
  }
});

// Only influencers can connect social accounts; profile must already exist (no upsert)
router.post('/connect-social', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can connect social accounts' });
      return;
    }

    const { platform, handle } = req.body;
    const userId = req.user.userId;

    const update = platform === 'instagram'
      ? { 'socialHandles.instagram': handle }
      : { 'socialHandles.youtube': handle };

    const profile = await InfluencerProfile.findOneAndUpdate(
      { userId },
      { $set: update },
      { new: true }
    );

    if (!profile) {
      res.status(404).json({ message: 'Influencer profile not found' });
      return;
    }

    res.json({ socialHandles: profile.socialHandles });
  } catch (error) {
    res.status(500).json({ message: 'Error connecting social media' });
  }
});

export default router;
