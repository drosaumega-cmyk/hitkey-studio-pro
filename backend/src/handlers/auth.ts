/**
 * Authentication API handlers
 */

import { Context } from 'hono';
import { AuthService, AuthUser } from '../lib/auth';
import { DatabaseService } from '../lib/database';
import { SessionService } from '../lib/database';
import { nanoid } from 'nanoid';

export class AuthHandler {
  private authService: AuthService;
  private db: DatabaseService;
  private sessionService: SessionService;

  constructor(db: DatabaseService, sessionService: SessionService) {
    this.authService = new AuthService(
      process.env.JWT_SECRET || 'your-secret-key',
      process.env.JWT_EXPIRATION || '7d'
    );
    this.db = db;
    this.sessionService = sessionService;
  }

  /**
   * Register a new user
   */
  async register(c: Context) {
    try {
      const { email, password, firstName, lastName } = await c.req.json();

      // Validate input
      if (!email || !password) {
        return c.json({ error: 'Email and password are required' }, 400);
      }

      if (!this.authService.validateEmail(email)) {
        return c.json({ error: 'Invalid email format' }, 400);
      }

      const passwordValidation = this.authService.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return c.json({ 
          error: 'Password does not meet requirements', 
          details: passwordValidation.errors 
        }, 400);
      }

      // Check if user already exists
      const existingUser = await this.db.executeOne(
        'SELECT id FROM users WHERE email = ?',
        [email.toLowerCase()]
      );

      if (existingUser) {
        return c.json({ error: 'User already exists' }, 409);
      }

      // Hash password
      const passwordHash = await this.authService.hashPassword(password);
      const userId = nanoid();
      const emailVerificationToken = this.authService.generateEmailVerificationToken();
      const emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user
      await this.db.executeRun(
        `INSERT INTO users (
          id, email, password_hash, first_name, last_name, 
          email_verification_token, email_verification_expires_at,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          userId,
          email.toLowerCase(),
          passwordHash,
          firstName || null,
          lastName || null,
          emailVerificationToken,
          emailVerificationExpiresAt.toISOString(),
        ]
      );

      // Create user profile
      await this.db.executeRun(
        `INSERT INTO user_profiles (user_id, created_at, updated_at) VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [userId]
      );

      // TODO: Send verification email
      console.log(`Email verification token for ${email}: ${emailVerificationToken}`);

      // Create free subscription
      const freePlan = await this.db.executeOne(
        'SELECT id FROM subscription_plans WHERE tier = ? AND billing_cycle = ?',
        ['free', 'monthly']
      );

      if (freePlan) {
        await this.db.executeRun(
          `INSERT INTO user_subscriptions (
            id, user_id, plan_id, status, tokens_allocated, tokens_used,
            current_period_start, current_period_end, created_at, updated_at
          ) VALUES (?, ?, ?, 'active', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            nanoid(),
            userId,
            freePlan.id,
            50, // Free tier tokens
            0,
          ]
        );
      }

      // Generate JWT token
      const user = { id: userId, email } as AuthUser;
      const token = this.authService.generateToken(user, 'free');

      // Create session
      await this.sessionService.createSession(token, { userId, email, tier: 'free' });

      return c.json({
        message: 'User registered successfully',
        user: {
          id: userId,
          email,
          firstName,
          lastName,
          emailVerified: false,
        },
        token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  /**
   * Login user
   */
  async login(c: Context) {
    try {
      const { email, password } = await c.req.json();

      if (!email || !password) {
        return c.json({ error: 'Email and password are required' }, 400);
      }

      // Find user
      const user = await this.db.executeOne(
        `SELECT id, email, password_hash, first_name, last_name, email_verified, status, created_at, updated_at 
         FROM users WHERE email = ? AND status = 'active'`,
        [email.toLowerCase()]
      ) as AuthUser | null;

      if (!user) {
        return c.json({ error: 'Invalid credentials' }, 401);
      }

      // Verify password
      const isValidPassword = await this.authService.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return c.json({ error: 'Invalid credentials' }, 401);
      }

      // Get user subscription
      const subscription = await this.db.executeOne(
        `SELECT us.*, sp.tier, sp.tokens as plan_tokens 
         FROM user_subscriptions us 
         JOIN subscription_plans sp ON us.plan_id = sp.id 
         WHERE us.user_id = ? AND us.status = 'active' 
         ORDER BY us.created_at DESC LIMIT 1`,
        [user.id]
      );

      const tier = subscription?.tier || 'free';

      // Generate JWT token
      const token = this.authService.generateToken(user, tier);

      // Update last login
      await this.db.executeRun(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );

      // Create session
      await this.sessionService.createSession(token, { 
        userId: user.id, 
        email: user.email, 
        tier,
        subscription 
      });

      // Log audit event
      await this.db.executeRun(
        `INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent, created_at)
         VALUES (?, 'login', 'user', ?, ?, CURRENT_TIMESTAMP)`,
        [user.id, c.req.header('cf-connecting-ip') || null, c.req.header('user-agent') || null]
      );

      return c.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          emailVerified: user.email_verified,
          tier,
          subscription,
        },
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  /**
   * Logout user
   */
  async logout(c: Context) {
    try {
      const token = this.authService.extractTokenFromHeader(c.req.header('Authorization') || undefined);
      if (!token) {
        return c.json({ error: 'No token provided' }, 401);
      }

      // Delete session
      await this.sessionService.deleteSession(token);

      // Log audit event
      const payload = this.authService.verifyToken(token);
      if (payload) {
        await this.db.executeRun(
          `INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent, created_at)
             VALUES (?, 'logout', 'user', ?, ?, CURRENT_TIMESTAMP)`,
          [payload.userId, c.req.header('cf-connecting-ip') || null, c.req.header('user-agent') || null]
        );
      }

      return c.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(c: Context) {
    try {
      const token = this.authService.extractTokenFromHeader(c.req.header('Authorization') || undefined);
      if (!token) {
        return c.json({ error: 'No token provided' }, 401);
      }

      const payload = this.authService.verifyToken(token);
      if (!payload) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      // Get user details
      const user = await this.db.executeOne(
        `SELECT u.*, up.bio, up.company, up.website, up.location, up.timezone, up.language, up.preferences
         FROM users u 
         LEFT JOIN user_profiles up ON u.id = up.user_id 
         WHERE u.id = ?`,
        [payload.userId]
      );

      if (!user) {
        return c.json({ error: 'User not found' }, 404);
      }

      // Get subscription details
      const subscription = await this.db.executeOne(
        `SELECT us.*, sp.name as plan_name, sp.tier, sp.billing_cycle, sp.price, sp.currency, sp.tokens as plan_tokens, sp.features
         FROM user_subscriptions us 
         JOIN subscription_plans sp ON us.plan_id = sp.id 
         WHERE us.user_id = ? AND us.status = 'active' 
         ORDER BY us.created_at DESC LIMIT 1`,
        [payload.userId]
      );

      // Get token balance
      const tokenBalance = await this.db.executeOne(
        `SELECT 
           SUM(CASE WHEN type = 'earned' OR type = 'purchased' OR type = 'bonus' THEN amount ELSE 0 END) as total,
           SUM(CASE WHEN type = 'spent' OR type = 'refund' THEN amount ELSE 0 END) as used
         FROM token_transactions 
         WHERE user_id = ?`,
        [payload.userId]
      );

      const totalTokens = tokenBalance?.total || 0;
      const usedTokens = tokenBalance?.used || 0;
      const availableTokens = totalTokens - usedTokens;

      return c.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          emailVerified: user.email_verified,
          status: user.status,
          profile: {
            bio: user.bio,
            company: user.company,
            website: user.website,
            location: user.location,
            timezone: user.timezone,
            language: user.language,
            preferences: user.preferences ? JSON.parse(user.preferences) : {},
          },
        },
        subscription,
        tokenBalance: {
          total: totalTokens,
          used: usedTokens,
          available: availableTokens,
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(c: Context) {
    try {
      const token = this.authService.extractTokenFromHeader(c.req.header('Authorization') || undefined);
      if (!token) {
        return c.json({ error: 'No token provided' }, 401);
      }

      const payload = this.authService.verifyToken(token);
      if (!payload) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const { firstName, lastName, profile } = await c.req.json();

      // Update user basic info
      if (firstName !== undefined || lastName !== undefined) {
        await this.db.executeRun(
          `UPDATE users SET first_name = ?, last_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [firstName || null, lastName || null, payload.userId]
        );
      }

      // Update profile
      if (profile) {
        const { bio, company, website, location, timezone, language, preferences } = profile;
        
        await this.db.executeRun(
          `UPDATE user_profiles 
           SET bio = ?, company = ?, website = ?, location = ?, timezone = ?, language = ?, preferences = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE user_id = ?`,
          [
            bio || null,
            company || null,
            website || null,
            location || null,
            timezone || 'UTC',
            language || 'en',
            preferences ? JSON.stringify(preferences) : null,
            payload.userId,
          ]
        );
      }

      // Log audit event
      await this.db.executeRun(
        `INSERT INTO audit_logs (user_id, action, resource_type, old_values, new_values, ip_address, user_agent, created_at)
         VALUES (?, 'update', 'user_profile', ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          payload.userId,
          JSON.stringify({ firstName, lastName, profile }),
          JSON.stringify({ firstName, lastName, profile }),
          c.req.header('cf-connecting-ip') || null,
          c.req.header('user-agent') || null
        ]
      );

      return c.json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Update profile error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  /**
   * Change password
   */
  async changePassword(c: Context) {
    try {
      const token = this.authService.extractTokenFromHeader(c.req.header('Authorization') || undefined);
      if (!token) {
        return c.json({ error: 'No token provided' }, 401);
      }

      const payload = this.authService.verifyToken(token);
      if (!payload) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const { currentPassword, newPassword } = await c.req.json();

      if (!currentPassword || !newPassword) {
        return c.json({ error: 'Current password and new password are required' }, 400);
      }

      // Validate new password
      const passwordValidation = this.authService.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return c.json({ 
          error: 'New password does not meet requirements', 
          details: passwordValidation.errors 
        }, 400);
      }

      // Get current user
      const user = await this.db.executeOne(
        'SELECT password_hash FROM users WHERE id = ?',
        [payload.userId]
      );

      if (!user) {
        return c.json({ error: 'User not found' }, 404);
      }

      // Verify current password
      const isValidPassword = await this.authService.verifyPassword(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return c.json({ error: 'Current password is incorrect' }, 401);
      }

      // Hash new password
      const newPasswordHash = await this.authService.hashPassword(newPassword);

      // Update password
      await this.db.executeRun(
        'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newPasswordHash, payload.userId]
      );

      // Log audit event
      await this.db.executeRun(
        `INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent, created_at)
           VALUES (?, 'change_password', 'user', ?, ?, CURRENT_TIMESTAMP)`,
        [payload.userId, c.req.header('cf-connecting-ip'), c.req.header('user-agent')]
      );

      return c.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(c: Context) {
    try {
      const { email } = await c.req.json();

      if (!email) {
        return c.json({ error: 'Email is required' }, 400);
      }

      const user = await this.db.executeOne(
        'SELECT id, email FROM users WHERE email = ? AND status = \'active\'',
        [email.toLowerCase()]
      );

      if (!user) {
        // Don't reveal if user exists or not
        return c.json({ message: 'If an account exists, a password reset link will be sent' });
      }

      const resetToken = this.authService.generatePasswordResetToken();
      const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.db.executeRun(
        'UPDATE users SET reset_password_token = ?, reset_password_expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [resetToken, resetExpiresAt.toISOString(), user.id]
      );

      // TODO: Send reset email
      console.log(`Password reset token for ${email}: ${resetToken}`);

      return c.json({ message: 'If an account exists, a password reset link will be sent' });
    } catch (error) {
      console.error('Request password reset error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(c: Context) {
    try {
      const { token, newPassword } = await c.req.json();

      if (!token || !newPassword) {
        return c.json({ error: 'Token and new password are required' }, 400);
      }

      // Validate new password
      const passwordValidation = this.authService.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return c.json({ 
          error: 'New password does not meet requirements', 
          details: passwordValidation.errors 
        }, 400);
      }

      const user = await this.db.executeOne(
        'SELECT id, reset_password_expires_at FROM users WHERE reset_password_token = ? AND status = \'active\'',
        [token]
      );

      if (!user) {
        return c.json({ error: 'Invalid or expired reset token' }, 400);
      }

      if (new Date() > new Date(user.reset_password_expires_at)) {
        return c.json({ error: 'Reset token has expired' }, 400);
      }

      // Hash new password
      const newPasswordHash = await this.authService.hashPassword(newPassword);

      // Update password and clear reset token
      await this.db.executeRun(
        'UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newPasswordHash, user.id]
      );

      // Log audit event
      await this.db.executeRun(
        `INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent, created_at)
           VALUES (?, 'reset_password', 'user', ?, ?, CURRENT_TIMESTAMP)`,
        [user.id, c.req.header('cf-connecting-ip') || null, c.req.header('user-agent') || null]
      );

      return c.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(c: Context) {
    try {
      const { token } = await c.req.json();

      if (!token) {
        return c.json({ error: 'Verification token is required' }, 400);
      }

      const user = await this.db.executeOne(
        'SELECT id, email_verification_expires_at FROM users WHERE email_verification_token = ? AND status = \'active\'',
        [token]
      );

      if (!user) {
        return c.json({ error: 'Invalid verification token' }, 400);
      }

      if (new Date() > new Date(user.email_verification_expires_at)) {
        return c.json({ error: 'Verification token has expired' }, 400);
      }

      // Update user as verified
      await this.db.executeRun(
        'UPDATE users SET email_verified = TRUE, email_verification_token = NULL, email_verification_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );

      return c.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Verify email error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
}