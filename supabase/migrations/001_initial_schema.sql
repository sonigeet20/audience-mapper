-- Universal Tracking Platform Database Schema
-- Version: 1.0.0
-- Description: Multi-tenant SaaS tracking system with comprehensive RBAC and affiliate attribution

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
-- TimescaleDB extension (optional - if not available, events table will use regular partitioning)
-- CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- =============================================
-- ORGANIZATIONS & USERS
-- =============================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('legacy_free', 'free', 'pro', 'enterprise')),
  deployment_mode TEXT NOT NULL DEFAULT 'shared' CHECK (deployment_mode IN ('shared', 'isolated')),
  identity_resolution_enabled BOOLEAN DEFAULT true,
  data_region TEXT DEFAULT 'us-east-1',
  billing_status TEXT DEFAULT 'active',
  grandfathered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'org_admin', 'analyst', 'developer', 'viewer')),
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('website', 'segment', 'integration', 'affiliate_url')),
  resource_id UUID NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_manage_users BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_type, resource_id)
);

-- =============================================
-- WEBSITES & TRACKING
-- =============================================

CREATE TABLE websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  tracking_code TEXT UNIQUE NOT NULL,
  data_collection_mode TEXT DEFAULT 'both' CHECK (data_collection_mode IN ('client_only', 'server_only', 'both')),
  consent_management_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  user_id TEXT,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_value NUMERIC,
  classification TEXT CHECK (classification IN ('high', 'medium', 'low')),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  auto_detected BOOLEAN DEFAULT false,
  sampled BOOLEAN DEFAULT true,
  sampling_rate NUMERIC,
  affiliate_url_id UUID,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  properties JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert events table to TimescaleDB hypertable for time-series optimization
-- Commented out as TimescaleDB may not be available - use regular table with partitioning instead
-- SELECT create_hypertable('events', 'created_at', if_not_exists => TRUE);

-- Create indexes for events
CREATE INDEX idx_events_org_id ON events(org_id);
CREATE INDEX idx_events_website_id ON events(website_id);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_session_id ON events(session_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_affiliate_url_id ON events(affiliate_url_id) WHERE affiliate_url_id IS NOT NULL;

-- =============================================
-- AFFILIATE TRACKING
-- =============================================

CREATE TABLE affiliate_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  daily_limit INTEGER DEFAULT 1000,
  priority INTEGER DEFAULT 1,
  enabled BOOLEAN DEFAULT true,
  obfuscation_level TEXT DEFAULT 'moderate' CHECK (obfuscation_level IN ('minimal', 'moderate', 'aggressive', 'adaptive')),
  attribution_window_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE affiliate_url_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_url_id UUID NOT NULL REFERENCES affiliate_urls(id) ON DELETE CASCADE,
  url_pattern TEXT NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('exact', 'contains', 'regex')),
  enabled BOOLEAN DEFAULT true,
  estimated_execution_time_ms NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE affiliate_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  affiliate_url_id UUID NOT NULL REFERENCES affiliate_urls(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click', 'conversion')),
  platform TEXT,
  click_id TEXT,
  offer_id TEXT,
  affiliate_id TEXT,
  payout NUMERIC,
  conversion_type TEXT,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE affiliate_cookie_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  affiliate_url_id UUID NOT NULL REFERENCES affiliate_urls(id) ON DELETE CASCADE,
  url_pattern_id UUID REFERENCES affiliate_url_patterns(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  cookies_attempted INTEGER DEFAULT 0,
  cookies_successful INTEGER DEFAULT 0,
  cookies_failed INTEGER DEFAULT 0,
  detection_blocked INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(affiliate_url_id, url_pattern_id, date)
);

CREATE TABLE affiliate_cookie_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  session_id TEXT,
  identity_cluster_id UUID,
  affiliate_url_id UUID NOT NULL REFERENCES affiliate_urls(id) ON DELETE CASCADE,
  url_pattern_id UUID REFERENCES affiliate_url_patterns(id) ON DELETE SET NULL,
  cookie_set_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL,
  conversion_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  conversion_value NUMERIC,
  attribution_model TEXT CHECK (attribution_model IN ('last_click', 'first_click', 'multi_touch', 'time_decay')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_affiliate_cookie_attributions_user_id ON affiliate_cookie_attributions(user_id);
CREATE INDEX idx_affiliate_cookie_attributions_affiliate_url_id ON affiliate_cookie_attributions(affiliate_url_id);
CREATE INDEX idx_affiliate_cookie_attributions_converted_at ON affiliate_cookie_attributions(converted_at) WHERE converted_at IS NOT NULL;

-- =============================================
-- IDENTITY RESOLUTION
-- =============================================

CREATE TABLE identity_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  user_identifiers JSONB NOT NULL,
  device_fingerprints JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_identity_clusters_org_id ON identity_clusters(org_id);

-- =============================================
-- EVENT OVERRIDES
-- =============================================

CREATE TABLE event_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  original_classification TEXT,
  new_classification TEXT NOT NULL,
  rule_type TEXT CHECK (rule_type IN ('reclassify', 'ignore', 'custom')),
  css_selector TEXT,
  url_pattern TEXT,
  created_by UUID REFERENCES users(id),
  modified_by UUID REFERENCES users(id),
  modified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, website_id, event_name)
);

CREATE TABLE event_override_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_override_id UUID NOT NULL REFERENCES event_overrides(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  total_events INTEGER,
  processed_events INTEGER DEFAULT 0,
  progress_percentage NUMERIC DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SEGMENTS
-- =============================================

CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL,
  confidence_threshold INTEGER DEFAULT 70,
  size_estimate INTEGER,
  last_calculated_at TIMESTAMPTZ,
  sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', '6h', '12h', 'daily')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PLATFORM INTEGRATIONS
-- =============================================

CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('google_ads', 'facebook', 'tiktok', 'linkedin', 'liveramp', 'trade_desk')),
  oauth_tokens JSONB,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, platform)
);

-- =============================================
-- CACHE INVALIDATION
-- =============================================

CREATE TABLE cache_invalidation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,
  priority TEXT DEFAULT 'standard' CHECK (priority IN ('critical', 'standard', 'low')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_cache_invalidation_queue_status ON cache_invalidation_queue(status, priority, created_at);

-- =============================================
-- DETECTION METRICS
-- =============================================

CREATE TABLE detection_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  detection_type TEXT CHECK (detection_type IN ('ad_blocker', 'script_blocked', 'evasion_success', 'evasion_failed')),
  browser TEXT,
  ad_blocker TEXT,
  obfuscation_technique TEXT,
  success BOOLEAN,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_detection_metrics_created_at ON detection_metrics(created_at DESC);

-- =============================================
-- INFRASTRUCTURE & MIGRATIONS
-- =============================================

CREATE TABLE infrastructure_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  deployment_mode TEXT NOT NULL CHECK (deployment_mode IN ('shared', 'isolated')),
  infrastructure_version TEXT NOT NULL,
  supabase_project_id TEXT,
  aws_account_id TEXT,
  redis_instance_id TEXT,
  region TEXT DEFAULT 'us-east-1',
  status TEXT DEFAULT 'active' CHECK (status IN ('provisioning', 'active', 'failed', 'deprecated')),
  deployed_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE migration_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  from_plan TEXT NOT NULL,
  to_plan TEXT NOT NULL,
  from_deployment_mode TEXT NOT NULL,
  to_deployment_mode TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'provisioning', 'exporting', 'importing', 'validating', 'cutover', 'completed', 'failed')),
  progress_percentage NUMERIC DEFAULT 0,
  total_events INTEGER,
  processed_events INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AUDIT LOGS
-- =============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  changes_json JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition audit_logs by month for performance
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id, created_at DESC);

-- =============================================
-- WHITE LABEL SETTINGS
-- =============================================

CREATE TABLE white_label_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  custom_domain TEXT UNIQUE,
  domain_verification_token TEXT,
  domain_verified BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BILLING METADATA
-- =============================================

CREATE TABLE billing_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  usage_limits JSONB,
  current_usage JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_url_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_cookie_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_cookie_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Super Admin policy (can access all orgs)
CREATE POLICY "Super admins can access all organizations" ON organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- Org-level policy (users can only access their org)
CREATE POLICY "Users can access their own organization" ON organizations
  FOR ALL USING (
    id IN (
      SELECT org_id FROM users WHERE users.id = auth.uid()
    )
  );

-- Generic org-level RLS for most tables
CREATE POLICY "Users can access org data" ON events
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users can access org websites" ON websites
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid())
  );

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON websites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INITIAL DATA
-- =============================================

-- Create super admin organization (for internal use)
INSERT INTO organizations (id, name, slug, plan_type, deployment_mode)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Super Admin',
  'super-admin',
  'enterprise',
  'shared'
);
