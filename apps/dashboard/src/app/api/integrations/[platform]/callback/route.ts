import { createClient } from '@/lib/supabase-server'
import { decryptCredentials, encryptCredentials } from '@tracking/shared'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // integration_id
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard/integrations?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=invalid_callback', request.url)
      )
    }

    const supabase = createClient()

    // Fetch integration
    const { data: integration, error: fetchError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', state)
      .single()

    if (fetchError || !integration) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=integration_not_found', request.url)
      )
    }

    // Decrypt existing credentials
    const [iv, authTag, encrypted] = integration.credentials_encrypted.split(':')
    const credentials = decryptCredentials(encrypted, iv, authTag)

    // Exchange authorization code for access token
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/${params.platform}/callback`
    let tokens: any = null

    try {
      switch (params.platform) {
        case 'google-ads':
          tokens = await exchangeGoogleAdsCode(code, credentials, redirectUri)
          break
        case 'facebook':
          tokens = await exchangeFacebookCode(code, credentials, redirectUri)
          break
        case 'tiktok':
          tokens = await exchangeTikTokCode(code, credentials, redirectUri)
          break
        case 'linkedin':
          tokens = await exchangeLinkedInCode(code, credentials, redirectUri)
          break
        default:
          throw new Error('Unsupported platform')
      }
    } catch (err: any) {
      console.error(`${params.platform} token exchange error:`, err)
      return NextResponse.redirect(
        new URL(`/dashboard/integrations?error=${encodeURIComponent(err.message)}`, request.url)
      )
    }

    // Update credentials with tokens
    const updatedCredentials = {
      ...credentials,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at
    }

    // Re-encrypt
    const { encrypted: newEncrypted, iv: newIv, authTag: newAuthTag } = encryptCredentials(updatedCredentials)
    const newCredentialsEncrypted = `${newIv}:${newAuthTag}:${newEncrypted}`

    // Update integration
    await supabase
      .from('integrations')
      .update({
        credentials_encrypted: newCredentialsEncrypted,
        credentials_iv: newIv,
        is_active: true,
        test_connection_status: 'success'
      })
      .eq('id', state)

    // Log successful connection
    await supabase.from('platform_sync_logs').insert({
      org_id: integration.org_id,
      integration_id: integration.id,
      sync_type: 'test_connection',
      status: 'success',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: 0
    })

    // Redirect to integrations page with success
    return NextResponse.redirect(
      new URL('/dashboard/integrations?success=connected', request.url)
    )
  } catch (error: any) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }
}

// ============================================================================
// Platform-specific token exchange
// ============================================================================

async function exchangeGoogleAdsCode(code: string, credentials: any, redirectUri: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  })

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error_description || data.error)
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in * 1000)
  }
}

async function exchangeFacebookCode(code: string, credentials: any, redirectUri: string) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `client_id=${credentials.app_id}&` +
    `client_secret=${credentials.app_secret}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `code=${code}`
  )

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message || data.error)
  }

  // Exchange short-lived token for long-lived token
  const longLivedResponse = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `grant_type=fb_exchange_token&` +
    `client_id=${credentials.app_id}&` +
    `client_secret=${credentials.app_secret}&` +
    `fb_exchange_token=${data.access_token}`
  )

  const longLivedData = await longLivedResponse.json()

  return {
    access_token: longLivedData.access_token,
    refresh_token: null, // Facebook doesn't provide refresh tokens for long-lived tokens
    expires_at: Date.now() + (longLivedData.expires_in * 1000)
  }
}

async function exchangeTikTokCode(code: string, credentials: any, redirectUri: string) {
  const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_key: credentials.client_key,
      client_secret: credentials.client_secret,
      auth_code: code,
      grant_type: 'authorization_code'
    })
  })

  const data = await response.json()

  if (data.code !== 0) {
    throw new Error(data.message || 'Token exchange failed')
  }

  return {
    access_token: data.data.access_token,
    refresh_token: null,
    expires_at: Date.now() + (data.data.access_token_expire_in * 1000)
  }
}

async function exchangeLinkedInCode(code: string, credentials: any, redirectUri: string) {
  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  })

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error_description || data.error)
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in * 1000)
  }
}
