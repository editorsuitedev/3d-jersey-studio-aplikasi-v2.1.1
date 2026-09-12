import { Router } from 'express';
import {
  processExportRequest,
  getUserExportHistory,
} from '../services/exportService';
import {
  authMiddleware,
  AuthenticatedRequest,
} from '../middleware/authMiddleware';

export const exportRouter = Router();

/**
 * POST /api/export
 * Process and record export request
 */
exportRouter.post('/', authMiddleware, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { type, format, resolution, model_id, download_url } = req.body || {};

    if (!type || !format || !resolution) {
      res.status(400).json({ error: 'type, format, dan resolution wajib disertakan' });
      return;
    }

    const result = await processExportRequest(req.user.id, {
      type,
      format,
      resolution,
      model_id: model_id || '01-o-neck',
      download_url,
    });

    if (!result.allowed) {
      res.status(403).json({
        allowed: false,
        error: result.error,
        code: 'PRO_SUBSCRIPTION_REQUIRED',
        record: result.record,
      });
      return;
    }

    res.json({
      allowed: true,
      message: 'Ekspor berhasil dicatat',
      record: result.record,
    });
  } catch (error: any) {
    console.error('[Export] Error processing export:', error);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan saat memproses ekspor' });
  }
});

/**
 * GET /api/export/history
 */
exportRouter.get('/history', authMiddleware, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const history = await getUserExportHistory(req.user.id);
    res.json(history);
  } catch (error) {
    console.error('[Export] Error fetching export history:', error);
    res.status(500).json({ error: 'Gagal mengambil riwayat ekspor' });
  }
});
