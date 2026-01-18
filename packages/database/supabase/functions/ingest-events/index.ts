import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Event Ingestion Edge Function
 * Receives batched events from tracking script
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { events, tracking_code } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify tracking code and get website/org info
    const { data: website, error: websiteError } = await supabaseClient
      .from('websites')
      .select('id, org_id, data_collection_mode')
      .eq('tracking_code', tracking_code)
      .single()

    if (websiteError || !website) {
      return new Response(
        JSON.stringify({ error: 'Invalid tracking code' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if server-side collection is enabled
    if (website.data_collection_mode === 'client_only') {
      return new Response(
        JSON.stringify({ message: 'Client-only mode, skipping server storage' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process and enrich events
    const enrichedEvents = events.map((event: any) => ({
      ...event,
      org_id: website.org_id,
      website_id: website.id,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
      created_at: new Date().toISOString()
    }))

    // Insert events in batch
    const { error: insertError } = await supabaseClient
      .from('events')
      .insert(enrichedEvents)

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to store events' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Queue events for async enrichment (IP geolocation, user-agent parsing)
    // This would be sent to SQS/Lambda in production
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        events_received: events.length,
        server_side_precedence: website.data_collection_mode === 'both' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
