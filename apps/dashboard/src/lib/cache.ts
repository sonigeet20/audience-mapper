/**
 * Cache utility - supports DynamoDB (primary) and PostgreSQL fallback
 */

import { DynamoDBClient, GetItemCommand, PutItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { createClient } from './supabase-server'

const dynamoClient = process.env.AWS_ACCESS_KEY_ID 
  ? new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' })
  : null

const CACHE_TABLE = process.env.DYNAMODB_CACHE_TABLE || 'tracking-cache'
const USE_DYNAMODB = !!dynamoClient

interface CacheOptions {
  ttl?: number // Time to live in seconds
}

/**
 * Get value from cache
 */
export async function getCacheValue<T>(key: string): Promise<T | null> {
  try {
    if (USE_DYNAMODB) {
      return await getDynamoDBValue<T>(key)
    } else {
      return await getPostgresValue<T>(key)
    }
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

/**
 * Set value in cache
 */
export async function setCacheValue<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  try {
    const ttl = options.ttl || 3600 // Default 1 hour
    
    if (USE_DYNAMODB) {
      await setDynamoDBValue(key, value, ttl)
    } else {
      await setPostgresValue(key, value, ttl)
    }
  } catch (error) {
    console.error('Cache set error:', error)
    // Don't throw - cache failures shouldn't break the app
  }
}

/**
 * Delete value from cache
 */
export async function deleteCacheValue(key: string): Promise<void> {
  try {
    if (USE_DYNAMODB) {
      await deleteDynamoDBValue(key)
    } else {
      await deletePostgresValue(key)
    }
  } catch (error) {
    console.error('Cache delete error:', error)
  }
}

/**
 * Invalidate multiple cache keys by pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  // This is primarily handled by cache_invalidation_queue table
  // Lambda functions process the queue and invalidate cache entries
  const supabase = createClient()
  
  await supabase.from('cache_invalidation_queue').insert({
    cache_pattern: pattern,
    status: 'pending'
  })
}

// ============================================================================
// DynamoDB Implementation
// ============================================================================

async function getDynamoDBValue<T>(key: string): Promise<T | null> {
  if (!dynamoClient) return null
  
  const command = new GetItemCommand({
    TableName: CACHE_TABLE,
    Key: marshall({ cache_key: key })
  })
  
  const response = await dynamoClient.send(command)
  
  if (!response.Item) {
    return null
  }
  
  const item = unmarshall(response.Item)
  
  // Check if expired
  if (item.expires_at && item.expires_at < Date.now()) {
    await deleteDynamoDBValue(key)
    return null
  }
  
  return item.cache_value as T
}

async function setDynamoDBValue<T>(
  key: string,
  value: T,
  ttl: number
): Promise<void> {
  if (!dynamoClient) return
  
  const expiresAt = Date.now() + (ttl * 1000)
  
  const command = new PutItemCommand({
    TableName: CACHE_TABLE,
    Item: marshall({
      cache_key: key,
      cache_value: value,
      ttl_seconds: ttl,
      expires_at: expiresAt,
      created_at: Date.now()
    })
  })
  
  await dynamoClient.send(command)
}

async function deleteDynamoDBValue(key: string): Promise<void> {
  if (!dynamoClient) return
  
  const command = new DeleteItemCommand({
    TableName: CACHE_TABLE,
    Key: marshall({ cache_key: key })
  })
  
  await dynamoClient.send(command)
}

// ============================================================================
// PostgreSQL Fallback Implementation
// ============================================================================

async function getPostgresValue<T>(key: string): Promise<T | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('cache_entries')
    .select('cache_value, expires_at')
    .eq('cache_key', key)
    .single()
  
  if (error || !data) {
    return null
  }
  
  // Check if expired
  if (new Date(data.expires_at) < new Date()) {
    await deletePostgresValue(key)
    return null
  }
  
  return data.cache_value as T
}

async function setPostgresValue<T>(
  key: string,
  value: T,
  ttl: number
): Promise<void> {
  const supabase = createClient()
  
  await supabase.from('cache_entries').upsert({
    cache_key: key,
    cache_value: value,
    ttl_seconds: ttl
  })
}

async function deletePostgresValue(key: string): Promise<void> {
  const supabase = createClient()
  
  await supabase
    .from('cache_entries')
    .delete()
    .eq('cache_key', key)
}

// ============================================================================
// High-level cache functions for common use cases
// ============================================================================

export async function getUserPermissions(userId: string) {
  const cacheKey = `permissions:${userId}`
  
  let permissions = await getCacheValue<any>(cacheKey)
  
  if (!permissions) {
    const supabase = createClient()
    const { data } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', userId)
      .single()
    
    permissions = data
    
    if (permissions) {
      await setCacheValue(cacheKey, permissions, { ttl: 300 }) // 5 minutes
    }
  }
  
  return permissions
}

export async function getWebsiteConfig(websiteId: string) {
  const cacheKey = `website:${websiteId}`
  
  let config = await getCacheValue<any>(cacheKey)
  
  if (!config) {
    const supabase = createClient()
    const { data } = await supabase
      .from('websites')
      .select('*')
      .eq('id', websiteId)
      .single()
    
    config = data
    
    if (config) {
      await setCacheValue(cacheKey, config, { ttl: 3600 }) // 1 hour
    }
  }
  
  return config
}

export async function getSegmentResults(segmentId: string) {
  const cacheKey = `segment:${segmentId}`
  return await getCacheValue<any>(cacheKey)
}

export async function setSegmentResults(segmentId: string, results: any) {
  const cacheKey = `segment:${segmentId}`
  await setCacheValue(cacheKey, results, { ttl: 1800 }) // 30 minutes
}
