/**
 * Encryption utilities for user-managed credentials
 * Uses AES-256-GCM for encryption
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits
const AUTH_TAG_LENGTH = 16

/**
 * Derive encryption key from environment variable
 * In production, use AWS KMS or Secrets Manager
 */
export function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY not found in environment')
  }

  // Hash the key to ensure it's exactly 32 bytes
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(key).digest()
}

/**
 * Encrypt data using AES-256-GCM
 * Returns base64-encoded encrypted data and IV
 */
export function encrypt(plaintext: string): { encrypted: string; iv: string; authTag: string } {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  
  const cipher = createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  const authTag = cipher.getAuthTag()
  
  return {
    encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  }
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(encrypted: string, iv: string, authTag: string): string {
  const key = getEncryptionKey()
  const ivBuffer = Buffer.from(iv, 'base64')
  const authTagBuffer = Buffer.from(authTag, 'base64')
  
  const decipher = createDecipheriv(ALGORITHM, key, ivBuffer)
  decipher.setAuthTag(authTagBuffer)
  
  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Encrypt platform credentials object
 */
export interface PlatformCredentials {
  client_id?: string
  client_secret?: string
  api_key?: string
  developer_token?: string
  access_token?: string
  refresh_token?: string
  expires_at?: number
  [key: string]: any
}

export function encryptCredentials(credentials: PlatformCredentials): {
  encrypted: string
  iv: string
  authTag: string
} {
  const plaintext = JSON.stringify(credentials)
  return encrypt(plaintext)
}

/**
 * Decrypt platform credentials object
 */
export function decryptCredentials(
  encrypted: string,
  iv: string,
  authTag: string
): PlatformCredentials {
  const plaintext = decrypt(encrypted, iv, authTag)
  return JSON.parse(plaintext)
}

/**
 * Mask sensitive data for logging
 */
export function maskCredentials(credentials: PlatformCredentials): PlatformCredentials {
  const masked = { ...credentials }
  
  const sensitiveKeys = ['client_secret', 'api_key', 'access_token', 'refresh_token', 'developer_token']
  
  for (const key of sensitiveKeys) {
    if (masked[key]) {
      masked[key] = '••••••••'
    }
  }
  
  return masked
}
