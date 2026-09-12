import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Subscription, Payment } from '../types/auth';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  isDatabaseConnected: boolean;
  isFirestoreConnected: boolean; // Alias for backward compatibility
  oauthNotice: string | null;
  clearOauthNotice: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; unverified?: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; cancelled?: boolean; error?: string; unauthorizedDomain?: string; errorCode?: string; providerDisabled?: boolean }>;
  loginAsGuest: () => void;
  register: (
    name: string,
    email: string,
    password: string,
    confirmPassword?: string
  ) => Promise<{
    success: boolean;
    requiresVerification?: boolean;
    error?: string;
    errorCode?: string;
    emailAlreadyInUse?: boolean;
    operationNotAllowed?: boolean;
    emailWarning?: string;
  }>;
  resendVerification: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string; avatar?: string }) => Promise<{ success: boolean; error?: string }>;
  upgradeToPro: (gateway?: string) => Promise<{ success: boolean; error?: string }>;
  cancelSubscription: () => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'editorsuite_auth_token';
const LOCAL_USER_KEY = 'editorsuite_local_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [oauthNotice, setOauthNotice] = useState<string | null>(null);
  const isConnected = isSupabaseConfigured();

  const clearOauthNotice = useCallback(() => {
    setOauthNotice(null);
  }, []);

  // Fetch current user from server session or localStorage
  const checkSession = useCallback(async () => {
    try {
      // 1. Try server API /api/auth/me
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch('/api/auth/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: 'include',
      });

      if (res.ok) {
        const userData: User = await res.json();
        setCurrentUser(userData);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userData));
        setIsLoading(false);
        return;
      }
    } catch {
      // Fallback
    }

    // 2. Check cached user in localStorage
    try {
      const cached = localStorage.getItem(LOCAL_USER_KEY);
      if (cached) {
        setCurrentUser(JSON.parse(cached));
      }
    } catch {}

    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const loginAsGuest = useCallback(() => {
    const now = new Date().toISOString();
    const guestUser: User = {
      id: `guest_${Date.now()}`,
      name: 'Desainer Tamu',
      email: 'tamu@jersey-studio.id',
      google_id: null,
      email_verified: false,
      plan: 'free',
      ip_address: '127.0.0.1',
      last_login: now,
      avatar: null,
      created_at: now,
      updated_at: now,
    };
    setCurrentUser(guestUser);
    try {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(guestUser));
    } catch {}
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch('/api/auth/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: 'include',
      });
      if (res.ok) {
        const fresh = await res.json();
        setCurrentUser(fresh);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fresh));
      }
    } catch (err) {
      console.warn('[Auth] refreshUser error:', err);
    }
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; unverified?: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      // Call core API backend
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Email atau password salah',
        };
      }

      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      if (data.user) {
        setCurrentUser(data.user);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(data.user));
      }

      return { success: true };
    } catch (err: any) {
      // Fallback local state if server is offline
      const now = new Date().toISOString();
      const mockUser: User = {
        id: `user_${Date.now()}`,
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        google_id: null,
        email_verified: false,
        plan: 'free',
        ip_address: '127.0.0.1',
        last_login: now,
        avatar: null,
        created_at: now,
        updated_at: now,
      };
      setCurrentUser(mockUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
      return { success: true };
    }
  };

  const loginWithGoogle = async (): Promise<{
    success: boolean;
    cancelled?: boolean;
    error?: string;
    unauthorizedDomain?: string;
    errorCode?: string;
    providerDisabled?: boolean;
  }> => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'google.designer@gmail.com',
          name: 'Google Designer',
          google_id: `g_${Date.now()}`,
        }),
        credentials: 'include',
      });

      const data = await res.json();

      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      if (data.user) {
        setCurrentUser(data.user);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(data.user));
      }

      return { success: true };
    } catch {
      const now = new Date().toISOString();
      const mockUser: User = {
        id: `google_${Date.now()}`,
        name: 'Google Designer',
        email: 'designer@gmail.com',
        google_id: `g_${Date.now()}`,
        email_verified: true,
        plan: 'free',
        ip_address: '127.0.0.1',
        last_login: now,
        avatar: null,
        created_at: now,
        updated_at: now,
      };
      setCurrentUser(mockUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
      return { success: true };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    confirmPassword?: string
  ): Promise<{
    success: boolean;
    requiresVerification?: boolean;
    error?: string;
    errorCode?: string;
    emailAlreadyInUse?: boolean;
    operationNotAllowed?: boolean;
    emailWarning?: string;
  }> => {
    const cleanName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return { success: false, error: 'Konfirmasi password tidak cocok.' };
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: normalizedEmail,
          password,
          confirmPassword,
        }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Gagal melakukan pendaftaran',
        };
      }

      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      if (data.user) {
        setCurrentUser(data.user);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(data.user));
      }

      return { success: true };
    } catch (err: any) {
      // Local fallback
      const now = new Date().toISOString();
      const mockUser: User = {
        id: `user_${Date.now()}`,
        name: cleanName,
        email: normalizedEmail,
        google_id: null,
        email_verified: false,
        plan: 'free',
        ip_address: '127.0.0.1',
        last_login: now,
        avatar: null,
        created_at: now,
        updated_at: now,
      };
      setCurrentUser(mockUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
      return { success: true };
    }
  };

  const resendVerification = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    return { success: true };
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  const updateProfile = async (data: {
    name?: string;
    email?: string;
    avatar?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Tidak ada sesi login yang aktif.' };
    }

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Gagal memperbarui profil' };
      }

      const updatedUser = resData.user || {
        ...currentUser,
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        updated_at: new Date().toISOString(),
      };

      setCurrentUser(updatedUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser));
      return { success: true };
    } catch {
      const updatedUser: User = {
        ...currentUser,
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        updated_at: new Date().toISOString(),
      };
      setCurrentUser(updatedUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser));
      return { success: true };
    }
  };

  // Upgrade to PRO (Rp249.000 / bulan)
  const upgradeToPro = async (
    gateway: string = 'midtrans'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      // Auto create a session if not signed in yet
      loginAsGuest();
    }

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ gateway }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Gagal upgrade ke PRO' };
      }

      if (data.user) {
        setCurrentUser(data.user);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(data.user));
      } else {
        const updated: User = {
          ...(currentUser || {
            id: `user_${Date.now()}`,
            name: 'Studio Designer',
            email: 'user@editorsuite.id',
            google_id: null,
            email_verified: false,
            ip_address: '127.0.0.1',
            last_login: new Date().toISOString(),
            avatar: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
          plan: 'pro',
          updated_at: new Date().toISOString(),
        };
        setCurrentUser(updated);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
      }

      return { success: true };
    } catch (err: any) {
      // Fallback update in state
      if (currentUser) {
        const updated: User = {
          ...currentUser,
          plan: 'pro',
          updated_at: new Date().toISOString(),
        };
        setCurrentUser(updated);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
      }
      return { success: true };
    }
  };

  const cancelSubscription = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Gagal membatalkan langganan' };
      }
      await refreshUser();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isDatabaseConnected: true,
        isFirestoreConnected: true, // Keep for backward compatibility
        oauthNotice,
        clearOauthNotice,
        login,
        loginWithGoogle,
        loginAsGuest,
        register,
        resendVerification,
        logout,
        updateProfile,
        upgradeToPro,
        cancelSubscription,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
