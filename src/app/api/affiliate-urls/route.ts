import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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

  // Fetch affiliate URLs for this org
  const { data: urls, error } = await supabase
    .from('affiliate_urls')
    .select(`
      *,
      websites!inner(name, domain)
    `)
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ urls })
}

export async function POST(request: NextRequest) {
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
  const {
    website_id,
    url,
    firing_delay_min_ms = 1000,
    firing_delay_max_ms = 3000,
    daily_limit = null,
    is_active = true,
  } = body

  if (!website_id || !url) {
    return NextResponse.json(
      { error: 'website_id and url are required' },
      { status: 400 }
    )
  }

  const { data: affiliateUrl, error } = await supabase
    .from('affiliate_urls')
    .insert({
      org_id: profile.org_id,
      website_id,
      url,
      firing_delay_min_ms,
      firing_delay_max_ms,
      daily_limit,
      is_active,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ affiliateUrl }, { status: 201 })
}
