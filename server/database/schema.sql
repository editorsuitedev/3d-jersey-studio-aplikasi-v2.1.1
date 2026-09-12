-- Core Tables Schema for Editor Suite 3D Jersey Studio
-- Business Model: Freemium SaaS (Free: 1 model O-Neck, no export. Pro: Rp249.000/bln, all models, all export)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) DEFAULT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    ip_address VARCHAR(45) DEFAULT NULL,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- 2. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trialing')),
    gateway VARCHAR(100) DEFAULT NULL,
    gateway_customer_id VARCHAR(255) DEFAULT NULL,
    gateway_subscription_id VARCHAR(255) DEFAULT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 3. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    gateway VARCHAR(100) NOT NULL,
    invoice_id VARCHAR(255) NOT NULL UNIQUE,
    payment_id VARCHAR(255) DEFAULT NULL,
    amount NUMERIC(12, 2) NOT NULL, -- e.g. 249000.00 IDR
    currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settlement', 'paid', 'failed', 'expired')),
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

-- 4. Usage Table
CREATE TABLE IF NOT EXISTS usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_id VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_model_id ON usage(model_id);
CREATE INDEX IF NOT EXISTS idx_usage_action ON usage(action);

-- 5. Export History Table
CREATE TABLE IF NOT EXISTS export_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'video', 'glb', 'svg')),
    format VARCHAR(50) NOT NULL,
    resolution VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'blocked_free_plan')),
    download_url TEXT DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_export_history_user_id ON export_history(user_id);
CREATE INDEX IF NOT EXISTS idx_export_history_created_at ON export_history(created_at);

-- 6. Models Table
CREATE TABLE IF NOT EXISTS models (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    tier VARCHAR(50) NOT NULL DEFAULT 'pro' CHECK (tier IN ('free', 'pro')),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_models_tier ON models(tier);
CREATE INDEX IF NOT EXISTS idx_models_category ON models(category);

-- 7. Model Assets Table
CREATE TABLE IF NOT EXISTS model_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id VARCHAR(100) NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('glb', 'uv_svg', 'thumbnail')),
    url TEXT NOT NULL,
    file_size BIGINT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_model_assets_model_id ON model_assets(model_id);
CREATE INDEX IF NOT EXISTS idx_model_assets_asset_type ON model_assets(asset_type);

-- 8. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'moderator')),
    permissions TEXT[] DEFAULT ARRAY['*'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
