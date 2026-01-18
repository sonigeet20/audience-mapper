/**
 * Application constants
 */

export const CACHE_KEYS = {
  USER_PERMISSIONS: (userId: string) => `permissions:${userId}`,
  SEGMENT_RESULTS: (segmentId: string) => `segment:${segmentId}`,
  WEBSITE_CONFIG: (websiteId: string) => `website:${websiteId}`,
  USAGE_METRICS: (orgId: string) => `usage:${orgId}`,
} as const

export const CACHE_TTL = {
  PERMISSIONS: 5 * 60, // 5 minutes
  SEGMENTS: 30 * 60, // 30 minutes
  WEBSITE_CONFIG: 60 * 60, // 1 hour
  USAGE_METRICS: 60 * 60, // 1 hour
} as const

export const API_RATE_LIMITS = {
  GOOGLE_ADS: {
    requestsPerDay: 5000,
    requestsPerHour: 500,
  },
  FACEBOOK: {
    requestsPerDay: 4560, // 190/hour * 24
    requestsPerHour: 190,
  },
  TIKTOK: {
    requestsPerDay: 10000,
    requestsPerHour: 1000,
  },
} as const

export const EVENT_SAMPLING_DEFAULTS = {
  high: 100,
  medium: 80,
  low: 50,
} as const

export const INFRASTRUCTURE_VERSIONS = {
  CURRENT: 'v1.0.0',
  SUPPORTED: ['v1.0.0'],
} as const
