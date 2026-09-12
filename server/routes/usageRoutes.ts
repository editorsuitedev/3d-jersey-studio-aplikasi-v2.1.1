import { Router } from 'express';
import { db } from '../database/db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';

export const usageRouter = Router();

/**
 * POST /api/usage
 * Log editor actions into usage table
 */
usageRouter.post('/', authMiddleware, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { model_id, action, metadata } = req.body || {};
    if (!action) {
      res.status(400).json({ error: 'Action wajib disertakan' });
      return;
    }

    const record = await db.logUsage({
      user_id: req.user.id,
      model_id: model_id || 'system',
      action,
      metadata: metadata || {},
    });

    res.json({ success: true, record });
  } catch (error) {
    console.error('[Usage] Error logging usage:', error);
    res.status(500).json({ error: 'Gagal mencatat penggunaan' });
  }
});
