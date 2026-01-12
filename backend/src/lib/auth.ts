/**
 * Authentication utilities for AI Audio Studio Pro
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

export interface JWTPayload {
  userId: string;
  email: string;
  tier: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  email_verified: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export class AuthService {
  private jwtSecret: string;
  private jwtExpiration: string;

  constructor(jwtSecret: string, jwtExpiration: string = '7d') {
    this.jwtSecret = jwtSecret;
    this.jwtExpiration = jwtExpiration;
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password against its hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a JWT token for a user
   */
  generateToken(user: AuthUser, tier: string = 'free'): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      tier,
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiration,
      issuer: 'ai-audio-studio',
      audience: 'ai-audio-studio-users',
    } as jwt.SignOptions);
  }

  /**
   * Verify and decode a JWT token
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'ai-audio-studio',
        audience: 'ai-audio-studio-users',
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate a secure random token
   */
  generateSecureToken(length: number = 32): string {
    return nanoid(length);
  }

  /**
   * Generate email verification token
   */
  generateEmailVerificationToken(): string {
    return this.generateSecureToken(64);
  }

  /**
   * Generate password reset token
   */
  generatePasswordResetToken(): string {
    return this.generateSecureToken(64);
  }

  /**
   * Check if a token has expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1] || null;
  }

  /**
   * Create a session token for KV storage
   */
  async createSessionToken(userId: string, userData: any): Promise<string> {
    const sessionId = this.generateSecureToken();
    const sessionData = {
      userId,
      userData,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    return sessionId;
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters long');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common passwords
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a more secure password');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Sanitize and validate user input
   */
  sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  /**
   * Rate limiting helper
   */
  createRateLimiter(maxAttempts: number, windowMs: number) {
    const attempts = new Map<string, { count: number; resetTime: number }>();

    return {
      isAllowed: (identifier: string): boolean => {
        const now = Date.now();
        const record = attempts.get(identifier);

        if (!record || now > record.resetTime) {
          attempts.set(identifier, {
            count: 1,
            resetTime: now + windowMs,
          });
          return true;
        }

        if (record.count >= maxAttempts) {
          return false;
        }

        record.count++;
        return true;
      },

      reset: (identifier: string): void => {
        attempts.delete(identifier);
      },

      getRemainingAttempts: (identifier: string): number => {
        const record = attempts.get(identifier);
        if (!record || Date.now() > record.resetTime) {
          return maxAttempts;
        }
        return Math.max(0, maxAttempts - record.count);
      },

      getResetTime: (identifier: string): number | null => {
        const record = attempts.get(identifier);
        if (!record) {
          return null;
        }
        return record.resetTime;
      },
    };
  }

  /**
   * Generate API key
   */
  async generateApiKey(): Promise<{ key: string; keyHash: string; keyPrefix: string }> {
    const key = `ak_${this.generateSecureToken(32)}`;
    const keyPrefix = key.substring(0, 8);
    const keyHash = await bcrypt.hash(key, 10);

    return { key, keyHash, keyPrefix };
  }

  /**
   * Verify API key
   */
  async verifyApiKey(apiKey: string, storedHash: string): Promise<boolean> {
    return bcrypt.compare(apiKey, storedHash);
  }
}

// Default instance with environment variables
export const authService = new AuthService(
  process.env.JWT_SECRET || 'your-secret-key',
  process.env.JWT_EXPIRATION || '7d'
);