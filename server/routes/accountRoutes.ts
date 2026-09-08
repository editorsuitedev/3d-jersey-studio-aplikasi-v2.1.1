import { Router } from 'express';
import {
  findUserById,
  findUserByEmail,
  updateUser,
  updateUserPlan,
  toSafeUser,
} from '../services/userService';
import {
  authMiddleware,
  AuthenticatedRequest,
} from '../middleware/authMiddleware';

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

    const user = await findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }

    res.json(toSafeUser(user));
  } catch (error) {
    console.error('Error fetching account:', error);
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

    const { name, email, avatar } = req.body || {};

    const updates: { name?: string; email?: string; avatar?: string } = {};

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

    if (avatar !== undefined) {
      if (avatar !== null && typeof avatar !== 'string') {
        res.status(400).json({ error: 'Format avatar tidak valid' });
        return;
      }
      updates.avatar = avatar || '';
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
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat memperbarui akun' });
  }
});

/**
 * POST /api/account/toggle-plan
 * Toggles plan between 'free' and 'pro' for testing
 */
accountRouter.post('/toggle-plan', authMiddleware, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }

    const targetPlan = req.body?.plan || (user.plan === 'pro' ? 'free' : 'pro');
    await updateUserPlan(user.id, targetPlan);
    const updated = await findUserById(user.id);

    res.json({
      success: true,
      message: `Status paket berhasil diubah menjadi ${targetPlan.toUpperCase()}`,
      user: updated ? toSafeUser(updated) : null,
    });
  } catch (error) {
    console.error('Error toggling plan:', error);
    res.status(500).json({ error: 'Gagal mengubah paket' });
  }
});
