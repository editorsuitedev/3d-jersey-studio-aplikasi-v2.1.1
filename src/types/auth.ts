export interface User {
  id: string;
  name: string;
  email: string;
  google_id: string | null;
  email_verified: boolean;
  plan: 'free' | 'pro';
  ip_address: string | null;
  last_login: string | null;
  avatar?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'pro';
  status: 'active' | 'cancelled' | 'expired' | 'trialing';
  gateway: string | null;
  gateway_customer_id: string | null;
  gateway_subscription_id: string | null;
  start_date: string;
  end_date: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id: string | null;
  gateway: string;
  invoice_id: string;
  payment_id: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'settlement' | 'paid' | 'failed' | 'expired';
  paid_at: string | null;
  created_at: string;
}

export interface ExportHistoryItem {
  id: string;
  user_id: string;
  type: 'image' | 'video' | 'glb' | 'svg';
  format: string;
  resolution: string;
  created_at: string;
  status: 'completed' | 'failed' | 'blocked_free_plan';
  download_url: string | null;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user: User;
  token?: string;
}
