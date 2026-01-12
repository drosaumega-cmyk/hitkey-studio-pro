/**
 * Tokenization and subscription types for AI Audio Studio Pro
 */

export type SubscriptionTier = 'free' | 'basic' | 'premium'

export type BillingCycle = 'monthly' | 'quarterly' | 'biyearly' | 'yearly'

export type TokenType = 'voice_cloning' | 'stem_separation' | 'voice_cleaning' | 'voice_changing' | 'video_generation'

export type SocialPlatform = 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube'

export interface TokenBalance {
  total: number
  used: number
  available: number
  lastUpdated: Date
}

export interface TokenCost {
  [key in TokenType]: number
}

export interface SubscriptionPlan {
  id: string
  name: string
  tier: SubscriptionTier
  billingCycle: BillingCycle
  price: number
  currency: string
  tokens: number
  tokenCosts: TokenCost
  features: string[]
  maxFileSize: number // in MB
  maxConcurrentJobs: number
  prioritySupport: boolean
  apiAccess: boolean
  customModels: boolean
  watermark: boolean
}

export interface TokenPack {
  id: string
  name: string
  tokens: number
  price: number
  currency: string
  bonusTokens?: number
  description: string
  popular?: boolean
}

export interface UserSubscription {
  userId: string
  plan: SubscriptionPlan | null
  status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trial'
  startDate: Date
  endDate?: Date
  trialEndDate?: Date
  autoRenew: boolean
  tokenBalance: TokenBalance
  purchasedPacks: TokenPack[]
  socialTokensEarned: number
  demoModeUsed: boolean
  lastSocialActivity: Date | null
}

export interface SocialEngagement {
  platform: SocialPlatform
  action: 'follow' | 'share' | 'like' | 'comment' | 'post' | 'subscribe'
  tokensEarned: number
  completedAt: Date
  verified: boolean
  verificationUrl?: string
}

export interface TokenTransaction {
  id: string
  userId: string
  type: 'earned' | 'spent' | 'purchased' | 'bonus' | 'refund'
  amount: number
  tokenType: TokenType
  description: string
  createdAt: Date
  metadata?: Record<string, any>
}

export interface UsageMetrics {
  totalTokensUsed: number
  tokensByType: Record<TokenType, number>
  jobsCompleted: number
  averageProcessingTime: number
  mostUsedFeature: TokenType
  subscriptionUtilization: number // percentage of allocated tokens used
}

export interface PricingStrategy {
  plans: SubscriptionPlan[]
  tokenPacks: TokenPack[]
  socialRewards: Record<SocialPlatform, Record<string, number>>
  regionalPricing: Record<string, { multiplier: number; currency: string }>
  enterprisePricing: {
    contactRequired: boolean
    customTokens: boolean
    dedicatedSupport: boolean
    slaGuarantee: boolean
  }
}

export interface DemoMode {
  isActive: boolean
  remainingTime: number // in minutes
  features: TokenType[]
  tokenAllowance: number
  restrictions: {
    maxFileSize: number
    maxProcessingTime: number
    watermarkOutput: boolean
    limitedModels: boolean
  }
}

export interface TokenUsageRequest {
  tokenType: TokenType
  estimatedCost: number
  userId: string
  feature: string
  metadata?: Record<string, any>
}

export interface TokenUsageResponse {
  approved: boolean
  tokensDeducted: number
  remainingBalance: number
  transactionId: string
  insufficientFunds: boolean
  suggestedUpgrade?: SubscriptionPlan
}

// Default token costs (in tokens)
export const DEFAULT_TOKEN_COSTS: TokenCost = {
  voice_cloning: 10,
  stem_separation: 5,
  voice_cleaning: 3,
  voice_changing: 2,
  video_generation: 25
}

// Social media token rewards
export const SOCIAL_TOKEN_REWARDS = {
  twitter: {
    follow: 5,
    share: 3,
    like: 1,
    comment: 2,
    post: 4,
    subscribe: 8
  },
  facebook: {
    follow: 4,
    share: 3,
    like: 1,
    comment: 2,
    post: 3,
    subscribe: 6
  },
  instagram: {
    follow: 5,
    share: 4,
    like: 1,
    comment: 2,
    post: 5,
    subscribe: 7
  },
  linkedin: {
    follow: 3,
    share: 4,
    like: 1,
    comment: 3,
    post: 6,
    subscribe: 10
  },
  tiktok: {
    follow: 6,
    share: 4,
    like: 1,
    comment: 2,
    post: 5,
    subscribe: 9
  },
  youtube: {
    follow: 8,
    share: 5,
    like: 2,
    comment: 3,
    post: 7,
    subscribe: 15
  }
}