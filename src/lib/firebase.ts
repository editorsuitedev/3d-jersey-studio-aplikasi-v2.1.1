import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance safely (singleton pattern)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore strictly following SKILL.md specification
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

// Connectivity state tracker
let isConnectionTested = false;
let isConnected = false;

/**
 * Validate connection to Firestore on boot as required by Firebase skill
 */
export async function testFirestoreConnection(): Promise<boolean> {
  if (isConnectionTested) return isConnected;
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('the client is offline')), 2000)
    );
    await Promise.race([
      getDocFromServer(doc(db, 'test', 'connection')),
      timeoutPromise,
    ]);
    isConnected = true;
    isConnectionTested = true;
    console.log('[Firebase] Successfully validated Firestore database connection.');
    return true;
  } catch (error: any) {
    isConnectionTested = true;
    if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
      isConnected = true;
      console.log('[Firebase] Successfully validated Firestore database connection (online).');
      return true;
    }
    isConnected = false;
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn(
        '[Firebase] Firestore status: Database sedang offline atau belum diaktifkan di Firebase Console (d-studio-e414d).'
      );
    }
    return false;
  }
}

// Initial boot probe
if (typeof window !== 'undefined') {
  testFirestoreConnection().catch((err) => {
    console.warn('[Firebase] Connection probe finished:', err);
  });
}
