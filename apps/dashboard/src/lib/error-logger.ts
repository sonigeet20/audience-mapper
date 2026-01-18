/**
 * Custom error logging system
 * Logs to both Supabase and CloudWatch
 */

import { createClient } from './supabase-server'

export type ErrorType = 'tracking_script' | 'api' | 'lambda' | 'edge_function' | 'integration' | 'database'
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface ErrorLogEntry {
  error_type: ErrorType
  severity: ErrorSeverity
  message: string
  stack_trace?: string
  context?: Record<string, any>
  source?: string
  user_id?: string
  website_id?: string
  org_id?: string
}

/**
 * Log error to Supabase
 */
export async function logError(entry: ErrorLogEntry): Promise<void> {
  try {
    const supabase = createClient()
    
    await supabase.from('error_logs').insert({
      org_id: entry.org_id,
      error_type: entry.error_type,
      severity: entry.severity,
      message: entry.message,
      stack_trace: entry.stack_trace,
      context: entry.context || {},
      source: entry.source,
      user_id: entry.user_id,
      website_id: entry.website_id
    })
    
    // Also log to console for CloudWatch
    const logLevel = entry.severity === 'critical' || entry.severity === 'error' ? 'error' : 'warn'
    console[logLevel]('[ERROR_LOG]', {
      type: entry.error_type,
      severity: entry.severity,
      message: entry.message,
      source: entry.source,
      context: entry.context
    })
  } catch (error) {
    // Fallback to console if logging fails
    console.error('[ERROR_LOGGER_FAILED]', error, entry)
  }
}

/**
 * Log API error
 */
export async function logAPIError(
  error: Error,
  context: {
    endpoint: string
    method: string
    userId?: string
    orgId?: string
  }
): Promise<void> {
  await logError({
    error_type: 'api',
    severity: 'error',
    message: error.message,
    stack_trace: error.stack,
    context: {
      endpoint: context.endpoint,
      method: context.method
    },
    source: `api:${context.endpoint}`,
    user_id: context.userId,
    org_id: context.orgId
  })
}

/**
 * Log integration error
 */
export async function logIntegrationError(
  platform: string,
  error: Error,
  context: {
    integrationId?: string
    orgId: string
    action: string
    [key: string]: any
  }
): Promise<void> {
  await logError({
    error_type: 'integration',
    severity: 'error',
    message: `${platform}: ${error.message}`,
    stack_trace: error.stack,
    context: {
      platform,
      integration_id: context.integrationId,
      ...context
    },
    source: `integration:${platform}`,
    org_id: context.orgId
  })
}

/**
 * Log tracking script error (sent from client)
 */
export async function logTrackingError(
  message: string,
  context: {
    websiteId: string
    orgId: string
    url?: string
    userAgent?: string
  }
): Promise<void> {
  await logError({
    error_type: 'tracking_script',
    severity: 'warning',
    message,
    context: {
      url: context.url,
      user_agent: context.userAgent
    },
    source: 'tracking_script',
    website_id: context.websiteId,
    org_id: context.orgId
  })
}

/**
 * Get recent errors for an organization
 */
export async function getRecentErrors(
  orgId: string,
  options: {
    limit?: number
    severity?: ErrorSeverity[]
    unresolved?: boolean
  } = {}
): Promise<any[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('error_logs')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(options.limit || 100)
  
  if (options.severity && options.severity.length > 0) {
    query = query.in('severity', options.severity)
  }
  
  if (options.unresolved) {
    query = query.eq('resolved', false)
  }
  
  const { data } = await query
  
  return data || []
}

/**
 * Mark error as resolved
 */
export async function resolveError(
  errorId: string,
  userId: string
): Promise<void> {
  const supabase = createClient()
  
  await supabase
    .from('error_logs')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: userId
    })
    .eq('id', errorId)
}

/**
 * Get error statistics
 */
export async function getErrorStats(
  orgId: string,
  hours: number = 24
): Promise<{
  total: number
  by_severity: Record<ErrorSeverity, number>
  by_type: Record<ErrorType, number>
  unresolved: number
}> {
  const supabase = createClient()
  
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  
  const { data } = await supabase
    .from('error_logs')
    .select('severity, error_type, resolved')
    .eq('org_id', orgId)
    .gte('created_at', since)
  
  const stats = {
    total: data?.length || 0,
    by_severity: {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0
    },
    by_type: {
      tracking_script: 0,
      api: 0,
      lambda: 0,
      edge_function: 0,
      integration: 0,
      database: 0
    },
    unresolved: 0
  }
  
  data?.forEach((error: any) => {
    stats.by_severity[error.severity as ErrorSeverity]++
    stats.by_type[error.error_type as ErrorType]++
    if (!error.resolved) {
      stats.unresolved++
    }
  })
  
  return stats
}
