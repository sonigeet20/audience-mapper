import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Affiliate Webhook Handler
 * Receives impression pixels and S2S postbacks from affiliate platforms
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const platform = url.searchParams.get('platform') || 'unknown'
    const token = url.searchParams.get('token')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify token (basic security)
    if (!token) {
      return new Response('Unauthorized', { status: 401 })
    }

    let eventData: any = {}

    // Parse based on platform
    if (req.method === 'GET') {
      // Impression pixel (GET request with query params)
      eventData = {
        event_type: 'impression',
        platform: platform,
        click_id: url.searchParams.get('click_id'),
        offer_id: url.searchParams.get('offer_id'),
        affiliate_id: url.searchParams.get('aff_id'),
        status: 'success'
      }
    } else if (req.method === 'POST') {
      // S2S postback (POST with conversion data)
      const body = await req.json()
      eventData = {
        event_type: body.event_type || 'conversion',
        platform: platform,
        click_id: body.click_id,
        offer_id: body.offer_id,
        affiliate_id: body.affiliate_id,
        payout: body.payout,
        conversion_type: body.conversion_type,
        status: 'success'
      }
    }

    // Find org_id and affiliate_url_id based on token
    // In production, token would map to specific affiliate URL
    const { data: affiliateUrl } = await supabaseClient
      .from('affiliate_urls')
      .select('id, org_id')
      .limit(1)
      .single()

    if (affiliateUrl) {
      eventData.org_id = affiliateUrl.org_id
      eventData.affiliate_url_id = affiliateUrl.id
    }

    // Store affiliate event
    const { error } = await supabaseClient
      .from('affiliate_events')
      .insert({
        ...eventData,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Insert error:', error)
      return new Response('Error', { status: 500 })
    }

    // For impression pixels, return 1x1 transparent GIF
    if (req.method === 'GET') {
      const gif = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), c => c.charCodeAt(0))
      return new Response(gif, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response('Error', { status: 500 })
  }
})
