/**
 * Affiliate Tracker
 * Handles affiliate URL firing with optimized URL pattern matching
 */

import { TrackerConfig, AffiliateUrl, UrlPattern } from '../types';
import { ObfuscationEngine } from './obfuscation';
import { CookieAttribution } from './cookie-attribution';

export class AffiliateTracker {
  private config: TrackerConfig;
  private obfuscation: ObfuscationEngine;
  private cookieAttribution: CookieAttribution;
  private compiledPattern: RegExp | null = null;
  private urlToAffiliateMap = new Map<string, AffiliateUrl>();
  private cachedMatches = new Map<string, string[]>();

  constructor(
    config: TrackerConfig,
    obfuscation: ObfuscationEngine,
    cookieAttribution: CookieAttribution
  ) {
    this.config = config;
    this.obfuscation = obfuscation;
    this.cookieAttribution = cookieAttribution;
    this._compilePatterns();
  }

  /**
   * Compile all URL patterns into optimized single regex
   */
  private _compilePatterns() {
    const affiliateUrls = this.config.affiliateTracking.urls || [];
    if (affiliateUrls.length === 0) return;

    const patterns: string[] = [];
    
    for (const affiliateUrl of affiliateUrls) {
      if (!affiliateUrl.patterns || affiliateUrl.patterns.length === 0) continue;
      
      for (const pattern of affiliateUrl.patterns) {
        if (!pattern.enabled) continue;
        
        let regexPattern: string;
        
        switch (pattern.matchType) {
          case 'exact':
            regexPattern = `^${this._escapeRegex(pattern.pattern)}$`;
            break;
          case 'contains':
            regexPattern = this._escapeRegex(pattern.pattern);
            break;
          case 'regex':
            regexPattern = pattern.pattern;
            break;
          default:
            continue;
        }
        
        patterns.push(`(${regexPattern})`);
        this.urlToAffiliateMap.set(regexPattern, affiliateUrl);
      }
    }

    if (patterns.length > 0) {
      try {
        // Compile all patterns into single regex with OR operators
        this.compiledPattern = new RegExp(patterns.join('|'), 'i');
      } catch (e) {
        console.error('[Tracker] Failed to compile URL patterns:', e);
      }
    }
  }

  /**
   * Check current URL and fire matching affiliate URLs
   */
  public checkAndFire(currentUrl: string) {
    // Check sessionStorage cache first
    const cacheKey = this._getCacheKey(currentUrl);
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached) {
      const affiliateIds = JSON.parse(cached);
      this._fireAffiliateUrls(affiliateIds);
      return;
    }

    // Match URL against compiled pattern
    if (!this.compiledPattern) return;
    
    const matches = currentUrl.match(this.compiledPattern);
    if (!matches) {
      // Cache negative result
      sessionStorage.setItem(cacheKey, JSON.stringify([]));
      return;
    }

    // Find matching affiliate URLs
    const matchingAffiliateIds: string[] = [];
    const affiliateUrls = this.config.affiliateTracking.urls || [];
    
    for (const affiliateUrl of affiliateUrls) {
      for (const pattern of affiliateUrl.patterns) {
        if (!pattern.enabled) continue;
        
        const isMatch = this._testPattern(currentUrl, pattern);
        if (isMatch) {
          matchingAffiliateIds.push(affiliateUrl.id);
          break; // Only match once per affiliate URL
        }
      }
    }

    // Cache matches
    sessionStorage.setItem(cacheKey, JSON.stringify(matchingAffiliateIds));
    
    // Fire matching URLs
    if (matchingAffiliateIds.length > 0) {
      this._fireAffiliateUrls(matchingAffiliateIds);
    }
  }

  /**
   * Test individual pattern
   */
  private _testPattern(url: string, pattern: UrlPattern): boolean {
    switch (pattern.matchType) {
      case 'exact':
        return url === pattern.pattern;
      case 'contains':
        return url.includes(pattern.pattern);
      case 'regex':
        try {
          const regex = new RegExp(pattern.pattern, 'i');
          return regex.test(url);
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  /**
   * Fire affiliate URLs based on priority and daily limits
   */
  private _fireAffiliateUrls(affiliateIds: string[]) {
    const affiliateUrls = this.config.affiliateTracking.urls || [];
    const matching = affiliateUrls
      .filter(a => affiliateIds.includes(a.id))
      .sort((a, b) => b.priority - a.priority); // Sort by priority descending

    for (const affiliateUrl of matching) {
      // Check daily limit
      if (!this._checkDailyLimit(affiliateUrl.id, affiliateUrl.dailyLimit)) {
        continue;
      }

      // Fire URL with obfuscation
      this._fireUrl(affiliateUrl);
    }
  }

  /**
   * Check if daily limit is reached
   */
  private _checkDailyLimit(affiliateId: string, limit: number): boolean {
    const today = new Date().toISOString().split('T')[0];
    const key = `_aff_limit_${affiliateId}_${today}`;
    const countStr = localStorage.getItem(key);
    const count = countStr ? parseInt(countStr, 10) : 0;
    
    if (count >= limit) {
      return false;
    }
    
    localStorage.setItem(key, (count + 1).toString());
    return true;
  }

  /**
   * Fire affiliate URL with obfuscation
   */
  private _fireUrl(affiliateUrl: AffiliateUrl) {
    // Add random delay (1-8s with Gaussian distribution)
    const delay = this._getRandomDelay();
    
    setTimeout(() => {
      // Use obfuscation engine based on level
      const success = this.obfuscation.fireUrl(
        affiliateUrl.url,
        affiliateUrl.obfuscationLevel
      );

      if (success) {
        // Set attribution cookie
        this.cookieAttribution.setAffiliateAttribution(
          affiliateUrl.id,
          affiliateUrl.attributionWindowDays
        );

        // Track success
        this._trackFire(affiliateUrl.id, true);
      } else {
        // Track failure
        this._trackFire(affiliateUrl.id, false);
      }
    }, delay);
  }

  /**
   * Get random delay with Gaussian distribution (1-8s)
   */
  private _getRandomDelay(): number {
    // Box-Muller transform for Gaussian distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    // Map to 1-8s range with mean at 4.5s
    const delay = Math.max(1000, Math.min(8000, 4500 + gaussian * 1500));
    return delay;
  }

  /**
   * Track affiliate URL fire
   */
  private _trackFire(affiliateId: string, success: boolean) {
    // Send tracking event to backend
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        type: 'affiliate_fire',
        affiliate_url_id: affiliateId,
        success,
        timestamp: new Date().toISOString()
      });
      
      navigator.sendBeacon(
        `${this.config.endpoint}/affiliate`,
        new Blob([data], { type: 'application/json' })
      );
    }
  }

  /**
   * Get cache key for URL
   */
  private _getCacheKey(url: string): string {
    return `_aff_match_${this._hashCode(url)}`;
  }

  /**
   * Simple string hash
   */
  private _hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Escape regex special characters
   */
  private _escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
