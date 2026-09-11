import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User } from '../types/auth';

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

  // Initialize and listen to Supabase Auth state & detect OAuth errors in URL
  useEffect(() => {
    // Check if the current URL contains OAuth redirect error parameters
    if (typeof window !== 'undefined') {
      try {
        const hash = window.location.hash ? window.location.hash.substring(1) : '';
        const search = window.location.search ? window.location.search.substring(1) : '';
        const params = new URLSearchParams(hash || search);
        const errorDesc = params.get('error_description') || params.get('error');
        if (errorDesc) {
          console.warn('[Supabase Auth Callback Notice]:', errorDesc);
          if (errorDesc.toLowerCase().includes('not enabled') || errorDesc.toLowerCase().includes('unsupported')) {
            setOauthNotice('Provider Google OAuth belum diaktifkan di Supabase Dashboard Anda. Silakan masuk menggunakan Email atau Mode Tamu.');
          } else {
            setOauthNotice(`Autentikasi: ${decodeURIComponent(errorDesc)}`);
          }
          // Clean the ugly error from the browser URL address bar
          window.history.replaceState(null, '', window.location.pathname);
        }
      } catch (err) {
        console.warn('Error reading URL auth params:', err);
      }
    }

    if (!isSupabaseConfigured()) {
      // Check local storage fallback user if Supabase is not yet configured
      try {
        const cached = localStorage.getItem(LOCAL_USER_KEY);
        if (cached) {
          setCurrentUser(JSON.parse(cached));
        }
      } catch {}
      setIsLoading(false);
      return;
    }

    // 1. Check existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!error && session?.user) {
        const u = session.user;
        const now = new Date().toISOString();
        const userObj: User = {
          id: u.id,
          name: u.user_metadata?.name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'Studio Designer',
          email: u.email || '',
          avatar: u.user_metadata?.avatar_url || null,
          created_at: u.created_at || now,
          updated_at: now,
        };
        setCurrentUser(userObj);
      } else {
        // Check if there is a local cached user (such as a guest or remembered local user)
        try {
          const cached = localStorage.getItem(LOCAL_USER_KEY);
          if (cached) {
            setCurrentUser(JSON.parse(cached));
          }
        } catch {}
      }
      setIsLoading(false);
    });

    // 2. Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const u = session.user;
        const now = new Date().toISOString();
        const userObj: User = {
          id: u.id,
          name: u.user_metadata?.name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'Studio Designer',
          email: u.email || '',
          avatar: u.user_metadata?.avatar_url || null,
          created_at: u.created_at || now,
          updated_at: now,
        };
        setCurrentUser(userObj);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        localStorage.removeItem(LOCAL_USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginAsGuest = useCallback(() => {
    const now = new Date().toISOString();
    const guestUser: User = {
      id: `guest_${Date.now()}`,
      name: 'Desainer Tamu',
      email: 'tamu@jersey-studio.id',
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
    if (!isSupabaseConfigured()) return;
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        const now = new Date().toISOString();
        setCurrentUser({
          id: user.id,
          name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Studio Designer',
          email: user.email || '',
          avatar: user.user_metadata?.avatar_url || null,
          created_at: user.created_at || now,
          updated_at: now,
        });
      }
    } catch (err) {
      console.warn('[Supabase Auth] refreshUser notice:', err);
    }
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; unverified?: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!isSupabaseConfigured()) {
      // Local fallback mode when Supabase credentials are pending
      const now = new Date().toISOString();
      const mockUser: User = {
        id: `user_${Date.now()}`,
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        avatar: null,
        created_at: now,
        updated_at: now,
      };
      setCurrentUser(mockUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('confirm') || msg.includes('verified')) {
          return {
            success: false,
            unverified: true,
            error: 'Email Anda belum dikonfirmasi. Silakan periksa inbox atau spam email Anda untuk mengonfirmasi akun.',
          };
        }
        if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
          return {
            success: false,
            error: 'Email atau password yang Anda masukkan salah. Silakan periksa kembali.',
          };
        }
        return { success: false, error: error.message };
      }

      if (data?.user) {
        const u = data.user;
        const now = new Date().toISOString();
        const userProfile: User = {
          id: u.id,
          name: u.user_metadata?.name || u.email?.split('@')[0] || 'Studio Designer',
          email: u.email || '',
          avatar: u.user_metadata?.avatar_url || null,
          created_at: u.created_at || now,
          updated_at: now,
        };
        setCurrentUser(userProfile);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userProfile));
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Terjadi kesalahan saat masuk dengan Supabase.',
      };
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
    if (!isSupabaseConfigured()) {
      const now = new Date().toISOString();
      const mockUser: User = {
        id: `google_${Date.now()}`,
        name: 'Google Designer',
        email: 'designer@gmail.com',
        avatar: null,
        created_at: now,
        updated_at: now,
      };
      setCurrentUser(mockUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.url) {
        window.location.assign(data.url);
        return { success: true };
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Gagal masuk menggunakan Google OAuth.',
      };
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

    if (!isSupabaseConfigured()) {
      // Local development fallback
      const now = new Date().toISOString();
      const mockUser: User = {
        id: `user_${Date.now()}`,
        name: cleanName,
        email: normalizedEmail,
        avatar: null,
        created_at: now,
        updated_at: now,
      };
      setCurrentUser(mockUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name: cleanName,
          },
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('user already exists')) {
          return {
            success: false,
            emailAlreadyInUse: true,
            error: 'Email ini sudah terdaftar di Supabase. Silakan masuk atau gunakan email lain.',
          };
        }
        return { success: false, error: error.message };
      }

      // If user identities is empty array in Supabase, email already exists
      if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
        return {
          success: false,
          emailAlreadyInUse: true,
          error: 'Email ini sudah terdaftar di Supabase. Silakan masuk menggunakan password Anda.',
        };
      }

      // Check if email confirmation is required
      if (data?.user && !data.session) {
        return {
          success: true,
          requiresVerification: true,
        };
      }

      if (data?.user) {
        const now = new Date().toISOString();
        const userProfile: User = {
          id: data.user.id,
          name: cleanName,
          email: normalizedEmail,
          avatar: null,
          created_at: now,
          updated_at: now,
        };
        setCurrentUser(userProfile);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userProfile));
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Gagal mendaftar akun ke Supabase.',
      };
    }
  };

  const resendVerification = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();

    // Client-side rate-limit protection (cooldown 60 seconds)
    const lastSentKey = `last_resend_verification_${normalizedEmail}`;
    const lastSentTime = Number(sessionStorage.getItem(lastSentKey) || 0);
    const elapsedSeconds = Math.floor((Date.now() - lastSentTime) / 1000);
    if (elapsedSeconds < 60) {
      const remaining = 60 - elapsedSeconds;
      return {
        success: false,
        error: `Mohon tunggu ${remaining} detik sebelum meminta pengiriman email verifikasi lagi.`,
      };
    }

    if (!isSupabaseConfigured()) {
      sessionStorage.setItem(lastSentKey, Date.now().toString());
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      sessionStorage.setItem(lastSentKey, Date.now().toString());
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Gagal mengirim ulang email verifikasi.',
      };
    }
  };

  const logout = async (): Promise<void> => {
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem(TOKEN_KEY);

    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[Supabase Auth] Signout notice:', err);
      }
    }
  };

  const updateProfile = async (data: {
    name?: string;
    email?: string;
    avatar?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Tidak ada sesi login yang aktif.' };
    }

    const updatedUser: User = {
      ...currentUser,
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email }),
      ...(data.avatar !== undefined && { avatar: data.avatar }),
      updated_at: new Date().toISOString(),
    };

    setCurrentUser(updatedUser);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser));

    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.updateUser({
          data: {
            ...(data.name && { name: data.name }),
            ...(data.avatar !== undefined && { avatar_url: data.avatar }),
          },
        });
      } catch (err: any) {
        console.warn('[Supabase Auth] Update user metadata notice:', err?.message || err);
      }
    }

    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isDatabaseConnected: isConnected,
        isFirestoreConnected: isConnected, // Keep for backward compatibility
        oauthNotice,
        clearOauthNotice,
        login,
        loginWithGoogle,
        loginAsGuest,
        register,
        resendVerification,
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
