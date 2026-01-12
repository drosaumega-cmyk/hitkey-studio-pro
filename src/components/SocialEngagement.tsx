/**
 * Social media engagement component for earning trial tokens
 */

import React, { useState, useEffect } from 'react'
import { 
  Twitter, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Youtube,
  Share2,
  Heart,
  MessageCircle,
  UserPlus,
  Video,
  CheckCircle,
  ExternalLink,
  Gift,
  Sparkles,
  Clock
} from 'lucide-react'
import { SocialPlatform, SocialEngagement } from '../types/token'
import { calculateSocialReward, canEarnSocialTokens } from '../utils/token'
import { SOCIAL_TOKEN_REWARDS } from '../types/token'

interface SocialTaskProps {
  platform: SocialPlatform
  action: string
  tokens: number
  completed: boolean
  onComplete: (platform: SocialPlatform, action: string) => void
}

const SocialTask: React.FC<SocialTaskProps> = ({ platform, action, tokens, completed, onComplete }) => {
  const [isVerifying, setIsVerifying] = useState(false)
  const [showVerification, setShowVerification] = useState(false)

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case 'twitter':
        return <Twitter className="w-6 h-6" />
      case 'facebook':
        return <Facebook className="w-6 h-6" />
      case 'instagram':
        return <Instagram className="w-6 h-6" />
      case 'linkedin':
        return <Linkedin className="w-6 h-6" />
      case 'youtube':
        return <Youtube className="w-6 h-6" />
      default:
        return <Share2 className="w-6 h-6" />
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'follow':
        return <UserPlus className="w-5 h-5" />
      case 'share':
        return <Share2 className="w-5 h-5" />
      case 'like':
        return <Heart className="w-5 h-5" />
      case 'comment':
        return <MessageCircle className="w-5 h-5" />
      case 'post':
        return <Video className="w-5 h-5" />
      case 'subscribe':
        return <UserPlus className="w-5 h-5" />
      default:
        return <Heart className="w-5 h-5" />
    }
  }

  const getPlatformColor = (platform: SocialPlatform) => {
    switch (platform) {
      case 'twitter':
        return 'text-blue-400 border-blue-400'
      case 'facebook':
        return 'text-blue-600 border-blue-600'
      case 'instagram':
        return 'text-pink-500 border-pink-500'
      case 'linkedin':
        return 'text-blue-700 border-blue-700'
      case 'youtube':
        return 'text-red-500 border-red-500'
      default:
        return 'text-green-400 border-green-400'
    }
  }

  const getSocialUrl = (platform: SocialPlatform, action: string) => {
    const baseUrl = 'https://aiaudiostudio.pro'
    
    switch (platform) {
      case 'twitter':
        if (action === 'follow') return 'https://twitter.com/aiaudiostudio'
        if (action === 'share') return `https://twitter.com/intent/tweet?text=Check out AI Audio Studio Pro - Amazing AI-powered audio processing! ${baseUrl}`
        return '#'
      
      case 'facebook':
        if (action === 'follow') return 'https://facebook.com/aiaudiostudio'
        if (action === 'share') return `https://facebook.com/sharer/sharer.php?u=${baseUrl}`
        return '#'
      
      case 'instagram':
        return 'https://instagram.com/aiaudiostudio'
      
      case 'linkedin':
        if (action === 'follow') return 'https://linkedin.com/company/aiaudiostudio'
        if (action === 'share') return `https://linkedin.com/sharing/share-offsite/?url=${baseUrl}`
        return '#'
      
      case 'youtube':
        return 'https://youtube.com/@aiaudiostudio'
      
      default:
        return '#'
    }
  }

  const handleAction = () => {
    const url = getSocialUrl(platform, action)
    if (url !== '#') {
      window.open(url, '_blank', 'width=600,height=400')
      setShowVerification(true)
    }
  }

  const handleVerification = async () => {
    setIsVerifying(true)
    
    // Simulate verification process
    setTimeout(() => {
      setIsVerifying(false)
      setShowVerification(false)
      onComplete(platform, action)
    }, 2000)
  }

  return (
    <div className={`bg-black border-2 rounded-lg p-4 transition-all duration-300 ${
      completed 
        ? 'border-green-400 bg-green-400/10' 
        : 'border-gray-800 hover:border-gray-600'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${getPlatformColor(platform)} bg-black/50`}>
            {getPlatformIcon(platform)}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              {getActionIcon(action)}
              <span className="text-green-400 font-medium capitalize">
                {action} {platform}
              </span>
            </div>
            <div className="text-gray-400 text-sm">
              Earn {tokens} tokens
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {completed ? (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Completed</span>
            </div>
          ) : (
            <>
              <button
                onClick={handleAction}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  platform === 'twitter' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                  platform === 'facebook' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                  platform === 'instagram' ? 'bg-pink-500 hover:bg-pink-600 text-white' :
                  platform === 'linkedin' ? 'bg-blue-700 hover:bg-blue-800 text-white' :
                  platform === 'youtube' ? 'bg-red-500 hover:bg-red-600 text-white' :
                  'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {action === 'follow' ? 'Follow' : action === 'share' ? 'Share' : action}
                <ExternalLink className="inline-block w-4 h-4 ml-1" />
              </button>
              
              {showVerification && (
                <button
                  onClick={handleVerification}
                  disabled={isVerifying}
                  className="px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-lg font-medium text-sm transition-all duration-300"
                >
                  {isVerifying ? (
                    <>
                      <Clock className="inline-block w-4 h-4 mr-1 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify'
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface SocialEngagementProps {
  onTokensEarned: (tokens: number) => void
  completedTasks: SocialEngagement[]
}

export const SocialEngagement: React.FC<SocialEngagementProps> = ({ onTokensEarned, completedTasks }) => {
  const [totalTokensEarned, setTotalTokensEarned] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)

  const socialTasks = [
    { platform: 'twitter' as SocialPlatform, action: 'follow', tokens: 5 },
    { platform: 'twitter' as SocialPlatform, action: 'share', tokens: 3 },
    { platform: 'facebook' as SocialPlatform, action: 'follow', tokens: 4 },
    { platform: 'facebook' as SocialPlatform, action: 'share', tokens: 3 },
    { platform: 'instagram' as SocialPlatform, action: 'follow', tokens: 5 },
    { platform: 'linkedin' as SocialPlatform, action: 'follow', tokens: 3 },
    { platform: 'linkedin' as SocialPlatform, action: 'share', tokens: 4 },
    { platform: 'youtube' as SocialPlatform, action: 'subscribe', tokens: 8 },
  ]

  const completedTaskKeys = new Set(
    completedTasks.map(task => `${task.platform}-${task.action}`)
  )

  const handleTaskComplete = (platform: SocialPlatform, action: string) => {
    const tokens = calculateSocialReward(platform, action)
    setTotalTokensEarned(prev => prev + tokens)
    onTokensEarned(tokens)
    setShowCelebration(true)
    
    setTimeout(() => setShowCelebration(false), 3000)
  }

  const availableTokens = socialTasks.reduce((total, task) => {
    const taskKey = `${task.platform}-${task.action}`
    return total + (completedTaskKeys.has(taskKey) ? 0 : task.tokens)
  }, 0)

  return (
    <div className="min-h-screen bg-black text-green-400 p-6">
      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border-2 border-green-400 rounded-xl p-8 max-w-md mx-4 text-center animate-pulse">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-r from-green-400 to-purple-600 rounded-full">
                <Gift className="w-12 h-12 text-black" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-green-400 mb-2">Tokens Earned!</h3>
            <p className="text-gray-300 mb-4">
              You've successfully earned tokens by completing social media tasks.
            </p>
            <div className="text-3xl font-black text-green-400">
              +{totalTokensEarned} tokens
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-green-400 to-purple-600 rounded-full">
              <Sparkles className="w-12 h-12 text-black" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-green-400 mb-4">
            EARN FREE TOKENS
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Complete social media tasks to earn tokens and unlock premium features
          </p>
          
          {/* Token Summary */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-black text-green-400">
                  {totalTokensEarned}
                </div>
                <div className="text-gray-400 text-sm">Tokens Earned</div>
              </div>
              <div>
                <div className="text-3xl font-black text-yellow-400">
                  {availableTokens}
                </div>
                <div className="text-gray-400 text-sm">Still Available</div>
              </div>
              <div>
                <div className="text-3xl font-black text-purple-400">
                  {totalTokensEarned + availableTokens}
                </div>
                <div className="text-gray-400 text-sm">Total Possible</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Tasks */}
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-green-400 mb-4">Social Media Tasks</h2>
          <p className="text-gray-400 mb-6">
            Follow our social media accounts and share our content to earn tokens. 
            Each task can only be completed once per user.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {socialTasks.map((task, index) => {
            const taskKey = `${task.platform}-${task.action}`
            const isCompleted = completedTaskKeys.has(taskKey)
            
            return (
              <SocialTask
                key={index}
                platform={task.platform}
                action={task.action}
                tokens={task.tokens}
                completed={isCompleted}
                onComplete={handleTaskComplete}
              />
            )
          })}
        </div>

        {/* Progress Section */}
        <div className="mt-12 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-green-400 mb-4">Your Progress</h3>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Tasks Completed</span>
              <span className="text-green-400">
                {completedTaskKeys.size} / {socialTasks.length}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-400 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(completedTaskKeys.size / socialTasks.length) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-black/50 rounded-lg p-3">
              <div className="text-lg font-bold text-blue-400">
                {completedTaskKeys.filter(k => k.includes('twitter')).length}
              </div>
              <div className="text-xs text-gray-400">Twitter</div>
            </div>
            <div className="bg-black/50 rounded-lg p-3">
              <div className="text-lg font-bold text-blue-600">
                {completedTaskKeys.filter(k => k.includes('facebook')).length}
              </div>
              <div className="text-xs text-gray-400">Facebook</div>
            </div>
            <div className="bg-black/50 rounded-lg p-3">
              <div className="text-lg font-bold text-pink-500">
                {completedTaskKeys.filter(k => k.includes('instagram')).length}
              </div>
              <div className="text-xs text-gray-400">Instagram</div>
            </div>
            <div className="bg-black/50 rounded-lg p-3">
              <div className="text-lg font-bold text-red-500">
                {completedTaskKeys.filter(k => k.includes('youtube')).length}
              </div>
              <div className="text-xs text-gray-400">YouTube</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-yellow-400 mb-3">How It Works</h3>
          <ol className="space-y-2 text-gray-300 text-sm">
            <li>1. Click on any social media task to open the platform</li>
            <li>2. Complete the action (follow, share, like, etc.)</li>
            <li>3. Click "Verify" to confirm your action</li>
            <li>4. Tokens will be added to your account instantly</li>
            <li>5. Each task can only be completed once per user</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default SocialEngagement