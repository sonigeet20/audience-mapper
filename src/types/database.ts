export interface Organization {
  id: string
  name: string
  slug: string
  plan_type: 'legacy_free' | 'free' | 'pro' | 'enterprise'
  deployment_mode: 'shared' | 'isolated'
  identity_resolution_enabled: boolean
  data_region: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  org_id: string
  email: string
  role: 'super_admin' | 'org_admin' | 'analyst' | 'developer' | 'viewer'
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Website {
  id: string
  org_id: string
  name: string
  domain: string
  tracking_code: string
  data_collection_mode: 'client_only' | 'server_only' | 'both'
  consent_management_enabled: boolean
  created_at: string
  updated_at: string
}

export interface AffiliateUrl {
  id: string
  org_id: string
  website_id: string
  url: string
  daily_limit: number
  priority: number
  enabled: boolean
  obfuscation_level: 'minimal' | 'moderate' | 'aggressive' | 'adaptive'
  attribution_window_days: number
  created_at: string
  updated_at: string
  patterns?: UrlPattern[]
}

export interface UrlPattern {
  id: string
  affiliate_url_id: string
  url_pattern: string
  match_type: 'exact' | 'contains' | 'regex'
  enabled: boolean
  estimated_execution_time_ms: number | null
  created_at: string
}

export interface Event {
  id: string
  org_id: string
  website_id: string
  user_id: string | null
  session_id: string
  event_type: string
  event_name: string
  event_value: number | null
  classification: 'high' | 'medium' | 'low' | null
  confidence_score: number | null
  auto_detected: boolean
  sampled: boolean
  affiliate_url_id: string | null
  page_url: string
  created_at: string
}

export interface Segment {
  id: string
  org_id: string
  name: string
  description: string | null
  filters: any
  confidence_threshold: number
  size_estimate: number | null
  sync_frequency: 'hourly' | '6h' | '12h' | 'daily'
  created_at: string
  updated_at: string
}

export interface AffiliateCookieStat {
  affiliate_url_id: string
  url_pattern_id: string | null
  date: string
  cookies_attempted: number
  cookies_successful: number
  cookies_failed: number
  detection_blocked: number
}
