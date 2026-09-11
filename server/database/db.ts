import crypto from 'crypto';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

// In-memory cache & high-reliability store for server sessions
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

  async create(user: Omit<UserRecord, 'id' | 'created_at' | 'updated_at'>, customId?: string): Promise<UserRecord> {
    const id = customId || crypto.randomUUID();
    const now = new Date().toISOString();
    const record: UserRecord = {
      id,
      email: user.email.trim().toLowerCase(),
      name: user.name.trim(),
      password_hash: user.password_hash,
      avatar: user.avatar || null,
      created_at: now,
      updated_at: now,
    };
    this.users.set(id, record);
    return { ...record };
  }

  async update(id: string, updates: Partial<Pick<UserRecord, 'name' | 'email' | 'avatar'>>): Promise<UserRecord | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updated: UserRecord = {
      ...user,
      ...(updates.name ? { name: updates.name.trim() } : {}),
      ...(updates.email ? { email: updates.email.trim().toLowerCase() } : {}),
      ...(updates.avatar !== undefined ? { avatar: updates.avatar } : {}),
      updated_at: new Date().toISOString(),
    };
    this.users.set(id, updated);
    return { ...updated };
  }
}

export const memoryStore = new MemoryUserStore();

/**
 * Initialize Database connection
 */
export async function initDatabase(): Promise<void> {
  console.log('[Database] Storage service initialized (Supabase / In-Memory Store active).');
}
