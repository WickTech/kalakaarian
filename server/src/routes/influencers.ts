import { Router } from 'express';
import {
  getInfluencers, getInfluencerById, searchInfluencers,
  updateInfluencerProfile, getTierCounts, getOwnProfile,
  updatePresence, updateProfileImage, connectSocial, updateGallery,
} from '../controllers/influencerController';
import { syncAllInstagramAvatars } from '../controllers/avatarSyncController';
import { getInfluencerRatings } from '../controllers/ratingController';
import { getSimilarInfluencers } from '../controllers/similarInfluencersController';
import { auth, optionalAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/tier-counts', getTierCounts);
router.get('/', optionalAuth, getInfluencers);
router.get('/search', optionalAuth, searchInfluencers);
router.get('/profile', auth, getOwnProfile);
router.get('/:id/ratings', getInfluencerRatings);
router.get('/:id/similar', optionalAuth, getSimilarInfluencers);
router.get('/:id', optionalAuth, getInfluencerById);
router.put('/profile', auth, updateInfluencerProfile);
router.put('/presence', auth, updatePresence);
router.put('/gallery', auth, updateGallery);
router.put('/:id/image', auth, updateProfileImage);
router.post('/connect-social', auth, connectSocial);
router.post('/sync-avatars', auth, requireAdmin as any, syncAllInstagramAvatars);

export default router;
