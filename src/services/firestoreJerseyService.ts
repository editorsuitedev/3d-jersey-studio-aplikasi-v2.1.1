import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { MockupSettings, LightingSettings, CameraSettings, TransformSettings } from '../types';

export interface SavedJerseyProject {
  id: string;
  userId: string;
  name: string;
  modelId: string;
  baseColor: string;
  accentColor: string;
  collarColor: string;
  sleeveColor: string;
  pattern: string;
  roughness: number;
  metalness: number;
  fabricSheen: number;
  layersCount: number;
  previewUrl?: string;
  createdAt?: any;
  updatedAt?: any;
  // Full config state
  mockupState?: MockupSettings;
  lightingState?: LightingSettings;
  cameraState?: CameraSettings;
  transformState?: TransformSettings;
}

/**
 * Save or update a 3D jersey design into Firebase Firestore
 */
export async function saveJerseyToFirestore(
  userId: string,
  project: {
    id?: string;
    name: string;
    mockup: MockupSettings;
    lighting?: LightingSettings;
    camera?: CameraSettings;
    transform?: TransformSettings;
    previewUrl?: string;
  }
): Promise<string> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) {
    throw new Error('Silakan login ke akun Anda terlebih dahulu untuk menyimpan ke Firestore.');
  }

  const effectiveUserId = currentAuthUser.uid;
  const jerseyId = project.id || `jersey_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `users/${effectiveUserId}/jerseys/${jerseyId}`;

  try {
    const docRef = doc(db, 'users', effectiveUserId, 'jerseys', jerseyId);
    const existingSnap = await getDoc(docRef);

    if (existingSnap.exists()) {
      // Update existing jersey without overwriting createdAt
      await setDoc(
        docRef,
        {
          id: jerseyId,
          userId: effectiveUserId,
          name: project.name.trim() || 'Desain Jersey Kustom',
          modelId: project.mockup.modelId,
          baseColor: project.mockup.baseColor,
          accentColor: project.mockup.accentColor,
          collarColor: project.mockup.collarColor,
          sleeveColor: project.mockup.sleeveColor,
          pattern: project.mockup.pattern,
          roughness: Number(project.mockup.roughness ?? 0.8),
          metalness: Number(project.mockup.metalness ?? 0.2),
          fabricSheen: Number(project.mockup.fabricSheen ?? 0.2),
          layersCount: project.mockup.layers?.length || 0,
          previewUrl: project.previewUrl || '',
          updatedAt: serverTimestamp(),
          mockupState: project.mockup,
          lightingState: project.lighting,
          cameraState: project.camera,
          transformState: project.transform,
        },
        { merge: true }
      );
    } else {
      // Create new jersey with both createdAt & updatedAt
      await setDoc(docRef, {
        id: jerseyId,
        userId: effectiveUserId,
        name: project.name.trim() || 'Desain Jersey Kustom',
        modelId: project.mockup.modelId,
        baseColor: project.mockup.baseColor,
        accentColor: project.mockup.accentColor,
        collarColor: project.mockup.collarColor,
        sleeveColor: project.mockup.sleeveColor,
        pattern: project.mockup.pattern,
        roughness: Number(project.mockup.roughness ?? 0.8),
        metalness: Number(project.mockup.metalness ?? 0.2),
        fabricSheen: Number(project.mockup.fabricSheen ?? 0.2),
        layersCount: project.mockup.layers?.length || 0,
        previewUrl: project.previewUrl || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        mockupState: project.mockup,
        lightingState: project.lighting,
        cameraState: project.camera,
        transformState: project.transform,
      });
    }

    return jerseyId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribe in real-time to user's saved jersey projects in Firestore
 */
export function subscribeUserJerseys(
  userId: string,
  onUpdate: (projects: SavedJerseyProject[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const currentAuthUser = auth.currentUser;
  // If not signed in to Firebase Auth or user ID mismatch, avoid unauthorized read stream
  if (!currentAuthUser || currentAuthUser.uid !== userId) {
    onUpdate([]);
    return () => {};
  }

  const effectiveUserId = currentAuthUser.uid;
  const path = `users/${effectiveUserId}/jerseys`;
  const jerseysRef = collection(db, 'users', effectiveUserId, 'jerseys');

  const unsubscribe = onSnapshot(
    jerseysRef,
    (snapshot) => {
      const items: SavedJerseyProject[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as SavedJerseyProject;
        items.push({
          ...data,
          id: docSnap.id,
        });
      });
      // Sort newest first
      items.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis?.() || Date.now();
        const timeB = b.updatedAt?.toMillis?.() || Date.now();
        return timeB - timeA;
      });
      onUpdate(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );

  return unsubscribe;
}

/**
 * Delete a jersey project from Firebase Firestore
 */
export async function deleteJerseyFromFirestore(userId: string, jerseyId: string): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) {
    throw new Error('Silakan login dengan akun Google terlebih dahulu.');
  }

  const effectiveUserId = currentAuthUser.uid;
  const path = `users/${effectiveUserId}/jerseys/${jerseyId}`;
  try {
    const docRef = doc(db, 'users', effectiveUserId, 'jerseys', jerseyId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
