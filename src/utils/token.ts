/**
 * Token management and subscription utilities
 */

import {
  SubscriptionTier,
  BillingCycle,
  TokenType,
  TokenBalance,
  TokenCost,
  SubscriptionPlan,
  TokenPack,
  UserSubscription,
  SocialEngagement,
  TokenTransaction,
  UsageMetrics,
  TokenUsageRequest,
  TokenUsageResponse,
  DemoMode,
  DEFAULT_TOKEN_COSTS,
  SOCIAL_TOKEN_REWARDS
} from '../types/token'

/**
 * Create initial token balance for a new user
 * @param initialTokens Initial token allocation
 * @returns Token balance object
 */
export function createInitialTokenBalance(initialTokens: number = 0): TokenBalance {
  return {
    total: initialTokens,
    used: 0,
    available: initialTokens,
    lastUpdated: new Date()
  }
}

/**
 * Calculate token cost for a specific feature
 * @param tokenType Type of token/feature
 * @param userPlan User's subscription plan
 * @returns Token cost
 */
export function calculateTokenCost(tokenType: TokenType, userPlan: SubscriptionPlan | null): number {
  if (!userPlan) {
    return DEFAULT_TOKEN_COSTS[tokenType]
  }
  
  return userPlan.tokenCosts[tokenType] || DEFAULT_TOKEN_COSTS[tokenType]
}

/**
 * Check if user has sufficient tokens for a request
 * @param balance User's token balance
 * @param cost Token cost
 * @returns True if sufficient tokens
 */
export function hasSufficientTokens(balance: TokenBalance, cost: number): boolean {
  return balance.available >= cost
}

/**
 * Deduct tokens from user balance
 * @param balance Current token balance
 * @param amount Amount to deduct
 * @returns Updated token balance
 */
export function deductTokens(balance: TokenBalance, amount: number): TokenBalance {
  const newUsed = balance.used + amount
  const newAvailable = balance.total - newUsed
  
  return {
    ...balance,
    used: newUsed,
    available: Math.max(0, newAvailable),
    lastUpdated: new Date()
  }
}

/**
 * Add tokens to user balance
 * @param balance Current token balance
 * @param amount Amount to add
 * @returns Updated token balance
 */
export function addTokens(balance: TokenBalance, amount: number): TokenBalance {
  const newTotal = balance.total + amount
  const newAvailable = newTotal - balance.used
  
  return {
    ...balance,
    total: newTotal,
    available: newAvailable,
    lastUpdated: new Date()
  }
}

/**
 * Create token transaction record
 * @param userId User ID
 * @param type Transaction type
 * @param amount Token amount
 * @param tokenType Token type
 * @param description Transaction description
 * @param metadata Additional metadata
 * @returns Token transaction object
 */
export function createTokenTransaction(
  userId: string,
  type: TokenTransaction['type'],
  amount: number,
  tokenType: TokenType,
  description: string,
  metadata?: Record<string, any>
): TokenTransaction {
  return {
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type,
    amount,
    tokenType,
    description,
    createdAt: new Date(),
    metadata
  }
}

/**
 * Calculate subscription utilization percentage
 * @param subscription User subscription
 * @returns Utilization percentage (0-100)
 */
export function calculateSubscriptionUtilization(subscription: UserSubscription): number {
  if (!subscription.plan) return 0
  
  const utilization = (subscription.tokenBalance.used / subscription.plan.tokens) * 100
  return Math.min(100, Math.max(0, utilization))
}

/**
 * Get user's current subscription tier
 * @param subscription User subscription
 * @returns Subscription tier
 */
export function getCurrentTier(subscription: UserSubscription): SubscriptionTier {
  if (!subscription.plan) return 'free'
  return subscription.plan.tier
}

/**
 * Check if user is on trial
 * @param subscription User subscription
 * @returns True if on trial
 */
export function isOnTrial(subscription: UserSubscription): boolean {
  return subscription.status === 'trial' && 
         subscription.trialEndDate && 
         subscription.trialEndDate > new Date()
}

/**
 * Get remaining trial days
 * @param subscription User subscription
 * @returns Remaining trial days
 */
export function getRemainingTrialDays(subscription: UserSubscription): number {
  if (!isOnTrial(subscription) || !subscription.trialEndDate) return 0
  
  const now = new Date()
  const trialEnd = new Date(subscription.trialEndDate)
  const diffTime = trialEnd.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}

/**
 * Calculate monthly token allowance based on subscription
 * @param plan Subscription plan
 * @param billingCycle Billing cycle
 * @returns Monthly token allowance
 */
export function calculateMonthlyTokenAllowance(plan: SubscriptionPlan, billingCycle: BillingCycle): number {
  const baseTokens = plan.tokens
  
  switch (billingCycle) {
    case 'monthly':
      return baseTokens
    case 'quarterly':
      return Math.floor(baseTokens / 3)
    case 'biyearly':
      return Math.floor(baseTokens / 6)
    case 'yearly':
      return Math.floor(baseTokens / 12)
    default:
      return baseTokens
  }
}

/**
 * Get upgrade suggestions based on usage
 * @param currentSubscription Current user subscription
 * @param availablePlans Available plans
 * @returns Suggested upgrade plan
 */
export function getUpgradeSuggestion(
  currentSubscription: UserSubscription,
  availablePlans: SubscriptionPlan[]
): SubscriptionPlan | null {
  const utilization = calculateSubscriptionUtilization(currentSubscription)
  
  if (utilization < 80) return null
  
  const currentTier = getCurrentTier(currentSubscription)
  
  // Find next higher tier
  const tierOrder: SubscriptionTier[] = ['free', 'basic', 'premium']
  const currentIndex = tierOrder.indexOf(currentTier)
  
  if (currentIndex >= tierOrder.length - 1) return null
  
  const nextTier = tierOrder[currentIndex + 1]
  return availablePlans.find(plan => plan.tier === nextTier) || null
}

/**
 * Calculate social media engagement reward
 * @param platform Social platform
 * @param action Engagement action
 * @returns Token reward amount
 */
export function calculateSocialReward(platform: keyof typeof SOCIAL_TOKEN_REWARDS, action: string): number {
  const platformRewards = SOCIAL_TOKEN_REWARDS[platform]
  return platformRewards[action as keyof typeof platformRewards] || 0
}

/**
 * Check if user can earn social tokens (cooldown period)
 * @param subscription User subscription
 * @param platform Social platform
 * @param action Engagement action
 * @param cooldownHours Cooldown period in hours
 * @returns True if user can earn tokens
 */
export function canEarnSocialTokens(
  subscription: UserSubscription,
  platform: string,
  action: string,
  cooldownHours: number = 24
): boolean {
  if (!subscription.lastSocialActivity) return true
  
  const cooldownMs = cooldownHours * 60 * 60 * 1000
  const timeSinceLastActivity = Date.now() - subscription.lastSocialActivity.getTime()
  
  return timeSinceLastActivity >= cooldownMs
}

/**
 * Create demo mode configuration
 * @param durationMinutes Demo duration in minutes
 * @returns Demo mode configuration
 */
export function createDemoMode(durationMinutes: number = 30): DemoMode {
  return {
    isActive: true,
    remainingTime: durationMinutes,
    features: ['voice_cloning', 'stem_separation', 'voice_cleaning', 'voice_changing', 'video_generation'],
    tokenAllowance: 100,
    restrictions: {
      maxFileSize: 10, // 10MB
      maxProcessingTime: 300, // 5 minutes
      watermarkOutput: true,
      limitedModels: true
    }
  }
}

/**
 * Check if demo mode is still active
 * @param demoMode Demo mode configuration
 * @returns True if demo is active
 */
export function isDemoModeActive(demoMode: DemoMode): boolean {
  return demoMode.isActive && demoMode.remainingTime > 0
}

/**
 * Process token usage request
 * @param request Token usage request
 * @param subscription User subscription
 * @param demoMode Demo mode configuration
 * @returns Token usage response
 */
export function processTokenUsage(
  request: TokenUsageRequest,
  subscription: UserSubscription,
  demoMode?: DemoMode
): TokenUsageResponse {
  const isDemo = demoMode && isDemoModeActive(demoMode)
  const balance = subscription.tokenBalance
  
  // Check if user has sufficient tokens
  const hasTokens = hasSufficientTokens(balance, request.estimatedCost)
  
  if (!hasTokens && !isDemo) {
    return {
      approved: false,
      tokensDeducted: 0,
      remainingBalance: balance.available,
      transactionId: '',
      insufficientFunds: true,
      suggestedUpgrade: null // Will be populated by calling function
    }
  }
  
  // Process the transaction
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const tokensDeducted = isDemo ? 0 : request.estimatedCost
  const newBalance = isDemo ? balance : deductTokens(balance, tokensDeducted)
  
  return {
    approved: true,
    tokensDeducted,
    remainingBalance: newBalance.available,
    transactionId,
    insufficientFunds: false
  }
}

/**
 * Calculate usage metrics for a user
 * @param transactions User's token transactions
 * @param subscription User subscription
 * @returns Usage metrics
 */
export function calculateUsageMetrics(
  transactions: TokenTransaction[],
  subscription: UserSubscription
): UsageMetrics {
  const spentTransactions = transactions.filter(t => t.type === 'spent')
  
  const totalTokensUsed = spentTransactions.reduce((sum, t) => sum + t.amount, 0)
  
  const tokensByType = spentTransactions.reduce((acc, t) => {
    acc[t.tokenType] = (acc[t.tokenType] || 0) + t.amount
    return acc
  }, {} as Record<TokenType, number>)
  
  const jobsCompleted = spentTransactions.length
  const mostUsedFeature = Object.entries(tokensByType).reduce((a, b) => 
    tokensByType[a[0] as TokenType] > tokensByType[b[0] as TokenType] ? a : b
  )[0] as TokenType
  
  return {
    totalTokensUsed,
    tokensByType,
    jobsCompleted,
    averageProcessingTime: 0, // Would be calculated from actual processing times
    mostUsedFeature,
    subscriptionUtilization: calculateSubscriptionUtilization(subscription)
  }
}

/**
 * Format token amount for display
 * @param amount Token amount
 * @returns Formatted token string
 */
export function formatTokens(amount: number): string {
  return amount.toLocaleString()
}

/**
 * Get token cost display with tier discount
 * @param baseCost Base token cost
 * @param userPlan User's subscription plan
 * @returns Formatted cost string
 */
export function formatTokenCost(baseCost: number, userPlan: SubscriptionPlan | null): string {
  const actualCost = calculateTokenCost('voice_cloning' as TokenType, userPlan) // Using voice_cloning as example
  
  if (userPlan && actualCost < baseCost) {
    return `${actualCost} tokens (${Math.round((1 - actualCost/baseCost) * 100)}% off)`
  }
  
  return `${actualCost} tokens`
}

/**
 * Validate token pack purchase
 * @param pack Token pack to purchase
 * @param userSubscription User's current subscription
 * @returns Validation result
 */
export function validateTokenPackPurchase(
  pack: TokenPack,
  userSubscription: UserSubscription
): { valid: boolean; reason?: string } {
  // Check if user already has active subscription
  if (userSubscription.plan && userSubscription.status === 'active') {
    return { valid: true }
  }
  
  // Free users can purchase token packs
  if (!userSubscription.plan || userSubscription.plan.tier === 'free') {
    return { valid: true }
  }
  
  // Other restrictions can be added here
  return { valid: true }
}