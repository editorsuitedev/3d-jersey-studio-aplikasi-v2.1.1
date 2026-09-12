import { Router, Request, Response } from 'express';
import { db } from '../database/db';

export const modelsRouter = Router();

/**
 * GET /api/models
 * Fetch all models with assets and tier status
 */
modelsRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const modelsWithAssets = await db.getAllModels();
    res.json(modelsWithAssets);
  } catch (error) {
    console.error('[Models] Error fetching models:', error);
    res.status(500).json({ error: 'Gagal mengambil katalog model 3D' });
  }
});

/**
 * GET /api/models/:id
 */
modelsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const model = await db.getModelById(req.params.id);
    if (!model) {
      res.status(404).json({ error: 'Model tidak ditemukan' });
      return;
    }
    res.json(model);
  } catch (error) {
    console.error('[Models] Error fetching model:', error);
    res.status(500).json({ error: 'Gagal mengambil detail model 3D' });
  }
});
