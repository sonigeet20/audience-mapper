import { createClient } from '@/lib/supabase-server'
import { decryptCredentials } from '@/lib/shared/encryption'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const searchParams = request.nextUrl.searchParams
    const integrationId = searchParams.get('integration_id')

    if (!integrationId) {
      return NextResponse.json({ error: 'integration_id required' }, { status: 400 })
    }

    // Fetch integration with encrypted credentials
    const { data: integration, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .single()

    if (error || !integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    // Decrypt credentials
    const [iv, authTag, encrypted] = integration.credentials_encrypted.split(':')
    const credentials = decryptCredentials(encrypted, iv, authTag)

    // Generate OAuth authorization URL based on platform
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/${params.platform}/callback`
    let authUrl = ''

    switch (params.platform) {
      case 'google-ads':
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${credentials.client_id}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent('https://www.googleapis.com/auth/adwords')}&` +
          `state=${integrationId}&` +
          `access_type=offline&` +
          `prompt=consent`
        break

      case 'facebook':
        authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
          `client_id=${credentials.app_id}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `state=${integrationId}&` +
          `scope=${encodeURIComponent('ads_management,business_management')}`
        break

      case 'tiktok':
        authUrl = `https://business-api.tiktok.com/open_api/v1.3/oauth2/authorize?` +
          `client_key=${credentials.client_key}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `state=${integrationId}&` +
          `response_type=code`
        break

      case 'linkedin':
        authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
          `client_id=${credentials.client_id}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `state=${integrationId}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent('r_ads r_organization_social w_organization_social')}`
        break

      default:
        return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
    }

    // Redirect to platform OAuth page
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('OAuth authorization error:', error)
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }
}
