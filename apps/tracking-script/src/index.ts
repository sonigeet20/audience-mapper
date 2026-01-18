/**
 * Universal Tracking Script SDK
 * Lightweight (<20KB) tracking script with auto-event detection,
 * affiliate tracking, and optimized URL pattern matching
 */

import { EventDetector } from './modules/event-detector';
import { AffiliateTracker } from './modules/affiliate-tracker';
import { EventBatcher } from './modules/event-batcher';
import { SamplingEngine } from './modules/sampling-engine';
import { CookieAttribution } from './modules/cookie-attribution';
import { ObfuscationEngine } from './modules/obfuscation';
import { Config, TrackerConfig } from './types';

class UniversalTracker {
  private config: TrackerConfig;
  private eventDetector: EventDetector;
  private affiliateTracker: AffiliateTracker;
  private eventBatcher: EventBatcher;
  private samplingEngine: SamplingEngine;
  private cookieAttribution: CookieAttribution;
  private obfuscation: ObfuscationEngine;
  private sessionId: string;
  private userId: string | null = null;

  constructor(config: Config) {
    this.config = this._validateConfig(config);
    this.sessionId = this._generateSessionId();
    
    // Initialize modules
    this.eventBatcher = new EventBatcher(this.config);
    this.samplingEngine = new SamplingEngine(this.config);
    this.cookieAttribution = new CookieAttribution(this.config);
    this.obfuscation = new ObfuscationEngine(this.config);
    
    // Initialize event detection if enabled
    if (this.config.autoDetectEvents) {
      this.eventDetector = new EventDetector(this.config, this._handleEvent.bind(this));
    }
    
    // Initialize affiliate tracking if enabled
    if (this.config.affiliateTracking?.enabled) {
      this.affiliateTracker = new AffiliateTracker(
        this.config,
        this.obfuscation,
        this.cookieAttribution
      );
      this._initAffiliateTracking();
    }
    
    // Track initial page view
    this.trackEvent('pageview', {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer
    });
    
    // Set up beforeunload to flush pending events
    window.addEventListener('beforeunload', () => {
      this.eventBatcher.flush(true);
    });
  }

  /**
   * Track custom event
   */
  public trackEvent(eventName: string, properties: Record<string, any> = {}) {
    const event = {
      id: this._generateEventId(),
      org_id: this.config.orgId,
      website_id: this.config.websiteId,
      user_id: this.userId,
      session_id: this.sessionId,
      event_type: 'custom',
      event_name: eventName,
      event_value: properties.value,
      auto_detected: false,
      affiliate_url_id: this.cookieAttribution.getCurrentAffiliateId(),
      page_url: window.location.href,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      properties: properties,
      timestamp: new Date().toISOString()
    };

    // Apply sampling
    if (this.samplingEngine.shouldSample(event)) {
      this.eventBatcher.add(event);
    }
  }

  /**
   * Identify user
   */
  public identify(userId: string, traits: Record<string, any> = {}) {
    this.userId = userId;
    this.trackEvent('identify', {
      user_id: userId,
      ...traits
    });
  }

  /**
   * Set user properties
   */
  public setUserProperties(properties: Record<string, any>) {
    this.trackEvent('user_properties_updated', properties);
  }

  /**
   * Track conversion
   */
  public trackConversion(value: number, properties: Record<string, any> = {}) {
    this.trackEvent('conversion', {
      value,
      ...properties
    });
    
    // Retroactively send queued low-value events for complete journey
    this.samplingEngine.upgradeSession(this.sessionId);
  }

  /**
   * Handle auto-detected events
   */
  private _handleEvent(event: any) {
    const trackedEvent = {
      ...event,
      org_id: this.config.orgId,
      website_id: this.config.websiteId,
      user_id: this.userId,
      session_id: this.sessionId,
      affiliate_url_id: this.cookieAttribution.getCurrentAffiliateId(),
      timestamp: new Date().toISOString()
    };

    if (this.samplingEngine.shouldSample(trackedEvent)) {
      this.eventBatcher.add(trackedEvent);
    }
  }

  /**
   * Initialize affiliate tracking
   */
  private _initAffiliateTracking() {
    // Wait for page load to check URL patterns
    if (document.readyState === 'complete') {
      this.affiliateTracker.checkAndFire(window.location.href);
    } else {
      window.addEventListener('load', () => {
        this.affiliateTracker.checkAndFire(window.location.href);
      });
    }
  }

  /**
   * Validate configuration
   */
  private _validateConfig(config: Config): TrackerConfig {
    if (!config.trackingCode) {
      throw new Error('Tracking code is required');
    }

    return {
      trackingCode: config.trackingCode,
      orgId: config.orgId,
      websiteId: config.websiteId,
      endpoint: config.endpoint || 'https://api.yourtracking.com/v1/events',
      dataCollectionMode: config.dataCollectionMode || 'both',
      autoDetectEvents: config.autoDetectEvents !== false,
      consentManagement: config.consentManagement || { enabled: false },
      affiliateTracking: config.affiliateTracking || { enabled: false },
      sampling: config.sampling || {
        high: 100,
        medium: 80,
        low: 50
      }
    };
  }

  /**
   * Generate session ID
   */
  private _generateSessionId(): string {
    const stored = sessionStorage.getItem('_tracker_session');
    if (stored) return stored;
    
    const sessionId = this._generateId();
    sessionStorage.setItem('_tracker_session', sessionId);
    return sessionId;
  }

  /**
   * Generate event ID
   */
  private _generateEventId(): string {
    return this._generateId();
  }

  /**
   * Generate random ID
   */
  private _generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Auto-initialize if config is present
if (typeof window !== 'undefined') {
  (window as any).UniversalTracker = UniversalTracker;
  
  // Check for inline config
  const inlineConfig = (window as any).__TRACKER_CONFIG__;
  if (inlineConfig) {
    (window as any).tracker = new UniversalTracker(inlineConfig);
  }
}

export default UniversalTracker;
