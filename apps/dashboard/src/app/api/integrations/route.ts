import { createClient } from '@/lib/supabase-server'
import { encryptCredentials } from '@tracking/shared/encryption'
import { logAPIError } from '@/lib/error-logger'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { platform_name, credentials, credential_type = 'oauth2' } = body

    if (!platform_name || !credentials) {
      return NextResponse.json(
        { error: 'platform_name and credentials are required' },
        { status: 400 }
      )
    }

    // Encrypt credentials
    const { encrypted, iv, authTag } = encryptCredentials(credentials)

    // Store credentials with IV combined (iv:authTag:encrypted)
    const credentialsEncrypted = `${iv}:${authTag}:${encrypted}`

    // Create integration record
    const { data: integration, error } = await supabase
      .from('integrations')
      .insert({
        org_id: profile.org_id,
        platform_name,
        credentials_encrypted: credentialsEncrypted,
        credentials_iv: iv,
        credential_type,
        is_active: false, // Will be activated after OAuth
        test_connection_status: 'pending'
      })
      .select()
      .single()

    if (error) {
      await logAPIError(new Error(error.message), {
        endpoint: '/api/integrations',
        method: 'POST',
        userId: user.id,
        orgId: profile.org_id
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Generate OAuth URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const oauthUrl = `${baseUrl}/api/integrations/${platform_name}/authorize?integration_id=${integration.id}`

    return NextResponse.json({ 
      integration,
      oauth_url: oauthUrl
    }, { status: 201 })
  } catch (error: any) {
    console.error('Integration creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Fetch integrations (without decrypted credentials)
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('id, platform_name, is_active, last_sync_at, test_connection_status, test_connection_error, created_at')
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ integrations })
  } catch (error: any) {
    console.error('Integration fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
