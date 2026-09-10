import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { getFirestoreDb, memoryStore, UserRecord } from '../database/db';

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

export function toSafeUser(user: UserRecord): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const db = getFirestoreDb();

  if (db) {
    try {
      const q = query(
        collection(db, 'users'),
        where('email', '==', normalizedEmail),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        return {
          id: snapshot.docs[0].id,
          email: docData.email,
          name: docData.name,
          password_hash: docData.password_hash || docData.passwordHash || '',
          avatar: docData.avatar || null,
          created_at: docData.created_at || docData.createdAt || new Date().toISOString(),
          updated_at: docData.updated_at || docData.updatedAt || new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('[Firestore] Notice finding user by email, using fallback cache:', (err as Error).message);
    }
  }

  return memoryStore.findByEmail(normalizedEmail);
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const db = getFirestoreDb();

  if (db) {
    try {
      const userRef = doc(db, 'users', id);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const docData = userDoc.data();
        return {
          id: userDoc.id,
          email: docData.email,
          name: docData.name,
          password_hash: docData.password_hash || docData.passwordHash || '',
          avatar: docData.avatar || null,
          created_at: docData.created_at || docData.createdAt || new Date().toISOString(),
          updated_at: docData.updated_at || docData.updatedAt || new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('[Firestore] Notice finding user by ID, using fallback cache:', (err as Error).message);
    }
  }

  return memoryStore.findById(id);
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  customId?: string;
}): Promise<SafeUser> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(data.password, saltRounds);
  const id = data.customId || crypto.randomUUID();
  const now = new Date().toISOString();
  const db = getFirestoreDb();

  const record: UserRecord = {
    id,
    email: normalizedEmail,
    name: data.name.trim(),
    password_hash: passwordHash,
    avatar: data.avatar || null,
    created_at: now,
    updated_at: now,
  };

  if (db) {
    try {
      await setDoc(doc(db, 'users', id), {
        id,
        email: normalizedEmail,
        name: data.name.trim(),
        passwordHash,
        password_hash: passwordHash,
        avatar: data.avatar || '',
        createdAt: now,
        created_at: now,
        updatedAt: now,
        updated_at: now,
      });
      console.log(`[Firebase Database] User created in Firestore collection 'users': ${id} (${normalizedEmail})`);
    } catch (err) {
      console.warn('[Firebase Database] Note writing to Firestore, saved in memory cache:', (err as Error).message);
    }
  }

  await memoryStore.create({
    email: normalizedEmail,
    name: data.name.trim(),
    password_hash: passwordHash,
    avatar: data.avatar || null,
  }, id);

  return toSafeUser(record);
}

export async function updateUser(
  id: string,
  updates: { name?: string; email?: string; avatar?: string }
): Promise<SafeUser | null> {
  const db = getFirestoreDb();
  const now = new Date().toISOString();

  if (db) {
    try {
      const userRef = doc(db, 'users', id);
      const firestoreUpdates: Record<string, any> = {
        updatedAt: now,
        updated_at: now,
      };
      if (updates.name !== undefined) firestoreUpdates.name = updates.name.trim();
      if (updates.email !== undefined) firestoreUpdates.email = updates.email.trim().toLowerCase();
      if (updates.avatar !== undefined) firestoreUpdates.avatar = updates.avatar;

      await updateDoc(userRef, firestoreUpdates);
      console.log(`[Firebase Database] User updated in Firestore collection 'users': ${id}`);
    } catch (err) {
      console.warn('[Firebase Database] Note updating in Firestore, sync to memory:', (err as Error).message);
    }
  }

  const updated = await memoryStore.update(id, updates);
  if (updated) return toSafeUser(updated);

  const fresh = await findUserById(id);
  return fresh ? toSafeUser(fresh) : null;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
