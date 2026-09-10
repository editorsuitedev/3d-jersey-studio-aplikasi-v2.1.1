import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, testFirestoreConnection } from '../lib/firebase';
import { User, AuthResponse } from '../types/auth';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  isFirestoreConnected: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, confirmPassword?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string; avatar?: string }) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'editorsuite_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState(true);

  // Test Firestore database connectivity on mount
  useEffect(() => {
    testFirestoreConnection()
      .then((connected) => setIsFirestoreConnected(connected))
      .catch(() => setIsFirestoreConnected(false));
  }, []);

  const getHeaders = useCallback((): HeadersInit => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, []);

  // Fetch Current User from backend
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include',
      });

      if (res.ok) {
        const user: User = await res.json();
        setCurrentUser(user);
      } else {
        // If not logged in via backend token, check Firebase Auth state
        if (!auth.currentUser) {
          setCurrentUser(null);
          localStorage.removeItem(TOKEN_KEY);
        }
      }
    } catch (err) {
      console.warn('[Auth] Backend user session check notice:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const now = new Date().toISOString();
        const userProfile: User = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Studio Designer',
          email: fbUser.email || '',
          avatar: fbUser.photoURL || null,
          created_at: now,
          updated_at: now,
        };
        setCurrentUser(userProfile);
        setIsLoading(false);
      } else {
        refreshUser();
      }
    });

    return () => unsubscribe();
  }, [refreshUser]);

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      const now = new Date().toISOString();
      const userProfile: User = {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Studio Designer',
        email: fbUser.email || '',
        avatar: fbUser.photoURL || null,
        created_at: now,
        updated_at: now,
      };

      // Save user to Firestore collection `/users/{userId}`
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        await setDoc(
          userDocRef,
          {
            id: fbUser.uid,
            name: userProfile.name,
            email: userProfile.email,
            avatar: userProfile.avatar || '',
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
        console.log('[Firebase Database] Successfully saved Google user profile in Firestore.');
      } catch (firestoreErr) {
        console.warn('[Firebase Database] Note saving Google user profile to Firestore:', firestoreErr);
      }

      setCurrentUser(userProfile);
      return { success: true };
    } catch (err: any) {
      console.error('[Firebase Auth] Google login error:', err);
      return { success: false, error: err.message || 'Gagal login dengan akun Google' };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data: AuthResponse & { error?: string } = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Email atau password salah' };
      }

      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      setCurrentUser(data.user);
      return { success: true };
    } catch (err) {
      console.error('[Auth] Login error:', err);
      return { success: false, error: 'Gagal terhubung ke database server. Silakan coba lagi.' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    confirmPassword?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword }),
        credentials: 'include',
      });

      const data: AuthResponse & { error?: string } = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Gagal mendaftar. Silakan periksa data Anda.' };
      }

      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      setCurrentUser(data.user);
      return { success: true };
    } catch (err) {
      console.error('[Auth] Registration error:', err);
      return { success: false, error: 'Gagal terhubung ke database server. Silakan coba lagi.' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Logout from backend session
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
      });
    } catch (err) {
      console.warn('[Auth] Backend logout note:', err);
    }

    try {
      // Logout from Firebase
      await firebaseSignOut(auth);
    } catch (fbErr) {
      console.warn('[Firebase Auth] SignOut note:', fbErr);
    }

    localStorage.removeItem(TOKEN_KEY);
    setCurrentUser(null);
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

      const resData = await res.json();

      if (!res.ok || !resData.success) {
        return { success: false, error: resData.error || 'Gagal memperbarui profil' };
      }

      // Also update Firestore directly if user id is available
      if (currentUser?.id) {
        try {
          const userDocRef = doc(db, 'users', currentUser.id);
          await setDoc(
            userDocRef,
            {
              name: data.name || currentUser.name,
              email: data.email || currentUser.email,
              avatar: data.avatar ?? currentUser.avatar,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (fsErr) {
          console.warn('[Firestore] Syncing profile update error:', fsErr);
        }
      }

      setCurrentUser(resData.user);
      return { success: true };
    } catch (err) {
      console.error('[Auth] Update profile error:', err);
      return { success: false, error: 'Gagal terhubung ke database server' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isFirestoreConnected,
        login,
        loginWithGoogle,
        register,
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
