import crypto from 'crypto';
import { db, SubscriptionRecord, PaymentRecord } from '../database/db';
import { findUserById, updateUser } from './userService';

export const PRO_PLAN_PRICE_IDR = 249000; // Rp249.000 / bulan

export async function getUserSubscription(userId: string): Promise<SubscriptionRecord | null> {
  return db.findSubscriptionByUserId(userId);
}

export async function getUserPayments(userId: string): Promise<PaymentRecord[]> {
  return db.getPaymentsByUserId(userId);
}

export async function upgradeToPro(
  userId: string,
  gateway: string = 'midtrans'
): Promise<{
  subscription: SubscriptionRecord;
  payment: PaymentRecord;
}> {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const invoiceId = `INV-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const paymentId = `PAY-${crypto.randomUUID().slice(0, 8)}`;

  // 1. Create or update subscription record for 30 days
  const subscription = await db.createOrUpdateSubscription(userId, {
    plan: 'pro',
    status: 'active',
    gateway,
    gateway_customer_id: `CUST-${userId.slice(0, 8)}`,
    gateway_subscription_id: `SUB-${crypto.randomUUID().slice(0, 8)}`,
    days: 30,
  });

  // 2. Create payment record
  const payment = await db.createPayment({
    user_id: userId,
    subscription_id: subscription.id,
    gateway,
    invoice_id: invoiceId,
    payment_id: paymentId,
    amount: PRO_PLAN_PRICE_IDR,
    currency: 'IDR',
    status: 'settlement',
  });

  // 3. Update user plan
  await updateUser(userId, { plan: 'pro' });

  // 4. Log usage
  await db.logUsage({
    user_id: userId,
    model_id: 'system',
    action: 'subscribe_pro',
    metadata: {
      invoice_id: invoiceId,
      amount: PRO_PLAN_PRICE_IDR,
      gateway,
    },
  });

  return { subscription, payment };
}

export async function cancelSubscription(userId: string): Promise<SubscriptionRecord | null> {
  const sub = await db.cancelSubscription(userId);
  await db.logUsage({
    user_id: userId,
    model_id: 'system',
    action: 'cancel_subscription',
    metadata: { subscription_id: sub?.id },
  });
  return sub;
}
