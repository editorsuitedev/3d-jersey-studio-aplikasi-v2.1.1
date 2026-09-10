import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as firebaseUpdateProfile,
  sendEmailVerification,
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
  login: (email: string, password: string) => Promise<{ success: boolean; unverified?: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; cancelled?: boolean; error?: string; unauthorizedDomain?: string; errorCode?: string }>;
  register: (name: string, email: string, password: string, confirmPassword?: string) => Promise<{ success: boolean; requiresVerification?: boolean; error?: string }>;
  resendVerification: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
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
        // If user logged in with email/password and is NOT yet verified, hold access
        const isPasswordProvider = fbUser.providerData.some((p) => p.providerId === 'password');
        if (isPasswordProvider && !fbUser.emailVerified) {
          console.info('[Firebase Auth] User email is not verified yet. Withholding auto-login.');
          setCurrentUser(null);
          setIsLoading(false);
          return;
        }

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

  const loginWithGoogle = async (): Promise<{
    success: boolean;
    cancelled?: boolean;
    error?: string;
    unauthorizedDomain?: string;
    errorCode?: string;
  }> => {
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

      // Save or update user profile in Firestore collection `/users/{userId}`
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const existingDoc = await getDoc(userDocRef);
        if (!existingDoc.exists()) {
          await setDoc(userDocRef, {
            id: fbUser.uid,
            name: userProfile.name,
            email: userProfile.email,
            avatar: userProfile.avatar || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(
            userDocRef,
            {
              name: userProfile.name,
              email: userProfile.email,
              avatar: userProfile.avatar || '',
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
        console.log('[Firebase Database] Successfully saved Google user profile in Firestore.');
      } catch (firestoreErr) {
        console.warn('[Firebase Database] Note saving Google user profile to Firestore:', firestoreErr);
      }

      setCurrentUser(userProfile);
      return { success: true };
    } catch (err: any) {
      const errorCode = err?.code;

      // 1. Expected user dismiss / close popup action
      if (errorCode === 'auth/popup-closed-by-user') {
        console.info('[Firebase Auth] Google login popup was closed by user.');
        return { success: false, cancelled: true, error: 'Login Google dibatalkan.' };
      }

      // 2. Browser popup blocked
      if (errorCode === 'auth/popup-blocked') {
        console.warn('[Firebase Auth] Google login popup was blocked by browser.');
        return {
          success: false,
          errorCode,
          error: 'Jendela pop-up login diblokir oleh browser. Harap izinkan pop-up pada browser Anda atau buka aplikasi di tab baru.',
        };
      }

      // 3. User cancelled duplicate request
      if (errorCode === 'auth/cancelled-popup-request') {
        return { success: false, cancelled: true, error: 'Permintaan login dibatalkan.' };
      }

      // 4. Provider Google not enabled in Firebase project!
      if (errorCode === 'auth/operation-not-allowed') {
        console.warn('[Firebase Auth] Google provider not enabled in Firebase project: d-studio-e414d');
        return {
          success: false,
          errorCode,
          error:
            'Provider "Google" belum diaktifkan di Firebase Console Anda (d-studio-e414d). Buka Firebase Console > Authentication > Sign-in method > Tambahkan Google > Aktifkan & Simpan.',
        };
      }

      // 5. Unauthorized domain in Firebase Authentication!
      if (errorCode === 'auth/unauthorized-domain') {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'domain ini';
        console.warn(`[Firebase Auth] Domain "${currentHost}" is not yet added to Firebase Console Authorized Domains.`);
        return {
          success: false,
          errorCode,
          unauthorizedDomain: currentHost,
          error: `Domain "${currentHost}" belum terdaftar di Firebase Console (d-studio-e414d). Buka Firebase Console > Authentication > Settings > Authorized domains, lalu tambahkan "${currentHost}".`,
        };
      }

      // 6. Network error
      if (errorCode === 'auth/network-request-failed') {
        console.warn('[Firebase Auth] Network request failed during Google login.');
        return { success: false, errorCode, error: 'Koneksi jaringan terganggu. Silakan periksa koneksi internet Anda.' };
      }

      console.warn('[Firebase Auth] Google login notice:', err?.message || err);
      return { success: false, errorCode, error: err?.message || 'Gagal login dengan akun Google.' };
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; unverified?: boolean; error?: string }> => {
    try {
      // 1. Sign in directly with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = userCredential.user;

      // 2. CRITICAL: Check if email is verified!
      if (!fbUser.emailVerified) {
        // Sign out immediately so unverified users do not have access
        await firebaseSignOut(auth);
        setCurrentUser(null);
        return {
          success: false,
          unverified: true,
          error: `Email ${email} belum diverifikasi. Harap buka email Anda dan klik tautan verifikasi yang kami kirimkan sebelum masuk.`,
        };
      }

      // 3. Fetch user profile from Firestore if available
      let userName = fbUser.displayName || email.split('@')[0];
      let userAvatar = fbUser.photoURL || null;

      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.name) userName = data.name;
          if (data.avatar) userAvatar = data.avatar;
        }
      } catch (fsErr) {
        console.warn('[Firebase Auth] Fetch profile note:', fsErr);
      }

      const now = new Date().toISOString();
      const userProfile: User = {
        id: fbUser.uid,
        name: userName,
        email: fbUser.email || email.trim().toLowerCase(),
        avatar: userAvatar,
        created_at: now,
        updated_at: now,
      };

      setCurrentUser(userProfile);

      // Sync backend session
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }).catch((e) => console.warn('[Auth] Server sync note:', e));

      return { success: true };
    } catch (err: any) {
      console.error('[Firebase Auth] Login error:', err);
      const code = err?.code;
      if (code === 'auth/operation-not-allowed') {
        return {
          success: false,
          error: 'Provider Email/Password belum diaktifkan di Firebase Console Anda (d-studio-e414d). Buka Firebase Console > Authentication > Sign-in method, aktifkan Email/Password, lalu simpan.',
        };
      }
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        return { success: false, error: 'Email atau kata sandi salah. Silakan periksa kembali.' };
      }
      if (code === 'auth/too-many-requests') {
        return { success: false, error: 'Terlalu banyak percobaan gagal. Silakan coba lagi beberapa saat lagi.' };
      }
      return { success: false, error: err?.message || 'Gagal masuk dengan email & password.' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    confirmPassword?: string
  ): Promise<{ success: boolean; requiresVerification?: boolean; error?: string }> => {
    if (confirmPassword && password !== confirmPassword) {
      return { success: false, error: 'Konfirmasi kata sandi tidak cocok.' };
    }

    try {
      // 1. Create account in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = userCredential.user;

      // 2. Update display name in Firebase Auth
      try {
        await firebaseUpdateProfile(fbUser, { displayName: name.trim() });
      } catch (profErr) {
        console.warn('[Firebase Auth] Display name update note:', profErr);
      }

      // 3. Send email verification to the registered user
      try {
        await sendEmailVerification(fbUser);
        console.log('[Firebase Auth] Verification email successfully sent to:', email);
      } catch (emailErr) {
        console.warn('[Firebase Auth] Verification email note:', emailErr);
      }

      // 4. Record profile document in Firestore collection `users`
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        await setDoc(
          userDocRef,
          {
            id: fbUser.uid,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            avatar: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (fsErr) {
        console.warn('[Firebase Auth] Saving user profile to Firestore note:', fsErr);
      }

      // 5. CRITICAL: Do NOT give immediate login access! Force sign out and require verification.
      await firebaseSignOut(auth);
      setCurrentUser(null);
      localStorage.removeItem(TOKEN_KEY);

      // Sync backend session record without logging in
      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      }).catch((e) => console.warn('[Auth] Server sync note:', e));

      return { success: true, requiresVerification: true };
    } catch (err: any) {
      console.error('[Firebase Auth] Registration error:', err);
      const code = err?.code;
      if (code === 'auth/operation-not-allowed') {
        return {
          success: false,
          error: 'Provider Email/Password belum diaktifkan di Firebase Console Anda (d-studio-e414d). Buka Firebase Console > Authentication > Sign-in method, aktifkan Email/Password, lalu simpan.',
        };
      }
      if (code === 'auth/email-already-in-use') {
        return { success: false, error: 'Email ini sudah terdaftar di Firebase. Silakan masuk atau gunakan email lain.' };
      }
      if (code === 'auth/weak-password') {
        return { success: false, error: 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.' };
      }
      if (code === 'auth/invalid-email') {
        return { success: false, error: 'Format email tidak valid.' };
      }
      return { success: false, error: err?.message || 'Gagal mendaftar akun baru ke Firebase.' };
    }
  };

  const resendVerification = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (password) {
        const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
        await sendEmailVerification(userCred.user);
        await firebaseSignOut(auth);
        return { success: true };
      }
      return {
        success: false,
        error: 'Masukkan kata sandi Anda untuk mengirim ulang email verifikasi.',
      };
    } catch (err: any) {
      console.error('[Firebase Auth] Resend verification error:', err);
      return { success: false, error: err?.message || 'Gagal mengirim ulang email verifikasi.' };
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

      // Also update Firestore directly if Firebase Auth user is signed in
      if (currentUser?.id && auth.currentUser && auth.currentUser.uid === currentUser.id) {
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
