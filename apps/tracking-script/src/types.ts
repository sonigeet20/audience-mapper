export interface Config {
  trackingCode: string;
  orgId?: string;
  websiteId?: string;
  endpoint?: string;
  dataCollectionMode?: 'client_only' | 'server_only' | 'both';
  autoDetectEvents?: boolean;
  consentManagement?: {
    enabled: boolean;
    categories?: string[];
  };
  affiliateTracking?: {
    enabled: boolean;
    urls?: AffiliateUrl[];
  };
  sampling?: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface TrackerConfig extends Required<Config> {}

export interface AffiliateUrl {
  id: string;
  url: string;
  patterns: UrlPattern[];
  priority: number;
  dailyLimit: number;
  obfuscationLevel: 'minimal' | 'moderate' | 'aggressive' | 'adaptive';
  attributionWindowDays: number;
}

export interface UrlPattern {
  id: string;
  pattern: string;
  matchType: 'exact' | 'contains' | 'regex';
  enabled: boolean;
}

export interface Event {
  id: string;
  org_id: string;
  website_id: string;
  user_id: string | null;
  session_id: string;
  event_type: string;
  event_name: string;
  event_value?: number;
  classification?: 'high' | 'medium' | 'low';
  confidence_score?: number;
  auto_detected: boolean;
  sampled: boolean;
  sampling_rate?: number;
  affiliate_url_id?: string;
  page_url: string;
  referrer: string;
  user_agent: string;
  properties: Record<string, any>;
  timestamp: string;
}

export interface DetectionResult {
  event_name: string;
  classification: 'high' | 'medium' | 'low';
  confidence_score: number;
  element?: HTMLElement;
  properties: Record<string, any>;
}
