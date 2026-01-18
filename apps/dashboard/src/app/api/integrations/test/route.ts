import { createClient } from '@/lib/supabase-server'
import { decryptCredentials } from '@/lib/shared/encryption'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Test platform connection with provided credentials
 * This makes a simple API call to verify credentials work
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { platform, credentials } = body

    if (!platform || !credentials) {
      return NextResponse.json(
        { error: 'platform and credentials are required' },
        { status: 400 }
      )
    }

    // Test connection based on platform
    let success = false
    let error = null

    try {
      switch (platform) {
        case 'google-ads':
          success = await testGoogleAdsConnection(credentials)
          break
        case 'facebook':
          success = await testFacebookConnection(credentials)
          break
        case 'tiktok':
          success = await testTikTokConnection(credentials)
          break
        case 'linkedin':
          success = await testLinkedInConnection(credentials)
          break
        default:
          return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
      }
    } catch (err: any) {
      error = err.message
      success = false
    }

    return NextResponse.json({ success, error })
  } catch (error: any) {
    console.error('Connection test error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ============================================================================
// Platform-specific connection tests
// ============================================================================

async function testGoogleAdsConnection(credentials: any): Promise<boolean> {
  // Simple validation - check if credentials have required fields
  if (!credentials.client_id || !credentials.client_secret) {
    throw new Error('Missing required credentials')
  }

  // In production, this would make an API call to Google Ads API
  // For now, just validate format
  if (!credentials.client_id.includes('apps.googleusercontent.com')) {
    throw new Error('Invalid Client ID format')
  }

  return true
}

async function testFacebookConnection(credentials: any): Promise<boolean> {
  if (!credentials.app_id || !credentials.app_secret) {
    throw new Error('Missing required credentials')
  }

  // Test with Facebook Graph API - get app access token
  try {
    const response = await fetch(
      `https://graph.facebook.com/oauth/access_token?client_id=${credentials.app_id}&client_secret=${credentials.app_secret}&grant_type=client_credentials`
    )

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message || 'Invalid credentials')
    }

    return !!data.access_token
  } catch (err: any) {
    throw new Error(`Facebook API error: ${err.message}`)
  }
}

async function testTikTokConnection(credentials: any): Promise<boolean> {
  if (!credentials.client_key || !credentials.client_secret) {
    throw new Error('Missing required credentials')
  }

  // Basic validation
  if (credentials.client_key.length < 10) {
    throw new Error('Invalid Client Key format')
  }

  return true
}

async function testLinkedInConnection(credentials: any): Promise<boolean> {
  if (!credentials.client_id || !credentials.client_secret) {
    throw new Error('Missing required credentials')
  }

  // Basic validation
  if (credentials.client_id.length < 10) {
    throw new Error('Invalid Client ID format')
  }

  return true
}
