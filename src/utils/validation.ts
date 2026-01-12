/**
 * Validation utility functions for the AI Audio Studio Pro application
 */

/**
 * Validate audio file type
 * @param file File to validate
 * @returns True if valid audio file
 */
export function isValidAudioFile(file: File): boolean {
  const validTypes = [
    'audio/mpeg',      // MP3
    'audio/wav',       // WAV
    'audio/flac',      // FLAC
    'audio/aac',       // AAC
    'audio/ogg',       // OGG
    'audio/mp4',       // M4A
    'audio/webm',      // WebM Audio
    'audio/x-m4a',     // M4A (alternative)
    'audio/x-wav'      // WAV (alternative)
  ]
  return validTypes.includes(file.type)
}

/**
 * Validate video file type
 * @param file File to validate
 * @returns True if valid video file
 */
export function isValidVideoFile(file: File): boolean {
  const validTypes = [
    'video/mp4',       // MP4
    'video/webm',      // WebM
    'video/ogg',       // OGG Video
    'video/quicktime', // MOV
    'video/x-msvideo', // AVI
    'video/mpeg'       // MPEG
  ]
  return validTypes.includes(file.type)
}

/**
 * Validate image file type
 * @param file File to validate
 * @returns True if valid image file
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = [
    'image/jpeg',      // JPEG
    'image/jpg',       // JPG
    'image/png',       // PNG
    'image/gif',       // GIF
    'image/webp',      // WebP
    'image/bmp',       // BMP
    'image/tiff'       // TIFF
  ]
  return validTypes.includes(file.type)
}

/**
 * Validate file size against maximum limit
 * @param file File to validate
 * @param maxSizeMB Maximum size in MB (default: 100)
 * @returns True if file size is within limit
 */
export function isValidFileSize(file: File, maxSizeMB: number = 100): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * Validate audio duration against recommended range
 * @param duration Duration in seconds
 * @param minDuration Minimum duration in seconds (default: 10)
 * @param maxDuration Maximum duration in seconds (default: 3600)
 * @returns True if duration is within range
 */
export function isValidAudioDuration(duration: number, minDuration: number = 10, maxDuration: number = 3600): boolean {
  return duration >= minDuration && duration <= maxDuration
}

/**
 * Validate email format
 * @param email Email address to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate URL format
 * @param url URL to validate
 * @returns True if valid URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate text input for AI prompts
 * @param text Text to validate
 * @param minLength Minimum length (default: 1)
 * @param maxLength Maximum length (default: 1000)
 * @returns Validation result with isValid and message
 */
export function validatePromptText(text: string, minLength: number = 1, maxLength: number = 1000): {
  isValid: boolean
  message?: string
} {
  if (text.length < minLength) {
    return {
      isValid: false,
      message: `Text must be at least ${minLength} character${minLength > 1 ? 's' : ''} long`
    }
  }
  
  if (text.length > maxLength) {
    return {
      isValid: false,
      message: `Text must not exceed ${maxLength} characters`
    }
  }
  
  return { isValid: true }
}

/**
 * Validate voice settings parameters
 * @param settings Voice settings object
 * @returns Validation result with isValid and message
 */
export function validateVoiceSettings(settings: {
  pitch: number
  speed: number
  tone: string
}): {
  isValid: boolean
  message?: string
} {
  if (settings.pitch < -12 || settings.pitch > 12) {
    return {
      isValid: false,
      message: 'Pitch must be between -12 and +12'
    }
  }
  
  if (settings.speed < 0.5 || settings.speed > 2) {
    return {
      isValid: false,
      message: 'Speed must be between 0.5x and 2x'
    }
  }
  
  const validTones = ['neutral', 'robotic', 'deep', 'high', 'whisper']
  if (!validTones.includes(settings.tone)) {
    return {
      isValid: false,
      message: 'Invalid tone selection'
    }
  }
  
  return { isValid: true }
}

/**
 * Validate video generation settings
 * @param settings Video settings object
 * @returns Validation result with isValid and message
 */
export function validateVideoSettings(settings: {
  resolution: string
  aspectRatio: string
  style: string
}): {
  isValid: boolean
  message?: string
} {
  const validResolutions = ['720p', '1080p']
  const validAspectRatios = ['16:9', '9:16']
  const validStyles = ['cinematic', 'realistic', 'artistic', 'animated', 'vintage']
  
  if (!validResolutions.includes(settings.resolution)) {
    return {
      isValid: false,
      message: 'Invalid resolution selection'
    }
  }
  
  if (!validAspectRatios.includes(settings.aspectRatio)) {
    return {
      isValid: false,
      message: 'Invalid aspect ratio selection'
    }
  }
  
  if (!validStyles.includes(settings.style)) {
    return {
      isValid: false,
      message: 'Invalid style selection'
    }
  }
  
  return { isValid: true }
}

/**
 * Check if string contains only safe characters
 * @param text Text to check
 * @returns True if contains only safe characters
 */
export function containsOnlySafeChars(text: string): boolean {
  const safeChars = /^[a-zA-Z0-9\s\-_.,!?()[\]{}:;'"@#$%^&*+=|\\/<>~`]+$/
  return safeChars.test(text)
}

/**
 * Validate file name for safety
 * @param fileName File name to validate
 * @returns True if safe file name
 */
export function isValidFileName(fileName: string): boolean {
  // Check for invalid characters and patterns
  const invalidPatterns = [
    /\.\./,           // Directory traversal
    /[<>:"|?*]/,      // Windows invalid characters
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Windows reserved names
    /^\./,            // Hidden files (Unix)
    /\s$/,            // Trailing whitespace
  ]
  
  return !invalidPatterns.some(pattern => pattern.test(fileName)) && fileName.length > 0 && fileName.length <= 255
}

/**
 * Validate hex color code
 * @param color Color code to validate
 * @returns True if valid hex color
 */
export function isValidHexColor(color: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return hexRegex.test(color)
}

/**
 * Validate UUID format
 * @param uuid UUID string to validate
 * @returns True if valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}