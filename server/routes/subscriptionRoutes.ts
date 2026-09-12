import { Router } from 'express';
import {
  getUserSubscription,
  getUserPayments,
  upgradeToPro,
  cancelSubscription,
  PRO_PLAN_PRICE_IDR,
} from '../services/subscriptionService';
import {
  authMiddleware,
  AuthenticatedRequest,
} from '../middleware/authMiddleware';
import { findUserById, toSafeUser } from '../services/userService';

export const subscriptionRouter = Router();

/**
 * GET /api/subscriptions/me
 */
subscriptionRouter.get('/me', authMiddleware, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [user, subscription, payments] = await Promise.all([
      findUserById(req.user.id),
      getUserSubscription(req.user.id),
      getUserPayments(req.user.id),
    ]);

    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }

    res.json({
      plan: user.plan,
      price_monthly_idr: PRO_PLAN_PRICE_IDR,
      subscription,
      payments,
    });
  } catch (error) {
    console.error('[Subscription] Error fetching subscription:', error);
    res.status(500).json({ error: 'Gagal mengambil data langganan' });
  }
});

/**
 * POST /api/subscriptions/upgrade
 * Upgrade to PRO — Rp249.000 / bulan
 */
subscriptionRouter.post('/upgrade', authMiddleware, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { gateway } = req.body || {};
    const result = await upgradeToPro(req.user.id, gateway || 'midtrans');

    const freshUser = await findUserById(req.user.id);

    res.json({
      success: true,
      message: 'Selamat! Akun Anda berhasil ditingkatkan ke paket PRO (Rp249.000 / bulan). Semua model jersey dan fitur ekspor kini aktif.',
      subscription: result.subscription,
      payment: result.payment,
      user: freshUser ? toSafeUser(freshUser) : null,
    });
  } catch (error: any) {
    console.error('[Subscription] Error upgrading to PRO:', error);
    res.status(500).json({ error: error.message || 'Gagal melakukan upgrade ke PRO' });
  }
});

/**
 * POST /api/subscriptions/cancel
 */
subscriptionRouter.post('/cancel', authMiddleware, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const cancelled = await cancelSubscription(req.user.id);

    res.json({
      success: true,
      message: 'Langganan PRO Anda telah dibatalkan.',
      subscription: cancelled,
    });
  } catch (error) {
    console.error('[Subscription] Error cancelling subscription:', error);
    res.status(500).json({ error: 'Gagal membatalkan langganan' });
  }
});

/**
 * GET /api/subscriptions/payments
 */
subscriptionRouter.get('/payments', authMiddleware, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const payments = await getUserPayments(req.user.id);
    res.json(payments);
  } catch (error) {
    console.error('[Subscription] Error fetching payments:', error);
    res.status(500).json({ error: 'Gagal mengambil riwayat pembayaran' });
  }
});
