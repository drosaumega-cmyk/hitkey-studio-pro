/**
 * Neon-themed pricing page with comprehensive subscription tiers
 */

import React, { useState } from 'react'
import { 
  Check, 
  X, 
  Star, 
  Zap, 
  Crown, 
  Rocket, 
  Sparkles,
  TrendingUp,
  Users,
  Globe,
  Shield,
  Headphones,
  Gift,
  CreditCard,
  ArrowRight,
  ChevronDown,
  Menu
} from 'lucide-react'
import {
  SUBSCRIPTION_PLANS,
  TOKEN_PACKS,
  FEATURE_COMPARISON,
  TRIAL_CONFIG,
  getPlansByTier,
  formatPrice,
  calculateSavings,
  getBestValueTokenPack,
  calculateTokenPackValue
} from '../data/pricing'
import { SubscriptionTier, BillingCycle } from '../types/token'

interface PricingCardProps {
  plan: any
  isPopular?: boolean
  billingCycle: BillingCycle
  onSubscribe: (planId: string) => void
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, isPopular, billingCycle, onSubscribe }) => {
  const [isHovered, setIsHovered] = useState(false)

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free':
        return <Gift className="w-8 h-8" />
      case 'basic':
        return <Zap className="w-8 h-8" />
      case 'premium':
        return <Crown className="w-8 h-8" />
      default:
        return <Star className="w-8 h-8" />
    }
  }

  const getTierGradient = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free':
        return 'from-gray-600 to-gray-800'
      case 'basic':
        return 'from-blue-600 to-purple-600'
      case 'premium':
        return 'from-yellow-500 to-orange-600'
      default:
        return 'from-gray-600 to-gray-800'
    }
  }

  return (
    <div
      className={`relative bg-black border-2 transition-all duration-300 ${
        isPopular 
          ? 'border-green-400 shadow-2xl shadow-green-400/20 scale-105' 
          : 'border-gray-800 hover:border-green-400/50'
      } ${isHovered ? 'transform -translate-y-2' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-green-400 text-black px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            MOST POPULAR
          </div>
        </div>
      )}

      <div className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${getTierGradient(plan.tier)} text-white mb-4`}>
            {getTierIcon(plan.tier)}
          </div>
          <h3 className="text-2xl font-bold text-green-400 mb-2">{plan.name}</h3>
          <div className="text-4xl font-black text-green-400 mb-2">
            {plan.price === 0 ? 'FREE' : formatPrice(plan.price, plan.currency)}
          </div>
          {plan.price > 0 && (
            <div className="text-gray-400 text-sm">
              {plan.billingCycle === 'monthly' && 'per month'}
              {plan.billingCycle === 'quarterly' && `per quarter (Save ${calculateSavings(SUBSCRIPTION_PLANS.find(p => p.tier === plan.tier && p.billingCycle === 'monthly')?.price || 0, plan.price, 3)}%)`}
              {plan.billingCycle === 'biyearly' && `per 6 months (Save ${calculateSavings(SUBSCRIPTION_PLANS.find(p => p.tier === plan.tier && p.billingCycle === 'monthly')?.price || 0, plan.price, 6)}%)`}
              {plan.billingCycle === 'yearly' && `per year (Save ${calculateSavings(SUBSCRIPTION_PLANS.find(p => p.tier === plan.tier && p.billingCycle === 'monthly')?.price || 0, plan.price, 12)}%)`}
            </div>
          )}
          <div className="text-green-400 font-semibold mt-2">
            {plan.tokens.toLocaleString()} tokens/month
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          {plan.features.map((feature: string, index: number) => (
            <div key={index} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 text-sm">{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onSubscribe(plan.id)}
          className={`w-full py-4 px-6 rounded-lg font-bold text-black transition-all duration-300 ${
            isPopular
              ? 'bg-green-400 hover:bg-green-300 shadow-lg shadow-green-400/50'
              : 'bg-gray-800 hover:bg-gray-700 text-green-400 border border-green-400'
          } ${isHovered ? 'transform scale-105' : ''}`}
        >
          {plan.price === 0 ? 'Start Free' : 'Subscribe Now'}
          <ArrowRight className="inline-block w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  )
}

interface TokenPackCardProps {
  pack: any
  onPurchase: (packId: string) => void
}

const TokenPackCard: React.FC<TokenPackCardProps> = ({ pack, onPurchase }) => {
  const [isHovered, setIsHovered] = useState(false)
  const value = calculateTokenPackValue(pack)
  const totalTokens = pack.tokens + (pack.bonusTokens || 0)

  return (
    <div
      className={`bg-black border-2 border-gray-800 rounded-xl p-6 transition-all duration-300 hover:border-green-400/50 ${
        isHovered ? 'transform -translate-y-2 shadow-xl shadow-green-400/20' : ''
      } ${pack.popular ? 'ring-2 ring-green-400/50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {pack.popular && (
        <div className="flex items-center justify-center mb-4">
          <div className="bg-green-400 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Star className="w-3 h-3" />
            BEST VALUE
          </div>
        </div>
      )}

      <h4 className="text-xl font-bold text-green-400 mb-2">{pack.name}</h4>
      <div className="text-3xl font-black text-green-400 mb-1">
        {formatPrice(pack.price, pack.currency)}
      </div>
      
      <div className="mb-4">
        <div className="text-green-400 font-semibold">
          {totalTokens.toLocaleString()} tokens
        </div>
        {pack.bonusTokens && (
          <div className="text-yellow-400 text-sm">
            +{pack.bonusTokens.toLocaleString()} bonus tokens
          </div>
        )}
        {value > 0 && (
          <div className="text-green-400 text-sm font-semibold">
            Save {value}%
          </div>
        )}
      </div>

      <p className="text-gray-400 text-sm mb-6">{pack.description}</p>

      <button
        onClick={() => onPurchase(pack.id)}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
          pack.popular
            ? 'bg-green-400 hover:bg-green-300 text-black'
            : 'bg-gray-800 hover:bg-gray-700 text-green-400 border border-green-400'
        } ${isHovered ? 'transform scale-105' : ''}`}
      >
        <CreditCard className="inline-block w-4 h-4 mr-2" />
        Purchase Pack
      </button>
    </div>
  )
}

export const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('basic')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSubscribe = (planId: string) => {
    console.log('Subscribe to plan:', planId)
    // Handle subscription logic
  }

  const handlePurchasePack = (packId: string) => {
    console.log('Purchase token pack:', packId)
    // Handle token pack purchase
  }

  const freePlans = getPlansByTier('free').filter(p => p.billingCycle === billingCycle)
  const basicPlans = getPlansByTier('basic').filter(p => p.billingCycle === billingCycle)
  const premiumPlans = getPlansByTier('premium').filter(p => p.billingCycle === billingCycle)

  return (
    <div className="min-h-screen bg-black text-green-400">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-black to-purple-900/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-green-400 to-purple-600 rounded-full">
                <Rocket className="w-12 h-12 text-black" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-green-400 mb-6 tracking-tight">
              AI AUDIO STUDIO
              <span className="block text-3xl md:text-5xl text-purple-400 mt-2">
                PRICING PLANS
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Choose the perfect plan for your audio processing needs. 
              Start free, upgrade when you're ready.
            </p>
            
            {/* Billing Cycle Toggle */}
            <div className="flex justify-center mb-12">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-1 inline-flex">
                {(['monthly', 'quarterly', 'biyearly', 'yearly'] as BillingCycle[]).map((cycle) => (
                  <button
                    key={cycle}
                    onClick={() => setBillingCycle(cycle)}
                    className={`px-6 py-2 rounded-md font-semibold transition-all duration-300 ${
                      billingCycle === cycle
                        ? 'bg-green-400 text-black'
                        : 'text-gray-400 hover:text-green-400'
                    }`}
                  >
                    {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                    {cycle === 'quarterly' && ' (20% off)'}
                    {cycle === 'biyearly' && ' (30% off)'}
                    {cycle === 'yearly' && ' (40% off)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {/* Free Plan */}
          <div>
            {freePlans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                billingCycle={billingCycle}
                onSubscribe={handleSubscribe}
              />
            ))}
          </div>

          {/* Basic Plans */}
          <div>
            {basicPlans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                isPopular={true}
                billingCycle={billingCycle}
                onSubscribe={handleSubscribe}
              />
            ))}
          </div>

          {/* Premium Plans */}
          <div>
            {premiumPlans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                billingCycle={billingCycle}
                onSubscribe={handleSubscribe}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Token Packs Section */}
      <section className="bg-gray-950 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-purple-400 to-green-600 rounded-full">
                <Sparkles className="w-12 h-12 text-black" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-green-400 mb-4">
              TOKEN PACKS
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Need more tokens? Purchase our flexible token packs and use them whenever you need.
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
            {TOKEN_PACKS.map((pack) => (
              <TokenPackCard
                key={pack.id}
                pack={pack}
                onPurchase={handlePurchasePack}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-green-400 mb-4">
            FEATURE COMPARISON
          </h2>
          <p className="text-xl text-gray-300">
            See exactly what you get with each plan
          </p>
        </div>

        <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-4 gap-4 p-6 border-b border-gray-800">
            <div className="text-green-400 font-bold">Feature</div>
            <div className="text-center text-green-400 font-bold">Free</div>
            <div className="text-center text-green-400 font-bold">Basic</div>
            <div className="text-center text-green-400 font-bold">Premium</div>
          </div>
          
          {Object.entries(FEATURE_COMPARISON).map(([feature, values]) => (
            <div key={feature} className="grid grid-cols-4 gap-4 p-6 border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
              <div className="text-gray-300 font-medium">{feature}</div>
              <div className="text-center text-gray-400">{values.free}</div>
              <div className="text-center text-gray-400">{values.basic}</div>
              <div className="text-center text-gray-400">{values.premium}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Trial Section */}
      <section className="bg-gradient-to-r from-green-900/20 to-purple-900/20 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center sm:px-6 lg:px-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-yellow-400 to-orange-600 rounded-full">
              <Gift className="w-12 h-12 text-black" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-green-400 mb-4">
            START YOUR FREE TRIAL
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Try all our premium features for {TRIAL_CONFIG.duration} days with {TRIAL_CONFIG.tokens} free tokens
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-black/50 border border-gray-800 rounded-lg p-6">
              <h3 className="text-green-400 font-bold mb-4">Trial Includes:</h3>
              <ul className="space-y-2 text-gray-300">
                {TRIAL_CONFIG.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-black/50 border border-gray-800 rounded-lg p-6">
              <h3 className="text-green-400 font-bold mb-4">No Credit Card Required</h3>
              <p className="text-gray-300 mb-4">
                Start your trial instantly with no commitment. 
                Cancel anytime during the trial period.
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                <Shield className="w-5 h-5 text-green-400" />
                <span>Secure & Private</span>
              </div>
            </div>
          </div>

          <button className="bg-green-400 hover:bg-green-300 text-black font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-400/50">
            Start Free Trial
            <ArrowRight className="inline-block w-5 h-5 ml-2" />
          </button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-green-400 mb-4">
            FREQUENTLY ASKED QUESTIONS
          </h2>
        </div>

        <div className="space-y-6">
          {[
            {
              q: "How do tokens work?",
              a: "Each audio processing feature consumes a specific number of tokens. More complex features like video generation require more tokens than simple voice changes."
            },
            {
              q: "Can I change my plan anytime?",
              a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any differences."
            },
            {
              q: "Do unused tokens roll over?",
              a: "Tokens reset each billing cycle. However, you can purchase token packs that never expire."
            },
            {
              q: "Is there a limit on file sizes?",
              a: "File size limits depend on your plan: Free (10MB), Basic (50MB), Premium (200MB)."
            },
            {
              q: "Do you offer enterprise plans?",
              a: "Yes! We offer custom enterprise solutions with dedicated support, SLA guarantees, and custom pricing."
            }
          ].map((faq, index) => (
            <div key={index} className="bg-gray-950 border border-gray-800 rounded-lg p-6">
              <h3 className="text-green-400 font-bold mb-3">{faq.q}</h3>
              <p className="text-gray-300">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-green-400 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-black text-black mb-4">
            READY TO GET STARTED?
          </h2>
          <p className="text-xl text-black/90 mb-8">
            Join thousands of creators using AI Audio Studio Pro
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-black hover:bg-gray-900 text-green-400 font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300">
              Start Free Trial
            </button>
            <button className="bg-white/20 backdrop-blur hover:bg-white/30 text-black font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300">
              <Headphones className="inline-block w-5 h-5 mr-2" />
              Contact Sales
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PricingPage