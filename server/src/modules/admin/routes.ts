import { Router, RequestHandler } from 'express';
import { auth, requireSuperAdmin } from '../../middleware/auth';
import {
  getPlatformStats, listUsers, listCampaigns, updateCampaignStatus, getAuditLogs,
  suspendUser, verifyCreator, forcePresence, deleteUser, promoteSuperAdmin,
  getFeatureFlags, updateFeatureFlag,
} from './controller';

const router = Router();

// Every admin route requires a valid session + a super-admin DB check.
router.use(auth, requireSuperAdmin as RequestHandler);

// Platform stats
router.get('/stats', getPlatformStats);

// User management
router.get('/users', listUsers);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/verify', verifyCreator);
router.put('/users/:id/presence', forcePresence);
router.put('/users/:id/promote', promoteSuperAdmin);
router.delete('/users/:id', deleteUser);

// Campaigns
router.get('/campaigns', listCampaigns);
router.put('/campaigns/:id/status', updateCampaignStatus);

// Feature flags
router.get('/flags', getFeatureFlags);
router.put('/flags/:key', updateFeatureFlag);

// Audit log
router.get('/audit-logs', getAuditLogs);

export default router;
