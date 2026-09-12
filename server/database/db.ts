import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// ==========================================
// 1. Core Tables TypeScript Interfaces
// ==========================================

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  google_id: string | null;
  email_verified: boolean;
  plan: 'free' | 'pro';
  ip_address: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  plan: 'free' | 'pro';
  status: 'active' | 'cancelled' | 'expired' | 'trialing';
  gateway: string | null; // e.g. 'midtrans', 'xendit', 'stripe', 'manual'
  gateway_customer_id: string | null;
  gateway_subscription_id: string | null;
  start_date: string;
  end_date: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  subscription_id: string | null;
  gateway: string;
  invoice_id: string;
  payment_id: string | null;
  amount: number; // e.g. 249000 for Pro plan
  currency: string; // e.g. 'IDR'
  status: 'pending' | 'settlement' | 'paid' | 'failed' | 'expired';
  paid_at: string | null;
  created_at: string;
}

export interface UsageRecord {
  id: string;
  user_id: string;
  model_id: string;
  action: string; // e.g. 'view', 'edit_material', 'upload_texture', 'export_attempt'
  metadata: Record<string, any>;
  created_at: string;
}

export interface ExportHistoryRecord {
  id: string;
  user_id: string;
  type: 'image' | 'video' | 'glb' | 'svg';
  format: string; // 'png' | 'jpg' | 'mp4' | 'webm'
  resolution: string; // '16:9 4K', '1:1', etc.
  created_at: string;
  status: 'completed' | 'failed' | 'blocked_free_plan';
  download_url: string | null;
}

export interface ModelRecord {
  id: string;
  name: string;
  slug: string;
  category: string;
  tier: 'free' | 'pro';
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModelAssetRecord {
  id: string;
  model_id: string;
  asset_type: 'glb' | 'uv_svg' | 'thumbnail';
  url: string;
  file_size: number | null;
  created_at: string;
}

export interface AdminRecord {
  id: string;
  user_id: string;
  role: 'superadmin' | 'admin' | 'moderator';
  permissions: string[];
  created_at: string;
}

export interface DatabaseState {
  users: UserRecord[];
  subscriptions: SubscriptionRecord[];
  payments: PaymentRecord[];
  usage: UsageRecord[];
  export_history: ExportHistoryRecord[];
  models: ModelRecord[];
  model_assets: ModelAssetRecord[];
  admins: AdminRecord[];
}

// ==========================================
// 2. High-Reliability Database Store Engine
// ==========================================

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

class DatabaseEngine {
  private users: Map<string, UserRecord> = new Map();
  private subscriptions: Map<string, SubscriptionRecord> = new Map();
  private payments: Map<string, PaymentRecord> = new Map();
  private usage: UsageRecord[] = [];
  private exportHistory: ExportHistoryRecord[] = [];
  private models: Map<string, ModelRecord> = new Map();
  private modelAssets: Map<string, ModelAssetRecord> = new Map();
  private admins: Map<string, AdminRecord> = new Map();

  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.ensureDataDir();
    this.loadFromDisk();
    this.seedDefaultData();
  }

  private ensureDataDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('[Database] Could not create data directory:', err);
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const state: DatabaseState = JSON.parse(raw);

        state.users?.forEach((u) => this.users.set(u.id, u));
        state.subscriptions?.forEach((s) => this.subscriptions.set(s.id, s));
        state.payments?.forEach((p) => this.payments.set(p.id, p));
        this.usage = state.usage || [];
        this.exportHistory = state.export_history || [];
        state.models?.forEach((m) => this.models.set(m.id, m));
        state.model_assets?.forEach((a) => this.modelAssets.set(a.id, a));
        state.admins?.forEach((ad) => this.admins.set(ad.id, ad));

        console.log(`[Database] Loaded ${this.users.size} users, ${this.models.size} models from disk.`);
      }
    } catch (err) {
      console.warn('[Database] Error loading from disk, using fresh state:', err);
    }
  }

  public saveToDisk() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      try {
        const state: DatabaseState = {
          users: Array.from(this.users.values()),
          subscriptions: Array.from(this.subscriptions.values()),
          payments: Array.from(this.payments.values()),
          usage: this.usage.slice(-1000), // Keep last 1000 events
          export_history: this.exportHistory.slice(-1000),
          models: Array.from(this.models.values()),
          model_assets: Array.from(this.modelAssets.values()),
          admins: Array.from(this.admins.values()),
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
      } catch (err) {
        console.error('[Database] Failed to write database to disk:', err);
      }
    }, 150);
  }

  private seedDefaultData() {
    const now = new Date().toISOString();

    // Seed 10 Jersey Models
    // FREE: 1 Model Jersey (01-o-neck). All other models are PRO.
    const defaultModels: Array<{
      id: string;
      name: string;
      slug: string;
      category: string;
      tier: 'free' | 'pro';
      desc: string;
      glb: string;
      svg: string;
      thumb: string;
    }> = [
      {
        id: '01-o-neck',
        name: 'O Neck',
        slug: '01-o-neck',
        category: 'Round Neck',
        tier: 'free', // Only this jersey is FREE in Freemium SaaS!
        desc: 'Classic circular crew-neck athletic jersey with contoured raglan sleeves.',
        glb: '/models/01.O-Neck.glb',
        svg: '/models/01.O-Neck.svg',
        thumb: 'https://cloud.editorsuite.id/resource-app/thumbnail/01.O-Neck.png',
      },
      {
        id: '02-v-neck',
        name: 'V Neck',
        slug: '02-v-neck',
        category: 'V-Neck',
        tier: 'pro',
        desc: 'Sharp athletic V-neck cut optimized for high-performance teamwear.',
        glb: '/models/02.V-Neck.glb',
        svg: '/models/02.V-Neck.svg',
        thumb: 'https://cloud.editorsuite.id/resource-app/thumbnail/02.V-Neck.png',
      },
      {
        id: '03-v-flat',
        name: 'V Flat',
        slug: '03-v-flat',
        category: 'V-Neck',
        tier: 'pro',
        desc: 'Flat-ribbed V-collar construction with seamless front finish.',
        glb: '/models/03.V-Flat.glb',
        svg: '/models/03.V-Flat.svg',
        thumb: 'https://cloud.editorsuite.id/resource-app/thumbnail/03.V-Flat.png',
      },
      {
        id: '04-v-cross',
        name: 'V Cross',
        slug: '04-v-cross',
        category: 'V-Neck',
        tier: 'pro',
        desc: 'Distinctive overlapping crossover V-neck styling with reinforced stitching.',
        glb: '/models/04.V-Cross.glb',
        svg: '/models/04.V-Cross.svg',
        thumb: 'https://cloud.editorsuite.id/resource-app/thumbnail/04.V-Cross.png',
      },
      {
        id: '05-v-casual',
        name: 'V Casual',
        slug: '05-v-casual',
        category: 'Casual Fit',
        tier: 'pro',
        desc: 'Relaxed fit V-neck jersey with subtle collar drape and modern proportions.',
        glb: '/models/05.V-Casual.glb',
        svg: '/models/05.V-Casual.svg',
        thumb: 'https://cloud.editorsuite.id/resource-app/thumbnail/05.V-Casual.png',
      },
      {
        id: '06-v-flat-casual',
        name: 'V Flat Casual',
        slug: '06-v-flat-casual',
        category: 'Casual Fit',
        tier: 'pro',
        desc: 'Contemporary flat collar blend with relaxed street-sport silhouette.',
        glb: '/models/06.V-Flat-Casual.glb',
        svg: '/models/06.V-Flat-Casual.svg',
        thumb: 'https://cloud.editorsuite.id/resource-app/thumbnail/06.V-Flat-Casual.png',
      },
      {
        id: '07-polo-v1',
        name: 'Polo V1',
        slug: '07-polo-v1',
        category: 'Polo Collared',
        tier: 'pro',
        desc: 'Structured polo collar jersey with neat button placket and ribbed cuffs.',
        glb: '/models/07.Polo-V1.glb',
        svg: '/models/07.Polo-V1.svg',
        thumb: 'https://cloud.editorsuite.id/resource-app/thumbnail/07.Polo-V1.png',
      },
      {
        id: '08-polo-v2',
        name: 'Polo V2',
        slug: '08-polo-v2',
        category: 'Polo Collared',
        tier: 'pro',
        desc: 'Modern mandarin/stand-up polo variation with aerodynamic lines.',
        glb: '/models/08.Polo-V2.glb',
        svg: '/models/08.Polo-V2.svg',
        thumb: 'https://cloud.editorsuite.id/resource-app/thumbnail/08.Polo-V2.png',
      },
      {
        id: '09-v-round',
        name: 'V Round',
        slug: '09-v-round',
        category: 'Hybrid Neck',
        tier: 'pro',
        desc: 'Ergonomic hybrid curved collar combining round base with subtle V notch.',
        glb: '/models/09.V-Round.glb',
        svg: '/models/09.V-Round.svg',
        thumb: 'https://cloud.editorsuite.id/resource-app/thumbnail/09.V-Round.png',
      },
      {
        id: '10-casual-neck',
        name: 'Casual Neck',
        slug: '10-casual-neck',
        category: 'Casual Fit',
        tier: 'pro',
        desc: 'Minimalist streetwear athletic cut with ultra-clean collar finishing.',
        glb: '/models/10.Casual-Neck.glb',
        svg: '/models/10.Casual-Neck.svg',
        thumb: 'https://cloud.editorsuite.id/resource-app/thumbnail/10.Casual-Neck.png',
      },
    ];

    for (const m of defaultModels) {
      if (!this.models.has(m.id)) {
        this.models.set(m.id, {
          id: m.id,
          name: m.name,
          slug: m.slug,
          category: m.category,
          tier: m.tier,
          description: m.desc,
          is_active: true,
          created_at: now,
          updated_at: now,
        });

        // Seed Assets for each model
        const glbAssetId = `${m.id}-glb`;
        this.modelAssets.set(glbAssetId, {
          id: glbAssetId,
          model_id: m.id,
          asset_type: 'glb',
          url: m.glb,
          file_size: 1024 * 1024 * 3, // ~3MB
          created_at: now,
        });

        const svgAssetId = `${m.id}-svg`;
        this.modelAssets.set(svgAssetId, {
          id: svgAssetId,
          model_id: m.id,
          asset_type: 'uv_svg',
          url: m.svg,
          file_size: 45 * 1024,
          created_at: now,
        });

        const thumbAssetId = `${m.id}-thumb`;
        this.modelAssets.set(thumbAssetId, {
          id: thumbAssetId,
          model_id: m.id,
          asset_type: 'thumbnail',
          url: m.thumb,
          file_size: 80 * 1024,
          created_at: now,
        });
      }
    }

    this.saveToDisk();
  }

  // ==========================================
  // USERS Table Methods
  // ==========================================

  async findUserById(id: string): Promise<UserRecord | null> {
    const u = this.users.get(id);
    return u ? { ...u } : null;
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.trim().toLowerCase();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === normalized) {
        return { ...u };
      }
    }
    return null;
  }

  async findUserByGoogleId(googleId: string): Promise<UserRecord | null> {
    for (const u of this.users.values()) {
      if (u.google_id === googleId) {
        return { ...u };
      }
    }
    return null;
  }

  async createUser(data: {
    name: string;
    email: string;
    password_hash: string;
    google_id?: string | null;
    email_verified?: boolean;
    plan?: 'free' | 'pro';
    ip_address?: string | null;
  }, customId?: string): Promise<UserRecord> {
    const id = customId || crypto.randomUUID();
    const now = new Date().toISOString();
    const record: UserRecord = {
      id,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password_hash: data.password_hash,
      google_id: data.google_id || null,
      email_verified: data.email_verified ?? false,
      plan: data.plan || 'free',
      ip_address: data.ip_address || null,
      last_login: null,
      created_at: now,
      updated_at: now,
    };

    this.users.set(id, record);

    // Automatically create initial subscription record
    const subId = crypto.randomUUID();
    const subRecord: SubscriptionRecord = {
      id: subId,
      user_id: id,
      plan: record.plan,
      status: 'active',
      gateway: null,
      gateway_customer_id: null,
      gateway_subscription_id: null,
      start_date: now,
      end_date: null,
      cancelled_at: null,
      created_at: now,
      updated_at: now,
    };
    this.subscriptions.set(subId, subRecord);

    this.saveToDisk();
    return { ...record };
  }

  async updateUser(id: string, updates: Partial<Omit<UserRecord, 'id' | 'created_at'>>): Promise<UserRecord | null> {
    const u = this.users.get(id);
    if (!u) return null;

    const updated: UserRecord = {
      ...u,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.users.set(id, updated);
    this.saveToDisk();
    return { ...updated };
  }

  async recordUserLogin(id: string, ipAddress?: string | null): Promise<UserRecord | null> {
    const u = this.users.get(id);
    if (!u) return null;

    const now = new Date().toISOString();
    const updated: UserRecord = {
      ...u,
      last_login: now,
      ip_address: ipAddress || u.ip_address,
      updated_at: now,
    };
    this.users.set(id, updated);
    this.saveToDisk();
    return { ...updated };
  }

  // ==========================================
  // SUBSCRIPTIONS Table Methods
  // ==========================================

  async findSubscriptionByUserId(userId: string): Promise<SubscriptionRecord | null> {
    for (const s of this.subscriptions.values()) {
      if (s.user_id === userId && s.status === 'active') {
        return { ...s };
      }
    }
    // Return any latest subscription for this user
    const userSubs = Array.from(this.subscriptions.values())
      .filter((s) => s.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return userSubs.length > 0 ? { ...userSubs[0] } : null;
  }

  async createOrUpdateSubscription(
    userId: string,
    data: {
      plan: 'free' | 'pro';
      status?: 'active' | 'cancelled' | 'expired' | 'trialing';
      gateway?: string;
      gateway_customer_id?: string;
      gateway_subscription_id?: string;
      days?: number;
    }
  ): Promise<SubscriptionRecord> {
    const now = new Date();
    const existing = await this.findSubscriptionByUserId(userId);

    const endDate = data.days
      ? new Date(now.getTime() + data.days * 24 * 60 * 60 * 1000).toISOString()
      : data.plan === 'pro'
      ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days default
      : null;

    if (existing) {
      const updated: SubscriptionRecord = {
        ...existing,
        plan: data.plan,
        status: data.status || 'active',
        gateway: data.gateway ?? existing.gateway,
        gateway_customer_id: data.gateway_customer_id ?? existing.gateway_customer_id,
        gateway_subscription_id: data.gateway_subscription_id ?? existing.gateway_subscription_id,
        start_date: now.toISOString(),
        end_date: endDate,
        cancelled_at: null,
        updated_at: now.toISOString(),
      };
      this.subscriptions.set(existing.id, updated);
      // Sync user plan
      await this.updateUser(userId, { plan: data.plan });
      this.saveToDisk();
      return { ...updated };
    }

    const newId = crypto.randomUUID();
    const record: SubscriptionRecord = {
      id: newId,
      user_id: userId,
      plan: data.plan,
      status: data.status || 'active',
      gateway: data.gateway || 'midtrans',
      gateway_customer_id: data.gateway_customer_id || null,
      gateway_subscription_id: data.gateway_subscription_id || null,
      start_date: now.toISOString(),
      end_date: endDate,
      cancelled_at: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    this.subscriptions.set(newId, record);
    // Sync user plan
    await this.updateUser(userId, { plan: data.plan });
    this.saveToDisk();
    return { ...record };
  }

  async cancelSubscription(userId: string): Promise<SubscriptionRecord | null> {
    const sub = await this.findSubscriptionByUserId(userId);
    if (!sub) return null;

    const now = new Date().toISOString();
    const updated: SubscriptionRecord = {
      ...sub,
      status: 'cancelled',
      cancelled_at: now,
      updated_at: now,
    };
    this.subscriptions.set(sub.id, updated);
    this.saveToDisk();
    return { ...updated };
  }

  // ==========================================
  // PAYMENTS Table Methods
  // ==========================================

  async createPayment(data: {
    user_id: string;
    subscription_id?: string | null;
    gateway: string;
    invoice_id: string;
    payment_id?: string | null;
    amount: number;
    currency?: string;
    status?: 'pending' | 'settlement' | 'paid' | 'failed' | 'expired';
  }): Promise<PaymentRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const record: PaymentRecord = {
      id,
      user_id: data.user_id,
      subscription_id: data.subscription_id || null,
      gateway: data.gateway,
      invoice_id: data.invoice_id,
      payment_id: data.payment_id || null,
      amount: data.amount,
      currency: data.currency || 'IDR',
      status: data.status || 'settlement',
      paid_at: data.status === 'paid' || data.status === 'settlement' ? now : null,
      created_at: now,
    };

    this.payments.set(id, record);
    this.saveToDisk();
    return { ...record };
  }

  async getPaymentsByUserId(userId: string): Promise<PaymentRecord[]> {
    return Array.from(this.payments.values())
      .filter((p) => p.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // ==========================================
  // USAGE Table Methods
  // ==========================================

  async logUsage(data: {
    user_id: string;
    model_id: string;
    action: string;
    metadata?: Record<string, any>;
  }): Promise<UsageRecord> {
    const record: UsageRecord = {
      id: crypto.randomUUID(),
      user_id: data.user_id,
      model_id: data.model_id,
      action: data.action,
      metadata: data.metadata || {},
      created_at: new Date().toISOString(),
    };
    this.usage.push(record);
    this.saveToDisk();
    return { ...record };
  }

  async getUsageByUserId(userId: string, limit = 50): Promise<UsageRecord[]> {
    return this.usage
      .filter((u) => u.user_id === userId)
      .slice(-limit)
      .reverse();
  }

  // ==========================================
  // EXPORT HISTORY Table Methods
  // ==========================================

  async logExport(data: {
    user_id: string;
    type: 'image' | 'video' | 'glb' | 'svg';
    format: string;
    resolution: string;
    status: 'completed' | 'failed' | 'blocked_free_plan';
    download_url?: string | null;
  }): Promise<ExportHistoryRecord> {
    const record: ExportHistoryRecord = {
      id: crypto.randomUUID(),
      user_id: data.user_id,
      type: data.type,
      format: data.format,
      resolution: data.resolution,
      created_at: new Date().toISOString(),
      status: data.status,
      download_url: data.download_url || null,
    };
    this.exportHistory.push(record);
    this.saveToDisk();
    return { ...record };
  }

  async getExportHistoryByUserId(userId: string, limit = 50): Promise<ExportHistoryRecord[]> {
    return this.exportHistory
      .filter((e) => e.user_id === userId)
      .slice(-limit)
      .reverse();
  }

  // ==========================================
  // MODELS & ASSETS Table Methods
  // ==========================================

  async getAllModels(): Promise<Array<ModelRecord & { assets: ModelAssetRecord[] }>> {
    const modelsList = Array.from(this.models.values()).filter((m) => m.is_active);
    return modelsList.map((m) => {
      const assets = Array.from(this.modelAssets.values()).filter((a) => a.model_id === m.id);
      return {
        ...m,
        assets,
      };
    });
  }

  async getModelById(id: string): Promise<(ModelRecord & { assets: ModelAssetRecord[] }) | null> {
    const m = this.models.get(id);
    if (!m) return null;
    const assets = Array.from(this.modelAssets.values()).filter((a) => a.model_id === m.id);
    return {
      ...m,
      assets,
    };
  }

  // ==========================================
  // ADMINS Table Methods
  // ==========================================

  async getAdminByUserId(userId: string): Promise<AdminRecord | null> {
    for (const ad of this.admins.values()) {
      if (ad.user_id === userId) {
        return { ...ad };
      }
    }
    return null;
  }

  async setAdmin(userId: string, role: 'superadmin' | 'admin' | 'moderator' = 'admin', permissions = ['*']): Promise<AdminRecord> {
    const existing = await this.getAdminByUserId(userId);
    if (existing) {
      existing.role = role;
      existing.permissions = permissions;
      this.admins.set(existing.id, existing);
      this.saveToDisk();
      return { ...existing };
    }
    const id = crypto.randomUUID();
    const record: AdminRecord = {
      id,
      user_id: userId,
      role,
      permissions,
      created_at: new Date().toISOString(),
    };
    this.admins.set(id, record);
    this.saveToDisk();
    return { ...record };
  }
}

export const db = new DatabaseEngine();

// Backward compatibility alias for memoryStore
export const memoryStore = {
  findByEmail: (email: string) => db.findUserByEmail(email),
  findById: (id: string) => db.findUserById(id),
  create: (user: any, customId?: string) => db.createUser(user, customId),
  update: (id: string, updates: any) => db.updateUser(id, updates),
};

export async function initDatabase(): Promise<void> {
  console.log('[Database] 8 Core Tables initialized (users, subscriptions, payments, usage, export_history, models, model_assets, admins).');
}
