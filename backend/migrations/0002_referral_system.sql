-- Referral System Migration
-- Created: 2024-01-02
-- Description: Add referral system, admin accounts, and multi-tenant support

-- Referral system tables
CREATE TABLE IF NOT EXISTS referral_codes (
  id TEXT PRIMARY KEY,
  referrer_id TEXT NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  referral_pin TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  max_uses INTEGER DEFAULT 100,
  current_uses INTEGER DEFAULT 0,
  reward_tokens INTEGER DEFAULT 50,
  referrer_reward_tokens INTEGER DEFAULT 100,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  referral_code_id TEXT NOT NULL,
  referrer_id TEXT NOT NULL,
  referred_user_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
  tokens_awarded BOOLEAN DEFAULT FALSE,
  referrer_tokens_awarded BOOLEAN DEFAULT FALSE,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referral_code_id) REFERENCES referral_codes(id) ON DELETE CASCADE,
  FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Admin accounts table
CREATE TABLE IF NOT EXISTS admin_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  permissions TEXT, -- JSON array of permissions
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Multi-tenant sites table
CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  theme_config TEXT, -- JSON object for theme customization
  custom_domain TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Site users table (for multi-tenant support)
CREATE TABLE IF NOT EXISTS site_users (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'user')),
  permissions TEXT, -- JSON array of site-specific permissions
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(site_id, user_id)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_referral_codes_referrer_id ON referral_codes(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_pin ON referral_codes(referral_pin);
CREATE INDEX IF NOT EXISTS idx_referral_codes_status ON referral_codes(status);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_accounts_user_id ON admin_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_accounts_role ON admin_accounts(role);

CREATE INDEX IF NOT EXISTS idx_sites_owner_id ON sites(owner_id);
CREATE INDEX IF NOT EXISTS idx_sites_domain ON sites(domain);
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status);

CREATE INDEX IF NOT EXISTS idx_site_users_site_id ON site_users(site_id);
CREATE INDEX IF NOT EXISTS idx_site_users_user_id ON site_users(user_id);

-- Insert default admin account (will be created during setup)
INSERT OR IGNORE INTO users (id, email, password_hash, first_name, last_name, email_verified, created_at, updated_at) VALUES
('admin-super-1', 'drosaumega@gmail.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe', 'Super', 'Admin', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create admin account for super admin
INSERT OR IGNORE INTO admin_accounts (id, user_id, role, permissions, created_at, updated_at) VALUES
('admin-account-1', 'admin-super-1', 'super_admin', '["all"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create default site for hustledigga.com
INSERT OR IGNORE INTO sites (id, owner_id, domain, name, description, status, created_at, updated_at) VALUES
('site-hustledigga-1', 'admin-super-1', 'hustledigga.com', 'HustleDigga', 'AI Audio Studio Pro - Professional Audio Processing Platform', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add site owner to site_users
INSERT OR IGNORE INTO site_users (id, site_id, user_id, role, created_at) VALUES
('site-user-1', 'site-hustledigga-1', 'admin-super-1', 'owner', CURRENT_TIMESTAMP);