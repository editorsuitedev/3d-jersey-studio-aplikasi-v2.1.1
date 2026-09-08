import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { PaymentService } from '../services/paymentService';
import { findUserById } from '../services/userService';

export const paymentRouter = Router();

/**
 * POST /api/payment/create-intent or /api/payment/create-invoice
 * Creates a payment intent for premium PRO access via Xendit SDK
 */
const handleCreatePaymentIntent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Harap login terlebih dahulu untuk upgrade akun.' });
      return;
    }

    const user = await findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      return;
    }

    // If user is already pro, notify
    if (user.plan === 'pro') {
      res.status(400).json({ error: 'Akun Anda sudah memiliki status PRO Lifetime aktif.' });
      return;
    }

    const result = await PaymentService.createPaymentIntent({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      amount: 199000,
      description: 'EditorSuite 3D Jersey Studio Lifetime Pro Access',
    });

    if (!result.success) {
      res.status(500).json({ error: result.error || 'Gagal membuat tagihan pembayaran Xendit.' });
      return;
    }

    res.json({
      success: true,
      invoice_url: result.invoiceUrl,
      invoice_id: result.invoiceId,
      external_id: result.externalId,
      amount: result.amount,
      status: result.status,
      is_simulated: result.isSimulated,
      message: result.message,
    });
  } catch (error) {
    console.error('[Payment Router Error]:', error);
    res.status(500).json({ error: 'Terjadi kendala saat memproses tagihan pembayaran.' });
  }
};

paymentRouter.post('/create-intent', authMiddleware, handleCreatePaymentIntent);
paymentRouter.post('/create-invoice', authMiddleware, handleCreatePaymentIntent);

/**
 * POST /api/payment/webhook
 * Receives payment status callback from Xendit
 */
paymentRouter.post('/webhook', async (req, res): Promise<void> => {
  try {
    const result = await PaymentService.handleWebhook(req.headers as any, req.body);
    if (!result.success) {
      res.status(403).json({ error: result.message });
      return;
    }
    res.json({ received: true, message: result.message });
  } catch (error) {
    console.error('[Payment Webhook Error]:', error);
    res.status(500).json({ error: 'Internal webhook error' });
  }
});
