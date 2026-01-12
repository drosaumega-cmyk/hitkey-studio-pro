/**
 * Demo mode component for testing all features
 */

import React, { useState, useEffect } from 'react'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Sparkles,
  Rocket,
  Music,
  Video,
  Mic,
  Headphones,
  Settings,
  ArrowRight
} from 'lucide-react'
import { DemoMode, TokenType } from '../types/token'
import { isDemoModeActive } from '../utils/token'

interface DemoModeProps {
  demoMode: DemoMode
  onStartDemo: () => void
  onExtendDemo: () => void
  onFeatureSelect: (feature: TokenType) => void
}

export const DemoMode: React.FC<DemoModeProps> = ({ 
  demoMode, 
  onStartDemo, 
  onExtendDemo, 
  onFeatureSelect 
}) => {
  const [timeRemaining, setTimeRemaining] = useState(demoMode.remainingTime)
  const [selectedFeature, setSelectedFeature] = useState<TokenType | null>(null)

  useEffect(() => {
    if (!isDemoModeActive(demoMode)) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [demoMode])

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getFeatureIcon = (feature: TokenType) => {
    switch (feature) {
      case 'voice_cloning':
        return <Mic className="w-6 h-6" />
      case 'stem_separation':
        return <Headphones className="w-6 h-6" />
      case 'voice_cleaning':
        return <Settings className="w-6 h-6" />
      case 'voice_changing':
        return <Zap className="w-6 h-6" />
      case 'video_generation':
        return <Video className="w-6 h-6" />
      default:
        return <Sparkles className="w-6 h-6" />
    }
  }

  const getFeatureName = (feature: TokenType): string => {
    switch (feature) {
      case 'voice_cloning':
        return 'Voice Cloning'
      case 'stem_separation':
        return 'Stem Separation'
      case 'voice_cleaning':
        return 'Voice Cleaning'
      case 'voice_changing':
        return 'Voice Changing'
      case 'video_generation':
        return 'Video Generation'
      default:
        return 'Unknown Feature'
    }
  }

  const getFeatureDescription = (feature: TokenType): string => {
    switch (feature) {
      case 'voice_cloning':
        return 'Clone any voice with AI technology'
      case 'stem_separation':
        return 'Separate vocals, drums, bass, and more'
      case 'voice_cleaning':
        return 'Remove noise and enhance audio quality'
      case 'voice_changing':
        return 'Transform voices with real-time effects'
      case 'video_generation':
        return 'Create AI videos from text or images'
      default:
        return 'Amazing AI-powered feature'
    }
  }

  if (!isDemoModeActive(demoMode)) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center p-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="p-6 bg-gradient-to-r from-green-400 to-purple-600 rounded-full">
              <Rocket className="w-16 h-16 text-black" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black text-green-400 mb-6">
            TRY DEMO MODE
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Experience all premium features with {demoMode.tokenAllowance} free tokens for {demoMode.remainingTime} minutes. 
            No credit card required.
          </p>
          
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-green-400 mb-4">Demo Includes:</h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-3">Features</h3>
                <ul className="space-y-2 text-gray-300">
                  {demoMode.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      {getFeatureName(feature)}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-3">Restrictions</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    Max file size: {demoMode.restrictions.maxFileSize}MB
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    Max processing time: {demoMode.restrictions.maxProcessingTime}s
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    {demoMode.restrictions.watermarkOutput ? 'Watermarked output' : 'No watermarks'}
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    {demoMode.restrictions.limitedModels ? 'Limited AI models' : 'All AI models'}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onStartDemo}
              className="bg-green-500 hover:bg-green-600 text-black font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-400/50"
            >
              <Play className="inline-block w-5 h-5 mr-2" />
              Start Demo
            </button>
            <button
              onClick={onExtendDemo}
              className="bg-gray-800 hover:bg-gray-700 text-green-400 border border-green-400 font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300"
            >
              <Clock className="inline-block w-5 h-5 mr-2" />
              Extend Demo
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-6">
      {/* Demo Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-gray-900 border-2 border-green-400 rounded-xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-green-400 to-purple-600 rounded-full">
                <Sparkles className="w-8 h-8 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-green-400">DEMO MODE</h1>
                <p className="text-gray-300">
                  {demoMode.tokenAllowance} tokens • {formatTime(timeRemaining)} remaining
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-black text-yellow-400 animate-pulse">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-xs text-gray-400">Time Left</div>
              </div>
              
              <button
                onClick={onExtendDemo}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-medium transition-all duration-300"
              >
                <Clock className="inline-block w-4 h-4 mr-1" />
                Extend
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-purple-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(timeRemaining / demoMode.remainingTime) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Selection */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-green-400 mb-6">Choose a Feature to Test</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {demoMode.features.map((feature) => (
            <div
              key={feature}
              onClick={() => {
                setSelectedFeature(feature)
                onFeatureSelect(feature)
              }}
              className={`bg-gray-900 border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                selectedFeature === feature
                  ? 'border-green-400 bg-green-400/10 transform scale-105'
                  : 'border-gray-800 hover:border-gray-600 hover:transform hover:scale-102'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-lg ${
                  selectedFeature === feature
                    ? 'bg-green-400 text-black'
                    : 'bg-gray-800 text-green-400'
                }`}>
                  {getFeatureIcon(feature)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-400">
                    {getFeatureName(feature)}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Click to test this feature
                  </p>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm mb-4">
                {getFeatureDescription(feature)}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Demo tokens available
                </span>
                <ArrowRight className="w-4 h-4 text-green-400" />
              </div>
            </div>
          ))}
        </div>

        {/* Demo Tips */}
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-yellow-400 mb-4">
            <AlertCircle className="inline-block w-5 h-5 mr-2" />
            Demo Tips
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-300">
            <div>
              <h4 className="font-semibold text-green-400 mb-2">Getting Started:</h4>
              <ul className="space-y-1">
                <li>• Upload sample audio files (max {demoMode.restrictions.maxFileSize}MB)</li>
                <li>• Try different features with your tokens</li>
                <li>• Experiment with settings and options</li>
                <li>• Test all available features before time runs out</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-green-400 mb-2">Limitations:</h4>
              <ul className="space-y-1">
                <li>• Processing time limited to {demoMode.restrictions.maxProcessingTime}s</li>
                <li>• {demoMode.restrictions.watermarkOutput ? 'Output will contain watermarks' : 'No watermarks on output'}</li>
                <li>• {demoMode.restrictions.limitedModels ? 'Limited to basic AI models' : 'Access to all AI models'}</li>
                <li>• Demo resets when timer expires</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DemoMode