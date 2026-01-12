/**
 * Request validation middleware
 */
import { z } from 'zod';
export function validateBody(schema) {
    return async (c, next) => {
        try {
            const body = await c.req.json();
            const validatedData = schema.parse(body);
            // Store validated data in context for use in handlers
            c.set('validatedBody', validatedData);
            await next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({
                    error: 'Validation failed',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                }, 400);
            }
            return c.json({ error: 'Invalid request body' }, 400);
        }
        return;
    };
}
export function validateQuery(schema) {
    return async (c, next) => {
        try {
            const query = Object.fromEntries(Object.entries(c.req.queries()));
            const validatedData = schema.parse(query);
            c.set('validatedQuery', validatedData);
            await next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({
                    error: 'Query validation failed',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                }, 400);
            }
            return c.json({ error: 'Invalid query parameters' }, 400);
        }
        return;
    };
}
// Common validation schemas
export const schemas = {
    register: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/\d/, 'Password must contain at least one number')
            .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
    }),
    login: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(1, 'Password is required'),
    }),
    changePassword: z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/\d/, 'Password must contain at least one number')
            .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
    }),
    updateProfile: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        profile: z.object({
            bio: z.string().optional(),
            company: z.string().optional(),
            website: z.string().url('Invalid website URL').optional().or(z.literal('')),
            location: z.string().optional(),
            timezone: z.string().optional(),
            language: z.string().optional(),
            preferences: z.record(z.any()).optional(),
        }).optional(),
    }),
    tokenUsage: z.object({
        tokenType: z.enum(['voice_cloning', 'stem_separation', 'voice_cleaning', 'voice_changing', 'video_generation']),
        amount: z.number().int().min(1).default(1),
        description: z.string().optional(),
        metadata: z.record(z.any()).optional(),
    }),
    addTokens: z.object({
        amount: z.number().int().min(1),
        type: z.enum(['earned', 'bonus', 'refund']),
        tokenType: z.enum(['voice_cloning', 'stem_separation', 'voice_cleaning', 'voice_changing', 'video_generation']).default('voice_cloning'),
        description: z.string().optional(),
        metadata: z.record(z.any()).optional(),
    }),
    purchaseTokenPack: z.object({
        tokenPackId: z.string().min(1, 'Token pack ID is required'),
    }),
    socialEngagement: z.object({
        platform: z.enum(['twitter', 'facebook', 'instagram', 'linkedin', 'tiktok', 'youtube']),
        action: z.enum(['follow', 'share', 'like', 'comment', 'post', 'subscribe']),
        verificationUrl: z.string().url().optional().or(z.literal('')),
    }),
    createSubscriptionCheckout: z.object({
        planId: z.string().min(1, 'Plan ID is required'),
        trialPeriodDays: z.number().int().min(0).max(365).optional(),
    }),
    cancelSubscription: z.object({
        immediate: z.boolean().default(false),
    }),
    updateSubscription: z.object({
        newPlanId: z.string().min(1, 'New plan ID is required'),
    }),
    pagination: z.object({
        page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
        limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('20'),
    }),
    analyticsPeriod: z.object({
        period: z.enum(['7d', '30d', '90d']).default('30d'),
    }),
    // Referral system schemas
    createReferralCode: z.object({
        maxUses: z.number().int().min(1).max(1000).optional(),
        rewardTokens: z.number().int().min(1).max(1000).optional(),
        referrerRewardTokens: z.number().int().min(1).max(1000).optional(),
        expiresAt: z.string().datetime().optional(),
    }),
    validateReferralCode: z.object({
        referralCode: z.string().min(3).max(50),
        referralPin: z.string().min(4).max(20),
    }),
    applyReferralCode: z.object({
        referralCode: z.string().min(3).max(50),
        referralPin: z.string().min(4).max(20),
    }),
    // Admin system schemas
    createAdmin: z.object({
        email: z.string().email(),
        role: z.enum(['super_admin', 'admin', 'moderator']),
        permissions: z.array(z.string()).optional(),
    }),
    createSite: z.object({
        domain: z.string().min(3),
        name: z.string().min(1),
        description: z.string().optional(),
        logoUrl: z.string().url().optional(),
        themeConfig: z.record(z.any()).optional(),
        customDomain: z.string().optional(),
    }),
};
