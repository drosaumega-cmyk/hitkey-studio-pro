-- AI Audio Studio Pro Database Schema
-- Created: 2024-01-01
-- Description: Initial database schema for users, subscriptions, tokens, and payments

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token TEXT,
    email_verification_expires_at DATETIME,
    reset_password_token TEXT,
    reset_password_expires_at DATETIME,
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted'))
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY,
    bio TEXT,
    company TEXT,
    website TEXT,
    location TEXT,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    preferences TEXT, -- JSON object for user preferences
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'premium')),
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'biyearly', 'yearly')),
    price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    tokens INTEGER NOT NULL,
    features TEXT, -- JSON array of features
    max_file_size INTEGER DEFAULT 10, -- in MB
    max_concurrent_jobs INTEGER DEFAULT 1,
    priority_support BOOLEAN DEFAULT FALSE,
    api_access BOOLEAN DEFAULT FALSE,
    custom_models BOOLEAN DEFAULT FALSE,
    watermark BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired', 'trial')),
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    current_period_start DATETIME,
    current_period_end DATETIME,
    trial_start DATETIME,
    trial_end DATETIME,
    cancelled_at DATETIME,
    auto_renew BOOLEAN DEFAULT TRUE,
    tokens_allocated INTEGER NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

-- Token transactions table
CREATE TABLE IF NOT EXISTS token_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'purchased', 'bonus', 'refund')),
    amount INTEGER NOT NULL,
    token_type TEXT NOT NULL CHECK (token_type IN ('voice_cloning', 'stem_separation', 'voice_cleaning', 'voice_changing', 'video_generation')),
    description TEXT,
    metadata TEXT, -- JSON object for additional data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Token packs table
CREATE TABLE IF NOT EXISTS token_packs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tokens INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    bonus_tokens INTEGER DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User token pack purchases table
CREATE TABLE IF NOT EXISTS user_token_packs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_pack_id TEXT NOT NULL,
    stripe_payment_intent_id TEXT UNIQUE,
    tokens_purchased INTEGER NOT NULL,
    bonus_tokens INTEGER DEFAULT 0,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (token_pack_id) REFERENCES token_packs(id)
);

-- Social engagements table
CREATE TABLE IF NOT EXISTS social_engagements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('twitter', 'facebook', 'instagram', 'linkedin', 'tiktok', 'youtube')),
    action TEXT NOT NULL CHECK (action IN ('follow', 'share', 'like', 'comment', 'post', 'subscribe')),
    tokens_earned INTEGER NOT NULL,
    verification_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL,
    permissions TEXT, -- JSON array of permissions
    rate_limit INTEGER DEFAULT 1000, -- requests per hour
    last_used_at DATETIME,
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Usage analytics table
CREATE TABLE IF NOT EXISTS usage_analytics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    feature TEXT NOT NULL,
    token_type TEXT NOT NULL,
    tokens_consumed INTEGER NOT NULL,
    processing_time_ms INTEGER,
    file_size_mb INTEGER,
    metadata TEXT, -- JSON object for additional metrics
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    old_values TEXT, -- JSON object
    new_values TEXT, -- JSON object
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Webhook events table
CREATE TABLE IF NOT EXISTS webhook_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    source TEXT NOT NULL, -- stripe, paypal, etc.
    event_id TEXT NOT NULL,
    payload TEXT NOT NULL, -- JSON object
    processed BOOLEAN DEFAULT FALSE,
    processing_attempts INTEGER DEFAULT 0,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_current_period_end ON user_subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON token_transactions(type);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_social_engagements_user_id ON social_engagements(user_id);
CREATE INDEX IF NOT EXISTS idx_social_engagements_platform ON social_engagements(platform);
CREATE INDEX IF NOT EXISTS idx_social_engagements_completed_at ON social_engagements(completed_at);

CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_id ON usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_feature ON usage_analytics(feature);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_created_at ON usage_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Insert default subscription plans
INSERT OR IGNORE INTO subscription_plans (id, name, tier, billing_cycle, price, currency, tokens, features, max_file_size, max_concurrent_jobs, priority_support, api_access, custom_models, watermark) VALUES
('free-monthly', 'Free', 'free', 'monthly', 0.00, 'USD', 50, '["Basic voice cloning", "Standard stem separation", "Noise reduction", "Voice effects", "720p video generation", "Community support", "Watermarked outputs"]', 10, 1, FALSE, FALSE, FALSE, TRUE),
('basic-monthly', 'Basic', 'basic', 'monthly', 19.99, 'USD', 500, '["Advanced voice cloning", "Professional stem separation", "AI voice cleaning", "Premium voice effects", "1080p video generation", "Email support", "No watermarks", "Custom voice models (5)"]', 50, 3, FALSE, FALSE, TRUE, FALSE),
('basic-quarterly', 'Basic', 'basic', 'quarterly', 47.97, 'USD', 1500, '["Advanced voice cloning", "Professional stem separation", "AI voice cleaning", "Premium voice effects", "1080p video generation", "Email support", "No watermarks", "Custom voice models (5)"]', 50, 3, FALSE, FALSE, TRUE, FALSE),
('premium-monthly', 'Premium', 'premium', 'monthly', 49.99, 'USD', 2000, '["Unlimited voice cloning", "Studio-quality stem separation", "Professional audio restoration", "Advanced voice effects", "4K video generation", "Priority support", "No watermarks", "Unlimited custom models", "API access", "Batch processing", "Advanced analytics"]', 200, 10, TRUE, TRUE, TRUE, FALSE),
('premium-quarterly', 'Premium', 'premium', 'quarterly', 112.47, 'USD', 6000, '["Unlimited voice cloning", "Studio-quality stem separation", "Professional audio restoration", "Advanced voice effects", "4K video generation", "Priority support", "No watermarks", "Unlimited custom models", "API access", "Batch processing", "Advanced analytics"]', 200, 10, TRUE, TRUE, TRUE, FALSE),
('premium-biyearly', 'Premium', 'premium', 'biyearly', 209.95, 'USD', 12000, '["Unlimited voice cloning", "Studio-quality stem separation", "Professional audio restoration", "Advanced voice effects", "4K video generation", "Priority support", "No watermarks", "Unlimited custom models", "API access", "Batch processing", "Advanced analytics"]', 200, 10, TRUE, TRUE, TRUE, FALSE),
('premium-yearly', 'Premium', 'premium', 'yearly', 359.95, 'USD', 24000, '["Unlimited voice cloning", "Studio-quality stem separation", "Professional audio restoration", "Advanced voice effects", "4K video generation", "Priority support", "No watermarks", "Unlimited custom models", "API access", "Batch processing", "Advanced analytics"]', 200, 10, TRUE, TRUE, TRUE, FALSE);

-- Insert default token packs
INSERT OR IGNORE INTO token_packs (id, name, tokens, price, currency, bonus_tokens, description) VALUES
('starter-pack', 'Starter Pack', 100, 4.99, 'USD', 0, 'Perfect for trying out our features'),
('standard-pack', 'Standard Pack', 250, 9.99, 'USD', 25, 'Great for regular users'),
('pro-pack', 'Pro Pack', 500, 17.99, 'USD', 75, 'Best value for power users'),
('business-pack', 'Business Pack', 1000, 29.99, 'USD', 200, 'Ideal for professionals and teams'),
('enterprise-pack', 'Enterprise Pack', 2500, 59.99, 'USD', 500, 'Maximum value for heavy users');