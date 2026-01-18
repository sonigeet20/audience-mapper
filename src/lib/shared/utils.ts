/**
 * Shared utility functions
 */

/**
 * Delay execution for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i)
        await sleep(delay)
      }
    }
  }

  throw lastError!
}

/**
 * Batch array into chunks
 */
export function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = []
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize))
  }
  return batches
}

/**
 * Hash string to number (for deterministic sampling)
 */
export function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

/**
 * Check if value is within percentage
 */
export function isWithinPercentage(value: string | number, percentage: number): boolean {
  const hash = typeof value === 'string' ? hashString(value) : value
  return (hash % 100) < percentage
}
