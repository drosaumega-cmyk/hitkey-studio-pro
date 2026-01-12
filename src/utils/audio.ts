/**
 * Audio-specific utility functions for the AI Audio Studio Pro application
 */

/**
 * Calculate audio duration from file
 * @param file Audio file
 * @returns Promise that resolves to duration in seconds
 */
export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    const url = URL.createObjectURL(file)
    
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url)
      resolve(audio.duration)
    })
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load audio metadata'))
    })
    
    audio.src = url
  })
}

/**
 * Create audio object URL with proper cleanup
 * @param file Audio file
 * @returns Object URL string
 */
export function createAudioUrl(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * Safely revoke audio object URL
 * @param url Object URL to revoke
 */
export function revokeAudioUrl(url: string): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

/**
 * Get audio file format from MIME type or extension
 * @param file Audio file
 * @returns Audio format string
 */
export function getAudioFormat(file: File): string {
  const mimeToFormat: Record<string, string> = {
    'audio/mpeg': 'MP3',
    'audio/wav': 'WAV',
    'audio/flac': 'FLAC',
    'audio/aac': 'AAC',
    'audio/ogg': 'OGG',
    'audio/mp4': 'M4A',
    'audio/webm': 'WebM',
    'audio/x-m4a': 'M4A',
    'audio/x-wav': 'WAV'
  }
  
  // Try MIME type first
  if (mimeToFormat[file.type]) {
    return mimeToFormat[file.type]
  }
  
  // Fall back to extension
  const extension = file.name.split('.').pop()?.toUpperCase()
  return extension || 'Unknown'
}

/**
 * Get audio codec information from MIME type
 * @param mimeType MIME type string
 * @returns Codec information
 */
export function getAudioCodec(mimeType: string): {
  codec: string
  quality: 'lossy' | 'lossless' | 'unknown'
} {
  const codecMap: Record<string, { codec: string; quality: 'lossy' | 'lossless' }> = {
    'audio/mpeg': { codec: 'MP3', quality: 'lossy' },
    'audio/wav': { codec: 'PCM', quality: 'lossless' },
    'audio/flac': { codec: 'FLAC', quality: 'lossless' },
    'audio/aac': { codec: 'AAC', quality: 'lossy' },
    'audio/ogg': { codec: 'Vorbis', quality: 'lossy' },
    'audio/mp4': { codec: 'AAC', quality: 'lossy' },
    'audio/webm': { codec: 'Opus', quality: 'lossy' }
  }
  
  return codecMap[mimeType] || { codec: 'Unknown', quality: 'unknown' }
}

/**
 * Calculate estimated bitrate from file size and duration
 * @param fileSize File size in bytes
 * @param duration Duration in seconds
 * @returns Estimated bitrate in kbps
 */
export function calculateBitrate(fileSize: number, duration: number): number {
  if (duration <= 0) return 0
  return Math.round((fileSize * 8) / (duration * 1000))
}

/**
 * Determine audio quality category from bitrate
 * @param kbps Bitrate in kbps
 * @param format Audio format
 * @returns Quality category
 */
export function getAudioQualityCategory(kbps: number, format: string): 'low' | 'medium' | 'high' | 'premium' {
  const thresholds: Record<string, { low: number; medium: number; high: number }> = {
    'MP3': { low: 128, medium: 192, high: 256 },
    'AAC': { low: 96, medium: 128, high: 192 },
    'OGG': { low: 96, medium: 160, high: 224 },
    'WAV': { low: 1411, medium: 1411, high: 1411 }, // Always high quality
    'FLAC': { low: 1411, medium: 1411, high: 1411 } // Always lossless
  }
  
  const formatThresholds = thresholds[format] || thresholds['MP3']
  
  if (kbps >= formatThresholds.high) return 'premium'
  if (kbps >= formatThresholds.medium) return 'high'
  if (kbps >= formatThresholds.low) return 'medium'
  return 'low'
}

/**
 * Generate audio waveform data points (simplified)
 * @param duration Audio duration in seconds
 * @param samples Number of samples to generate (default: 100)
 * @returns Array of waveform amplitude values
 */
export function generateWaveform(duration: number, samples: number = 100): number[] {
  const waveform: number[] = []
  const sampleInterval = duration / samples
  
  for (let i = 0; i < samples; i++) {
    // Simulate waveform with some randomness
    const time = i * sampleInterval
    const amplitude = Math.abs(Math.sin(time * 2) * Math.cos(time * 0.5)) + Math.random() * 0.3
    waveform.push(Math.min(1, amplitude))
  }
  
  return waveform
}

/**
 * Calculate audio file hash for deduplication
 * @param file Audio file
 * @returns Promise that resolves to file hash
 */
export async function calculateAudioHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Check if two audio files are likely duplicates
 * @param file1 First audio file
 * @param file2 Second audio file
 * @returns Promise that resolves to true if files are likely duplicates
 */
export async function areAudioFilesDuplicate(file1: File, file2: File): Promise<boolean> {
  // Quick check: exact size match
  if (file1.size !== file2.size) return false
  
  // Quick check: exact name match
  if (file1.name === file2.name) return true
  
  // Deep check: hash comparison
  try {
    const hash1 = await calculateAudioHash(file1)
    const hash2 = await calculateAudioHash(file2)
    return hash1 === hash2
  } catch {
    return false
  }
}

/**
 * Get recommended audio settings for different use cases
 * @param useCase Use case type
 * @returns Recommended audio settings
 */
export function getRecommendedAudioSettings(useCase: 'voice' | 'music' | 'podcast' | 'audiobook'): {
  format: string
  bitrate: number
  sampleRate: number
  channels: number
} {
  const settings = {
    voice: {
      format: 'MP3',
      bitrate: 128,
      sampleRate: 22050,
      channels: 1 // Mono is fine for voice
    },
    music: {
      format: 'FLAC',
      bitrate: 1411,
      sampleRate: 44100,
      channels: 2 // Stereo for music
    },
    podcast: {
      format: 'MP3',
      bitrate: 192,
      sampleRate: 44100,
      channels: 2 // Stereo for podcasts
    },
    audiobook: {
      format: 'MP3',
      bitrate: 96,
      sampleRate: 22050,
      channels: 1 // Mono for audiobooks
    }
  }
  
  return settings[useCase]
}

/**
 * Estimate audio processing time based on file characteristics
 * @param fileSize File size in bytes
 * @param duration Duration in seconds
 * @param processingType Type of processing
 * @returns Estimated processing time in milliseconds
 */
export function estimateProcessingTime(
  fileSize: number, 
  duration: number, 
  processingType: 'voice-cloning' | 'stem-separation' | 'noise-removal' | 'enhancement'
): number {
  const baseTime = 1000 // 1 second base time
  
  const multipliers = {
    'voice-cloning': 10, // Voice cloning is intensive
    'stem-separation': 5, // Stem separation is moderately intensive
    'noise-removal': 2,  // Noise removal is relatively quick
    'enhancement': 3     // Enhancement is moderately quick
  }
  
  const sizeFactor = Math.log(fileSize / (1024 * 1024)) // Logarithmic scaling
  const durationFactor = duration / 60 // Per minute
  
  return baseTime * multipliers[processingType] * (1 + sizeFactor) * durationFactor
}

/**
 * Create audio context for advanced audio processing
 * @returns AudioContext instance
 */
export function createAudioContext(): AudioContext {
  return new (window.AudioContext || (window as any).webkitAudioContext)()
}

/**
 * Check if browser supports Web Audio API
 * @returns True if Web Audio API is supported
 */
export function isWebAudioSupported(): boolean {
  return !!(window.AudioContext || (window as any).webkitAudioContext)
}

/**
 * Get supported audio formats in current browser
 * @returns Array of supported audio formats
 */
export function getSupportedAudioFormats(): string[] {
  const audio = document.createElement('audio')
  const formats: string[] = []
  
  const formatTests = [
    { mime: 'audio/mpeg', format: 'MP3' },
    { mime: 'audio/wav', format: 'WAV' },
    { mime: 'audio/flac', format: 'FLAC' },
    { mime: 'audio/aac', format: 'AAC' },
    { mime: 'audio/ogg', format: 'OGG' },
    { mime: 'audio/webm', format: 'WebM' }
  ]
  
  formatTests.forEach(({ mime, format }) => {
    if (audio.canPlayType(mime) !== '') {
      formats.push(format)
    }
  })
  
  return formats
}