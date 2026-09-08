import { Xendit } from 'xendit-node';
import { updateUserPlan, findUserById } from './userService';

export interface CreatePaymentIntentParams {
  userId: string;
  userEmail: string;
  userName: string;
  amount?: number;
  description?: string;
}

export interface PaymentIntentResult {
  success: boolean;
  invoiceUrl?: string;
  invoiceId?: string;
  externalId: string;
  amount: number;
  status: string;
  isSimulated?: boolean;
  message?: string;
  error?: string;
}

export class PaymentService {
  private static xenditClient: Xendit | null = null;

  /**
   * Lazily initializes Xendit SDK client
   */
  private static getXenditClient(): Xendit | null {
    if (this.xenditClient) {
      return this.xenditClient;
    }

    const secretKey = process.env.XENDIT_SECRET_KEY;
    if (!secretKey || secretKey.trim().length === 0) {
      return null;
    }

    this.xenditClient = new Xendit({
      secretKey: secretKey.trim(),
    });

    return this.xenditClient;
  }

  /**
   * Creates a payment intent / invoice using the Xendit SDK
   */
  public static async createPaymentIntent(
    params: CreatePaymentIntentParams
  ): Promise<PaymentIntentResult> {
    const { userId, userEmail, userName } = params;
    const amount = params.amount || 199000; // IDR 199.000 for Lifetime PRO
    const description = params.description || 'EditorSuite 3D Jersey Studio Lifetime Pro Access';
    const externalId = `INV-ESPRO-${userId}-${Date.now()}`;
    const appUrl = process.env.APP_URL || 'https://editorsuite.cloud';

    const client = this.getXenditClient();

    // If Xendit Secret Key is not configured, gracefully run in test simulation mode
    if (!client) {
      console.warn('[PaymentService Warning] XENDIT_SECRET_KEY is not set in environment. Running in simulated mode.');
      return {
        success: true,
        isSimulated: true,
        invoiceUrl: `${appUrl}/studio?payment_simulated=true`,
        externalId,
        amount,
        status: 'PENDING',
        message: 'Mode simulasi pembayaran (XENDIT_SECRET_KEY belum diisi pada .env).',
      };
    }

    try {
      console.log(`[PaymentService] Creating Xendit invoice for user ${userId} (${userEmail})`);

      const response = await client.Invoice.createInvoice({
        data: {
          externalId,
          amount,
          description,
          invoiceDuration: 86400, // 24 hours
          payerEmail: userEmail,
          customer: {
            givenNames: userName,
            email: userEmail,
          },
          successRedirectUrl: `${appUrl}/studio?payment=success`,
          failureRedirectUrl: `${appUrl}/studio?payment=failed`,
          currency: 'IDR',
          paymentMethods: [
            'QRIS',
            'BCA',
            'BNI',
            'BRI',
            'MANDIRI',
            'PERMATA',
            'OVO',
            'DANA',
            'SHOPEEPAY',
            'LINKAJA',
          ],
        },
      });

      console.log(`[PaymentService] Xendit Invoice created successfully: ${response.id}, URL: ${response.invoiceUrl}`);

      return {
        success: true,
        invoiceUrl: response.invoiceUrl,
        invoiceId: response.id,
        externalId: response.externalId || externalId,
        amount: response.amount || amount,
        status: response.status || 'PENDING',
      };
    } catch (error: any) {
      console.error('[PaymentService Error] Failed to create Xendit invoice via SDK:', error?.message || error);
      return {
        success: false,
        externalId,
        amount,
        status: 'FAILED',
        error: error?.message || 'Gagal membuat tagihan pembayaran melalui Xendit SDK',
      };
    }
  }

  /**
   * Validates webhook callback token and updates user plan to 'pro' if settled
   */
  public static async handleWebhook(
    headers: Record<string, string | string[] | undefined>,
    body: any
  ): Promise<{ success: boolean; message: string }> {
    const callbackToken = (headers['x-callback-token'] || headers['X-Callback-Token']) as string | undefined;
    const expectedToken = process.env.XENDIT_WEBHOOK_VERIFICATION_TOKEN;

    if (expectedToken && callbackToken !== expectedToken) {
      console.warn('[PaymentService Webhook] Invalid x-callback-token verification attempt');
      return { success: false, message: 'Invalid callback verification token' };
    }

    const { status, external_id } = body || {};
    console.log(`[PaymentService Webhook] Received status "${status}" for ${external_id}`);

    if (status === 'PAID' || status === 'SETTLED') {
      const parts = (external_id || '').split('-');
      // Format: INV-ESPRO-<userId>-<timestamp>
      if (parts.length >= 3) {
        const userId = parts[2];
        const user = await findUserById(userId);
        if (user) {
          await updateUserPlan(userId, 'pro');
          console.log(`[PaymentService Webhook] Upgraded user ${userId} (${user.email}) to PRO successfully.`);
          return { success: true, message: `User ${userId} upgraded to PRO` };
        }
      }
    }

    return { success: true, message: 'Webhook event processed' };
  }

  /**
   * Retrieves an invoice by ID from Xendit
   */
  public static async getInvoiceStatus(invoiceId: string) {
    const client = this.getXenditClient();
    if (!client) {
      return null;
    }
    try {
      return await client.Invoice.getInvoiceById({ invoiceId });
    } catch (error) {
      console.error('[PaymentService] Failed to retrieve invoice:', error);
      return null;
    }
  }
}
