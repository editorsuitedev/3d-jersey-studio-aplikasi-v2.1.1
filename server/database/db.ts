import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  avatar: string | null;
  is_verified: boolean;
  verification_otp: string | null;
  verification_token: string | null;
  otp_expires_at: string | null;
  provider: 'local' | 'google';
  google_id: string | null;
  plan: 'free' | 'pro';
  created_at: string;
  updated_at: string;
}

// In-memory fallback store when PostgreSQL DATABASE_URL is not provided or during local testing
class MemoryUserStore {
  private users: Map<string, UserRecord> = new Map();

  async findByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === normalized) {
        return { ...user };
      }
    }
    return null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  async findByVerificationToken(token: string): Promise<UserRecord | null> {
    for (const user of this.users.values()) {
      if (user.verification_token === token) {
        return { ...user };
      }
    }
    return null;
  }

  async create(user: Omit<UserRecord, 'id' | 'created_at' | 'updated_at'>): Promise<UserRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const record: UserRecord = {
      id,
      email: user.email.trim().toLowerCase(),
      name: user.name.trim(),
      password_hash: user.password_hash,
      avatar: user.avatar || null,
      is_verified: user.is_verified ?? false,
      verification_otp: user.verification_otp || null,
      verification_token: user.verification_token || null,
      otp_expires_at: user.otp_expires_at || null,
      provider: user.provider || 'local',
      google_id: user.google_id || null,
      plan: user.plan || 'free',
      created_at: now,
      updated_at: now,
    };
    this.users.set(id, record);
    return { ...record };
  }

  async update(id: string, updates: Partial<UserRecord>): Promise<UserRecord | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updated: UserRecord = {
      ...user,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.users.set(id, updated);
    return { ...updated };
  }
}

export const memoryStore = new MemoryUserStore();

let pool: pg.Pool | null = null;
let isPostgresConnected = false;

export function getPostgresPool(): pg.Pool | null {
  return pool;
}

export function isUsingRealPostgres(): boolean {
  return isPostgresConnected;
}

/**
 * Parse database connection string safely, stripping template brackets
 * like [YOUR-PASSWORD] or special character encoding issues common in Supabase/Neon URIs
 */
export function parseDatabaseConfig(rawUrl: string): pg.PoolConfig | null {
  if (!rawUrl || !rawUrl.trim()) return null;
  const str = rawUrl.trim();

  // Pattern matching: postgres(?:ql)?://<user>:<password>@<host>:<port>/<db>
  const match = str.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:\/]+)(?::(\d+))?\/(.+)$/);
  if (match) {
    let [, user, pass, host, port, database] = match;

    // Strip square brackets if user copied template literally e.g. [myPassword]
    if (pass.startsWith('[') && pass.endsWith(']')) {
      pass = pass.slice(1, -1);
    }
    try {
      pass = decodeURIComponent(pass);
    } catch {
      // Keep as-is if decode fails
    }

    return {
      user: decodeURIComponent(user),
      password: pass,
      host,
      port: port ? parseInt(port, 10) : 5432,
      database: database.split('?')[0],
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    };
  }

  // Fallback to standard URL parser
  try {
    const u = new URL(str);
    let pass = u.password;
    if (pass.startsWith('[') && pass.endsWith(']')) {
      pass = pass.slice(1, -1);
    }
    try {
      pass = decodeURIComponent(pass);
    } catch {
      // Keep as-is
    }

    return {
      user: decodeURIComponent(u.username),
      password: pass,
      host: u.hostname,
      port: u.port ? parseInt(u.port, 10) : 5432,
      database: u.pathname.replace(/^\//, '').split('?')[0],
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    };
  } catch {
    // If URL parsing fails, fallback to passing raw string
    return {
      connectionString: str,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    };
  }
}

/**
 * Initialize PostgreSQL connection pool and verify/create `users` table
 */
export async function initDatabase(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log('[Database] DATABASE_URL not set. Running with built-in persistent in-memory user store.');
    console.log('[Database] Ready for local testing. Connect PostgreSQL by configuring DATABASE_URL in .env.');
    return;
  }

  try {
    console.log('[Database] Parsing and connecting to PostgreSQL at configured DATABASE_URL...');
    const poolConfig = parseDatabaseConfig(databaseUrl);
    if (!poolConfig) {
      throw new Error('Invalid DATABASE_URL format');
    }

    pool = new Pool(poolConfig);

    // Prevent uncaught errors on idle client drop
    pool.on('error', (err) => {
      console.warn('[Database Pool Warning] Idle client connection issue:', err.message);
    });

    const client = await pool.connect();
    
    // Create users table if not exists with all required fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash TEXT NOT NULL,
        avatar TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_otp VARCHAR(16),
        verification_token VARCHAR(128),
        otp_expires_at TIMESTAMP WITH TIME ZONE,
        provider VARCHAR(32) DEFAULT 'local',
        google_id VARCHAR(128),
        plan VARCHAR(32) DEFAULT 'free',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure columns exist if table was created previously (idempotent ALTERs)
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_otp VARCHAR(16);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(128);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(32) DEFAULT 'local';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(128);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(32) DEFAULT 'free';
    `);

    // Create index on email and verification_token for quick lookup
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_verif_token ON users(verification_token);
    `);

    client.release();
    isPostgresConnected = true;
    console.log('[Database] Successfully connected to PostgreSQL. Table `users` is ready and verified.');
  } catch (error) {
    const rawMessage = (error as Error).message || '';
    // Mask potential credentials in error logs
    const sanitizedMessage = rawMessage.replace(/:\/\/([^:]+):([^@]+)@/g, '://$1:***@');
    console.warn('[Database] Could not connect to PostgreSQL server:', sanitizedMessage);
    console.warn('[Database] Falling back gracefully to memory store until database connection is established.');
    if (pool) {
      try {
        await pool.end();
      } catch {}
      pool = null;
    }
    isPostgresConnected = false;
  }
}
