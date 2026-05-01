import { Router } from 'express';
import {
  getInfluencers, getInfluencerById, searchInfluencers,
  updateInfluencerProfile, getTierCounts, getOwnProfile,
  updatePresence, updateProfileImage, connectSocial,
} from '../controllers/influencerController';
import { auth, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/tier-counts', getTierCounts);
router.get('/', optionalAuth, getInfluencers);
router.get('/search', optionalAuth, searchInfluencers);
router.get('/profile', auth, getOwnProfile);
router.get('/:id', optionalAuth, getInfluencerById);
router.put('/profile', auth, updateInfluencerProfile);
router.put('/presence', auth, updatePresence);
router.put('/:id/image', auth, updateProfileImage);
router.post('/connect-social', auth, connectSocial);

export default router;
