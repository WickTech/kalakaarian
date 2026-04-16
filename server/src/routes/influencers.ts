import { Router, Request, Response } from 'express';
import { getInfluencers, getInfluencerById, searchInfluencers, updateInfluencerProfile, getTierCounts } from '../controllers/influencerController';
import { auth } from '../middleware/auth';
import { optionalAuth } from '../middleware/auth';
import InfluencerProfile from '../models/InfluencerProfile';

const router = Router();

router.get('/tier-counts', getTierCounts);

router.get('/', optionalAuth, getInfluencers);

router.get('/search', optionalAuth, searchInfluencers);

router.get('/:id', optionalAuth, getInfluencerById);

router.put('/profile', auth, updateInfluencerProfile);

router.put('/:id/image', auth, async (req: Request, res: Response) => {
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

export default router;
