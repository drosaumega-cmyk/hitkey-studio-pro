/**
 * Rate limiting middleware
 */
import { AuthService } from '../lib/auth';
export function rateLimit(config) {
    const authService = new AuthService('');
    const rateLimiter = authService.createRateLimiter(config.maxRequests, config.windowMs);
    return async (c, next) => {
        const key = config.keyGenerator ? config.keyGenerator(c) : c.req.header('cf-connecting-ip') || 'unknown';
        if (!rateLimiter.isAllowed(key)) {
            const resetTime = rateLimiter.getResetTime(key);
            const remainingAttempts = rateLimiter.getRemainingAttempts(key);
            c.header('X-RateLimit-Limit', config.maxRequests.toString());
            c.header('X-RateLimit-Remaining', remainingAttempts.toString());
            c.header('X-RateLimit-Reset', (resetTime || 0).toString());
            c.header('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString());
            return c.json({
                error: 'Too many requests',
                message: `Rate limit exceeded. Try again in ${Math.ceil((resetTime - Date.now()) / 1000)} seconds.`,
            }, 429);
        }
        return;
        c.header('X-RateLimit-Limit', config.maxRequests.toString());
        c.header('X-RateLimit-Remaining', rateLimiter.getRemainingAttempts(key).toString());
        await next();
    };
}
// Predefined rate limiters
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    keyGenerator: (c) => `auth:${c.req.header('cf-connecting-ip') || 'unknown'}`,
});
export const paymentRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    keyGenerator: (c) => `payment:${c.req.header('cf-connecting-ip') || 'unknown'}`,
});
export const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyGenerator: (c) => `general:${c.req.header('cf-connecting-ip') || 'unknown'}`,
});
