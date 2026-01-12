/**
 * Formatting utility functions for the AI Audio Studio Pro application
 */

/**
 * Format duration in seconds to human-readable string
 * @param seconds Duration in seconds
 * @returns Formatted duration string (MM:SS or HH:MM:SS)
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) return '00:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Format file size to human-readable string
 * @param bytes Size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format date to relative time string
 * @param date Date object or timestamp
 * @returns Relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | number): string {
  const now = new Date()
  const targetDate = typeof date === 'number' ? new Date(date) : date
  const diffMs = now.getTime() - targetDate.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffSeconds < 60) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return targetDate.toLocaleDateString()
}

/**
 * Format percentage with optional decimal places
 * @param value Value between 0 and 100
 * @param decimals Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format audio quality score with descriptive label
 * @param score Quality score (0-100)
 * @returns Formatted quality with label
 */
export function formatAudioQuality(score: number): string {
  let label = 'Poor'
  if (score >= 90) label = 'Excellent'
  else if (score >= 75) label = 'Good'
  else if (score >= 50) label = 'Fair'
  
  return `${score}/100 (${label})`
}

/**
 * Format processing time with appropriate units
 * @param milliseconds Processing time in milliseconds
 * @returns Formatted time string
 */
export function formatProcessingTime(milliseconds: number): string {
  if (milliseconds < 1000) return `${milliseconds}ms`
  if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`
  return `${(milliseconds / 60000).toFixed(1)}min`
}

/**
 * Format frequency in Hz to human-readable string
 * @param hz Frequency in Hz
 * @returns Formatted frequency string
 */
export function formatFrequency(hz: number): string {
  if (hz < 1000) return `${hz}Hz`
  if (hz < 1000000) return `${(hz / 1000).toFixed(1)}kHz`
  return `${(hz / 1000000).toFixed(1)}MHz`
}

/**
 * Format bitrate to human-readable string
 * @param kbps Bitrate in kbps
 * @returns Formatted bitrate string
 */
export function formatBitrate(kbps: number): string {
  if (kbps < 1000) return `${kbps}kbps`
  return `${(kbps / 1000).toFixed(1)}Mbps`
}

/**
 * Format sample rate with appropriate units
 * @param hz Sample rate in Hz
 * @returns Formatted sample rate string
 */
export function formatSampleRate(hz: number): string {
  const commonRates = [8000, 11025, 16000, 22050, 44100, 48000, 88200, 96000, 176400, 192000]
  if (commonRates.includes(hz)) {
    return `${hz / 1000}kHz`
  }
  return formatFrequency(hz)
}

/**
 * Truncate text with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Capitalize first letter of each word
 * @param text Text to capitalize
 * @returns Capitalized text
 */
export function capitalizeWords(text: string): string {
  return text.replace(/\b\w/g, char => char.toUpperCase())
}

/**
 * Convert camelCase to Title Case
 * @param text CamelCase text
 * @returns Title Case text
 */
export function camelToTitle(text: string): string {
  return text.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}

/**
 * Format currency amount
 * @param amount Amount in dollars
 * @param currency Currency code (default: 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}