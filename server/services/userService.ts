import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db, UserRecord } from '../database/db';

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  google_id: string | null;
  email_verified: boolean;
  plan: 'free' | 'pro';
  ip_address: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Strips password_hash and sensitive internals before returning user data to client
 */
export function toSafeUser(user: UserRecord): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    google_id: user.google_id,
    email_verified: user.email_verified,
    plan: user.plan,
    ip_address: user.ip_address,
    last_login: user.last_login,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  return db.findUserByEmail(email);
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  return db.findUserById(id);
}

export async function findUserByGoogleId(googleId: string): Promise<UserRecord | null> {
  return db.findUserByGoogleId(googleId);
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  google_id?: string | null;
  email_verified?: boolean;
  ip_address?: string | null;
  customId?: string;
}): Promise<SafeUser> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const saltRounds = 10;
  // Securely hash password with bcrypt - NEVER plaintext
  const passwordHash = await bcrypt.hash(data.password, saltRounds);
  const id = data.customId || crypto.randomUUID();

  const record = await db.createUser(
    {
      name: data.name.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      google_id: data.google_id || null,
      email_verified: data.email_verified ?? false,
      plan: 'free',
      ip_address: data.ip_address || null,
    },
    id
  );

  return toSafeUser(record);
}

export async function recordUserLogin(id: string, ipAddress?: string | null): Promise<SafeUser | null> {
  const updated = await db.recordUserLogin(id, ipAddress);
  return updated ? toSafeUser(updated) : null;
}

export async function updateUser(
  id: string,
  updates: Partial<Omit<UserRecord, 'id' | 'password_hash' | 'created_at'>>
): Promise<SafeUser | null> {
  const updated = await db.updateUser(id, updates);
  return updated ? toSafeUser(updated) : null;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
