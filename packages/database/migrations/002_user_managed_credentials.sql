-- Migration: User-Managed Platform Credentials
-- Date: 2026-01-18
-- Description: Add support for user-provided platform credentials with encryption

-- Add encrypted credentials columns to integrations table
ALTER TABLE integrations
ADD COLUMN IF NOT EXISTS credentials_encrypted TEXT,
ADD COLUMN IF NOT EXISTS credentials_iv TEXT,
ADD COLUMN IF NOT EXISTS credential_type TEXT CHECK (credential_type IN ('oauth2', 'api_key', 'bearer_token')),
ADD COLUMN IF NOT EXISTS test_connection_status TEXT CHECK (test_connection_status IN ('pending', 'success', 'failed')),
ADD COLUMN IF NOT EXISTS test_connection_error TEXT,
ADD COLUMN IF NOT EXISTS test_connection_at TIMESTAMPTZ;

-- Create error_logs table for custom error tracking
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL CHECK (error_type IN ('tracking_script', 'api', 'lambda', 'edge_function', 'integration', 'database')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB DEFAULT '{}',
  source TEXT, -- e.g., 'lambda:identity-resolution', 'api:/websites'
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  website_id UUID REFERENCES websites(id) ON DELETE SET NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on error_logs for efficient querying
CREATE INDEX IF NOT EXISTS idx_error_logs_org_created ON error_logs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity) WHERE severity IN ('error', 'critical');
CREATE INDEX IF NOT EXISTS idx_error_logs_unresolved ON error_logs(org_id, resolved) WHERE resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_error_logs_source ON error_logs(source);

-- Enable RLS on error_logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view errors from their org
CREATE POLICY "Users can view org errors"
  ON error_logs
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policy: Only org_admins can update errors (mark as resolved)
CREATE POLICY "Org admins can update errors"
  ON error_logs
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid() AND role IN ('org_admin', 'super_admin')
    )
  );

-- Create platform_sync_logs table for tracking integration syncs
CREATE TABLE IF NOT EXISTS platform_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES segments(id) ON DELETE SET NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('audience_create', 'audience_update', 'audience_delete', 'test_connection')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'success', 'failed', 'partial')),
  users_synced INTEGER DEFAULT 0,
  users_failed INTEGER DEFAULT 0,
  error_message TEXT,
  platform_audience_id TEXT, -- ID returned by platform (e.g., Google Ads customer list ID)
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}'
);

-- Indexes for platform_sync_logs
CREATE INDEX IF NOT EXISTS idx_platform_sync_logs_org ON platform_sync_logs(org_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_sync_logs_integration ON platform_sync_logs(integration_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_sync_logs_status ON platform_sync_logs(status) WHERE status IN ('in_progress', 'failed');

-- Enable RLS on platform_sync_logs
ALTER TABLE platform_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view sync logs from their org
CREATE POLICY "Users can view org sync logs"
  ON platform_sync_logs
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid()
    )
  );

-- Create cache_entries table for DynamoDB-like caching in PostgreSQL (fallback)
CREATE TABLE IF NOT EXISTS cache_entries (
  cache_key TEXT PRIMARY KEY,
  cache_value JSONB NOT NULL,
  ttl_seconds INTEGER NOT NULL DEFAULT 3600,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ GENERATED ALWAYS AS (created_at + (ttl_seconds || ' seconds')::INTERVAL) STORED
);

-- Index for cache expiration cleanup
CREATE INDEX IF NOT EXISTS idx_cache_entries_expires ON cache_entries(expires_at);

-- Function to auto-delete expired cache entries
CREATE OR REPLACE FUNCTION delete_expired_cache_entries()
RETURNS void AS $$
BEGIN
  DELETE FROM cache_entries WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining encryption
COMMENT ON COLUMN integrations.credentials_encrypted IS 'AES-256-GCM encrypted JSON containing platform credentials (client_id, client_secret, tokens, etc.)';
COMMENT ON COLUMN integrations.credentials_iv IS 'Initialization vector for AES-256-GCM encryption';
COMMENT ON TABLE error_logs IS 'Custom error tracking system - logs errors from all components (tracking script, API, Lambda, Edge Functions)';
COMMENT ON TABLE platform_sync_logs IS 'Audit trail of all platform synchronization attempts with success/failure metrics';
COMMENT ON TABLE cache_entries IS 'PostgreSQL fallback cache (primary cache is DynamoDB) - stores frequently accessed data with TTL';
