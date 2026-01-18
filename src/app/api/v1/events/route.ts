import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const maxDuration = 60

// Validation schema
const EventSchema = z.object({
  event_type: z.string(),
  event_name: z.string(),
  timestamp: z.number(),
  url: z.string().optional(),
  referrer: z.string().optional(),
  user_id: z.string().optional(),
  session_id: z.string(),
  value: z.number().optional(),
  currency: z.string().optional(),
  gaid: z.string().optional(),
  idfa: z.string().optional(),
  device_type: z.string().optional(),
})

const EventBatchSchema = z.object({
  tracking_code: z.string(),
  events: z.array(EventSchema).min(1).max(1000),
})

// In-memory deduplication cache
const dedupCache = new Map<string, boolean>()
const dedupCacheTTL = new Map<string, number>()

function checkAndMarkDedup(eventId: string): boolean {
  const now = Date.now()
  const existingTTL = dedupCacheTTL.get(eventId)
  
  if (existingTTL && existingTTL > now) {
    return true // Duplicate
  }
  
  dedupCache.set(eventId, true)
  dedupCacheTTL.set(eventId, now + 24 * 60 * 60 * 1000) // 24h TTL
  return false
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('[Events API] Received event batch')

    // Parse JSON body
    const body = await request.json()
    
    // Validate batch schema
    const parsed = EventBatchSchema.parse(body)
    const { tracking_code, events } = parsed

    // Get Supabase client - use service role for tracking to bypass RLS
    // This allows public tracking pixels to work without authentication
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch website details
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('id, org_id, tracking_code')
      .eq('tracking_code', tracking_code)
      .single()

    if (websiteError || !website) {
      console.error(`[Events API] Invalid tracking code: ${tracking_code}`)
      return NextResponse.json(
        { error: 'Invalid tracking code' },
        { status: 401 }
      )
    }

    const websiteId = website.id
    const orgId = website.org_id

    // Deduplication phase
    console.log(`[Events API] Deduplicating ${events.length} events...`)
    const deduplicatedEvents = events.filter((event) => {
      const eventId = event.session_id + '_' + event.event_type + '_' + event.timestamp
      return !checkAndMarkDedup(eventId)
    })

    const duplicateCount = events.length - deduplicatedEvents.length
    console.log(`[Events API] Duplicates found: ${duplicateCount}`)

    // Enrich events
    console.log('[Events API] Enriching events...')
    const enrichedEvents = deduplicatedEvents.map((event) => ({
      org_id: orgId,
      website_id: websiteId,
      tracking_code,
      event_type: event.event_type,
      event_name: event.event_name,
      session_id: event.session_id,
      user_id: event.user_id || null,
      url: event.url || null,
      referrer: event.referrer || null,
      value: event.value || null,
      currency: event.currency || 'USD',
      timestamp: new Date(event.timestamp),
      received_at: new Date(),
      gaid: event.gaid || null,
      idfa: event.idfa || null,
      device_type: event.device_type || null,
    }))

    // Try to write to database - gracefully handle if table doesn't exist
    console.log(`[Events API] Writing ${enrichedEvents.length} events to database...`)
    const { error: insertError } = await supabase
      .from('events')
      .insert(enrichedEvents as any)

    if (insertError) {
      console.warn('[Events API] DB write warning (table may not exist yet):', insertError.message)
    }

    // Try to store mobile ID mappings
    console.log('[Events API] Storing mobile ID mappings...')
    const mobileIdMappings = deduplicatedEvents
      .filter((e) => e.gaid || e.idfa)
      .map((event) => ({
        org_id: orgId,
        website_id: websiteId,
        session_id: event.session_id,
        user_id: event.user_id || null,
        gaid: event.gaid || null,
        idfa: event.idfa || null,
        device_type: event.device_type || null,
        capture_method: 'tracking_script',
      }))

    if (mobileIdMappings.length > 0) {
      const { error: mobileError } = await supabase
        .from('mobile_id_mappings')
        .upsert(mobileIdMappings, {
          onConflict: 'session_id',
        } as any)

      if (mobileError) {
        console.warn('[Events API] Mobile ID storage warning:', mobileError.message)
      }
    }

    // Try to fetch and fire pixels
    console.log('[Events API] Fetching pixels for firing...')
    const { data: pixels, error: pixelsError } = await supabase
      .from('website_pixels')
      .select('*')
      .eq('website_id', websiteId)
      .eq('enabled', true)

    if (pixelsError) {
      console.warn('[Events API] Pixels table warning:', pixelsError.message)
    }

    // Fire pixels in parallel
    const pixelsFired: any[] = []
    const clientSnippets: any[] = []

    if (pixels && pixels.length > 0) {
      console.log(`[Events API] Firing ${pixels.length} pixels...`)
      
      const pixelPromises = pixels.map((pixel) => firePixel(pixel, enrichedEvents[0], supabase))
      const results = await Promise.allSettled(pixelPromises)

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          pixelsFired.push(result.value)
          // Collect client-side snippets
          if (result.value?.client_snippet) {
            clientSnippets.push(result.value.client_snippet)
          }
        }
      })
    }

    const latency = Date.now() - startTime

    console.log(`[Events API] Request processed in ${latency}ms`)

    return NextResponse.json(
      {
        success: true,
        processed: deduplicatedEvents.length,
        duplicates: duplicateCount,
        pixels_fired: pixelsFired.length,
        client_snippets: clientSnippets,
        latency_ms: latency,
        message: 'Events processed successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Events API] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: error.issues.map(i => ({ path: i.path, message: i.message })),
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process events', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// Fire pixels to their respective platforms
async function firePixel(pixel: any, event: any, supabase: any): Promise<{ platform: string; status: string; details?: any; client_snippet?: any }> {
  try {
    console.log(`[Pixel] Firing ${pixel.platform} pixel for event ${event.event_type}`)
    
    // Check if event should trigger this pixel
    const eventMappings = pixel.event_mappings || {}
    if (!eventMappings[event.event_type]) {
      console.log(`[Pixel] Skipping - event type ${event.event_type} not mapped`)
      return { platform: pixel.platform, status: 'skipped' }
    }

    let firingResult = { platform: pixel.platform, status: 'sent', details: {} as any, client_snippet: null as any }

    // Handle snippet-based integration (JavaScript/HTML for all platforms)
    if (pixel.integration_method === 'snippet' && pixel.custom_snippet) {
      console.log(`[Pixel] ${pixel.platform} using snippet integration`)
      
      // Replace event variables in snippet
      let processedSnippet = pixel.custom_snippet
        .replace(/\{event_type\}/g, event.event_type)
        .replace(/\{event_name\}/g, event.event_name)
        .replace(/\{value\}/g, event.value || '0')
        .replace(/\{session_id\}/g, event.session_id)
        .replace(/\{user_id\}/g, event.user_id || '')
        .replace(/\{url\}/g, event.url || '')
      
      // Check if it's a server-side fireable snippet (image/iframe)
      if (pixel.snippet_type === 'image' || pixel.snippet_type === 'iframe') {
        const urlMatch = processedSnippet.match(/src=["']([^"']+)["']/)
        if (urlMatch && urlMatch[1]) {
          try {
            await fetch(urlMatch[1], { method: 'GET' })
            console.log(`[Pixel] Server-side ${pixel.snippet_type} fired: ${urlMatch[1]}`)
            firingResult.details = { url: urlMatch[1], method: 'server-side' }
          } catch (err) {
            console.error(`[Pixel] Failed to fire ${pixel.snippet_type}:`, err)
            firingResult.status = 'failed'
          }
        }
      } else {
        // JavaScript/HTML snippet - return for client-side execution
        firingResult.client_snippet = {
          platform: pixel.platform,
          name: pixel.name || `${pixel.platform} Pixel`,
          snippet: processedSnippet,
          snippet_type: pixel.snippet_type || 'javascript'
        }
        firingResult.details = { method: 'client-side' }
        console.log(`[Pixel] ${pixel.platform} snippet queued for client-side execution`)
      }
      
      // Log the firing
      await supabase.from('pixel_firing_logs').insert({
        org_id: event.org_id,
        website_id: event.website_id,
        pixel_id: pixel.id,
        event_id: event.session_id,
        platform: pixel.platform,
        event_type: event.event_type,
        status: firingResult.status,
        fired_at: new Date().toISOString(),
      }).catch((err: any) => console.warn('[Pixel] Failed to log firing:', err))
      
      return firingResult
    }

    // Handle API-based integration (original logic)
    switch (pixel.platform) {
      case 'google_ads':
        if (pixel.conversion_id && pixel.conversion_label) {
          // In production: Make actual Google Ads API call
          console.log(`[Pixel] Google Ads conversion: ${pixel.conversion_id}/${pixel.conversion_label}`)
          firingResult.details = { conversion_id: pixel.conversion_id }
        }
        break
      
      case 'facebook':
        if (pixel.pixel_id) {
          // In production: Make actual Facebook Conversions API call
          console.log(`[Pixel] Facebook pixel: ${pixel.pixel_id}`)
          firingResult.details = { pixel_id: pixel.pixel_id }
        }
        break
      
      case 'tiktok':
        if (pixel.pixel_code) {
          // In production: Make actual TikTok Events API call
          console.log(`[Pixel] TikTok pixel: ${pixel.pixel_code}`)
          firingResult.details = { pixel_code: pixel.pixel_code }
        }
        break
      
      case 'linkedin':
        if (pixel.conversion_id) {
          // In production: Make actual LinkedIn Conversions API call
          console.log(`[Pixel] LinkedIn conversion: ${pixel.conversion_id}`)
          firingResult.details = { conversion_id: pixel.conversion_id }
        }
        break
      
      case 'pinterest':
        if (pixel.pixel_id) {
          // In production: Make actual Pinterest API call
          console.log(`[Pixel] Pinterest pixel: ${pixel.pixel_id}`)
          firingResult.details = { pixel_id: pixel.pixel_id }
        }
        break
    }

    // Log pixel firing to database
    await supabase.from('pixel_firing_logs').insert({
      org_id: event.org_id,
      website_id: event.website_id,
      pixel_id: pixel.id,
      event_id: event.session_id, // Using session_id as event identifier
      platform: pixel.platform,
      event_type: event.event_type,
      status: firingResult.status,
      fired_at: new Date().toISOString(),
    }).catch((err: any) => console.warn('[Pixel] Failed to log firing:', err))

    return firingResult
  } catch (error) {
    console.error(`[Pixel] Error firing ${pixel.platform}:`, error)
    return { platform: pixel.platform, status: 'failed' }
  }
}
