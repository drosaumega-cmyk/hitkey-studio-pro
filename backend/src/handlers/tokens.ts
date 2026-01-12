/**
 * Token management API handlers
 */

import { Context } from 'hono';
import { DatabaseService } from '../lib/database';
import { PaymentService } from '../lib/payments';
import { AuthService } from '../lib/auth';
import { nanoid } from 'nanoid';

export interface TokenTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'spent' | 'purchased' | 'bonus' | 'refund';
  amount: number;
  tokenType: 'voice_cloning' | 'stem_separation' | 'voice_cleaning' | 'voice_changing' | 'video_generation';
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface TokenBalance {
  total: number;
  used: number;
  available: number;
  byType: Record<string, { total: number; used: number; available: number }>;
}

export class TokenHandler {
  private db: DatabaseService;
  private paymentService: PaymentService;
  private authService: AuthService;

  constructor(db: DatabaseService) {
    this.db = db;
    this.paymentService = new PaymentService(
      process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_key'
    );
    this.authService = new AuthService(
      process.env.JWT_SECRET || 'your-secret-key'
    );
  }

  /**
   * Get user's token balance
   */
  async getTokenBalance(c: Context) {
    try {
      const token = this.authService.extractTokenFromHeader(c.req.header('Authorization') || undefined);
      if (!token) {
        return c.json({ error: 'No token provided' }, 401);
      }

      const payload = this.authService.verifyToken(token);
      if (!payload) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const balance = await this.calculateTokenBalance(payload.userId);

      return c.json({ balance });
    } catch (error) {
      console.error('Get token balance error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  /**
   * Get token transactions
   */
  async getTokenTransactions(c: Context) {
    try {
      const token = this.authService.extractTokenFromHeader(c.req.header('Authorization') || undefined);
      if (!token) {
        return c.json({ error: 'No token provided' }, 401);
      }

      const payload = this.authService.verifyToken(token);
      if (!payload) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const { page = 1, limit = 20, type, tokenType } = c.req.query();

      let whereClause = 'WHERE user_id = ?';
      const params: any[] = [payload.userId];

      if (type) {
        whereClause += ' AND type = ?';
        params.push(type);
      }

      if (tokenType) {
        whereClause += ' AND token_type = ?';
        params.push(tokenType);
      }

      const result = await this.db.paginate(
        `SELECT * FROM token_transactions ${whereClause} ORDER BY created_at DESC`,
        params,
        parseInt(page as string),
        parseInt(limit as string)
      );

      return c.json(result);
    } catch (error) {
      console.error('Get token transactions error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  /**
   * Get available token packs
   */
  async getTokenPacks(c: Context) {
    try {
      const packs = await this.db.execute(
        'SELECT * FROM token_packs WHERE is_active = TRUE ORDER BY price'
      );

      return c.json({ packs });
    } catch (error) {
      console.error('Get token packs error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  /**
   * Purchase token pack
   */
  async purchaseTokenPack(c: Context) {
    try {
      const token = this.authService.extractTokenFromHeader(c.req.header('Authorization') || undefined);
      if (!token) {
        return c.json({ error: 'No token provided' }, 401);
      }

      const payload = this.authService.verifyToken(token);
      if (!payload) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const { tokenPackId } = await c.req.json();

      if (!tokenPackId) {
        return c.json({ error: 'Token pack ID is required' }, 400);
      }

      // Get token pack details
      const tokenPack = await this.db.executeOne(
        'SELECT * FROM token_packs WHERE id = ? AND is_active = TRUE',
        [tokenPackId]
      );

      if (!tokenPack) {
        return c.json({ error: 'Token pack not found' }, 404);
      }

      // Get user details
      const user = await this.db.executeOne(
        'SELECT id, email, stripe_customer_id FROM users WHERE id = ?',
        [payload.userId]
      );

      if (!user) {
        return c.json({ error: 'User not found' }, 404);
      }

      // Create or get Stripe customer
      let customerId = user.stripe_customer_id;
      if (!customerId) {
        const customer = await this.paymentService.createCustomer(
          user.email,
          undefined,
          { userId: user.id }
        );
        customerId = customer.id;

        await this.db.executeRun(
          'UPDATE users SET stripe_customer_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [customerId, user.id]
        );
      }

      // Create payment intent
      const paymentIntent = await this.paymentService.createPaymentIntent(
        tokenPack.price,
        tokenPack.currency.toLowerCase(),
        customerId,
        {
          userId: user.id,
          tokenPackId: tokenPack.id,
          type: 'token_pack_purchase',
        }
      );

      // Create purchase record
      const purchaseId = nanoid();
      await this.db.executeRun(
        `INSERT INTO user_token_packs (
          id, user_id, token_pack_id, stripe_payment_intent_id, 
          tokens_purchased, bonus_tokens, price, currency, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
        [
          purchaseId,
          user.id,
          tokenPack.id,
          paymentIntent.id,
          tokenPack.tokens,
          tokenPack.bonus_tokens,
          tokenPack.price,
          tokenPack.currency,
        ]
      );

      // Log audit event
      await this.db.executeRun(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values, ip_address, user_agent, created_at)
           VALUES (?, 'purchase_token_pack', 'token_pack', ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          user.id,
          tokenPack.id,
          JSON.stringify({ tokenPackId, purchaseId, amount: tokenPack.price }),
          c.req.header('cf-connecting-ip') || null,
          c.req.header('user-agent') || null
        ]
      );

      return c.json({
        purchaseId,
        clientSecret: paymentIntent.clientSecret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      });
    } catch (error) {
      console.error('Purchase token pack error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  /**
   * Process token usage
   */
  async processTokenUsage(c: Context) {
    try {
      const token = this.authService.extractTokenFromHeader(c.req.header('Authorization') || undefined);
      if (!token) {
        return c.json({ error: 'No token provided' }, 401);
      }

      const payload = this.authService.verifyToken(token);
      if (!payload) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const { tokenType, amount = 1, description, metadata } = await c.req.json();

      if (!tokenType) {
        return c.json({ error: 'Token type is required' }, 400);
      }

      const validTokenTypes = ['voice_cloning', 'stem_separation', 'voice_cleaning', 'voice_changing', 'video_generation'];
      if (!validTokenTypes.includes(tokenType)) {
        return c.json({ error: 'Invalid token type' }, 400);
      }

      // Check token balance
      const balance = await this.calculateTokenBalance(payload.userId);
      if (balance.available < amount) {
        return c.json({ 
          error: 'Insufficient tokens', 
          required: amount,
          available: balance.available,
        }, 400);
      }

      // Record token usage
      const transactionId = nanoid();
      await this.db.executeRun(
        `INSERT INTO token_transactions (
          id, user_id, type, amount, token_type, description, metadata, created_at
        ) VALUES (?, ?, 'spent', ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          transactionId,
          payload.userId,
          amount,
          tokenType,
          description,
          metadata ? JSON.stringify(metadata) : null,
        ]
      );

      // Update usage analytics
      await this.db.executeRun(
        `INSERT INTO usage_analytics (
          id, user_id, feature, token_type, tokens_consumed, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          nanoid(),
          payload.userId,
          tokenType,
          tokenType,
          amount,
          metadata ? JSON.stringify(metadata) : null,
        ]
      );

      // Log audit event
      await this.db.executeRun(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values, ip_address, user_agent, created_at)
           VALUES (?, 'spend_tokens', 'token_transaction', ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          payload.userId,
          transactionId,
          JSON.stringify({ amount, tokenType, description }),
          c.req.header('cf-connecting-ip') || null,
          c.req.header('user-agent') || null
        ]
      );

      return c.json({
        success: true,
        transactionId,
        amount,
        remainingBalance: balance.available - amount,
      });
    } catch (error) {
      console.error('Process token usage error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  /**
   * Add tokens (for bonuses, refunds, etc.)
   */
  async addTokens(c: Context) {
    try {
      const token = this.authService.extractTokenFromHeader(c.req.header('Authorization') || undefined);
      if (!token) {
        return c.json({ error: 'No token provided' }, 401);
      }

      const payload = this.authService.verifyToken(token);
      if (!payload) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const { amount, type = 'bonus', tokenType = 'voice_cloning', description, metadata } = await c.req.json();

      if (!amount || amount <= 0) {
        return c.json({ error: 'Valid amount is required' }, 400);
      }

      const validTypes = ['earned', 'bonus', 'refund'];
      if (!validTypes.includes(type)) {
        return c.json({ error: 'Invalid transaction type' }, 400);
      }

      // Record token addition
      const transactionId = nanoid();
      await this.db.executeRun(
        `INSERT INTO token_transactions (
          id, user_id, type, amount, token_type, description, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          transactionId,
          payload.userId,
          type,
          amount,
          tokenType,
          description,
          metadata ? JSON.stringify(metadata) : null,
        ]
      );

      // Log audit event
      await this.db.executeRun(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values, ip_address, user_agent, created_at)
           VALUES (?, 'add_tokens', 'token_transaction', ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          payload.userId,
          transactionId,
          JSON.stringify({ amount, type, tokenType, description }),
          c.req.header('cf-connecting-ip') || null,
          c.req.header('user-agent') || null
        ]
      );

      const newBalance = await this.calculateTokenBalance(payload.userId);

      return c.json({
        success: true,
        transactionId,
        amount,
        type,
        newBalance,
      });
    } catch (error) {
      console.error('Add tokens error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  /**
   * Get social engagement tasks
   */
  async getSocialEngagements(c: Context) {
    try {
      const token = this.authService.extractTokenFromHeader(c.req.header('Authorization') || undefined);
      if (!token) {
        return c.json({ error: 'No token provided' }, 401);
      }

      const payload = this.authService.verifyToken(token);
      if (!payload) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      // Get user's completed engagements
      const completedEngagements = await this.db.execute(
        `SELECT platform, action, tokens_earned, completed_at 
         FROM social_engagements 
         WHERE user_id = ? AND verified = TRUE 
         ORDER BY completed_at DESC`,
        [payload.userId]
      );

      // Define available engagement tasks
      const availableTasks = [
        {
          platform: 'twitter',
          action: 'follow',
          tokens: 10,
          description: 'Follow our Twitter account',
          verificationUrl: 'https://twitter.com/aiaudiostudio',
        },
        {
          platform: 'twitter',
          action: 'share',
          tokens: 15,
          description: 'Share our product on Twitter',
          verificationUrl: null,
        },
        {
          platform: 'facebook',
          action: 'like',
          tokens: 10,
          description: 'Like our Facebook page',
          verificationUrl: 'https://facebook.com/aiaudiostudio',
        },
        {
          platform: 'instagram',
          action: 'follow',
          tokens: 10,
          description: 'Follow our Instagram account',
          verificationUrl: 'https://instagram.com/aiaudiostudio',
        },
        {
          platform: 'youtube',
          action: 'subscribe',
          tokens: 20,
          description: 'Subscribe to our YouTube channel',
          verificationUrl: 'https://youtube.com/@aiaudiostudio',
        },
      ];

      // Filter out completed tasks
      const availableTasksFiltered = availableTasks.filter(task => {
        return !completedEngagements.some((completed: any) => 
          completed.platform === task.platform && completed.action === task.action
        );
      });

      return c.json({
        availableTasks: availableTasksFiltered,
        completedEngagements,
      });
    } catch (error) {
      console.error('Get social engagements error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  /**
   * Submit social engagement
   */
  async submitSocialEngagement(c: Context) {
    try {
      const token = this.authService.extractTokenFromHeader(c.req.header('Authorization') || undefined);
      if (!token) {
        return c.json({ error: 'No token provided' }, 401);
      }

      const payload = this.authService.verifyToken(token);
      if (!payload) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const { platform, action, verificationUrl } = await c.req.json();

      if (!platform || !action) {
        return c.json({ error: 'Platform and action are required' }, 400);
      }

      const validPlatforms = ['twitter', 'facebook', 'instagram', 'linkedin', 'tiktok', 'youtube'];
      const validActions = ['follow', 'share', 'like', 'comment', 'post', 'subscribe'];

      if (!validPlatforms.includes(platform) || !validActions.includes(action)) {
        return c.json({ error: 'Invalid platform or action' }, 400);
      }

      // Check if already completed
      const existing = await this.db.executeOne(
        `SELECT id FROM social_engagements 
         WHERE user_id = ? AND platform = ? AND action = ? AND verified = TRUE`,
        [payload.userId, platform, action]
      );

      if (existing) {
        return c.json({ error: 'Task already completed' }, 409);
      }

      // Define token rewards
      const tokenRewards: Record<string, Record<string, number>> = {
        twitter: { follow: 10, share: 15, like: 5, comment: 8 },
        facebook: { follow: 10, like: 5, share: 12, comment: 8 },
        instagram: { follow: 10, like: 5, comment: 8 },
        linkedin: { follow: 15, share: 20, like: 10, comment: 12 },
        tiktok: { follow: 15, like: 10, share: 18, comment: 10 },
        youtube: { subscribe: 20, like: 8, comment: 10 },
      };

      const tokensEarned = tokenRewards[platform]?.[action] || 5;

      // Create engagement record (pending verification)
      const engagementId = nanoid();
      await this.db.executeRun(
        `INSERT INTO social_engagements (
          id, user_id, platform, action, tokens_earned, verification_url, 
          verified, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, FALSE, CURRENT_TIMESTAMP)`,
        [engagementId, payload.userId, platform, action, tokensEarned, verificationUrl]
      );

      // TODO: Implement verification logic
      // For now, auto-verify for demo purposes
      await this.db.executeRun(
        `UPDATE social_engagements 
         SET verified = TRUE, completed_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [engagementId]
      );

      // Add tokens to user balance
      await this.db.executeRun(
        `INSERT INTO token_transactions (
          id, user_id, type, amount, token_type, description, metadata, created_at
        ) VALUES (?, ?, 'earned', ?, 'voice_cloning', ?, ?, CURRENT_TIMESTAMP)`,
        [
          nanoid(),
          payload.userId,
          tokensEarned,
          `Social media engagement: ${platform} ${action}`,
          JSON.stringify({ engagementId, platform, action }),
        ]
      );

      // Log audit event
      await this.db.executeRun(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values, ip_address, user_agent, created_at)
           VALUES (?, 'social_engagement', 'social_engagement', ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          payload.userId,
          engagementId,
          JSON.stringify({ platform, action, tokensEarned }),
          c.req.header('cf-connecting-ip') || null,
          c.req.header('user-agent') || null
        ]
      );

      const newBalance = await this.calculateTokenBalance(payload.userId);

      return c.json({
        success: true,
        engagementId,
        tokensEarned,
        newBalance,
        message: 'Social engagement completed successfully!',
      });
    } catch (error) {
      console.error('Submit social engagement error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  /**
   * Calculate user's token balance
   */
  private async calculateTokenBalance(userId: string): Promise<TokenBalance> {
    const balance = await this.db.executeOne(
      `SELECT 
         SUM(CASE WHEN type IN ('earned', 'purchased', 'bonus') THEN amount ELSE 0 END) as total,
         SUM(CASE WHEN type IN ('spent', 'refund') THEN amount ELSE 0 END) as used
       FROM token_transactions 
       WHERE user_id = ?`,
      [userId]
    );

    const total = balance?.total || 0;
    const used = balance?.used || 0;
    const available = total - used;

    // Get balance by token type
    const byTypeResult = await this.db.execute(
      `SELECT token_type,
         SUM(CASE WHEN type IN ('earned', 'purchased', 'bonus') THEN amount ELSE 0 END) as total,
         SUM(CASE WHEN type IN ('spent', 'refund') THEN amount ELSE 0 END) as used
       FROM token_transactions 
       WHERE user_id = ?
       GROUP BY token_type`,
      [userId]
    );

    const byType: Record<string, { total: number; used: number; available: number }> = {};
    byTypeResult.forEach((row: any) => {
      byType[row.token_type] = {
        total: row.total || 0,
        used: row.used || 0,
        available: (row.total || 0) - (row.used || 0),
      };
    });

    return {
      total,
      used,
      available,
      byType,
    };
  }

  /**
   * Get usage analytics
   */
  async getUsageAnalytics(c: Context) {
    try {
      const token = this.authService.extractTokenFromHeader(c.req.header('Authorization') || undefined);
      if (!token) {
        return c.json({ error: 'No token provided' }, 401);
      }

      const payload = this.authService.verifyToken(token);
      if (!payload) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const { period = '30d' } = c.req.query();

      let dateFilter = '';
      const params: any[] = [payload.userId];

      if (period === '7d') {
        dateFilter = 'AND created_at >= datetime("now", "-7 days")';
      } else if (period === '30d') {
        dateFilter = 'AND created_at >= datetime("now", "-30 days")';
      } else if (period === '90d') {
        dateFilter = 'AND created_at >= datetime("now", "-90 days")';
      }

      const analytics = await this.db.execute(
        `SELECT feature, token_type, SUM(tokens_consumed) as total_tokens, 
                COUNT(*) as usage_count, AVG(processing_time_ms) as avg_processing_time,
                SUM(file_size_mb) as total_file_size
         FROM usage_analytics 
         WHERE user_id = ? ${dateFilter}
         GROUP BY feature, token_type
         ORDER BY total_tokens DESC`,
        params
      );

      const totalUsage = await this.db.executeOne(
        `SELECT SUM(tokens_consumed) as total_tokens, COUNT(*) as total_usage
         FROM usage_analytics 
         WHERE user_id = ? ${dateFilter}`,
        params
      );

      return c.json({
        analytics,
        summary: {
          totalTokens: totalUsage?.total_tokens || 0,
          totalUsage: totalUsage?.total_usage || 0,
          period,
        },
      });
    } catch (error) {
      console.error('Get usage analytics error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
}