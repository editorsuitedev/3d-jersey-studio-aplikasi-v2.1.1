import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { memoryStore, UserRecord } from '../database/db';

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
  return memoryStore.findByEmail(normalizedEmail);
}

export async function findUserById(id: string): Promise<UserRecord | null> {
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

  const record: UserRecord = {
    id,
    email: normalizedEmail,
    name: data.name.trim(),
    password_hash: passwordHash,
    avatar: data.avatar || null,
    created_at: now,
    updated_at: now,
  };

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
  const updated = await memoryStore.update(id, updates);
  if (updated) return toSafeUser(updated);

  const fresh = await findUserById(id);
  return fresh ? toSafeUser(fresh) : null;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
