import { Router } from 'express';
import { getInfluencers, getInfluencerById, searchInfluencers, updateInfluencerProfile } from '../controllers/influencerController';
import { auth } from '../middleware/auth';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, getInfluencers);

router.get('/search', optionalAuth, searchInfluencers);

router.get('/:id', optionalAuth, getInfluencerById);

router.put('/profile', auth, updateInfluencerProfile);

export default router;
