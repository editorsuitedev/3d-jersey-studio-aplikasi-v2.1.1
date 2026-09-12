import { Router } from 'express';
import {
  findUserById,
  findUserByEmail,
  updateUser,
  toSafeUser,
} from '../services/userService';
import {
  authMiddleware,
  AuthenticatedRequest,
} from '../middleware/authMiddleware';
import { getUserSubscription, getUserPayments } from '../services/subscriptionService';
import { getUserExportHistory } from '../services/exportService';

export const accountRouter = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * GET /api/account
 */
accountRouter.get('/', authMiddleware, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [user, subscription, payments, exportHistory] = await Promise.all([
      findUserById(req.user.id),
      getUserSubscription(req.user.id),
      getUserPayments(req.user.id),
      getUserExportHistory(req.user.id, 10),
    ]);

    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }

    res.json({
      user: toSafeUser(user),
      subscription,
      payments,
      exportHistory,
    });
  } catch (error) {
    console.error('[Account] Error fetching account:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat mengambil data akun' });
  }
});

/**
 * PATCH /api/account
 */
accountRouter.patch('/', authMiddleware, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, email } = req.body || {};

    const updates: { name?: string; email?: string } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        res.status(400).json({ error: 'Nama minimal harus 2 karakter' });
        return;
      }
      updates.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
        res.status(400).json({ error: 'Format email tidak valid' });
        return;
      }
      const normalizedEmail = email.trim().toLowerCase();

      // Check if new email is already taken by another user
      const existing = await findUserByEmail(normalizedEmail);
      if (existing && existing.id !== req.user.id) {
        res.status(400).json({ error: 'Email sudah digunakan oleh akun lain' });
        return;
      }
      updates.email = normalizedEmail;
    }

    const updatedUser = await updateUser(req.user.id, updates);
    if (!updatedUser) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }

    res.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      user: updatedUser,
    });
  } catch (error) {
    console.error('[Account] Error updating account:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat memperbarui akun' });
  }
});
