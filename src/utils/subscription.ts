export type SubscriptionPlan = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'expired' | 'canceled';

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiresAt: string | null; // ISO Date string
  priceMonthly: number; // 249000
  updatedAt: string;
}

export const PRO_PRICE_MONTHLY = 249000;
export const PRO_PRICE_FORMATTED = 'Rp249.000/bulan';
export const FREE_ALLOWED_MODEL_ID = '01-o-neck';

const STORAGE_KEY = 'editorsuite_subscription_v1';

export function getDefaultSubscription(): UserSubscription {
  return {
    plan: 'free',
    status: 'active',
    expiresAt: null,
    priceMonthly: PRO_PRICE_MONTHLY,
    updatedAt: new Date().toISOString(),
  };
}

export function getStoredSubscription(): UserSubscription {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultSubscription();

    let sub: UserSubscription = JSON.parse(raw);
    // Validate format
    if (!sub || (sub.plan !== 'free' && sub.plan !== 'pro')) {
      return getDefaultSubscription();
    }

    // Check if Pro subscription has expired
    if (sub.plan === 'pro') {
      if (sub.status !== 'active' || (sub.expiresAt && new Date(sub.expiresAt).getTime() <= Date.now())) {
        sub = {
          ...sub,
          plan: 'free',
          status: 'expired',
          updatedAt: new Date().toISOString(),
        };
        saveSubscription(sub);
      }
    }

    return sub;
  } catch (e) {
    console.error('Failed to parse subscription from storage:', e);
    return getDefaultSubscription();
  }
}

export function saveSubscription(sub: UserSubscription): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sub));
  } catch (e) {
    console.error('Failed to save subscription to storage:', e);
  }
}

export function isProSubscription(sub: UserSubscription | null | undefined): boolean {
  if (!sub) return false;
  if (sub.plan !== 'pro') return false;
  if (sub.status !== 'active') return false;
  if (sub.expiresAt && new Date(sub.expiresAt).getTime() <= Date.now()) return false;
  return true;
}

export function canAccessModel(modelId: string, isPro: boolean): boolean {
  if (isPro) return true;
  return modelId === FREE_ALLOWED_MODEL_ID;
}

export function canExportImage(isPro: boolean): boolean {
  return isPro;
}

export function canExportVideo(isPro: boolean): boolean {
  return isPro;
}

export function activateProSubscription(durationDays = 30): UserSubscription {
  const expires = new Date();
  expires.setDate(expires.getDate() + durationDays);

  const sub: UserSubscription = {
    plan: 'pro',
    status: 'active',
    expiresAt: expires.toISOString(),
    priceMonthly: PRO_PRICE_MONTHLY,
    updatedAt: new Date().toISOString(),
  };

  saveSubscription(sub);
  return sub;
}

export function expireProSubscription(): UserSubscription {
  const sub: UserSubscription = {
    plan: 'free',
    status: 'expired',
    expiresAt: new Date(Date.now() - 1000).toISOString(),
    priceMonthly: PRO_PRICE_MONTHLY,
    updatedAt: new Date().toISOString(),
  };

  saveSubscription(sub);
  return sub;
}

export function formatRupiah(amount: number): string {
  return `Rp${amount.toLocaleString('id-ID')}`;
}
