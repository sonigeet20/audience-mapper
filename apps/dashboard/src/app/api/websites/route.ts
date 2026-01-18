import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org_id
  const { data: profile } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Fetch websites for this org
  const { data: websites, error } = await supabase
    .from('websites')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ websites })
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
  const { domain, name, data_collection_mode = 'both' } = body

  if (!domain || !name) {
    return NextResponse.json(
      { error: 'domain and name are required' },
      { status: 400 }
    )
  }

  // Generate tracking code
  const tracking_code = `trk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`

  const { data: website, error } = await supabase
    .from('websites')
    .insert({
      org_id: profile.org_id,
      domain,
      name,
      tracking_code,
      data_collection_mode,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ website }, { status: 201 })
}
