/**
 * Async utility functions for the AI Audio Studio Pro application
 */

/**
 * Create a promise that resolves after a specified delay
 * @param ms Delay in milliseconds
 * @returns Promise that resolves after delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Create a timeout promise that rejects after specified time
 * @param ms Timeout in milliseconds
 * @param errorMessage Custom error message
 * @returns Promise that rejects after timeout
 */
export function timeout(ms: number, errorMessage: string = 'Operation timed out'): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), ms)
  })
}

/**
 * Add timeout to an existing promise
 * @param promise Original promise
 * @param ms Timeout in milliseconds
 * @param errorMessage Custom error message
 * @returns Promise with timeout
 */
export function withTimeout<T>(
  promise: Promise<T>, 
  ms: number, 
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([promise, timeout(ms, errorMessage)])
}

/**
 * Retry a function multiple times with exponential backoff
 * @param fn Function to retry
 * @param maxAttempts Maximum number of attempts
 * @param baseDelay Base delay in milliseconds
 * @param maxDelay Maximum delay in milliseconds
 * @returns Promise that resolves when function succeeds
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxAttempts) {
        throw lastError
      }
      
      const delayMs = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
      await delay(delayMs)
    }
  }
  
  throw lastError!
}

/**
 * Create a debounced function
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      fn(...args)
    }, delayMs)
  }
}

/**
 * Create a throttled function
 * @param fn Function to throttle
 * @param interval Interval in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  intervalMs: number
): (...args: Parameters<T>) => void {
  let lastExecution = 0
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    
    if (now - lastExecution >= intervalMs) {
      lastExecution = now
      fn(...args)
    }
  }
}

/**
 * Create a memoized function
 * @param fn Function to memoize
 * @param getKey Function to generate cache key from arguments
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>()
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)
    }
    
    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

/**
 * Run multiple promises concurrently with limited concurrency
 * @param tasks Array of promise-returning functions
 * @param concurrency Maximum number of concurrent promises
 * @returns Promise that resolves to array of results
 */
export async function limitConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number = 3
): Promise<T[]> {
  const results: T[] = []
  const executing: Promise<void>[] = []
  
  for (const [index, task] of tasks.entries()) {
    const promise = task().then(result => {
      results[index] = result
    })
    
    executing.push(promise)
    
    if (executing.length >= concurrency) {
      await Promise.race(executing)
      executing.splice(executing.findIndex(p => p === promise), 1)
    }
  }
  
  await Promise.all(executing)
  return results
}

/**
 * Create a cancellable promise
 * @param executor Promise executor function
 * @returns Object with promise and cancel function
 */
export function createCancellablePromise<T>(
  executor: (resolve: (value: T) => void, reject: (reason?: any) => void) => void
): {
  promise: Promise<T>
  cancel: (reason?: any) => void
} {
  let isCancelled = false
  let cancelCallback: ((reason?: any) => void) | null = null
  
  const promise = new Promise<T>((resolve, reject) => {
    executor(
      (value: T) => {
        if (!isCancelled) resolve(value)
      },
      (reason?: any) => {
        if (!isCancelled) reject(reason)
      }
    )
    
    cancelCallback = (reason?: any) => {
      if (!isCancelled) {
        isCancelled = true
        reject(reason || new Error('Promise was cancelled'))
      }
    }
  })
  
  return {
    promise,
    cancel: (reason?: any) => cancelCallback?.(reason)
  }
}

/**
 * Poll a function until it returns a truthy value or times out
 * @param fn Function to poll
 * @param interval Polling interval in milliseconds
 * @param timeout Timeout in milliseconds
 * @returns Promise that resolves to the truthy value
 */
export async function poll<T>(
  fn: () => Promise<T | null | undefined>,
  intervalMs: number = 1000,
  timeoutMs: number = 30000
): Promise<T> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeoutMs) {
    const result = await fn()
    if (result) return result
    
    await delay(intervalMs)
  }
  
  throw new Error('Polling timed out')
}

/**
 * Create a batch processor for processing items in batches
 * @param processor Function to process a batch
 * @param batchSize Size of each batch
 * @returns Batch processor function
 */
export function createBatchProcessor<T, R>(
  processor: (batch: T[]) => Promise<R[]>,
  batchSize: number
) {
  return async function processBatch(items: T[]): Promise<R[]> {
    const results: R[] = []
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const batchResults = await processor(batch)
      results.push(...batchResults)
    }
    
    return results
  }
}

/**
 * Create a queue for processing async tasks sequentially
 * @returns Queue object with add and process methods
 */
export function createAsyncQueue<T>() {
  const queue: Array<{
    task: () => Promise<T>
    resolve: (value: T) => void
    reject: (reason?: any) => void
  }> = []
  
  let processing = false
  
  const processNext = async () => {
    if (processing || queue.length === 0) return
    
    processing = true
    const { task, resolve, reject } = queue.shift()!
    
    try {
      const result = await task()
      resolve(result)
    } catch (error) {
      reject(error)
    } finally {
      processing = false
      // Process next item in queue
      if (queue.length > 0) {
        setTimeout(processNext, 0)
      }
    }
  }
  
  return {
    /**
     * Add a task to the queue
     * @param task Async task function
     * @returns Promise that resolves when task is processed
     */
    add(task: () => Promise<T>): Promise<T> {
      return new Promise((resolve, reject) => {
        queue.push({ task, resolve, reject })
        processNext()
      })
    },
    
    /**
     * Get current queue length
     * @returns Number of items in queue
     */
    get length(): number {
      return queue.length
    },
    
    /**
     * Clear all items from queue
     */
    clear(): void {
      queue.length = 0
    }
  }
}

/**
 * Create a rate limiter for API calls
 * @param maxCalls Maximum number of calls
 * @param timeWindow Time window in milliseconds
 * @returns Rate limiter object
 */
export function createRateLimiter(maxCalls: number, timeWindowMs: number) {
  const calls: number[] = []
  
  return {
    /**
     * Check if a call is allowed
     * @returns True if call is allowed
     */
    isAllowed(): boolean {
      const now = Date.now()
      const cutoff = now - timeWindowMs
      
      // Remove old calls
      while (calls.length > 0 && calls[0] < cutoff) {
        calls.shift()
      }
      
      return calls.length < maxCalls
    },
    
    /**
     * Wait until a call is allowed
     * @returns Promise that resolves when call is allowed
     */
    async waitForSlot(): Promise<void> {
      while (!this.isAllowed()) {
        const oldestCall = calls[0]
        const waitTime = oldestCall ? (oldestCall + timeWindowMs) - Date.now() : timeWindowMs
        if (waitTime > 0) {
          await delay(waitTime)
        }
      }
      calls.push(Date.now())
    },
    
    /**
     * Get current usage statistics
     * @returns Usage statistics
     */
    getStats(): { currentCalls: number; maxCalls: number; timeWindow: number } {
      const now = Date.now()
      const cutoff = now - timeWindowMs
      
      while (calls.length > 0 && calls[0] < cutoff) {
        calls.shift()
      }
      
      return {
        currentCalls: calls.length,
        maxCalls,
        timeWindow: timeWindowMs
      }
    }
  }
}