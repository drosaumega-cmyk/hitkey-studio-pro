/**
 * Storage utility functions for the AI Audio Studio Pro application
 */

/**
 * Save data to localStorage with error handling
 * @param key Storage key
 * @param data Data to store (must be serializable)
 * @returns True if save was successful
 */
export function saveToLocalStorage<T>(key: string, data: T): boolean {
  try {
    const serializedData = JSON.stringify(data)
    localStorage.setItem(key, serializedData)
    return true
  } catch (error) {
    console.warn('Failed to save to localStorage:', error)
    return false
  }
}

/**
 * Load data from localStorage with error handling
 * @param key Storage key
 * @param defaultValue Default value if key doesn't exist
 * @returns Loaded data or default value
 */
export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const serializedData = localStorage.getItem(key)
    if (serializedData === null) return defaultValue
    return JSON.parse(serializedData) as T
  } catch (error) {
    console.warn('Failed to load from localStorage:', error)
    return defaultValue
  }
}

/**
 * Remove data from localStorage
 * @param key Storage key to remove
 * @returns True if removal was successful
 */
export function removeFromLocalStorage(key: string): boolean {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error)
    return false
  }
}

/**
 * Clear all localStorage data
 * @returns True if clear was successful
 */
export function clearLocalStorage(): boolean {
  try {
    localStorage.clear()
    return true
  } catch (error) {
    console.warn('Failed to clear localStorage:', error)
    return false
  }
}

/**
 * Get all localStorage keys
 * @returns Array of storage keys
 */
export function getLocalStorageKeys(): string[] {
  try {
    return Object.keys(localStorage)
  } catch (error) {
    console.warn('Failed to get localStorage keys:', error)
    return []
  }
}

/**
 * Get localStorage usage information
 * @returns Storage usage information
 */
export function getLocalStorageUsage(): {
  used: number
  total: number
  percentage: number
  available: number
} {
  try {
    let used = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length
      }
    }
    
    // Most browsers have 5-10MB limit
    const total = 5 * 1024 * 1024 // 5MB
    const percentage = (used / total) * 100
    const available = total - used
    
    return { used, total, percentage, available }
  } catch (error) {
    console.warn('Failed to calculate localStorage usage:', error)
    return { used: 0, total: 0, percentage: 0, available: 0 }
  }
}

/**
 * Save data to sessionStorage with error handling
 * @param key Storage key
 * @param data Data to store (must be serializable)
 * @returns True if save was successful
 */
export function saveToSessionStorage<T>(key: string, data: T): boolean {
  try {
    const serializedData = JSON.stringify(data)
    sessionStorage.setItem(key, serializedData)
    return true
  } catch (error) {
    console.warn('Failed to save to sessionStorage:', error)
    return false
  }
}

/**
 * Load data from sessionStorage with error handling
 * @param key Storage key
 * @param defaultValue Default value if key doesn't exist
 * @returns Loaded data or default value
 */
export function loadFromSessionStorage<T>(key: string, defaultValue: T): T {
  try {
    const serializedData = sessionStorage.getItem(key)
    if (serializedData === null) return defaultValue
    return JSON.parse(serializedData) as T
  } catch (error) {
    console.warn('Failed to load from sessionStorage:', error)
    return defaultValue
  }
}

/**
 * Create a cache manager with TTL support
 * @param storage Storage object (localStorage or sessionStorage)
 * @returns Cache manager object
 */
export function createCacheManager(storage: Storage = localStorage) {
  const cache = new Map<string, { data: any; expiry: number }>()
  
  return {
    /**
     * Set cache item with TTL
     * @param key Cache key
     * @param data Data to cache
     * @param ttl Time to live in milliseconds
     */
    set<T>(key: string, data: T, ttl: number): void {
      const expiry = Date.now() + ttl
      cache.set(key, { data, expiry })
      
      try {
        storage.setItem(`cache_${key}`, JSON.stringify({ data, expiry }))
      } catch (error) {
        console.warn('Failed to save cache to storage:', error)
      }
    },
    
    /**
     * Get cache item
     * @param key Cache key
     * @returns Cached data or undefined
     */
    get<T>(key: string): T | undefined {
      // Check memory cache first
      const memoryItem = cache.get(key)
      if (memoryItem && memoryItem.expiry > Date.now()) {
        return memoryItem.data
      }
      
      // Check storage cache
      try {
        const serializedItem = storage.getItem(`cache_${key}`)
        if (serializedItem) {
          const parsedItem = JSON.parse(serializedItem)
          if (parsedItem.expiry > Date.now()) {
            cache.set(key, parsedItem)
            return parsedItem.data
          } else {
            storage.removeItem(`cache_${key}`)
          }
        }
      } catch (error) {
        console.warn('Failed to load cache from storage:', error)
      }
      
      return undefined
    },
    
    /**
     * Remove cache item
     * @param key Cache key
     */
    remove(key: string): void {
      cache.delete(key)
      try {
        storage.removeItem(`cache_${key}`)
      } catch (error) {
        console.warn('Failed to remove cache from storage:', error)
      }
    },
    
    /**
     * Clear all expired cache items
     */
    clearExpired(): void {
      const now = Date.now()
      
      // Clear memory cache
      for (const [key, item] of cache.entries()) {
        if (item.expiry <= now) {
          cache.delete(key)
        }
      }
      
      // Clear storage cache
      try {
        for (let i = 0; i < storage.length; i++) {
          const storageKey = storage.key(i)
          if (storageKey?.startsWith('cache_')) {
            const serializedItem = storage.getItem(storageKey)
            if (serializedItem) {
              const parsedItem = JSON.parse(serializedItem)
              if (parsedItem.expiry <= now) {
                storage.removeItem(storageKey)
              }
            }
          }
        }
      } catch (error) {
        console.warn('Failed to clear expired cache from storage:', error)
      }
    },
    
    /**
     * Clear all cache items
     */
    clear(): void {
      cache.clear()
      try {
        const keysToRemove: string[] = []
        for (let i = 0; i < storage.length; i++) {
          const storageKey = storage.key(i)
          if (storageKey?.startsWith('cache_')) {
            keysToRemove.push(storageKey)
          }
        }
        keysToRemove.forEach(key => storage.removeItem(key))
      } catch (error) {
        console.warn('Failed to clear cache from storage:', error)
      }
    }
  }
}

/**
 * Create a persistent settings manager
 * @param key Settings storage key
 * @param defaultSettings Default settings object
 * @returns Settings manager object
 */
export function createSettingsManager<T extends Record<string, any>>(
  key: string, 
  defaultSettings: T
) {
  let settings = loadFromLocalStorage(key, defaultSettings)
  
  return {
    /**
     * Get a setting value
     * @param settingKey Setting key
     * @returns Setting value
     */
    get<K extends keyof T>(settingKey: K): T[K] {
      return settings[settingKey]
    },
    
    /**
     * Set a setting value
     * @param settingKey Setting key
     * @param value Setting value
     */
    set<K extends keyof T>(settingKey: K, value: T[K]): void {
      settings[settingKey] = value
      saveToLocalStorage(key, settings)
    },
    
    /**
     * Get all settings
     * @returns All settings object
     */
    getAll(): T {
      return { ...settings }
    },
    
    /**
     * Update multiple settings
     * @param updates Settings updates
     */
    update(updates: Partial<T>): void {
      settings = { ...settings, ...updates }
      saveToLocalStorage(key, settings)
    },
    
    /**
     * Reset settings to defaults
     */
    reset(): void {
      settings = { ...defaultSettings }
      saveToLocalStorage(key, settings)
    },
    
    /**
     * Export settings as JSON
     * @returns JSON string of settings
     */
    export(): string {
      return JSON.stringify(settings, null, 2)
    },
    
    /**
     * Import settings from JSON
     * @param jsonSettings JSON string of settings
     * @returns True if import was successful
     */
    import(jsonSettings: string): boolean {
      try {
        const imported = JSON.parse(jsonSettings)
        settings = { ...defaultSettings, ...imported }
        saveToLocalStorage(key, settings)
        return true
      } catch (error) {
        console.warn('Failed to import settings:', error)
        return false
      }
    }
  }
}

/**
 * Check if storage is available
 * @param type Storage type ('localStorage' or 'sessionStorage')
 * @returns True if storage is available
 */
export function isStorageAvailable(type: 'localStorage' | 'sessionStorage' = 'localStorage'): boolean {
  try {
    const storage = window[type]
    const testKey = '__storage_test__'
    storage.setItem(testKey, 'test')
    storage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Get storage quota information (for browsers that support it)
 * @returns Promise that resolves to quota information
 */
export async function getStorageQuota(): Promise<{
  quota: number
  usage: number
  available: number
  percentage: number
}> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      const quota = estimate.quota || 0
      const usage = estimate.usage || 0
      const available = quota - usage
      const percentage = quota > 0 ? (usage / quota) * 100 : 0
      
      return { quota, usage, available, percentage }
    }
  } catch (error) {
    console.warn('Failed to get storage quota:', error)
  }
  
  // Fallback values
  return { quota: 0, usage: 0, available: 0, percentage: 0 }
}