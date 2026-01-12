/**
 * Random utility functions for the AI Audio Studio Pro application
 */

/**
 * Generate a random integer between min and max (inclusive)
 * @param min Minimum value
 * @param max Maximum value
 * @returns Random integer
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generate a random float between min and max
 * @param min Minimum value
 * @param max Maximum value
 * @param decimals Number of decimal places (default: 2)
 * @returns Random float
 */
export function randomFloat(min: number, max: number, decimals: number = 2): number {
  const randomValue = Math.random() * (max - min) + min
  return Number(randomValue.toFixed(decimals))
}

/**
 * Generate a random boolean value
 * @param probability Probability of true (0-1, default: 0.5)
 * @returns Random boolean
 */
export function randomBoolean(probability: number = 0.5): boolean {
  return Math.random() < probability
}

/**
 * Pick a random element from an array
 * @param array Array to pick from
 * @returns Random element or undefined if array is empty
 */
export function randomPick<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined
  return array[randomInt(0, array.length - 1)]
}

/**
 * Pick multiple random elements from an array without duplicates
 * @param array Array to pick from
 * @param count Number of elements to pick
 * @returns Array of random elements
 */
export function randomPickMultiple<T>(array: T[], count: number): T[] {
  if (count >= array.length) return [...array].sort(() => Math.random() - 0.5)
  
  const shuffled = [...array].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Shuffle an array in place (Fisher-Yates algorithm)
 * @param array Array to shuffle
 * @returns Shuffled array (same reference)
 */
export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/**
 * Generate a random string
 * @param length Length of the string
 * @param charset Character set to use (default: alphanumeric)
 * @returns Random string
 */
export function randomString(
  length: number,
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return result
}

/**
 * Generate a random UUID v4
 * @returns Random UUID string
 */
export function randomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Generate a random color in hex format
 * @returns Random hex color
 */
export function randomColor(): string {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
}

/**
 * Generate a random RGB color object
 * @returns Random RGB color object
 */
export function randomRGB(): { r: number; g: number; b: number } {
  return {
    r: randomInt(0, 255),
    g: randomInt(0, 255),
    b: randomInt(0, 255)
  }
}

/**
 * Generate a random timestamp within a range
 * @param daysBack Number of days back from now (default: 365)
 * @returns Random timestamp
 */
export function randomTimestamp(daysBack: number = 365): Date {
  const now = new Date()
  const past = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()))
}

/**
 * Generate a random audio file name
 * @returns Random audio filename
 */
export function randomAudioFileName(): string {
  const extensions = ['mp3', 'wav', 'flac', 'aac', 'ogg']
  const names = [
    'audio_recording', 'voice_sample', 'music_track', 'podcast_episode',
    'sound_effect', 'instrumental', 'vocal_take', 'studio_recording'
  ]
  const name = randomPick(names)
  const timestamp = Date.now()
  const extension = randomPick(extensions)
  return `${name}_${timestamp}.${extension}`
}

/**
 * Generate a random processing duration for audio files (in seconds)
 * @returns Random duration between 10 and 300 seconds
 */
export function randomAudioDuration(): number {
  return randomInt(10, 300)
}

/**
 * Generate a random file size (in bytes)
 * @param minSizeMB Minimum size in MB (default: 1)
 * @param maxSizeMB Maximum size in MB (default: 50)
 * @returns Random file size in bytes
 */
export function randomFileSize(minSizeMB: number = 1, maxSizeMB: number = 50): number {
  const sizeMB = randomFloat(minSizeMB, maxSizeMB, 2)
  return Math.floor(sizeMB * 1024 * 1024)
}

/**
 * Generate a random processing status
 * @returns Random processing status
 */
export function randomProcessingStatus(): 'pending' | 'processing' | 'completed' | 'failed' {
  const statuses: ('pending' | 'processing' | 'completed' | 'failed')[] = ['pending', 'processing', 'completed', 'failed']
  return randomPick(statuses) || 'pending'
}

/**
 * Generate a random voice preset name
 * @returns Random voice preset
 */
export function randomVoicePreset(): string {
  const presets = [
    'Professional Narrator', 'Friendly Assistant', 'Deep Voice', 'High Pitch',
    'Robot Voice', 'Child Voice', 'Elder Voice', 'Monster Voice', 'Alien Voice',
    'Hero Voice', 'Whisper Voice', 'Announcer Voice', 'Character Voice'
  ]
  return randomPick(presets) || 'Default Voice'
}

/**
 * Generate a random audio processing type
 * @returns Random processing type
 */
export function randomProcessingType(): string {
  const types = [
    'stem-separation', 'noise-removal', 'voice-enhancement', 'pitch-correction',
    'tempo-adjustment', 'equalization', 'compression', 'reverb-removal',
    'echo-cancellation', 'audio-restoration'
  ]
  return randomPick(types) || 'audio-processing'
}

/**
 * Generate a random delay time for simulating processing
 * @param minMs Minimum delay in milliseconds (default: 1000)
 * @param maxMs Maximum delay in milliseconds (default: 5000)
 * @returns Random delay time
 */
export function randomDelay(minMs: number = 1000, maxMs: number = 5000): number {
  return randomInt(minMs, maxMs)
}

/**
 * Generate a random percentage value
 * @returns Random percentage (0-100)
 */
export function randomPercentage(): number {
  return randomInt(0, 100)
}

/**
 * Generate a random audio quality score
 * @returns Random quality score (0-100)
 */
export function randomAudioQuality(): number {
  // Weighted towards higher quality scores
  const weights = [5, 10, 15, 20, 25, 20, 15, 10, 5] // Weights for scores 10-100
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  let random = Math.random() * totalWeight
  
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i]
    if (random <= 0) {
      return (i + 1) * 10
    }
  }
  return 100
}