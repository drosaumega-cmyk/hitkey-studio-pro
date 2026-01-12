/**
 * Authentication utilities for AI Audio Studio Pro
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
export class AuthService {
    jwtSecret;
    jwtExpiration;
    constructor(jwtSecret, jwtExpiration = '7d') {
        this.jwtSecret = jwtSecret;
        this.jwtExpiration = jwtExpiration;
    }
    /**
     * Hash a password using bcrypt
     */
    async hashPassword(password) {
        const saltRounds = 12;
        return bcrypt.hash(password, saltRounds);
    }
    /**
     * Verify a password against its hash
     */
    async verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
    /**
     * Generate a JWT token for a user
     */
    generateToken(user, tier = 'free') {
        const payload = {
            userId: user.id,
            email: user.email,
            tier,
        };
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.jwtExpiration,
            issuer: 'ai-audio-studio',
            audience: 'ai-audio-studio-users',
        });
    }
    /**
     * Verify and decode a JWT token
     */
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret, {
                issuer: 'ai-audio-studio',
                audience: 'ai-audio-studio-users',
            });
            return decoded;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Generate a secure random token
     */
    generateSecureToken(length = 32) {
        return nanoid(length);
    }
    /**
     * Generate email verification token
     */
    generateEmailVerificationToken() {
        return this.generateSecureToken(64);
    }
    /**
     * Generate password reset token
     */
    generatePasswordResetToken() {
        return this.generateSecureToken(64);
    }
    /**
     * Check if a token has expired
     */
    isTokenExpired(token) {
        try {
            const decoded = jwt.decode(token);
            if (!decoded || !decoded.exp) {
                return true;
            }
            return Date.now() >= decoded.exp * 1000;
        }
        catch {
            return true;
        }
    }
    /**
     * Extract token from Authorization header
     */
    extractTokenFromHeader(authHeader) {
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
    async createSessionToken(userId, userData) {
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
    validatePasswordStrength(password) {
        const errors = [];
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
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    /**
     * Sanitize and validate user input
     */
    sanitizeInput(input) {
        return input.trim().replace(/[<>]/g, '');
    }
    /**
     * Rate limiting helper
     */
    createRateLimiter(maxAttempts, windowMs) {
        const attempts = new Map();
        return {
            isAllowed: (identifier) => {
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
            reset: (identifier) => {
                attempts.delete(identifier);
            },
            getRemainingAttempts: (identifier) => {
                const record = attempts.get(identifier);
                if (!record || Date.now() > record.resetTime) {
                    return maxAttempts;
                }
                return Math.max(0, maxAttempts - record.count);
            },
            getResetTime: (identifier) => {
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
    async generateApiKey() {
        const key = `ak_${this.generateSecureToken(32)}`;
        const keyPrefix = key.substring(0, 8);
        const keyHash = await bcrypt.hash(key, 10);
        return { key, keyHash, keyPrefix };
    }
    /**
     * Verify API key
     */
    async verifyApiKey(apiKey, storedHash) {
        return bcrypt.compare(apiKey, storedHash);
    }
}
// Default instance with environment variables
export const authService = new AuthService(process.env.JWT_SECRET || 'your-secret-key', process.env.JWT_EXPIRATION || '7d');
