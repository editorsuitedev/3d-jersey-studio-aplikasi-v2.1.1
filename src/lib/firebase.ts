import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance safely (singleton pattern)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore safely with database ID or default
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

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
    await getDocFromServer(doc(db, 'test', 'connection'));
    isConnected = true;
    isConnectionTested = true;
    console.log('[Firebase] Successfully validated Firestore database connection.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn(
        '[Firebase] Firestore status: Database sedang offline atau belum diaktifkan di Firebase Console (d-studio-e414d).'
      );
      isConnected = false;
    } else {
      // Permission denied or not-found still proves network connectivity to the Firestore instance
      isConnected = true;
      console.log('[Firebase] Firestore reachable (database responded).');
    }
    isConnectionTested = true;
    return isConnected;
  }
}

// Initial boot probe
if (typeof window !== 'undefined') {
  testFirestoreConnection().catch((err) => {
    console.warn('[Firebase] Connection probe finished:', err);
  });
}
