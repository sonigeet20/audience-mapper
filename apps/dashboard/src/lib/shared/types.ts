/**
 * Shared types across packages
 */

export type DeploymentMode = 'shared' | 'isolated'
export type PlanType = 'legacy_free' | 'free' | 'pro' | 'enterprise'
export type UserRole = 'super_admin' | 'org_admin' | 'analyst' | 'developer' | 'viewer'
export type DataCollectionMode = 'client_only' | 'server_only' | 'both'
export type EventClassification = 'high' | 'medium' | 'low'
export type ObfuscationLevel = 'minimal' | 'moderate' | 'aggressive' | 'adaptive'
export type AttributionModel = 'last_click' | 'first_click' | 'multi_touch' | 'time_decay'
export type SyncFrequency = 'hourly' | '6h' | '12h' | 'daily'

export interface CacheConfig {
  ttl: number
  priority: 'critical' | 'standard' | 'low'
}

export interface RateLimitConfig {
  requestsPerHour: number
  requestsPerDay: number
}
