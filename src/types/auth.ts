export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  is_verified: boolean;
  provider: 'local' | 'google';
  plan: 'free' | 'pro';
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user: User;
  token?: string;
  requiresVerification?: boolean;
  email?: string;
}
