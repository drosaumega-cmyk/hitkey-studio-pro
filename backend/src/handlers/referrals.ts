/**
 * Referral System API handlers
 */

import { Context } from 'hono';
import { DatabaseService } from '../lib/database';
import { AuthService } from '../lib/auth';
import { nanoid } from 'nanoid';

export class ReferralHandler {
  private db: DatabaseService;
  private authService: AuthService;

  constructor(db: DatabaseService) {
    this.db = db;
    this.authService = new AuthService(
      process.env.JWT_SECRET || 'your-secret-key',
      process.env.JWT_EXPIRATION || '7d'
    );
  }

  // Generate unique referral code and pin
  private generateReferralCode(): string {
    const prefix = 'AUDIO';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${random}`;
  }

  private generateReferralPin(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  /**
   * Create referral code (admin only)
   */
  async createReferralCode(c: Context) {
    try {
      const { maxUses, rewardTokens, referrerRewardTokens, expiresAt } = await c.req.json();
      
      // Get authenticated user
      const authUser = c.get('authUser');
      if (!authUser) {
        return c.json({ error: 'Authentication required' }, 401);
      }
      
      // Check if user is admin
      const adminCheck = await this.db.executeOne(
        'SELECT role FROM admin_accounts WHERE user_id = ?',
        [authUser.id]
      );
      
      if (!adminCheck) {
        return c.json({ error: 'Admin access required' }, 403);
      }
      
      // Generate unique code and pin
      let referralCode: string;
      let referralPin: string;
      let attempts = 0;
      
      do {
        referralCode = this.generateReferralCode();
        referralPin = this.generateReferralPin();
        
        const existingCode = await this.db.executeOne(
          'SELECT id FROM referral_codes WHERE referral_code = ? OR referral_pin = ?',
          [referralCode, referralPin]
        );
        
        if (!existingCode) break;
        attempts++;
      } while (attempts < 10);
      
      if (attempts >= 10) {
        return c.json({ error: 'Failed to generate unique referral code' }, 500);
      }
      
      // Create referral code
      const referralCodeId = nanoid();
      await this.db.execute(`
        INSERT INTO referral_codes (
          id, referrer_id, referral_code, referral_pin, max_uses,
          reward_tokens, referrer_reward_tokens, expires_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        referralCodeId,
        authUser.id,
        referralCode,
        referralPin,
        maxUses || 100,
        rewardTokens || 50,
        referrerRewardTokens || 100,
        expiresAt || null
      ]);
      
      return c.json({
        success: true,
        referralCode: {
          id: referralCodeId,
          code: referralCode,
          pin: referralPin,
          maxUses: maxUses || 100,
          rewardTokens: rewardTokens || 50,
          referrerRewardTokens: referrerRewardTokens || 100,
          expiresAt
        }
      });
      
    } catch (error) {
      console.error('Create referral code error:', error);
      return c.json({ error: 'Failed to create referral code' }, 500);
    }
  }

  /**
   * Get user's referral codes
   */
  async getReferralCodes(c: Context) {
    try {
      const authUser = c.get('authUser');
      if (!authUser) {
        return c.json({ error: 'Authentication required' }, 401);
      }
      
      // Get referral codes
      const referralCodes = await this.db.execute(`
        SELECT 
          rc.id,
          rc.referral_code,
          rc.referral_pin,
          rc.status,
          rc.max_uses,
          rc.current_uses,
          rc.reward_tokens,
          rc.referrer_reward_tokens,
          rc.expires_at,
          rc.created_at,
          rc.updated_at,
          COUNT(r.id) as total_referrals
        FROM referral_codes rc
        LEFT JOIN referrals r ON rc.id = r.referral_code_id
        WHERE rc.referrer_id = ?
        GROUP BY rc.id
        ORDER BY rc.created_at DESC
      `, [authUser.id]);
      
      return c.json({
        success: true,
        referralCodes
      });
      
    } catch (error) {
      console.error('Get referral codes error:', error);
      return c.json({ error: 'Failed to get referral codes' }, 500);
    }
  }

  /**
   * Validate referral code (public)
   */
  async validateReferralCode(c: Context) {
    try {
      const { referralCode, referralPin } = await c.req.json();
      
      // Find referral code
      const codeCheck = await this.db.executeOne(`
        SELECT 
          rc.*,
          u.email as referrer_email,
          u.first_name as referrer_first_name
        FROM referral_codes rc
        JOIN users u ON rc.referrer_id = u.id
        WHERE rc.referral_code = ? AND rc.referral_pin = ? AND rc.status = 'active'
      `, [referralCode, referralPin]);
      
      if (!codeCheck) {
        return c.json({ 
          valid: false, 
          error: 'Invalid or inactive referral code' 
        });
      }
      
      // Check if expired
      if (codeCheck.expires_at && new Date(codeCheck.expires_at) < new Date()) {
        return c.json({ 
          valid: false, 
          error: 'Referral code has expired' 
        });
      }
      
      // Check if max uses reached
      if (codeCheck.current_uses >= codeCheck.max_uses) {
        return c.json({ 
          valid: false, 
          error: 'Referral code has reached maximum uses' 
        });
      }
      
      return c.json({
        valid: true,
        referralInfo: {
          referrerName: `${codeCheck.referrer_first_name}`,
          referrerEmail: codeCheck.referrer_email,
          rewardTokens: codeCheck.reward_tokens,
          referrerRewardTokens: codeCheck.referrer_reward_tokens,
          maxUses: codeCheck.max_uses,
          currentUses: codeCheck.current_uses
        }
      });
      
    } catch (error) {
      console.error('Validate referral code error:', error);
      return c.json({ error: 'Failed to validate referral code' }, 500);
    }
  }

  /**
   * Apply referral code during registration
   */
  async applyReferralCode(c: Context) {
    try {
      const { referralCode, referralPin } = await c.req.json();
      
      const authUser = c.get('authUser');
      if (!authUser) {
        return c.json({ error: 'Authentication required' }, 401);
      }
      
      // Check if user already has a referral
      const existingReferral = await this.db.executeOne(
        'SELECT id FROM referrals WHERE referred_user_id = ?',
        [authUser.id]
      );
      
      if (existingReferral) {
        return c.json({ error: 'User already has a referral applied' }, 400);
      }
      
      // Find and validate referral code
      const codeCheck = await this.db.executeOne(`
        SELECT * FROM referral_codes 
        WHERE referral_code = ? AND referral_pin = ? AND status = 'active'
      `, [referralCode, referralPin]);
      
      if (!codeCheck) {
        return c.json({ error: 'Invalid or inactive referral code' }, 400);
      }
      
      // Check if expired
      if (codeCheck.expires_at && new Date(codeCheck.expires_at) < new Date()) {
        return c.json({ error: 'Referral code has expired' }, 400);
      }
      
      // Check if max uses reached
      if (codeCheck.current_uses >= codeCheck.max_uses) {
        return c.json({ error: 'Referral code has reached maximum uses' }, 400);
      }
      
      // Check if referring to self
      if (codeCheck.referrer_id === authUser.id) {
        return c.json({ error: 'Cannot refer yourself' }, 400);
      }
      
      // Create referral record
      const referralId = nanoid();
      await this.db.execute(`
        INSERT INTO referrals (
          id, referral_code_id, referrer_id, referred_user_id, status, created_at
        ) VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
      `, [referralId, codeCheck.id, codeCheck.referrer_id, authUser.id]);
      
      // Update referral code usage
      await this.db.execute(`
        UPDATE referral_codes 
        SET current_uses = current_uses + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [codeCheck.id]);
      
      return c.json({
        success: true,
        message: 'Referral code applied successfully',
        referralInfo: {
          rewardTokens: codeCheck.reward_tokens,
          referrerRewardTokens: codeCheck.referrer_reward_tokens
        }
      });
      
    } catch (error) {
      console.error('Apply referral code error:', error);
      return c.json({ error: 'Failed to apply referral code' }, 500);
    }
  }

  /**
   * Get referral statistics
   */
  async getReferralStats(c: Context) {
    try {
      const authUser = c.get('authUser');
      if (!authUser) {
        return c.json({ error: 'Authentication required' }, 401);
      }
      
      // Get referral statistics
      const stats = await this.db.executeOne(`
        SELECT 
          COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_referrals,
          COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_referrals,
          SUM(CASE WHEN r.tokens_awarded = TRUE THEN rc.reward_tokens ELSE 0 END) as tokens_earned,
          COUNT(DISTINCT rc.id) as active_codes
        FROM referrals r
        JOIN referral_codes rc ON r.referral_code_id = rc.id
        WHERE r.referrer_id = ?
      `, [authUser.id]);
      
      const recentReferrals = await this.db.execute(`
        SELECT 
          r.id,
          r.status,
          r.tokens_awarded,
          r.referrer_tokens_awarded,
          r.created_at,
          r.completed_at,
          u.email as referred_email,
          u.first_name as referred_first_name
        FROM referrals r
        JOIN users u ON r.referred_user_id = u.id
        WHERE r.referrer_id = ?
        ORDER BY r.created_at DESC
        LIMIT 10
      `, [authUser.id]);
      
      return c.json({
        success: true,
        stats: stats || {
          completed_referrals: 0,
          pending_referrals: 0,
          tokens_earned: 0,
          active_codes: 0
        },
        recentReferrals
      });
      
    } catch (error) {
      console.error('Get referral stats error:', error);
      return c.json({ error: 'Failed to get referral statistics' }, 500);
    }
  }

  /**
   * Admin: Get all referrals
   */
  async getAllReferrals(c: Context) {
    try {
      const authUser = c.get('authUser');
      if (!authUser) {
        return c.json({ error: 'Authentication required' }, 401);
      }
      
      // Check if user is admin
      const adminCheck = await this.db.executeOne(
        'SELECT role FROM admin_accounts WHERE user_id = ?',
        [authUser.id]
      );
      
      if (!adminCheck) {
        return c.json({ error: 'Admin access required' }, 403);
      }
      
      // Get pagination parameters
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '50');
      const offset = (page - 1) * limit;
      
      const referrals = await this.db.execute(`
        SELECT 
          r.id,
          r.status,
          r.tokens_awarded,
          r.referrer_tokens_awarded,
          r.created_at,
          r.completed_at,
          referrer.email as referrer_email,
          referrer.first_name as referrer_first_name,
          referred.email as referred_email,
          referred.first_name as referred_first_name,
          rc.referral_code,
          rc.reward_tokens,
          rc.referrer_reward_tokens
        FROM referrals r
        JOIN users referrer ON r.referrer_id = referrer.id
        JOIN users referred ON r.referred_user_id = referred.id
        JOIN referral_codes rc ON r.referral_code_id = rc.id
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);
      
      const totalCount = await this.db.executeOne('SELECT COUNT(*) as count FROM referrals');
      
      return c.json({
        success: true,
        referrals,
        pagination: {
          page,
          limit,
          total: totalCount.count,
          totalPages: Math.ceil(totalCount.count / limit)
        }
      });
      
    } catch (error) {
      console.error('Get all referrals error:', error);
      return c.json({ error: 'Failed to get referrals' }, 500);
    }
  }
}