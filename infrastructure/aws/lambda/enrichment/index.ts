/**
 * Event Enrichment Lambda
 * 
 * Enriches incoming events with:
 * - IP geolocation (ip-api.com)
 * - User agent parsing
 * - Device fingerprinting
 * 
 * Triggered by: SQS Event Queue
 */

import { SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const CACHE_TABLE = process.env.DYNAMODB_CACHE_TABLE || 'tracking-cache';

interface TrackingEvent {
  event_id: string;
  website_id: string;
  session_id: string;
  visitor_id: string;
  ip_address?: string;
  user_agent?: string;
  event_type: string;
  event_data: Record<string, any>;
  timestamp: string;
}

interface GeoLocationData {
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
}

interface UserAgentData {
  browser: string;
  browser_version: string;
  os: string;
  os_version: string;
  device_type: string;
  device_vendor: string;
}

export const handler = async (event: SQSEvent) => {
  console.log('Enrichment Lambda triggered with', event.Records.length, 'messages');

  for (const record of event.Records) {
    try {
      const trackingEvent: TrackingEvent = JSON.parse(record.body);
      
      // Enrich with geolocation
      let geoData: GeoLocationData | null = null;
      if (trackingEvent.ip_address) {
        geoData = await getIPGeolocation(trackingEvent.ip_address);
      }

      // Enrich with user agent parsing
      let uaData: UserAgentData | null = null;
      if (trackingEvent.user_agent) {
        uaData = parseUserAgent(trackingEvent.user_agent);
      }

      // TODO: Send enriched event to Supabase Edge Function
      const enrichedEvent = {
        ...trackingEvent,
        geo_data: geoData,
        ua_data: uaData,
        enriched_at: new Date().toISOString()
      };

      console.log('Enriched event:', enrichedEvent.event_id);
      
    } catch (error) {
      console.error('Error enriching event:', error);
      // Don't throw - allows batch to continue processing
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ processed: event.Records.length })
  };
};

/**
 * Get IP geolocation using ip-api.com (free, 45 requests/minute per IP)
 * Uses DynamoDB cache to avoid repeated lookups
 */
async function getIPGeolocation(ip: string): Promise<GeoLocationData | null> {
  // Check cache first
  const cacheKey = `geo:${ip}`;
  
  try {
    const cached = await docClient.send(new GetCommand({
      TableName: CACHE_TABLE,
      Key: { cache_key: cacheKey }
    }));

    if (cached.Item && cached.Item.ttl > Math.floor(Date.now() / 1000)) {
      return cached.Item.value as GeoLocationData;
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }

  // Fetch from ip-api.com
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=66846719`);
    
    if (!response.ok) {
      throw new Error(`IP API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'fail') {
      console.warn('IP geolocation failed:', data.message);
      return null;
    }

    const geoData: GeoLocationData = {
      country: data.country,
      countryCode: data.countryCode,
      region: data.region,
      regionName: data.regionName,
      city: data.city,
      zip: data.zip,
      lat: data.lat,
      lon: data.lon,
      timezone: data.timezone,
      isp: data.isp
    };

    // Cache for 24 hours
    try {
      await docClient.send(new PutCommand({
        TableName: CACHE_TABLE,
        Item: {
          cache_key: cacheKey,
          value: geoData,
          ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        }
      }));
    } catch (error) {
      console.error('Cache write error:', error);
    }

    return geoData;
  } catch (error) {
    console.error('IP geolocation error:', error);
    return null;
  }
}

/**
 * Parse user agent string
 * Simple implementation - in production use ua-parser-js library
 */
function parseUserAgent(userAgent: string): UserAgentData {
  // Basic detection patterns
  let browser = 'Unknown';
  let browser_version = '';
  let os = 'Unknown';
  let os_version = '';
  let device_type = 'desktop';
  let device_vendor = 'Unknown';

  // Browser detection
  if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
    browser_version = match ? match[1] : '';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
    browser_version = match ? match[1] : '';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
    const match = userAgent.match(/Version\/(\d+\.\d+)/);
    browser_version = match ? match[1] : '';
  } else if (userAgent.includes('Edge')) {
    browser = 'Edge';
    const match = userAgent.match(/Edge?\/(\d+\.\d+)/);
    browser_version = match ? match[1] : '';
  }

  // OS detection
  if (userAgent.includes('Windows')) {
    os = 'Windows';
    if (userAgent.includes('Windows NT 10.0')) os_version = '10';
    else if (userAgent.includes('Windows NT 6.3')) os_version = '8.1';
    else if (userAgent.includes('Windows NT 6.2')) os_version = '8';
  } else if (userAgent.includes('Mac OS X')) {
    os = 'macOS';
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
    os_version = match ? match[1].replace('_', '.') : '';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
    const match = userAgent.match(/Android (\d+\.\d+)/);
    os_version = match ? match[1] : '';
    device_type = 'mobile';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
    const match = userAgent.match(/OS (\d+_\d+)/);
    os_version = match ? match[1].replace('_', '.') : '';
    device_type = userAgent.includes('iPad') ? 'tablet' : 'mobile';
    device_vendor = 'Apple';
  }

  // Device type refinement
  if (userAgent.includes('Mobile') && device_type === 'desktop') {
    device_type = 'mobile';
  } else if (userAgent.includes('Tablet')) {
    device_type = 'tablet';
  }

  return {
    browser,
    browser_version,
    os,
    os_version,
    device_type,
    device_vendor
  };
}
