import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthResponse } from '../types/auth';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; requiresVerification?: boolean; email?: string; error?: string }>;
  register: (name: string, email: string, password: string, confirmPassword?: string) => Promise<{ success: boolean; requiresVerification?: boolean; email?: string; message?: string; error?: string }>;
  verifyEmail: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  loginWithGoogle: (credential: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string; avatar?: string }) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'editorsuite_auth_token';

/**
 * Safely parse JSON responses to prevent DOMException / SyntaxError:
 * "The string did not match the expected pattern" in WebKit / Safari
 * when the server or gateway returns non-JSON (e.g. HTML 502/504 or error pages).
 */
async function parseJsonSafely<T = any>(res: Response): Promise<{ data: T | null; text: string }> {
  try {
    const text = await res.text();
    if (!text || !text.trim()) {
      return { data: null, text: '' };
    }
    try {
      const data = JSON.parse(text) as T;
      return { data, text };
    } catch {
      return { data: null, text };
    }
  } catch {
    return { data: null, text: '' };
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getHeaders = useCallback((): HeadersInit => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && token.trim().length > 0) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }
    return headers;
  }, []);

  // Fetch Current User from backend
  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token || !token.trim()) {
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/auth/me', {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include',
      });

      if (res.ok) {
        const { data: user } = await parseJsonSafely<User>(res);
        if (user && user.id) {
          setCurrentUser(user);
        } else {
          setCurrentUser(null);
          localStorage.removeItem(TOKEN_KEY);
        }
      } else {
        setCurrentUser(null);
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem(TOKEN_KEY);
        }
      }
    } catch (err) {
      console.warn('[Auth] Note on user session refresh:', (err as any)?.message || err);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; requiresVerification?: boolean; email?: string; error?: string }> => {
    try {
      const normalizedEmail = (email || '').trim().toLowerCase();
      const normalizedPassword = password || '';

      if (!normalizedEmail || !normalizedPassword) {
        return { success: false, error: 'Email dan kata sandi wajib diisi.' };
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword }),
        credentials: 'include',
      });

      const { data } = await parseJsonSafely<AuthResponse & { error?: string }>(res);

      if (res.status === 403 && data?.requiresVerification) {
        return {
          success: false,
          requiresVerification: true,
          email: data.email || normalizedEmail,
          error: data.error,
        };
      }

      if (!res.ok || !data || !data.success) {
        const fallbackMsg = res.status === 401 ? 'Email atau kata sandi salah.' : 'Gagal masuk. Silakan periksa kembali akun Anda.';
        return { success: false, error: data?.error || fallbackMsg };
      }

      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      if (data.user) {
        setCurrentUser(data.user);
      }
      return { success: true };
    } catch (err) {
      console.error('[Auth] Login connection error:', (err as any)?.message || err);
      return { success: false, error: 'Gagal terhubung ke server autentikasi. Silakan periksa koneksi Anda.' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    confirmPassword?: string
  ): Promise<{ success: boolean; requiresVerification?: boolean; email?: string; message?: string; error?: string }> => {
    try {
      const normalizedName = (name || '').trim();
      const normalizedEmail = (email || '').trim().toLowerCase();

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: normalizedName, email: normalizedEmail, password, confirmPassword }),
        credentials: 'include',
      });

      const { data } = await parseJsonSafely<AuthResponse & { error?: string }>(res);

      if (!res.ok || !data) {
        return { success: false, error: data?.error || 'Gagal mendaftar. Silakan periksa data Anda.' };
      }

      if (data.requiresVerification) {
        return {
          success: true,
          requiresVerification: true,
          email: data.email || normalizedEmail,
          message: data.message,
        };
      }

      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      if (data.user) {
        setCurrentUser(data.user);
      }
      return { success: true };
    } catch (err) {
      console.error('[Auth] Registration connection error:', (err as any)?.message || err);
      return { success: false, error: 'Gagal terhubung ke server. Silakan coba lagi.' };
    }
  };

  const verifyEmail = async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const normalizedEmail = (email || '').trim().toLowerCase();
      const normalizedCode = (code || '').trim();

      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, otp: normalizedCode }),
        credentials: 'include',
      });

      const { data } = await parseJsonSafely<AuthResponse & { error?: string }>(res);
      if (!res.ok || !data || !data.success) {
        return { success: false, error: data?.error || 'Kode verifikasi salah atau telah kadaluarsa.' };
      }

      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      if (data.user) {
        setCurrentUser(data.user);
      }
      return { success: true };
    } catch (err) {
      console.error('[Auth] Verify connection error:', (err as any)?.message || err);
      return { success: false, error: 'Gagal menghubungi server verifikasi.' };
    }
  };

  const resendVerification = async (email: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const normalizedEmail = (email || '').trim().toLowerCase();

      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
        credentials: 'include',
      });

      const { data } = await parseJsonSafely<{ success?: boolean; message?: string; error?: string }>(res);
      if (!res.ok || !data) {
        return { success: false, error: data?.error || 'Gagal mengirim ulang kode verifikasi.' };
      }
      return { success: true, message: data.message || 'Kode verifikasi baru telah dikirimkan ke email Anda.' };
    } catch (err) {
      console.error('[Auth] Resend verification connection error:', (err as any)?.message || err);
      return { success: false, error: 'Gagal menghubungi server.' };
    }
  };

  const loginWithGoogle = async (credential: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
        credentials: 'include',
      });

      const { data } = await parseJsonSafely<AuthResponse & { error?: string }>(res);
      if (!res.ok || !data || !data.success) {
        return { success: false, error: data?.error || 'Autentikasi Google gagal.' };
      }

      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      if (data.user) {
        setCurrentUser(data.user);
      }
      return { success: true };
    } catch (err) {
      console.error('[Auth] Google login connection error:', (err as any)?.message || err);
      return { success: false, error: 'Gagal menghubungkan akun Google.' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
      });
    } catch (err) {
      console.warn('[Auth] Logout warning:', (err as any)?.message || err);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setCurrentUser(null);
    }
  };

  const updateProfile = async (data: {
    name?: string;
    email?: string;
    avatar?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
        credentials: 'include',
      });

      const { data: resData } = await parseJsonSafely<{ success?: boolean; user?: User; error?: string }>(res);

      if (!res.ok || !resData || !resData.success) {
        return { success: false, error: resData?.error || 'Gagal memperbarui profil' };
      }

      if (resData.user) {
        setCurrentUser(resData.user);
      }
      return { success: true };
    } catch (err) {
      console.error('[Auth] Update profile connection error:', (err as any)?.message || err);
      return { success: false, error: 'Gagal terhubung ke server' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        login,
        register,
        verifyEmail,
        resendVerification,
        loginWithGoogle,
        logout,
        updateProfile,
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
