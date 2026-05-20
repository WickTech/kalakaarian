import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as service from './service';
import type { AdminResult } from './service';
import type { ListUsersQuery } from './types';

// Thin HTTP handlers for the admin domain. All routes are already guarded by
// `auth` + `requireSuperAdmin` at the router level.

// Maps a service AdminResult onto the HTTP response.
const sendResult = (res: Response, result: AdminResult, extra?: Record<string, unknown>): void => {
  if (result.kind === 'error') {
    res.status(result.status).json({ message: result.message });
    return;
  }
  res.json({ message: result.message, ...extra });
};

export const getPlatformStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json(await service.getStats());
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({ users: await service.listUsers(req.query as ListUsersQuery) });
  } catch {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

export const listCampaigns = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({ campaigns: await service.listCampaigns() });
  } catch {
    res.status(500).json({ message: 'Failed to fetch campaigns' });
  }
};

export const getAuditLogs = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({ logs: await service.getAuditLogs() });
  } catch {
    res.status(500).json({ message: 'Failed to fetch logs' });
  }
};

export const getFeatureFlags = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({ flags: await service.getFeatureFlags() });
  } catch {
    res.status(500).json({ message: 'Failed to fetch flags' });
  }
};

export const updateCampaignStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await service.updateCampaignStatus(
      req.user!.userId, req.params.id, req.body.status, req.ip,
    );
    sendResult(res, result);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const suspendUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await service.suspendUser(
      req.user!.userId, req.params.id, req.body.suspend, req.ip,
    );
    sendResult(res, result);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyCreator = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await service.verifyCreator(
      req.user!.userId, req.params.id, req.body.verified, req.ip,
    );
    sendResult(res, result);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const forcePresence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await service.forcePresence(
      req.user!.userId, req.params.id, req.body.online, req.ip,
    );
    sendResult(res, result);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await service.deleteUser(req.user!.userId, req.params.id, req.ip);
    sendResult(res, result);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const promoteSuperAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await service.promoteSuperAdmin(
      req.user!.userId, req.params.id, req.body.promote, req.ip,
    );
    sendResult(res, result);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateFeatureFlag = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { enabled } = req.body;
    const result = await service.updateFeatureFlag(
      req.user!.userId, req.params.key, enabled, req.ip,
    );
    sendResult(res, result, result.kind === 'ok' ? { key: req.params.key, enabled } : undefined);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
