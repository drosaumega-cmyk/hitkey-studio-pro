# Utility Functions Library

This directory contains comprehensive utility functions for the AI Audio Studio Pro application. All utilities are fully typed with TypeScript and designed for production use.

## Modules Overview

### 🎲 `random.ts`
Random data generation utilities with audio-specific functions.

**Key Functions:**
- `randomInt(min, max)` - Generate random integers
- `randomFloat(min, max, decimals)` - Generate random floats
- `randomPick(array)` - Pick random element from array
- `shuffleArray(array)` - Shuffle array in place
- `randomUUID()` - Generate UUID v4
- `randomAudioFileName()` - Generate realistic audio filenames
- `randomAudioDuration()` - Generate random audio durations
- `randomVoicePreset()` - Generate random voice presets

### 📝 `format.ts`
Data formatting utilities for consistent display formatting.

**Key Functions:**
- `formatDuration(seconds)` - Format duration to MM:SS or HH:MM:SS
- `formatFileSize(bytes)` - Format file size with units
- `formatRelativeTime(date)` - Format relative time (e.g., "2 hours ago")
- `formatPercentage(value, decimals)` - Format percentage
- `formatAudioQuality(score)` - Format audio quality with labels
- `formatProcessingTime(ms)` - Format processing time
- `formatFrequency(hz)` - Format frequency (Hz/kHz/MHz)
- `formatBitrate(kbps)` - Format bitrate (kbps/Mbps)

### ✅ `validation.ts`
Input validation utilities for forms and file uploads.

**Key Functions:**
- `isValidAudioFile(file)` - Validate audio file types
- `isValidVideoFile(file)` - Validate video file types
- `isValidImageFile(file)` - Validate image file types
- `isValidFileSize(file, maxSizeMB)` - Validate file size
- `isValidAudioDuration(duration)` - Validate audio duration
- `validatePromptText(text, min, max)` - Validate AI prompt text
- `validateVoiceSettings(settings)` - Validate voice transformation settings
- `validateVideoSettings(settings)` - Validate video generation settings
- `isValidEmail(email)` - Validate email format
- `isValidUrl(url)` - Validate URL format

### 🎵 `audio.ts`
Audio-specific utilities for file processing and analysis.

**Key Functions:**
- `getAudioDuration(file)` - Get audio file duration
- `createAudioUrl(file)` - Create audio object URL
- `revokeAudioUrl(url)` - Safely revoke audio URL
- `getAudioFormat(file)` - Get audio format from file
- `getAudioCodec(mimeType)` - Get codec information
- `calculateBitrate(fileSize, duration)` - Calculate bitrate
- `getAudioQualityCategory(kbps, format)` - Determine quality category
- `generateWaveform(duration, samples)` - Generate waveform data
- `calculateAudioHash(file)` - Calculate file hash for deduplication
- `areAudioFilesDuplicate(file1, file2)` - Check for duplicate files
- `getRecommendedAudioSettings(useCase)` - Get recommended settings
- `estimateProcessingTime(fileSize, duration, type)` - Estimate processing time
- `isWebAudioSupported()` - Check Web Audio API support
- `getSupportedAudioFormats()` - Get browser-supported formats

### 💾 `storage.ts`
Local storage and caching utilities with error handling.

**Key Functions:**
- `saveToLocalStorage(key, data)` - Save to localStorage
- `loadFromLocalStorage(key, defaultValue)` - Load from localStorage
- `removeFromLocalStorage(key)` - Remove from localStorage
- `createCacheManager(storage)` - Create cache with TTL support
- `createSettingsManager(key, defaults)` - Create persistent settings
- `getLocalStorageUsage()` - Get storage usage statistics
- `getStorageQuota()` - Get storage quota information
- `isStorageAvailable(type)` - Check storage availability

### ⚡ `async.ts`
Async utilities for promises, concurrency, and performance.

**Key Functions:**
- `delay(ms)` - Create delay promise
- `timeout(ms, message)` - Create timeout promise
- `withTimeout(promise, ms)` - Add timeout to promise
- `retry(fn, attempts, delay, maxDelay)` - Retry with exponential backoff
- `debounce(fn, delay)` - Create debounced function
- `throttle(fn, interval)` - Create throttled function
- `memoize(fn, getKey)` - Create memoized function
- `limitConcurrency(tasks, concurrency)` - Limit concurrent promises
- `createCancellablePromise(executor)` - Create cancellable promise
- `poll(fn, interval, timeout)` - Poll until condition met
- `createBatchProcessor(processor, batchSize)` - Create batch processor
- `createAsyncQueue()` - Create async task queue
- `createRateLimiter(calls, timeWindow)` - Create rate limiter

### 🖥️ `device.ts`
Device, browser, and capability detection utilities.

**Key Functions:**
- `getBrowserInfo()` - Get browser information
- `getOSInfo()` - Get operating system information
- `getDeviceInfo()` - Get device information
- `getNetworkInfo()` - Get network information
- `isFeatureSupported(feature)` - Check feature support
- `getSupportedAudioFormats()` - Get supported audio formats
- `getSupportedVideoFormats()` - Get supported video formats
- `getPerformanceAssessment()` - Assess device capabilities
- `getViewportInfo()` - Get viewport information
- `isDarkMode()` - Check dark mode preference
- `prefersReducedMotion()` - Check reduced motion preference
- `watchSystemPreferences(callback)` - Watch system preference changes

## Usage Examples

### Basic Random Generation
```typescript
import { randomInt, randomPick, randomAudioFileName } from './utils'

// Generate random number between 1 and 100
const randomNumber = randomInt(1, 100)

// Pick random element from array
const randomVoice = randomPick(['male', 'female', 'child'])

// Generate realistic audio filename
const filename = randomAudioFileName()
```

### File Validation
```typescript
import { isValidAudioFile, validateVoiceSettings } from './utils'

// Validate uploaded file
if (isValidAudioFile(file)) {
  console.log('Valid audio file')
}

// Validate voice settings
const validation = validateVoiceSettings({
  pitch: 2,
  speed: 1.5,
  tone: 'robotic'
})

if (validation.isValid) {
  // Process with valid settings
}
```

### Audio Processing
```typescript
import { getAudioDuration, calculateBitrate, getAudioFormat } from './utils'

// Get audio duration
const duration = await getAudioDuration(audioFile)

// Calculate bitrate
const bitrate = calculateBitrate(file.size, duration)

// Get format information
const format = getAudioFormat(audioFile)
```

### Storage Management
```typescript
import { createSettingsManager, createCacheManager } from './utils'

// Create settings manager
const settings = createSettingsManager('app-settings', {
  theme: 'dark',
  quality: 'high'
})

// Save settings
settings.set('theme', 'light')

// Create cache with TTL
const cache = createCacheManager()
cache.set('api-data', data, 300000) // 5 minutes TTL
```

### Async Operations
```typescript
import { retry, debounce, limitConcurrency } from './utils'

// Retry with exponential backoff
const result = await retry(apiCall, 3, 1000, 10000)

// Debounce search input
const debouncedSearch = debounce(performSearch, 300)

// Limit concurrent API calls
const results = await limitConcurrency(apiCalls, 3)
```

### Device Detection
```typescript
import { getBrowserInfo, isFeatureSupported, getPerformanceAssessment } from './utils'

// Get browser information
const browser = getBrowserInfo()

// Check feature support
if (isFeatureSupported('web-audio')) {
  // Use Web Audio API
}

// Assess device capabilities
const assessment = getPerformanceAssessment()
if (assessment.canHandleAudioProcessing) {
  // Enable advanced features
}
```

## Best Practices

1. **Type Safety**: All functions are fully typed with TypeScript
2. **Error Handling**: Storage and async functions include proper error handling
3. **Performance**: Memoization and caching utilities optimize performance
4. **Browser Compatibility**: Feature detection ensures cross-browser compatibility
5. **Memory Management**: Proper cleanup for object URLs and event listeners
6. **Validation**: Comprehensive input validation for security and reliability

## Integration with React

These utilities integrate seamlessly with React components:

```typescript
import React, { useEffect, useState } from 'react'
import { createSettingsManager, debounce, isDarkMode } from './utils'

function MyComponent() {
  const [theme, setTheme] = useState('light')
  const settings = createSettingsManager('my-component', { theme: 'light' })
  
  useEffect(() => {
    // Load saved settings
    setTheme(settings.get('theme'))
    
    // Watch system preferences
    const cleanup = watchSystemPreferences(({ darkMode }) => {
      if (darkMode) {
        setTheme('dark')
        settings.set('theme', 'dark')
      }
    })
    
    return cleanup
  }, [])
  
  const debouncedSave = debounce((newTheme: string) => {
    settings.set('theme', newTheme)
  }, 500)
  
  return (
    <div className={`theme-${theme}`}>
      {/* Component content */}
    </div>
  )
}
```

## Testing

All utilities are designed to be easily testable:

```typescript
import { randomInt, formatDuration } from './utils'

// Test random function
test('randomInt generates number in range', () => {
  const result = randomInt(1, 10)
  expect(result).toBeGreaterThanOrEqual(1)
  expect(result).toBeLessThanOrEqual(10)
})

// Test format function
test('formatDuration formats correctly', () => {
  expect(formatDuration(125)).toBe('2:05')
  expect(formatDuration(3665)).toBe('1:01:05')
})
```

This comprehensive utility library provides all the tools needed for building robust, performant audio processing applications.