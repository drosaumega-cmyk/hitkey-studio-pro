-- Seed data for AI Audio Studio Pro Backend
-- This file contains sample data for development and testing

-- Insert sample users (passwords are 'password123')
INSERT OR IGNORE INTO users (id, email, password_hash, first_name, last_name, email_verified, created_at, updated_at) VALUES
('user-demo-1', 'demo@aiaudiostudio.pro', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe', 'Demo', 'User', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('user-premium-1', 'premium@aiaudiostudio.pro', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe', 'Premium', 'User', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('user-basic-1', 'basic@aiaudiostudio.pro', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe', 'Basic', 'User', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert user profiles
INSERT OR IGNORE INTO user_profiles (user_id, bio, company, website, location, timezone, language, preferences, created_at, updated_at) VALUES
('user-demo-1', 'Demo user for testing the platform', 'AI Audio Studio', 'https://aiaudiostudio.pro', 'San Francisco, CA', 'America/Los_Angeles', 'en', '{"theme": "dark", "notifications": true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('user-premium-1', 'Premium user with full access to all features', 'Music Productions Inc.', 'https://musicproductions.com', 'Los Angeles, CA', 'America/Los_Angeles', 'en', '{"theme": "dark", "notifications": true, "autoSave": true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('user-basic-1', 'Basic user exploring the platform features', 'Creative Studio', 'https://creativestudio.com', 'New York, NY', 'America/New_York', 'en', '{"theme": "light", "notifications": false}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample subscriptions
INSERT OR IGNORE INTO user_subscriptions (id, user_id, plan_id, status, stripe_customer_id, current_period_start, current_period_end, tokens_allocated, tokens_used, created_at, updated_at) VALUES
('sub-demo-1', 'user-demo-1', 'free-monthly', 'active', 'cus_demo_1', CURRENT_TIMESTAMP, datetime('now', '+1 month'), 50, 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sub-basic-1', 'user-basic-1', 'basic-monthly', 'active', 'cus_basic_1', CURRENT_TIMESTAMP, datetime('now', '+1 month'), 500, 87, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sub-premium-1', 'user-premium-1', 'premium-monthly', 'active', 'cus_premium_1', CURRENT_TIMESTAMP, datetime('now', '+1 month'), 2000, 234, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample token transactions
INSERT OR IGNORE INTO token_transactions (id, user_id, type, amount, token_type, description, metadata, created_at) VALUES
-- Demo user transactions
('tx-demo-1', 'user-demo-1', 'purchased', 50, 'voice_cloning', 'Initial free tokens', '{"source": "registration"}', CURRENT_TIMESTAMP),
('tx-demo-2', 'user-demo-1', 'spent', 5, 'voice_cloning', 'Voice cloning sample', '{"duration": 120, "quality": "high"}', datetime('now', '-1 day')),
('tx-demo-3', 'user-demo-1', 'spent', 3, 'stem_separation', 'Stem separation test', '{"instruments": 4, "duration": 180}', datetime('now', '-2 days')),
('tx-demo-4', 'user-demo-1', 'earned', 10, 'voice_cloning', 'Twitter follow bonus', '{"platform": "twitter", "action": "follow"}', datetime('now', '-3 days')),

-- Basic user transactions
('tx-basic-1', 'user-basic-1', 'purchased', 500, 'voice_cloning', 'Basic subscription tokens', '{"source": "subscription", "plan": "basic"}', CURRENT_TIMESTAMP),
('tx-basic-2', 'user-basic-1', 'spent', 25, 'voice_cloning', 'Professional voice cloning', '{"duration": 300, "quality": "premium"}', datetime('now', '-1 day')),
('tx-basic-3', 'user-basic-1', 'spent', 15, 'stem_separation', 'Full song separation', '{"instruments": 6, "duration": 240}', datetime('now', '-2 days')),
('tx-basic-4', 'user-basic-1', 'spent', 8, 'voice_cleaning', 'Audio cleanup project', '{"noise_reduction": true, "enhancement": true}', datetime('now', '-3 days')),
('tx-basic-5', 'user-basic-1', 'spent', 12, 'video_generation', 'Music video creation', '{"resolution": "1080p", "duration": 60}', datetime('now', '-4 days')),

-- Premium user transactions
('tx-premium-1', 'user-premium-1', 'purchased', 2000, 'voice_cloning', 'Premium subscription tokens', '{"source": "subscription", "plan": "premium"}', CURRENT_TIMESTAMP),
('tx-premium-2', 'user-premium-1', 'spent', 50, 'voice_cloning', 'Album voice cloning', '{"duration": 600, "quality": "studio"}', datetime('now', '-1 day')),
('tx-premium-3', 'user-premium-1', 'spent', 30, 'stem_separation', 'Multi-track separation', '{"instruments": 12, "duration": 480}', datetime('now', '-2 days')),
('tx-premium-4', 'user-premium-1', 'spent', 20, 'voice_cleaning', 'Podcast mastering', '{"noise_reduction": true, "enhancement": true, "normalization": true}', datetime('now', '-3 days')),
('tx-premium-5', 'user-premium-1', 'spent', 40, 'video_generation', '4K music video', '{"resolution": "4K", "duration": 180, "style": "cinematic"}', datetime('now', '-4 days')),
('tx-premium-6', 'user-premium-1', 'bonus', 100, 'voice_cloning', 'Loyalty bonus', '{"reason": "premium_loyalty", "months": 6}', datetime('now', '-5 days'));

-- Insert sample social engagements
INSERT OR IGNORE INTO social_engagements (id, user_id, platform, action, tokens_earned, verification_url, verified, completed_at, created_at) VALUES
('se-demo-1', 'user-demo-1', 'twitter', 'follow', 10, 'https://twitter.com/aiaudiostudio', TRUE, datetime('now', '-3 days'), CURRENT_TIMESTAMP),
('se-demo-2', 'user-demo-1', 'youtube', 'subscribe', 20, 'https://youtube.com/@aiaudiostudio', TRUE, datetime('now', '-5 days'), CURRENT_TIMESTAMP),
('se-basic-1', 'user-basic-1', 'twitter', 'follow', 10, 'https://twitter.com/aiaudiostudio', TRUE, datetime('now', '-10 days'), CURRENT_TIMESTAMP),
('se-basic-2', 'user-basic-1', 'facebook', 'like', 5, 'https://facebook.com/aiaudiostudio', TRUE, datetime('now', '-15 days'), CURRENT_TIMESTAMP),
('se-premium-1', 'user-premium-1', 'instagram', 'follow', 10, 'https://instagram.com/aiaudiostudio', TRUE, datetime('now', '-20 days'), CURRENT_TIMESTAMP),
('se-premium-2', 'user-premium-1', 'linkedin', 'follow', 15, 'https://linkedin.com/company/aiaudiostudio', TRUE, datetime('now', '-25 days'), CURRENT_TIMESTAMP);

-- Insert sample usage analytics
INSERT OR IGNORE INTO usage_analytics (id, user_id, feature, token_type, tokens_consumed, processing_time_ms, file_size_mb, metadata, created_at) VALUES
-- Demo user analytics
('ua-demo-1', 'user-demo-1', 'voice_cloning', 'voice_cloning', 5, 12000, 15, '{"model": "basic", "quality": "standard"}', datetime('now', '-1 day')),
('ua-demo-2', 'user-demo-1', 'stem_separation', 'stem_separation', 3, 8000, 25, '{"instruments": 4, "quality": "high"}', datetime('now', '-2 days')),

-- Basic user analytics
('ua-basic-1', 'user-basic-1', 'voice_cloning', 'voice_cloning', 25, 45000, 45, '{"model": "advanced", "quality": "premium"}', datetime('now', '-1 day')),
('ua-basic-2', 'user-basic-1', 'stem_separation', 'stem_separation', 15, 28000, 60, '{"instruments": 6, "quality": "studio"}', datetime('now', '-2 days')),
('ua-basic-3', 'user-basic-1', 'voice_cleaning', 'voice_cleaning', 8, 15000, 30, '{"noise_reduction": true, "enhancement": true}', datetime('now', '-3 days')),
('ua-basic-4', 'user-basic-1', 'video_generation', 'video_generation', 12, 180000, 100, '{"resolution": "1080p", "duration": 60, "model": "veo3-fast"}', datetime('now', '-4 days')),

-- Premium user analytics
('ua-premium-1', 'user-premium-1', 'voice_cloning', 'voice_cloning', 50, 120000, 120, '{"model": "professional", "quality": "studio", "voices": 3}', datetime('now', '-1 day')),
('ua-premium-2', 'user-premium-1', 'stem_separation', 'stem_separation', 30, 85000, 180, '{"instruments": 12, "quality": "master"}', datetime('now', '-2 days')),
('ua-premium-3', 'user-premium-1', 'voice_cleaning', 'voice_cleaning', 20, 35000, 80, '{"noise_reduction": true, "enhancement": true, "normalization": true, "mastering": true}', datetime('now', '-3 days')),
('ua-premium-4', 'user-premium-1', 'video_generation', 'video_generation', 40, 450000, 500, '{"resolution": "4K", "duration": 180, "model": "veo3", "style": "cinematic"}', datetime('now', '-4 days')),
('ua-premium-5', 'user-premium-1', 'voice_changing', 'voice_changing', 15, 22000, 40, '{"effects": ["pitch", "speed", "tone"], "presets": ["robot", "alien"]}', datetime('now', '-5 days'));

-- Insert sample audit logs
INSERT OR IGNORE INTO audit_logs (id, user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent, created_at) VALUES
('al-demo-1', 'user-demo-1', 'login', 'user', 'user-demo-1', NULL, '{"timestamp": "' || datetime('now', '-1 day') || '"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', datetime('now', '-1 day')),
('al-demo-2', 'user-demo-1', 'spend_tokens', 'token_transaction', 'tx-demo-2', NULL, '{"amount": 5, "tokenType": "voice_cloning"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', datetime('now', '-1 day')),
('al-basic-1', 'user-basic-1', 'login', 'user', 'user-basic-1', NULL, '{"timestamp": "' || datetime('now', '-2 hours') || '"}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', datetime('now', '-2 hours')),
('al-premium-1', 'user-premium-1', 'subscription_created', 'subscription', 'sub-premium-1', NULL, '{"planId": "premium-monthly", "status": "active"}', '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', datetime('now', '-1 week'));

-- Insert sample webhook events (for testing webhook processing)
INSERT OR IGNORE INTO webhook_events (id, event_type, source, event_id, payload, processed, created_at) VALUES
('we-1', 'payment_intent.succeeded', 'stripe', 'pi_test_1', '{"id": "pi_test_1", "object": "payment_intent", "status": "succeeded", "metadata": {"type": "token_pack_purchase"}}', TRUE, datetime('now', '-1 day')),
('we-2', 'customer.subscription.created', 'stripe', 'sub_test_1', '{"id": "sub_test_1", "object": "subscription", "status": "active", "customer": "cus_test_1"}', TRUE, datetime('now', '-2 days')),
('we-3', 'invoice.payment_succeeded', 'stripe', 'in_test_1', '{"id": "in_test_1", "object": "invoice", "status": "paid", "subscription": "sub_test_1"}', TRUE, datetime('now', '-3 days'));

-- Update Stripe customer IDs for users (for webhook testing)
UPDATE users SET stripe_customer_id = 'cus_demo_1' WHERE id = 'user-demo-1';
UPDATE users SET stripe_customer_id = 'cus_basic_1' WHERE id = 'user-basic-1';
UPDATE users SET stripe_customer_id = 'cus_premium_1' WHERE id = 'user-premium-1';

-- Update subscription IDs (for webhook testing)
UPDATE user_subscriptions SET stripe_subscription_id = 'sub_demo_1' WHERE id = 'sub-demo-1';
UPDATE user_subscriptions SET stripe_subscription_id = 'sub_basic_1' WHERE id = 'sub-basic-1';
UPDATE user_subscriptions SET stripe_subscription_id = 'sub_premium_1' WHERE id = 'sub-premium-1';