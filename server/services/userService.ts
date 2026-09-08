import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getPostgresPool, isUsingRealPostgres, memoryStore, UserRecord } from '../database/db';

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  is_verified: boolean;
  provider: 'local' | 'google';
  plan: 'free' | 'pro';
  created_at: string;
  updated_at: string;
}

export function toSafeUser(user: UserRecord): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    is_verified: user.is_verified ?? false,
    provider: user.provider || 'local',
    plan: user.plan || 'free',
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

const SELECT_USER_COLUMNS = `
  id, email, name, password_hash, avatar, 
  is_verified, verification_otp, verification_token, otp_expires_at, 
  provider, google_id, plan, created_at, updated_at
`;

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const pool = getPostgresPool();

  if (isUsingRealPostgres() && pool) {
    const result = await pool.query<UserRecord>(
      `SELECT ${SELECT_USER_COLUMNS} FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [normalizedEmail]
    );
    return result.rows[0] || null;
  }

  return memoryStore.findByEmail(normalizedEmail);
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const pool = getPostgresPool();

  if (isUsingRealPostgres() && pool) {
    const result = await pool.query<UserRecord>(
      `SELECT ${SELECT_USER_COLUMNS} FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  }

  return memoryStore.findById(id);
}

export async function findUserByVerificationToken(token: string): Promise<UserRecord | null> {
  const pool = getPostgresPool();

  if (isUsingRealPostgres() && pool) {
    const result = await pool.query<UserRecord>(
      `SELECT ${SELECT_USER_COLUMNS} FROM users WHERE verification_token = $1 LIMIT 1`,
      [token]
    );
    return result.rows[0] || null;
  }

  return memoryStore.findByVerificationToken(token);
}

export async function createUserWithVerification(data: {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  is_verified?: boolean;
  provider?: 'local' | 'google';
  google_id?: string;
}): Promise<{ user: SafeUser; otp: string; verification_token: string }> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const saltRounds = 10;
  const passwordHash = data.password
    ? await bcrypt.hash(data.password, saltRounds)
    : await bcrypt.hash(crypto.randomBytes(16).toString('hex'), saltRounds);

  const id = crypto.randomUUID();
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits OTP
  const verification_token = crypto.randomBytes(32).toString('hex');
  const otp_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
  const is_verified = data.is_verified ?? false;
  const provider = data.provider || 'local';
  const google_id = data.google_id || null;

  const pool = getPostgresPool();

  if (isUsingRealPostgres() && pool) {
    const result = await pool.query<UserRecord>(
      `INSERT INTO users (
        id, email, name, password_hash, avatar, 
        is_verified, verification_otp, verification_token, otp_expires_at, 
        provider, google_id, plan, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'free', NOW(), NOW())
      RETURNING ${SELECT_USER_COLUMNS}`,
      [
        id,
        normalizedEmail,
        data.name.trim(),
        passwordHash,
        data.avatar || null,
        is_verified,
        otp,
        verification_token,
        otp_expires_at,
        provider,
        google_id,
      ]
    );
    return { user: toSafeUser(result.rows[0]), otp, verification_token };
  }

  const record = await memoryStore.create({
    email: normalizedEmail,
    name: data.name.trim(),
    password_hash: passwordHash,
    avatar: data.avatar || null,
    is_verified,
    verification_otp: otp,
    verification_token,
    otp_expires_at,
    provider,
    google_id,
    plan: 'free',
  });

  return { user: toSafeUser(record), otp, verification_token };
}

export async function verifyUserEmail(email: string, otpOrToken: string): Promise<SafeUser | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);
  if (!user) return null;

  // Check if token or OTP matches
  const isOtpMatch = user.verification_otp && user.verification_otp.trim() === otpOrToken.trim();
  const isTokenMatch = user.verification_token && user.verification_token.trim() === otpOrToken.trim();

  if (!isOtpMatch && !isTokenMatch) {
    return null;
  }

  // Check expiration if set
  if (user.otp_expires_at) {
    const expiry = new Date(user.otp_expires_at).getTime();
    if (Date.now() > expiry) {
      return null; // Expired
    }
  }

  const pool = getPostgresPool();
  if (isUsingRealPostgres() && pool) {
    const result = await pool.query<UserRecord>(
      `UPDATE users 
       SET is_verified = TRUE, verification_otp = NULL, verification_token = NULL, updated_at = NOW() 
       WHERE id = $1 
       RETURNING ${SELECT_USER_COLUMNS}`,
      [user.id]
    );
    return result.rows[0] ? toSafeUser(result.rows[0]) : null;
  }

  const updated = await memoryStore.update(user.id, {
    is_verified: true,
    verification_otp: null,
    verification_token: null,
  });
  return updated ? toSafeUser(updated) : null;
}

export async function refreshUserOtp(email: string): Promise<{ otp: string; token: string; user: SafeUser } | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);
  if (!user) return null;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const token = crypto.randomBytes(32).toString('hex');
  const otp_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const pool = getPostgresPool();
  if (isUsingRealPostgres() && pool) {
    const result = await pool.query<UserRecord>(
      `UPDATE users 
       SET verification_otp = $1, verification_token = $2, otp_expires_at = $3, updated_at = NOW() 
       WHERE id = $4 
       RETURNING ${SELECT_USER_COLUMNS}`,
      [otp, token, otp_expires_at, user.id]
    );
    return result.rows[0] ? { otp, token, user: toSafeUser(result.rows[0]) } : null;
  }

  const updated = await memoryStore.update(user.id, {
    verification_otp: otp,
    verification_token: token,
    otp_expires_at,
  });
  return updated ? { otp, token, user: toSafeUser(updated) } : null;
}

export async function updateUserPlan(userId: string, plan: 'free' | 'pro'): Promise<SafeUser | null> {
  const pool = getPostgresPool();
  if (isUsingRealPostgres() && pool) {
    const result = await pool.query<UserRecord>(
      `UPDATE users SET plan = $1, updated_at = NOW() WHERE id = $2 RETURNING ${SELECT_USER_COLUMNS}`,
      [plan, userId]
    );
    return result.rows[0] ? toSafeUser(result.rows[0]) : null;
  }

  const updated = await memoryStore.update(userId, { plan });
  return updated ? toSafeUser(updated) : null;
}

export async function updateUser(
  id: string,
  updates: { name?: string; email?: string; avatar?: string }
): Promise<SafeUser | null> {
  const pool = getPostgresPool();

  if (isUsingRealPostgres() && pool) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name.trim());
    }

    if (updates.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(updates.email.trim().toLowerCase());
    }

    if (updates.avatar !== undefined) {
      fields.push(`avatar = $${paramIndex++}`);
      values.push(updates.avatar);
    }

    if (fields.length === 0) {
      const existing = await findUserById(id);
      return existing ? toSafeUser(existing) : null;
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING ${SELECT_USER_COLUMNS}
    `;

    const result = await pool.query<UserRecord>(query, values);
    return result.rows[0] ? toSafeUser(result.rows[0]) : null;
  }

  const updated = await memoryStore.update(id, updates);
  return updated ? toSafeUser(updated) : null;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash || typeof hash !== 'string' || !hash.startsWith('$2')) {
    return false;
  }
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export async function seedInitialUsers(): Promise<void> {
  const demoUsers = [
    {
      name: 'Studio Designer',
      email: 'editorsuite.id@gmail.com',
      password: 'password123',
    },
    {
      name: 'EditorSuite Admin',
      email: 'editorsuite@gmail.com',
      password: 'password123',
    },
  ];

  for (const demo of demoUsers) {
    try {
      const existing = await findUserByEmail(demo.email);
      if (!existing) {
        const created = await createUserWithVerification({
          name: demo.name,
          email: demo.email,
          password: demo.password,
          is_verified: true,
        });
        await updateUserPlan(created.user.id, 'pro');
        console.log(`[Database Seed] Default account initialized: ${demo.email}`);
      }
    } catch (e) {
      console.warn(`[Database Seed] Could not seed user ${demo.email}:`, e);
    }
  }
}
