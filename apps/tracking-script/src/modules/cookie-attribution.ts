/**
 * Cookie Attribution
 * Manages first-party cookie for affiliate attribution
 */

import { TrackerConfig } from '../types';

interface AttributionData {
  affiliate_url_id: string;
  timestamp: number;
  url_pattern_id?: string;
}

export class CookieAttribution {
  private config: TrackerConfig;
  private cookieName = '_aff_attr';
  private currentAffiliateId: string | null = null;

  constructor(config: TrackerConfig) {
    this.config = config;
    this._loadCurrentAttribution();
  }

  /**
   * Set affiliate attribution cookie
   */
  public setAffiliateAttribution(
    affiliateUrlId: string,
    expirationDays: number,
    urlPatternId?: string
  ) {
    const data: AttributionData = {
      affiliate_url_id: affiliateUrlId,
      timestamp: Date.now(),
      url_pattern_id: urlPatternId
    };

    // Set cookie with expiration
    const expires = new Date();
    expires.setDate(expires.getDate() + expirationDays);
    
    document.cookie = `${this.cookieName}=${encodeURIComponent(JSON.stringify(data))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    
    this.currentAffiliateId = affiliateUrlId;
  }

  /**
   * Get current affiliate ID from cookie
   */
  public getCurrentAffiliateId(): string | null {
    return this.currentAffiliateId;
  }

  /**
   * Get full attribution data
   */
  public getAttributionData(): AttributionData | null {
    const cookie = this._getCookie(this.cookieName);
    if (!cookie) return null;

    try {
      return JSON.parse(decodeURIComponent(cookie));
    } catch {
      return null;
    }
  }

  /**
   * Clear attribution cookie
   */
  public clearAttribution() {
    document.cookie = `${this.cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    this.currentAffiliateId = null;
  }

  /**
   * Load current attribution on init
   */
  private _loadCurrentAttribution() {
    const data = this.getAttributionData();
    if (data) {
      this.currentAffiliateId = data.affiliate_url_id;
    }
  }

  /**
   * Get cookie value by name
   */
  private _getCookie(name: string): string | null {
    const matches = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
    );
    return matches ? matches[1] : null;
  }
}
