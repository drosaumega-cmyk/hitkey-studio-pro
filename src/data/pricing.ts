/**
 * Comprehensive pricing strategy for AI Audio Studio Pro
 * Optimized for US-based app with worldwide utilization
 */

import {
  SubscriptionPlan,
  TokenPack,
  PricingStrategy,
  BillingCycle,
  SubscriptionTier,
  DEFAULT_TOKEN_COSTS,
  SOCIAL_TOKEN_REWARDS
} from '../types/token'

// Base subscription plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  // Free Tier
  {
    id: 'free-monthly',
    name: 'Free',
    tier: 'free',
    billingCycle: 'monthly',
    price: 0,
    currency: 'USD',
    tokens: 50,
    tokenCosts: {
      voice_cloning: 15,
      stem_separation: 8,
      voice_cleaning: 5,
      voice_changing: 3,
      video_generation: 30
    },
    features: [
      'Basic voice cloning',
      'Standard stem separation',
      'Noise reduction',
      'Voice effects',
      '720p video generation',
      'Community support',
      'Watermarked outputs'
    ],
    maxFileSize: 10, // 10MB
    maxConcurrentJobs: 1,
    prioritySupport: false,
    apiAccess: false,
    customModels: false,
    watermark: true
  },
  
  // Basic Tier - Monthly
  {
    id: 'basic-monthly',
    name: 'Basic',
    tier: 'basic',
    billingCycle: 'monthly',
    price: 19.99,
    currency: 'USD',
    tokens: 500,
    tokenCosts: {
      voice_cloning: 10,
      stem_separation: 5,
      voice_cleaning: 3,
      voice_changing: 2,
      video_generation: 25
    },
    features: [
      'Advanced voice cloning',
      'Professional stem separation',
      'AI voice cleaning',
      'Premium voice effects',
      '1080p video generation',
      'Email support',
      'No watermarks',
      'Custom voice models (5)'
    ],
    maxFileSize: 50, // 50MB
    maxConcurrentJobs: 3,
    prioritySupport: false,
    apiAccess: false,
    customModels: true,
    watermark: false
  },
  
  // Basic Tier - Quarterly (20% discount)
  {
    id: 'basic-quarterly',
    name: 'Basic',
    tier: 'basic',
    billingCycle: 'quarterly',
    price: 47.97, // $19.99 * 3 * 0.8
    currency: 'USD',
    tokens: 1500, // 500 * 3
    tokenCosts: {
      voice_cloning: 10,
      stem_separation: 5,
      voice_cleaning: 3,
      voice_changing: 2,
      video_generation: 25
    },
    features: [
      'Advanced voice cloning',
      'Professional stem separation',
      'AI voice cleaning',
      'Premium voice effects',
      '1080p video generation',
      'Email support',
      'No watermarks',
      'Custom voice models (5)'
    ],
    maxFileSize: 50,
    maxConcurrentJobs: 3,
    prioritySupport: false,
    apiAccess: false,
    customModels: true,
    watermark: false
  },
  
  // Premium Tier - Monthly
  {
    id: 'premium-monthly',
    name: 'Premium',
    tier: 'premium',
    billingCycle: 'monthly',
    price: 49.99,
    currency: 'USD',
    tokens: 2000,
    tokenCosts: {
      voice_cloning: 7,
      stem_separation: 3,
      voice_cleaning: 2,
      voice_changing: 1,
      video_generation: 20
    },
    features: [
      'Unlimited voice cloning',
      'Studio-quality stem separation',
      'Professional audio restoration',
      'Advanced voice effects',
      '4K video generation',
      'Priority support',
      'No watermarks',
      'Unlimited custom models',
      'API access',
      'Batch processing',
      'Advanced analytics'
    ],
    maxFileSize: 200, // 200MB
    maxConcurrentJobs: 10,
    prioritySupport: true,
    apiAccess: true,
    customModels: true,
    watermark: false
  },
  
  // Premium Tier - Quarterly (25% discount)
  {
    id: 'premium-quarterly',
    name: 'Premium',
    tier: 'premium',
    billingCycle: 'quarterly',
    price: 112.47, // $49.99 * 3 * 0.75
    currency: 'USD',
    tokens: 6000, // 2000 * 3
    tokenCosts: {
      voice_cloning: 7,
      stem_separation: 3,
      voice_cleaning: 2,
      voice_changing: 1,
      video_generation: 20
    },
    features: [
      'Unlimited voice cloning',
      'Studio-quality stem separation',
      'Professional audio restoration',
      'Advanced voice effects',
      '4K video generation',
      'Priority support',
      'No watermarks',
      'Unlimited custom models',
      'API access',
      'Batch processing',
      'Advanced analytics'
    ],
    maxFileSize: 200,
    maxConcurrentJobs: 10,
    prioritySupport: true,
    apiAccess: true,
    customModels: true,
    watermark: false
  },
  
  // Premium Tier - Bi-yearly (30% discount)
  {
    id: 'premium-biyearly',
    name: 'Premium',
    tier: 'premium',
    billingCycle: 'biyearly',
    price: 209.95, // $49.99 * 6 * 0.7
    currency: 'USD',
    tokens: 12000, // 2000 * 6
    tokenCosts: {
      voice_cloning: 7,
      stem_separation: 3,
      voice_cleaning: 2,
      voice_changing: 1,
      video_generation: 20
    },
    features: [
      'Unlimited voice cloning',
      'Studio-quality stem separation',
      'Professional audio restoration',
      'Advanced voice effects',
      '4K video generation',
      'Priority support',
      'No watermarks',
      'Unlimited custom models',
      'API access',
      'Batch processing',
      'Advanced analytics'
    ],
    maxFileSize: 200,
    maxConcurrentJobs: 10,
    prioritySupport: true,
    apiAccess: true,
    customModels: true,
    watermark: false
  },
  
  // Premium Tier - Yearly (40% discount)
  {
    id: 'premium-yearly',
    name: 'Premium',
    tier: 'premium',
    billingCycle: 'yearly',
    price: 359.95, // $49.99 * 12 * 0.6
    currency: 'USD',
    tokens: 24000, // 2000 * 12
    tokenCosts: {
      voice_cloning: 7,
      stem_separation: 3,
      voice_cleaning: 2,
      voice_changing: 1,
      video_generation: 20
    },
    features: [
      'Unlimited voice cloning',
      'Studio-quality stem separation',
      'Professional audio restoration',
      'Advanced voice effects',
      '4K video generation',
      'Priority support',
      'No watermarks',
      'Unlimited custom models',
      'API access',
      'Batch processing',
      'Advanced analytics'
    ],
    maxFileSize: 200,
    maxConcurrentJobs: 10,
    prioritySupport: true,
    apiAccess: true,
    customModels: true,
    watermark: false
  }
]

// Token packs for additional purchases
export const TOKEN_PACKS: TokenPack[] = [
  {
    id: 'starter-pack',
    name: 'Starter Pack',
    tokens: 100,
    price: 4.99,
    currency: 'USD',
    description: 'Perfect for trying out our features',
    popular: false
  },
  {
    id: 'standard-pack',
    name: 'Standard Pack',
    tokens: 250,
    price: 9.99,
    currency: 'USD',
    description: 'Great for regular users',
    bonusTokens: 25,
    popular: true
  },
  {
    id: 'pro-pack',
    name: 'Pro Pack',
    tokens: 500,
    price: 17.99,
    currency: 'USD',
    description: 'Best value for power users',
    bonusTokens: 75,
    popular: false
  },
  {
    id: 'business-pack',
    name: 'Business Pack',
    tokens: 1000,
    price: 29.99,
    currency: 'USD',
    description: 'Ideal for professionals and teams',
    bonusTokens: 200,
    popular: false
  },
  {
    id: 'enterprise-pack',
    name: 'Enterprise Pack',
    tokens: 2500,
    price: 59.99,
    currency: 'USD',
    description: 'Maximum value for heavy users',
    bonusTokens: 500,
    popular: false
  }
]

// Regional pricing adjustments
export const REGIONAL_PRICING = {
  'US': { multiplier: 1.0, currency: 'USD' },
  'CA': { multiplier: 1.2, currency: 'CAD' },
  'GB': { multiplier: 0.8, currency: 'GBP' },
  'EU': { multiplier: 0.85, currency: 'EUR' },
  'AU': { multiplier: 1.3, currency: 'AUD' },
  'JP': { multiplier: 110, currency: 'JPY' },
  'IN': { multiplier: 75, currency: 'INR' },
  'BR': { multiplier: 5.0, currency: 'BRL' },
  'MX': { multiplier: 18, currency: 'MXN' },
  'CN': { multiplier: 7.0, currency: 'CNY' },
  'KR': { multiplier: 1200, currency: 'KRW' },
  'SG': { multiplier: 1.35, currency: 'SGD' },
  'MY': { multiplier: 4.5, currency: 'MYR' },
  'TH': { multiplier: 35, currency: 'THB' },
  'ID': { multiplier: 15000, currency: 'IDR' },
  'PH': { multiplier: 55, currency: 'PHP' },
  'VN': { multiplier: 23000, currency: 'VND' },
  'ZA': { multiplier: 15, currency: 'ZAR' },
  'NG': { multiplier: 400, currency: 'NGN' },
  'KE': { multiplier: 110, currency: 'KES' },
  'EG': { multiplier: 30, currency: 'EGP' },
  'IL': { multiplier: 3.5, currency: 'ILS' },
  'AE': { multiplier: 3.67, currency: 'AED' },
  'SA': { multiplier: 3.75, currency: 'SAR' },
  'TR': { multiplier: 18, currency: 'TRY' },
  'RU': { multiplier: 70, currency: 'RUB' },
  'PK': { multiplier: 220, currency: 'PKR' },
  'BD': { multiplier: 85, currency: 'BDT' },
  'LK': { multiplier: 300, currency: 'LKR' }
}

// Comprehensive pricing strategy
export const PRICING_STRATEGY: PricingStrategy = {
  plans: SUBSCRIPTION_PLANS,
  tokenPacks: TOKEN_PACKS,
  socialRewards: SOCIAL_TOKEN_REWARDS,
  regionalPricing: REGIONAL_PRICING,
  enterprisePricing: {
    contactRequired: true,
    customTokens: true,
    dedicatedSupport: true,
    slaGuarantee: true
  }
}

// Pricing helper functions
export function getPlansByTier(tier: SubscriptionTier): SubscriptionPlan[] {
  return SUBSCRIPTION_PLANS.filter(plan => plan.tier === tier)
}

export function getPlansByBillingCycle(cycle: BillingCycle): SubscriptionPlan[] {
  return SUBSCRIPTION_PLANS.filter(plan => plan.billingCycle === cycle)
}

export function getPlanById(id: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === id)
}

export function getTokenPackById(id: string): TokenPack | undefined {
  return TOKEN_PACKS.find(pack => pack.id === id)
}

export function calculateRegionalPrice(
  basePrice: number,
  region: string
): { price: number; currency: string } {
  const regional = REGIONAL_PRICING[region as keyof typeof REGIONAL_PRICING]
  
  if (!regional) {
    return { price: basePrice, currency: 'USD' }
  }
  
  return {
    price: Math.round(basePrice * regional.multiplier * 100) / 100,
    currency: regional.currency
  }
}

export function calculateSavings(
  monthlyPrice: number,
  cyclePrice: number,
  months: number
): number {
  const expectedMonthlyPrice = monthlyPrice * months
  const savings = expectedMonthlyPrice - cyclePrice
  return Math.round((savings / expectedMonthlyPrice) * 100)
}

export function getBestValueTokenPack(): TokenPack {
  return TOKEN_PACKS.reduce((best, pack) => {
    const currentValue = (pack.tokens + (pack.bonusTokens || 0)) / pack.price
    const bestValue = (best.tokens + (best.bonusTokens || 0)) / best.price
    return currentValue > bestValue ? pack : best
  })
}

export function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)
}

export function calculateTokenPackValue(pack: TokenPack): number {
  const totalTokens = pack.tokens + (pack.bonusTokens || 0)
  const basePricePerToken = 0.05 // $0.05 per token base rate
  const actualValue = totalTokens * basePricePerToken
  const savings = ((actualValue - pack.price) / actualValue) * 100
  return Math.round(savings)
}

// Feature comparison data
export const FEATURE_COMPARISON = {
  'Voice Cloning': {
    free: 'Basic (3 voices)',
    basic: 'Advanced (10 voices)',
    premium: 'Unlimited'
  },
  'Stem Separation': {
    free: 'Standard quality',
    basic: 'Professional quality',
    premium: 'Studio quality'
  },
  'Video Generation': {
    free: '720p, 1/min',
    basic: '1080p, 3/min',
    premium: '4K, 10/min'
  },
  'File Size Limit': {
    free: '10MB',
    basic: '50MB',
    premium: '200MB'
  },
  'Concurrent Jobs': {
    free: '1',
    basic: '3',
    premium: '10'
  },
  'Support': {
    free: 'Community',
    basic: 'Email (48h)',
    premium: 'Priority (24h)'
  },
  'API Access': {
    free: '❌',
    basic: '❌',
    premium: '✅'
  },
  'Custom Models': {
    free: '❌',
    basic: '5 models',
    premium: 'Unlimited'
  },
  'Watermarks': {
    free: '✅',
    basic: '❌',
    premium: '❌'
  }
}

// Trial configuration
export const TRIAL_CONFIG = {
  duration: 14, // 14 days
  tokens: 200,
  features: [
    'Advanced voice cloning',
    'Professional stem separation',
    'AI voice cleaning',
    'Premium voice effects',
    '1080p video generation'
  ],
  restrictions: {
    maxFileSize: 25,
    maxConcurrentJobs: 2,
    watermarkOutput: false
  }
}

// Enterprise pricing tiers
export const ENTERPRISE_TIERS = [
  {
    name: 'Team',
    minUsers: 5,
    basePrice: 199,
    tokensPerUser: 5000,
    features: [
      'All Premium features',
      'Team management dashboard',
      'Shared voice models',
      'Collaborative projects',
      'Usage analytics'
    ]
  },
  {
    name: 'Business',
    minUsers: 20,
    basePrice: 799,
    tokensPerUser: 10000,
    features: [
      'All Team features',
      'SSO integration',
      'Custom branding',
      'Dedicated account manager',
      'SLA guarantee (99.5%)'
    ]
  },
  {
    name: 'Enterprise',
    minUsers: 50,
    basePrice: 2999,
    tokensPerUser: 25000,
    features: [
      'All Business features',
      'On-premise deployment option',
      'Custom integrations',
      '24/7 phone support',
      'SLA guarantee (99.9%)',
      'Custom model training'
    ]
  }
]