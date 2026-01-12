/**
 * Device and browser utility functions for the AI Audio Studio Pro application
 */

/**
 * Get browser information
 * @returns Browser information object
 */
export function getBrowserInfo(): {
  name: string
  version: string
  isChrome: boolean
  isFirefox: boolean
  isSafari: boolean
  isEdge: boolean
  isMobile: boolean
} {
  const userAgent = navigator.userAgent
  const vendor = navigator.vendor || ''
  
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(vendor)
  const isFirefox = /Firefox/.test(userAgent)
  const isSafari = /Safari/.test(userAgent) && /Apple Computer/.test(vendor)
  const isEdge = /Edg/.test(userAgent)
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  
  let name = 'Unknown'
  let version = 'Unknown'
  
  if (isChrome) {
    name = 'Chrome'
    const match = userAgent.match(/Chrome\/(\d+)/)
    version = match ? match[1] : 'Unknown'
  } else if (isFirefox) {
    name = 'Firefox'
    const match = userAgent.match(/Firefox\/(\d+)/)
    version = match ? match[1] : 'Unknown'
  } else if (isSafari) {
    name = 'Safari'
    const match = userAgent.match(/Version\/(\d+)/)
    version = match ? match[1] : 'Unknown'
  } else if (isEdge) {
    name = 'Edge'
    const match = userAgent.match(/Edg\/(\d+)/)
    version = match ? match[1] : 'Unknown'
  }
  
  return {
    name,
    version,
    isChrome,
    isFirefox,
    isSafari,
    isEdge,
    isMobile
  }
}

/**
 * Get operating system information
 * @returns OS information object
 */
export function getOSInfo(): {
  name: string
  version: string
  isWindows: boolean
  isMac: boolean
  isLinux: boolean
  isIOS: boolean
  isAndroid: boolean
} {
  const userAgent = navigator.userAgent
  const platform = navigator.platform
  
  const isWindows = /Win/.test(platform)
  const isMac = /Mac/.test(platform)
  const isLinux = /Linux/.test(platform)
  const isIOS = /iPad|iPhone|iPod/.test(userAgent)
  const isAndroid = /Android/.test(userAgent)
  
  let name = 'Unknown'
  let version = 'Unknown'
  
  if (isWindows) {
    name = 'Windows'
    const match = userAgent.match(/Windows NT (\d+\.\d+)/)
    version = match ? match[1] : 'Unknown'
  } else if (isMac) {
    name = 'macOS'
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/)
    version = match ? match[1].replace('_', '.') : 'Unknown'
  } else if (isLinux) {
    name = 'Linux'
  } else if (isIOS) {
    name = 'iOS'
    const match = userAgent.match(/OS (\d+[._]\d+)/)
    version = match ? match[1].replace('_', '.') : 'Unknown'
  } else if (isAndroid) {
    name = 'Android'
    const match = userAgent.match(/Android (\d+\.\d+)/)
    version = match ? match[1] : 'Unknown'
  }
  
  return {
    name,
    version,
    isWindows,
    isMac,
    isLinux,
    isIOS,
    isAndroid
  }
}

/**
 * Get device information
 * @returns Device information object
 */
export function getDeviceInfo(): {
  type: 'desktop' | 'mobile' | 'tablet'
  isTouchDevice: boolean
  pixelRatio: number
  screenWidth: number
  screenHeight: number
  colorDepth: number
  memory?: number
  cores?: number
} {
  const userAgent = navigator.userAgent
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  let type: 'desktop' | 'mobile' | 'tablet' = 'desktop'
  
  if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    type = /iPad/i.test(userAgent) ? 'tablet' : 'mobile'
  }
  
  const memory = (navigator as any).deviceMemory
  const cores = navigator.hardwareConcurrency
  
  return {
    type,
    isTouchDevice,
    pixelRatio: window.devicePixelRatio || 1,
    screenWidth: screen.width,
    screenHeight: screen.height,
    colorDepth: screen.colorDepth,
    memory,
    cores
  }
}

/**
 * Get network information
 * @returns Network information object
 */
export function getNetworkInfo(): {
  isOnline: boolean
  connectionType?: string
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
} {
  const isOnline = navigator.onLine
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  
  return {
    isOnline,
    connectionType: connection?.type,
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt,
    saveData: connection?.saveData
  }
}

/**
 * Check if a specific browser feature is supported
 * @param feature Feature name to check
 * @returns True if feature is supported
 */
export function isFeatureSupported(feature: string): boolean {
  const features: Record<string, () => boolean> = {
    'web-audio': () => !!(window.AudioContext || (window as any).webkitAudioContext),
    'web-workers': () => typeof Worker !== 'undefined',
    'service-workers': () => 'serviceWorker' in navigator,
    'indexed-db': () => 'indexedDB' in window,
    'local-storage': () => 'localStorage' in window,
    'session-storage': () => 'sessionStorage' in window,
    'webgl': () => {
      try {
        const canvas = document.createElement('canvas')
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      } catch {
        return false
      }
    },
    'webgl2': () => {
      try {
        const canvas = document.createElement('canvas')
        return !!canvas.getContext('webgl2')
      } catch {
        return false
      }
    },
    'webassembly': () => typeof WebAssembly === 'object',
    'geolocation': () => 'geolocation' in navigator,
    'camera': () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    'microphone': () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    'notifications': () => 'Notification' in window,
    'share-api': () => 'share' in navigator,
    'clipboard-api': () => 'clipboard' in navigator,
    'fullscreen': () => !!(document.fullscreenEnabled || (document as any).webkitFullscreenEnabled),
    'picture-in-picture': () => 'pictureInPictureEnabled' in document,
    'wake-lock': () => 'wakeLock' in navigator,
    'bluetooth': () => 'bluetooth' in navigator,
    'usb': () => 'usb' in navigator,
    'nfc': () => 'nfc' in navigator,
    'vr': () => 'xr' in navigator,
    'payment-request': () => 'PaymentRequest' in window,
    'credentials': () => 'credentials' in navigator,
    'sensor': () => 'Sensor' in window,
    'performance-api': () => 'performance' in window,
    'intersection-observer': () => 'IntersectionObserver' in window,
    'mutation-observer': () => 'MutationObserver' in window,
    'resize-observer': () => 'ResizeObserver' in window,
    'web-animations': () => 'animate' in document.documentElement,
    'css-grid': () => CSS.supports('display', 'grid'),
    'css-flexbox': () => CSS.supports('display', 'flex'),
    'css-custom-properties': () => CSS.supports('color', 'var(--test)'),
    'css-contain': () => CSS.supports('contain', 'strict'),
    'css-scroll-snap': () => CSS.supports('scroll-snap-type', 'mandatory')
  }
  
  const checker = features[feature.toLowerCase()]
  return checker ? checker() : false
}

/**
 * Get supported audio formats for the current browser
 * @returns Array of supported audio formats
 */
export function getSupportedAudioFormats(): string[] {
  const audio = document.createElement('audio')
  const formats: Array<{ mime: string; format: string }> = [
    { mime: 'audio/mpeg', format: 'MP3' },
    { mime: 'audio/wav', format: 'WAV' },
    { mime: 'audio/flac', format: 'FLAC' },
    { mime: 'audio/aac', format: 'AAC' },
    { mime: 'audio/ogg; codecs="vorbis"', format: 'OGG Vorbis' },
    { mime: 'audio/ogg; codecs="opus"', format: 'OGG Opus' },
    { mime: 'audio/webm; codecs="opus"', format: 'WebM Opus' },
    { mime: 'audio/webm; codecs="vorbis"', format: 'WebM Vorbis' },
    { mime: 'audio/mp4', format: 'M4A' },
    { mime: 'audio/3gpp', format: '3GPP' }
  ]
  
  return formats
    .filter(({ mime }) => audio.canPlayType(mime) !== '')
    .map(({ format }) => format)
}

/**
 * Get supported video formats for the current browser
 * @returns Array of supported video formats
 */
export function getSupportedVideoFormats(): string[] {
  const video = document.createElement('video')
  const formats: Array<{ mime: string; format: string }> = [
    { mime: 'video/mp4; codecs="avc1.42E01E"', format: 'MP4 H.264' },
    { mime: 'video/webm; codecs="vp8"', format: 'WebM VP8' },
    { mime: 'video/webm; codecs="vp9"', format: 'WebM VP9' },
    { mime: 'video/webm; codecs="av1"', format: 'WebM AV1' },
    { mime: 'video/ogg; codecs="theora"', format: 'OGG Theora' },
    { mime: 'video/quicktime', format: 'MOV' },
    { mime: 'video/x-msvideo', format: 'AVI' }
  ]
  
  return formats
    .filter(({ mime }) => video.canPlayType(mime) !== '')
    .map(({ format }) => format)
}

/**
 * Check if device has sufficient performance for audio processing
 * @returns Performance assessment object
 */
export function getPerformanceAssessment(): {
  canHandleAudioProcessing: boolean
  canHandleVideoProcessing: boolean
  recommendedQuality: 'low' | 'medium' | 'high'
  limitations: string[]
} {
  const deviceInfo = getDeviceInfo()
  const networkInfo = getNetworkInfo()
  const limitations: string[] = []
  
  // Check memory
  if (deviceInfo.memory && deviceInfo.memory < 4) {
    limitations.push('Limited memory may affect performance')
  }
  
  // Check CPU cores
  if (deviceInfo.cores && deviceInfo.cores < 4) {
    limitations.push('Limited CPU cores may slow processing')
  }
  
  // Check network
  if (networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
    limitations.push('Slow network connection detected')
  }
  
  // Check device type
  if (deviceInfo.type === 'mobile') {
    limitations.push('Mobile device may have limited processing power')
  }
  
  // Determine capabilities
  const canHandleAudioProcessing = deviceInfo.cores ? deviceInfo.cores >= 2 : true
  const canHandleVideoProcessing = deviceInfo.cores ? deviceInfo.cores >= 4 : false
  
  // Determine recommended quality
  let recommendedQuality: 'low' | 'medium' | 'high' = 'medium'
  
  if (deviceInfo.type === 'mobile' || (deviceInfo.memory && deviceInfo.memory < 4)) {
    recommendedQuality = 'low'
  } else if (deviceInfo.cores && deviceInfo.cores >= 8 && deviceInfo.memory && deviceInfo.memory >= 8) {
    recommendedQuality = 'high'
  }
  
  return {
    canHandleAudioProcessing,
    canHandleVideoProcessing,
    recommendedQuality,
    limitations
  }
}

/**
 * Get viewport information
 * @returns Viewport information object
 */
export function getViewportInfo(): {
  width: number
  height: number
  scrollX: number
  scrollY: number
  isPortrait: boolean
  isLandscape: boolean
  pixelRatio: number
} {
  const width = window.innerWidth
  const height = window.innerHeight
  const isPortrait = height > width
  const isLandscape = width > height
  
  return {
    width,
    height,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    isPortrait,
    isLandscape,
    pixelRatio: window.devicePixelRatio || 1
  }
}

/**
 * Check if device is in dark mode
 * @returns True if dark mode is preferred
 */
export function isDarkMode(): boolean {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Check if device prefers reduced motion
 * @returns True if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Add event listener for system preference changes
 * @param callback Callback function called when preferences change
 * @returns Cleanup function
 */
export function watchSystemPreferences(callback: (preferences: {
  darkMode: boolean
  reducedMotion: boolean
}) => void): () => void {
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  
  const updatePreferences = () => {
    callback({
      darkMode: darkModeQuery.matches,
      reducedMotion: reducedMotionQuery.matches
    })
  }
  
  darkModeQuery.addEventListener('change', updatePreferences)
  reducedMotionQuery.addEventListener('change', updatePreferences)
  
  // Initial call
  updatePreferences()
  
  return () => {
    darkModeQuery.removeEventListener('change', updatePreferences)
    reducedMotionQuery.removeEventListener('change', updatePreferences)
  }
}