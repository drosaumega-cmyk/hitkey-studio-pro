import { useState, useRef, useEffect } from 'react'
import { 
  Upload, Mic, Play, Pause, Download, AudioLines, Volume2, 
  Moon, Sun, Settings, Music, Scissors, Sparkles, 
  Divide, RotateCw, Video, BarChart3, Sliders,
  Headphones, Speaker, Waves, Zap, Filter, Image, 
  Wand2, FileText, Globe, Eye, Shuffle
} from 'lucide-react'
import { 
  randomAudioFileName, 
  randomAudioDuration, 
  randomVoicePreset, 
  randomDelay,
  formatDuration,
  formatFileSize,
  isValidAudioFile,
  getAudioFormat,
  createSettingsManager
} from './utils'
import { 
  processTokenUsage,
  createInitialTokenBalance,
  calculateTokenCost,
  hasSufficientTokens,
  formatTokens,
  createDemoMode,
  isDemoModeActive
} from './utils/token'
import { 
  UserSubscription, 
  SubscriptionPlan, 
  TokenUsageRequest, 
  DemoMode,
  TokenType,
  SubscriptionTier
} from './types/token'
import { SUBSCRIPTION_PLANS, getPlanById, formatPrice } from './data/pricing'

interface VoiceFile {
  id: string
  name: string
  duration: number
  file: File
  url: string
}

interface AudioProcessingResult {
  type: string
  name: string
  url: string
  processed: boolean
}

interface VideoGenerationTask {
  taskId: string
  status: 'submitted' | 'queued' | 'in_progress' | 'completed' | 'failed'
  model: string
  createdAt: number
  videoUrls?: string[]
  error?: string
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [voiceFiles, setVoiceFiles] = useState<VoiceFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeVoice, setActiveVoice] = useState<string | null>(null)
  const [generatedVoice, setGeneratedVoice] = useState<string | null>(null)
  const [textToSpeak, setTextToSpeak] = useState('')
  const [activeTab, setActiveTab] = useState('voice-cloning')
  const [processedAudio, setProcessedAudio] = useState<AudioProcessingResult[]>([])
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [videoPrompt, setVideoPrompt] = useState('')
  const [generationMode, setGenerationMode] = useState<'text-to-video' | 'image-to-video'>('text-to-video')
  const [videoModel, setVideoModel] = useState<'veo3' | 'veo3-fast' | 'midjourney-video'>('veo3-fast')
  const [videoTask, setVideoTask] = useState<VideoGenerationTask | null>(null)
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null)
  const [voiceSettings, setVoiceSettings] = useState({
    pitch: 0,
    speed: 1,
    tone: 'neutral'
  })
  const [videoSettings, setVideoSettings] = useState({
    resolution: '720p',
    aspectRatio: '16:9',
    generateAudio: false,
    style: 'cinematic'
  })
  
  // Token system state
  const [userSubscription, setUserSubscription] = useState<UserSubscription>({
    userId: 'demo-user',
    plan: null,
    status: 'trial',
    startDate: new Date(),
    trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    autoRenew: false,
    tokenBalance: createInitialTokenBalance(200), // 200 trial tokens
    purchasedPacks: [],
    socialTokensEarned: 0,
    demoModeUsed: false,
    lastSocialActivity: null
  })
  const [demoMode, setDemoMode] = useState<DemoMode>(createDemoMode(30))
  const [showTokenInsufficient, setShowTokenInsufficient] = useState(false)
  const [showPricing, setShowPricing] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      Array.from(files).forEach((file, index) => {
        if (isValidAudioFile(file) && voiceFiles.length < 5) {
          const audio = new Audio()
          audio.src = URL.createObjectURL(file)
          audio.addEventListener('loadedmetadata', () => {
            const newVoice: VoiceFile = {
              id: `voice-${Date.now()}-${index}`,
              name: file.name,
              duration: audio.duration,
              file: file,
              url: audio.src
            }
            setVoiceFiles(prev => [...prev, newVoice])
          })
        }
      })
    }
  }

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setImageFile(file)
      setGenerationMode('image-to-video')
    }
  }

  const playVoice = (voiceId: string, url: string) => {
    if (audioRef.current) {
      if (activeVoice === voiceId) {
        audioRef.current.pause()
        setActiveVoice(null)
      } else {
        audioRef.current.src = url
        audioRef.current.play()
        setActiveVoice(voiceId)
      }
    }
  }

  const processVoiceCloning = async () => {
    if (voiceFiles.length === 0 || !textToSpeak.trim()) return
    
    const tokenCost = calculateTokenCost('voice_cloning', userSubscription.plan)
    
    if (!hasSufficientTokens(userSubscription.tokenBalance, tokenCost) && !isDemoModeActive(demoMode)) {
      setShowTokenInsufficient(true)
      return
    }
    
    setIsProcessing(true)
    
    // Process token usage
    const tokenRequest: TokenUsageRequest = {
      tokenType: 'voice_cloning',
      estimatedCost: tokenCost,
      userId: userSubscription.userId,
      feature: 'Voice Cloning',
      metadata: { voiceCount: voiceFiles.length, textLength: textToSpeak.length }
    }
    
    const tokenResponse = processTokenUsage(tokenRequest, userSubscription, demoMode)
    
    if (tokenResponse.approved) {
      setUserSubscription(prev => ({
        ...prev,
        tokenBalance: {
          ...prev.tokenBalance,
          used: prev.tokenBalance.used + tokenResponse.tokensDeducted,
          available: prev.tokenBalance.available - tokenResponse.tokensDeducted
        }
      }))
    }
    
    // Simulate LALAL.AI voice cloning process
    setTimeout(() => {
      setGeneratedVoice(`Generated voice with ${voiceFiles.length} samples: "${textToSpeak}"`)
      setIsProcessing(false)
    }, 3000)
  }

  const processAudio = async (type: string) => {
    if (voiceFiles.length === 0) return
    
    // Map processing types to token types
    const tokenTypeMap: Record<string, TokenType> = {
      'stem-separation': 'stem_separation',
      'stem-vocals': 'stem_separation',
      'stem-drums': 'stem_separation',
      'stem-bass': 'stem_separation',
      'stem-guitar': 'stem_separation',
      'stem-piano': 'stem_separation',
      'stem-other': 'stem_separation',
      'clean-denoise': 'voice_cleaning',
      'clean-enhance': 'voice_cleaning',
      'clean-normalize': 'voice_cleaning',
      'voice-robot': 'voice_changing',
      'voice-child': 'voice_changing',
      'voice-elder': 'voice_changing',
      'voice-monster': 'voice_changing',
      'voice-alien': 'voice_changing',
      'voice-hero': 'voice_changing',
      'lead-vocals': 'stem_separation',
      'backing-vocals': 'stem_separation',
      'remove-echo': 'voice_cleaning',
      'remove-reverb': 'voice_cleaning',
      'room-correction': 'voice_cleaning',
      'complete-cleanup': 'voice_cleaning'
    }
    
    const tokenType = tokenTypeMap[type] || 'voice_cleaning'
    const tokenCost = calculateTokenCost(tokenType, userSubscription.plan)
    
    if (!hasSufficientTokens(userSubscription.tokenBalance, tokenCost) && !isDemoModeActive(demoMode)) {
      setShowTokenInsufficient(true)
      return
    }
    
    setIsProcessing(true)
    
    // Process token usage
    const tokenRequest: TokenUsageRequest = {
      tokenType,
      estimatedCost: tokenCost,
      userId: userSubscription.userId,
      feature: type,
      metadata: { fileName: voiceFiles[0].name }
    }
    
    const tokenResponse = processTokenUsage(tokenRequest, userSubscription, demoMode)
    
    if (tokenResponse.approved) {
      setUserSubscription(prev => ({
        ...prev,
        tokenBalance: {
          ...prev.tokenBalance,
          used: prev.tokenBalance.used + tokenResponse.tokensDeducted,
          available: prev.tokenBalance.available - tokenResponse.tokensDeducted
        }
      }))
    }
    
    // Simulate audio processing
    setTimeout(() => {
      const result: AudioProcessingResult = {
        type,
        name: `${type}_${voiceFiles[0].name}`,
        url: voiceFiles[0].url,
        processed: true
      }
      setProcessedAudio(prev => [...prev, result])
      setIsProcessing(false)
    }, 2000)
  }

  const generateVideoFromPrompt = async () => {
    if (!videoPrompt.trim()) return
    
    setIsProcessing(true)
    
    try {
      const formData = new FormData()
      
      const generateParams = {
        prompt: videoPrompt,
        model: videoModel,
        ...(videoModel !== 'midjourney-video' && {
          resolution: videoSettings.resolution,
          aspect_ratio: videoSettings.aspectRatio,
          generate_audio: videoSettings.generateAudio
        })
      }
      
      if (generationMode === 'image-to-video' && imageFile) {
        formData.append('image', imageFile)
      }
      
      formData.append('generate_params', JSON.stringify(generateParams))
      
      const response = await fetch('https://api.youware.com/public/v1/ai/videos/generations', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-YOUWARE'
        },
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`Video generation failed: ${response.status} ${response.statusText}`)
      }
      
      const taskData = await response.json()
      
      const newTask: VideoGenerationTask = {
        taskId: taskData.task_id,
        status: taskData.status,
        model: taskData.model,
        createdAt: taskData.created || Date.now()
      }
      
      setVideoTask(newTask)
      startPolling(newTask.taskId)
      
    } catch (error) {
      console.error('Error generating video:', error)
      setIsProcessing(false)
    }
  }
  
  const startPolling = (taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`https://api.youware.com/public/v1/ai/videos/generations/${taskId}`, {
          headers: {
            'Authorization': 'Bearer sk-YOUWARE'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Polling failed: ${response.status}`)
        }
        
        const result = await response.json()
        
        setVideoTask(prev => prev ? {
          ...prev,
          status: result.status,
          videoUrls: result.data?.map((item: any) => item.url),
          error: result.error
        } : null)
        
        if (result.status === 'completed' || result.status === 'failed') {
          clearInterval(interval)
          setPollInterval(null)
          setIsProcessing(false)
          
          if (result.status === 'completed' && result.data) {
            const videoResult: AudioProcessingResult = {
              type: 'ai-video',
              name: `ai_video_${Date.now()}`,
              url: result.data[0].url,
              processed: true
            }
            setProcessedAudio(prev => [...prev, videoResult])
          }
        }
        
      } catch (error) {
        console.error('Polling error:', error)
        clearInterval(interval)
        setPollInterval(null)
        setIsProcessing(false)
      }
    }, 5000)
    
    setPollInterval(interval)
  }

  const createMusicVideo = async () => {
    if (generationMode === 'text-to-video' || generationMode === 'image-to-video') {
      await generateVideoFromPrompt()
    } else if (videoFile && voiceFiles.length > 0) {
      // Traditional video sync functionality
      setIsProcessing(true)
      
      setTimeout(() => {
        const result: AudioProcessingResult = {
          type: 'music-video',
          name: `music_video_${videoFile.name}`,
          url: URL.createObjectURL(videoFile),
          processed: true
        }
        setProcessedAudio(prev => [...prev, result])
        setIsProcessing(false)
      }, 3000)
    }
  }

  const generateRandomSample = () => {
    const sampleFile: VoiceFile = {
      id: `sample-${Date.now()}`,
      name: randomAudioFileName(),
      duration: randomAudioDuration(),
      file: new File([''], randomAudioFileName(), { type: 'audio/mpeg' }),
      url: ''
    }
    setVoiceFiles(prev => [...prev, sampleFile])
  }

  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [pollInterval])



  const getTotalDuration = () => {
    return voiceFiles.reduce((total, voice) => total + voice.duration, 0)
  }

  const removeVoice = (voiceId: string) => {
    setVoiceFiles(prev => prev.filter(voice => voice.id !== voiceId))
    URL.revokeObjectURL(voiceFiles.find(v => v.id === voiceId)?.url || '')
  }

  const tabs = [
    { id: 'voice-cloning', label: 'Voice Cloning', icon: Mic },
    { id: 'stem-splitter', label: 'Stem Splitter', icon: Scissors },
    { id: 'voice-cleaner', label: 'Voice Cleaner', icon: Sparkles },
    { id: 'voice-changer', label: 'Voice Changer', icon: Sliders },
    { id: 'lead-back-splitter', label: 'Lead/Back Splitter', icon: Divide },
    { id: 'echo-reverb-remover', label: 'Echo & Reverb Remover', icon: RotateCw },
    { id: 'music-video-creator', label: 'Music Video Creator', icon: Video }
  ]

  const themeClasses = isDarkMode
    ? 'bg-gray-900 text-white'
    : 'bg-gradient-to-br from-slate-50 to-slate-100 text-gray-900'

  const cardClasses = isDarkMode
    ? 'bg-gray-800 border-gray-700'
    : 'bg-white border-gray-200'

  const buttonClasses = isDarkMode
    ? 'bg-blue-600 hover:bg-blue-700 text-white'
    : 'bg-blue-600 hover:bg-blue-700 text-white'

  const inputClasses = isDarkMode
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses} p-4`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <AudioLines className="w-8 h-8 text-blue-600" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Hytqi Studio Pro</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Token Balance Display */}
              <div className={`px-4 py-2 rounded-lg ${cardClasses} border`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">
                    {formatTokens(userSubscription.tokenBalance.available)} tokens
                  </span>
                </div>
                {userSubscription.plan && (
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {userSubscription.plan.name} Plan
                  </div>
                )}
              </div>
              
              {/* Demo Mode Badge */}
              {isDemoModeActive(demoMode) && (
                <div className="px-3 py-1 bg-yellow-400 text-black rounded-full text-xs font-bold animate-pulse">
                  DEMO MODE: {demoMode.remainingTime}min
                </div>
              )}
              
              {/* Upgrade Button */}
              <button
                onClick={() => setShowPricing(true)}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all duration-300"
              >
                Upgrade
              </button>
              
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg ${cardClasses} border hover:shadow-lg transition-all duration-300`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Professional audio & video processing suite technology</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : isDarkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Content */}
        {activeTab === 'voice-cloning' && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className={`${cardClasses} border rounded-xl shadow-xl p-6 backdrop-blur-sm`}>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-6 h-6 text-blue-600" />
                Voice Samples
              </h2>
              
              <div className="mb-4">
                <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Upload 1-5 high-quality voice recordings (10-50 minutes recommended)
                </p>
                <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg border-2 border-dashed ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${buttonClasses}`}
                    disabled={voiceFiles.length >= 5}
                  >
                    <Mic className="w-5 h-5" />
                    {voiceFiles.length >= 5 ? 'Maximum 5 files reached' : 'Select Audio Files'}
                  </button>
                  <button
                    onClick={generateRandomSample}
                    className={`w-full py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                      isDarkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'
                    } text-white`}
                    disabled={voiceFiles.length >= 5}
                  >
                    <Shuffle className="w-4 h-4" />
                    Generate Random Sample
                  </button>
                </div>
              </div>

              {/* Uploaded Files */}
              {voiceFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Uploaded Samples ({voiceFiles.length}/5)
                    </h3>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Total: {formatDuration(getTotalDuration())}
                    </span>
                  </div>
                  
                  {voiceFiles.map((voice) => (
                    <div key={voice.id} className={`flex items-center justify-between ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 rounded-lg`}>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => playVoice(voice.id, voice.url)}
                          className={`p-2 rounded-full transition-all duration-300 ${buttonClasses}`}
                        >
                          {activeVoice === voice.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <div>
                          <p className={`font-medium truncate max-w-[200px] ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {voice.name}
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {formatDuration(voice.duration)} • {formatFileSize(voice.file.size)} • {getAudioFormat(voice.file)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeVoice(voice.id)}
                        className="text-red-500 hover:text-red-700 transition-colors px-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Generation Section */}
            <div className={`${cardClasses} border rounded-xl shadow-xl p-6 backdrop-blur-sm`}>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <AudioLines className="w-6 h-6 text-green-600" />
                Voice Generation
              </h2>

              <div className="mb-4">
                <label htmlFor="text-input" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Text to Speech
                </label>
                <textarea
                  id="text-input"
                  value={textToSpeak}
                  onChange={(e) => setTextToSpeak(e.target.value)}
                  placeholder="Enter the text you want to convert to speech using your cloned voice..."
                  className={`w-full h-32 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-300 ${inputClasses}`}
                />
              </div>

              <button
                onClick={processVoiceCloning}
                disabled={voiceFiles.length === 0 || !textToSpeak.trim() || isProcessing}
                className={`w-full py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing Voice...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5" />
                    Generate Cloned Voice
                  </>
                )}
              </button>

              {generatedVoice && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <h3 className="font-medium text-green-800 dark:text-green-400 mb-2">Generated Voice Ready!</h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mb-3">{generatedVoice}</p>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      <Play className="w-4 h-4" />
                      Play
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stem-splitter' && (
          <div className={`${cardClasses} border rounded-xl shadow-xl p-6 backdrop-blur-sm max-w-4xl mx-auto`}>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Scissors className="w-6 h-6 text-purple-600" />
              AI Stem Splitter
            </h2>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Separate vocals, drums, bass, and other instruments from any audio track
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Music className="w-5 h-5 text-blue-600" />
                  Separation Options
                </h3>
                <div className="space-y-2">
                  {['Vocals', 'Drums', 'Bass', 'Guitar', 'Piano', 'Other'].map((stem) => (
                    <button
                      key={stem}
                      onClick={() => processAudio(`stem-${stem.toLowerCase()}`)}
                      disabled={voiceFiles.length === 0 || isProcessing}
                      className={`w-full p-3 rounded-lg text-left hover:shadow-md transition-all duration-300 ${
                        isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                      } disabled:opacity-50`}
                    >
                      Extract {stem}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Waves className="w-5 h-5 text-green-600" />
                  Processing Results
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {processedAudio.filter(item => item.type.startsWith('stem-')).map((item, index) => (
                    <div key={index} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{item.name}</span>
                        <button className="text-blue-600 hover:text-blue-800">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {processedAudio.filter(item => item.type.startsWith('stem-')).length === 0 && (
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No processed stems yet. Upload audio and start extracting!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'voice-cleaner' && (
          <div className={`${cardClasses} border rounded-xl shadow-xl p-6 backdrop-blur-sm max-w-4xl mx-auto`}>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-600" />
              AI Voice Cleaner
            </h2>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Remove background noise, enhance clarity, and improve audio quality
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { type: 'denoise', label: 'Remove Noise', icon: Filter, color: 'blue' },
                { type: 'enhance', label: 'Enhance Quality', icon: Zap, color: 'green' },
                { type: 'normalize', label: 'Normalize Audio', icon: BarChart3, color: 'purple' }
              ].map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.type}
                    onClick={() => processAudio(`clean-${option.type}`)}
                    disabled={voiceFiles.length === 0 || isProcessing}
                    className={`p-6 rounded-lg border-2 border-dashed transition-all duration-300 hover:shadow-lg disabled:opacity-50 ${
                      isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Icon className={`w-8 h-8 mx-auto mb-3 text-${option.color}-600`} />
                    <h3 className="font-semibold mb-2">{option.label}</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      AI-powered audio enhancement
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'voice-changer' && (
          <div className={`${cardClasses} border rounded-xl shadow-xl p-6 backdrop-blur-sm max-w-4xl mx-auto`}>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Sliders className="w-6 h-6 text-indigo-600" />
              AI Voice Changer
            </h2>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Transform your voice with real-time effects and character presets
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4">Voice Controls</h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Pitch: {voiceSettings.pitch}
                    </label>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      value={voiceSettings.pitch}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, pitch: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Speed: {voiceSettings.speed}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={voiceSettings.speed}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Tone
                    </label>
                    <select
                      value={voiceSettings.tone}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, tone: e.target.value }))}
                      className={`w-full p-2 border rounded-lg ${inputClasses}`}
                    >
                      <option value="neutral">Neutral</option>
                      <option value="robotic">Robotic</option>
                      <option value="deep">Deep</option>
                      <option value="high">High</option>
                      <option value="whisper">Whisper</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Character Presets</h3>
                <div className="grid grid-cols-2 gap-3">
                  {['Robot', 'Child', 'Elder', 'Monster', 'Alien', 'Hero'].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => processAudio(`voice-${preset.toLowerCase()}`)}
                      disabled={voiceFiles.length === 0 || isProcessing}
                      className={`p-3 rounded-lg transition-all duration-300 hover:shadow-md disabled:opacity-50 ${
                        isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lead-back-splitter' && (
          <div className={`${cardClasses} border rounded-xl shadow-xl p-6 backdrop-blur-sm max-w-4xl mx-auto`}>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Divide className="w-6 h-6 text-red-600" />
              Lead/Back Vocal Splitter
            </h2>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Separate lead vocals from backing vocals and harmonies
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => processAudio('lead-vocals')}
                disabled={voiceFiles.length === 0 || isProcessing}
                className={`p-8 rounded-lg border-2 border-dashed transition-all duration-300 hover:shadow-lg disabled:opacity-50 ${
                  isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Headphones className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <h3 className="font-semibold mb-2">Extract Lead Vocals</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Isolate the main vocal track
                </p>
              </button>
              
              <button
                onClick={() => processAudio('backing-vocals')}
                disabled={voiceFiles.length === 0 || isProcessing}
                className={`p-8 rounded-lg border-2 border-dashed transition-all duration-300 hover:shadow-lg disabled:opacity-50 ${
                  isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Speaker className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <h3 className="font-semibold mb-2">Extract Backing Vocals</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Isolate harmonies and background vocals
                </p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'echo-reverb-remover' && (
          <div className={`${cardClasses} border rounded-xl shadow-xl p-6 backdrop-blur-sm max-w-4xl mx-auto`}>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <RotateCw className="w-6 h-6 text-orange-600" />
              Echo & Reverb Remover
            </h2>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Remove unwanted echo, reverb, and room acoustics from recordings
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4">Processing Options</h3>
                <div className="space-y-3">
                  {[
                    { type: 'remove-echo', label: 'Remove Echo', desc: 'Eliminate echo effects' },
                    { type: 'remove-reverb', label: 'Remove Reverb', desc: 'Clean up reverb artifacts' },
                    { type: 'room-correction', label: 'Room Correction', desc: 'Correct room acoustics' },
                    { type: 'complete-cleanup', label: 'Complete Cleanup', desc: 'Full echo/reverb removal' }
                  ].map((option) => (
                    <button
                      key={option.type}
                      onClick={() => processAudio(option.type)}
                      disabled={voiceFiles.length === 0 || isProcessing}
                      className={`w-full p-4 rounded-lg text-left transition-all duration-300 hover:shadow-md disabled:opacity-50 ${
                        isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <h4 className="font-medium">{option.label}</h4>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {option.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Preview & Settings</h3>
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Echo Reduction Strength
                      </label>
                      <input type="range" min="0" max="100" defaultValue="50" className="w-full" />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Reverb Reduction Strength
                      </label>
                      <input type="range" min="0" max="100" defaultValue="50" className="w-full" />
                    </div>
                    <button className={`w-full py-2 px-4 rounded-lg ${buttonClasses} transition-colors`}>
                      Preview Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'music-video-creator' && (
          <div className={`${cardClasses} border rounded-xl shadow-xl p-6 backdrop-blur-sm max-w-6xl mx-auto`}>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Video className="w-6 h-6 text-pink-600" />
              AI Music Video Creator
            </h2>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Create AI-generated videos from text prompts or transform images into videos with VEO3 technology
            </p>
            
            {/* Generation Mode Toggle */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setGenerationMode('text-to-video')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    generationMode === 'text-to-video'
                      ? 'bg-pink-600 text-white shadow-lg'
                      : isDarkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Text to Video
                </button>
                <button
                  onClick={() => setGenerationMode('image-to-video')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    generationMode === 'image-to-video'
                      ? 'bg-pink-600 text-white shadow-lg'
                      : isDarkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Image className="w-4 h-4" />
                  Image to Video
                </button>
              </div>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Input Section */}
              <div className="lg:col-span-2">
                {generationMode === 'image-to-video' && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Image className="w-5 h-5 text-blue-600" />
                      Source Image
                    </h3>
                    <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg border-2 border-dashed ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        className={`w-full py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${buttonClasses}`}
                      >
                        <Image className="w-5 h-5" />
                        {imageFile ? imageFile.name : 'Select Source Image'}
                      </button>
                    </div>
                    
                    {imageFile && (
                      <div className="mt-4">
                        <img
                          src={URL.createObjectURL(imageFile)}
                          alt="Source"
                          className="w-full max-h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Video Prompt */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-purple-600" />
                    Video Generation Prompt
                  </h3>
                  <textarea
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder={generationMode === 'text-to-video' 
                      ? "Describe the video you want to create... (e.g., 'A majestic eagle soaring over snow-capped mountains at sunset, cinematic shot')"
                      : "Describe how you want the image to animate... (e.g., 'Add gentle camera movement and subtle lighting changes, cinematic style')"
                    }
                    className={`w-full h-32 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none transition-all duration-300 ${inputClasses}`}
                  />
                  
                  {/* Prompt Templates */}
                  <div className="mt-3">
                    <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Quick Templates:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        generationMode === 'text-to-video' 
                          ? 'A serene mountain landscape with flowing water, cinematic 4K'
                          : 'Add subtle camera movement and atmospheric effects',
                        generationMode === 'text-to-video'
                          ? 'Urban cityscape at night with neon lights, cyberpunk style'
                          : 'Create dynamic motion with lighting changes',
                        generationMode === 'text-to-video'
                          ? 'Abstract colorful particles floating in space'
                          : 'Transform with smooth transitions and effects'
                      ].map((template, index) => (
                        <button
                          key={index}
                          onClick={() => setVideoPrompt(template)}
                          className={`text-xs px-3 py-1 rounded-full transition-colors ${
                            isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {template.substring(0, 30)}...
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Generation Button */}
                <button
                  onClick={createMusicVideo}
                  disabled={!videoPrompt.trim() || (generationMode === 'image-to-video' && !imageFile) || isProcessing}
                  className={`w-full py-4 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    isDarkMode ? 'bg-pink-600 hover:bg-pink-700' : 'bg-pink-600 hover:bg-pink-700'
                  } text-white text-lg font-semibold`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {videoTask?.status === 'submitted' && 'Submitting...'}
                      {videoTask?.status === 'queued' && 'Queued for processing...'}
                      {videoTask?.status === 'in_progress' && 'Generating video... (2-5 minutes)'}
                    </>
                  ) : (
                    <>
                      <Video className="w-5 h-5" />
                      Generate AI Video
                    </>
                  )}
                </button>
                
                {/* Processing Status */}
                {videoTask && (
                  <div className={`mt-4 p-4 rounded-lg ${
                    videoTask.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                    videoTask.status === 'failed' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                    'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  } border`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${
                        videoTask.status === 'completed' ? 'bg-green-500' :
                        videoTask.status === 'failed' ? 'bg-red-500' :
                        'bg-blue-500 animate-pulse'
                      }`}></div>
                      <span className="font-medium capitalize">{videoTask.status.replace('_', ' ')}</span>
                    </div>
                    
                    {videoTask.status === 'completed' && videoTask.videoUrls && (
                      <div className="space-y-2">
                        <p className="text-sm text-green-700 dark:text-green-300">Video generated successfully!</p>
                        {videoTask.videoUrls.map((url, index) => (
                          <video
                            key={index}
                            src={url}
                            controls
                            className="w-full max-h-64 rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                    
                    {videoTask.status === 'failed' && (
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Generation failed: {videoTask.error || 'Unknown error'}
                      </p>
                    )}
                    
                    {videoTask.status === 'in_progress' && (
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Please wait while your video is being generated. This typically takes 2-5 minutes.
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Settings Panel */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  Generation Settings
                </h3>
                
                <div className="space-y-4">
                  {/* Model Selection */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      AI Model
                    </label>
                    <select
                      value={videoModel}
                      onChange={(e) => setVideoModel(e.target.value as any)}
                      className={`w-full p-2 border rounded-lg ${inputClasses}`}
                    >
                      <option value="veo3-fast">VEO3 Fast (2-3 min)</option>
                      <option value="veo3">VEO3 High Quality (3-5 min)</option>
                      <option value="midjourney-video">Midjourney Video (Image only)</option>
                    </select>
                  </div>
                  
                  {videoModel !== 'midjourney-video' && (
                    <>
                      {/* Resolution */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Resolution
                        </label>
                        <select
                          value={videoSettings.resolution}
                          onChange={(e) => setVideoSettings(prev => ({ ...prev, resolution: e.target.value }))}
                          className={`w-full p-2 border rounded-lg ${inputClasses}`}
                        >
                          <option value="720p">720p (HD)</option>
                          <option value="1080p">1080p (Full HD)</option>
                        </select>
                      </div>
                      
                      {/* Aspect Ratio */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Aspect Ratio
                        </label>
                        <select
                          value={videoSettings.aspectRatio}
                          onChange={(e) => setVideoSettings(prev => ({ ...prev, aspectRatio: e.target.value }))}
                          className={`w-full p-2 border rounded-lg ${inputClasses}`}
                        >
                          <option value="16:9">16:9 (Widescreen)</option>
                          <option value="9:16">9:16 (Portrait)</option>
                        </select>
                      </div>
                      
                      {/* Generate Audio */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="generate-audio"
                          checked={videoSettings.generateAudio}
                          onChange={(e) => setVideoSettings(prev => ({ ...prev, generateAudio: e.target.checked }))}
                          className="rounded"
                        />
                        <label htmlFor="generate-audio" className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Generate Audio Track
                        </label>
                      </div>
                    </>
                  )}
                  
                  {/* Style Preset */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Style Preset
                    </label>
                    <select
                      value={videoSettings.style}
                      onChange={(e) => setVideoSettings(prev => ({ ...prev, style: e.target.value }))}
                      className={`w-full p-2 border rounded-lg ${inputClasses}`}
                    >
                      <option value="cinematic">Cinematic</option>
                      <option value="realistic">Realistic</option>
                      <option value="artistic">Artistic</option>
                      <option value="animated">Animated</option>
                      <option value="vintage">Vintage</option>
                    </select>
                  </div>
                </div>
                
                {/* Processing Time Info */}
                <div className={`mt-6 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Processing Time
                  </h4>
                  <div className="text-sm space-y-1">
                    <p>• VEO3 Fast: 2-3 minutes</p>
                    <p>• VEO3 Quality: 3-5 minutes</p>
                    <p>• Midjourney: ~4 minutes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className={`mt-12 ${cardClasses} border rounded-xl shadow-xl p-6 backdrop-blur-sm`}>
          <h2 className="text-2xl font-semibold mb-6 text-center">Professional Audio Processing Features</h2>
          <div className="grid md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              { icon: Mic, title: 'Voice Cloning', desc: 'AI-powered voice replication' },
              { icon: Scissors, title: 'Stem Splitting', desc: 'Isolate instruments & vocals' },
              { icon: Sparkles, title: 'Audio Cleaning', desc: 'Remove noise & enhance quality' },
              { icon: Sliders, title: 'Voice Effects', desc: 'Real-time voice transformation' },
              { icon: Divide, title: 'Vocal Separation', desc: 'Lead & backing vocal isolation' },
              { icon: Video, title: 'AI Video Creation', desc: 'Generate videos from prompts & images' }
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="text-center">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {feature.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Token Insufficient Modal */}
      {showTokenInsufficient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className={`${cardClasses} border-2 border-red-400 rounded-xl p-8 max-w-md mx-4 text-center`}>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-red-500 rounded-full">
                <div className="w-8 h-8 text-white">⚠️</div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-red-400 mb-4">Insufficient Tokens</h3>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              You don't have enough tokens to complete this action. Upgrade your plan or purchase token packs to continue.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowTokenInsufficient(false)
                  setShowPricing(true)
                }}
                className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all duration-300"
              >
                View Pricing Plans
              </button>
              <button
                onClick={() => setShowTokenInsufficient(false)}
                className={`w-full py-3 px-4 ${cardClasses} border rounded-lg font-medium transition-all duration-300`}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Pricing Modal */}
      {showPricing && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen bg-black/80 backdrop-blur-sm">
            <div className="flex items-center justify-center p-4">
              <div className={`${cardClasses} border-2 border-green-400 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto`}>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-green-400">Choose Your Plan</h2>
                    <button
                      onClick={() => setShowPricing(false)}
                      className={`p-2 rounded-lg ${cardClasses} border hover:bg-gray-700 transition-all duration-300`}
                    >
                      ✕
                    </button>
                  </div>
                  
                  {/* Quick Plan Overview */}
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {['free', 'basic', 'premium'].map((tier) => {
                      const plan = getPlanById(`${tier}-monthly`)
                      if (!plan) return null
                      
                      return (
                        <div key={tier} className={`border rounded-lg p-4 ${
                          tier === 'basic' ? 'border-green-400 bg-green-400/10' : 'border-gray-800'
                        }`}>
                          <h3 className="text-lg font-bold text-green-400 capitalize mb-2">{plan.name}</h3>
                          <div className="text-2xl font-black text-green-400 mb-2">
                            {plan.price === 0 ? 'Free' : formatPrice(plan.price, plan.currency)}
                          </div>
                          <div className="text-gray-400 text-sm mb-3">{plan.tokens.toLocaleString()} tokens/month</div>
                          <button
                            onClick={() => {
                              // Handle subscription
                              console.log('Subscribe to:', plan.id)
                            }}
                            className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                              tier === 'basic' 
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-gray-800 hover:bg-gray-700 text-green-400 border border-green-400'
                            }`}
                          >
                            {plan.price === 0 ? 'Start Free' : 'Subscribe'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={() => setShowPricing(false)}
                      className={`px-6 py-2 ${cardClasses} border rounded-lg font-medium transition-all duration-300`}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <audio ref={audioRef} onEnded={() => setActiveVoice(null)} />
    </div>
  );
}

export default App