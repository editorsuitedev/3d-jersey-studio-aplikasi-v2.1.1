import { db, ExportHistoryRecord } from '../database/db';
import { findUserById } from './userService';

export interface ExportRequestPayload {
  type: 'image' | 'video' | 'glb' | 'svg';
  format: string; // 'png', 'jpg', 'mp4', 'webm'
  resolution: string; // '16:9', '1:1', '9:16', '4:5', '4K'
  model_id: string;
  download_url?: string;
}

export async function processExportRequest(
  userId: string,
  payload: ExportRequestPayload
): Promise<{
  allowed: boolean;
  error?: string;
  record: ExportHistoryRecord;
}> {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Freemium SaaS Rule:
  // FREE plan users CANNOT perform any export (Image, Video 360, GLB/SVG).
  // PRO plan users can export all images, videos in all aspect ratios.
  if (user.plan !== 'pro') {
    const blockedRecord = await db.logExport({
      user_id: userId,
      type: payload.type,
      format: payload.format,
      resolution: payload.resolution,
      status: 'blocked_free_plan',
      download_url: null,
    });

    await db.logUsage({
      user_id: userId,
      model_id: payload.model_id || 'unknown',
      action: 'export_blocked_free_plan',
      metadata: {
        type: payload.type,
        format: payload.format,
        resolution: payload.resolution,
        reason: 'Export not allowed on Free plan',
      },
    });

    return {
      allowed: false,
      error: 'Fitur Export hanya tersedia untuk pelanggan PRO (Rp249.000 / bulan). Upgrade sekarang untuk membuka export 4K image dan 360° video turntable.',
      record: blockedRecord,
    };
  }

  // PRO User: Export allowed
  const completedRecord = await db.logExport({
    user_id: userId,
    type: payload.type,
    format: payload.format,
    resolution: payload.resolution,
    status: 'completed',
    download_url: payload.download_url || null,
  });

  await db.logUsage({
    user_id: userId,
    model_id: payload.model_id || 'unknown',
    action: `export_${payload.type}`,
    metadata: {
      type: payload.type,
      format: payload.format,
      resolution: payload.resolution,
      status: 'completed',
    },
  });

  return {
    allowed: true,
    record: completedRecord,
  };
}

export async function getUserExportHistory(userId: string, limit?: number): Promise<ExportHistoryRecord[]> {
  const records = await db.getExportHistoryByUserId(userId);
  return typeof limit === 'number' ? records.slice(0, limit) : records;
}
