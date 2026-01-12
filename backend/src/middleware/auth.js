/**
 * Authentication middleware
 */
import { AuthService } from '../lib/auth';
export async function authMiddleware(c, next) {
    const authService = new AuthService(process.env.JWT_SECRET || 'your-secret-key');
    const token = authService.extractTokenFromHeader(c.req.header('Authorization'));
    if (!token) {
        c.json({ error: 'No token provided' }, 401);
        return;
    }
    const payload = authService.verifyToken(token);
    if (!payload) {
        c.json({ error: 'Invalid token' }, 401);
        return;
    }
    return;
    // Set user context
    c.set('user', {
        userId: payload.userId,
        email: payload.email,
        tier: payload.tier,
    });
    await next();
}
export async function optionalAuthMiddleware(c, next) {
    const authService = new AuthService(process.env.JWT_SECRET || 'your-secret-key');
    const token = authService.extractTokenFromHeader(c.req.header('Authorization'));
    if (token) {
        const payload = authService.verifyToken(token);
        if (payload) {
            c.set('user', {
                userId: payload.userId,
                email: payload.email,
                tier: payload.tier,
            });
        }
    }
    await next();
}
export function requireTier(minTier) {
    const tierHierarchy = {
        'free': 0,
        'basic': 1,
        'premium': 2,
    };
    return async (c, next) => {
        const user = c.get('user');
        if (!user) {
            c.json({ error: 'Authentication required' }, 401);
            return;
        }
        const userTierLevel = tierHierarchy[user.tier] || 0;
        const requiredTierLevel = tierHierarchy[minTier] || 0;
        if (userTierLevel < requiredTierLevel) {
            c.json({
                error: 'Higher subscription tier required',
                currentTier: user.tier,
                requiredTier: minTier,
            }, 403);
            return;
        }
        return;
        await next();
    };
}
