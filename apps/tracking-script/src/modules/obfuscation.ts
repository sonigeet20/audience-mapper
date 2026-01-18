/**
 * Obfuscation Engine
 * Handles affiliate URL firing with various obfuscation levels
 */

import { TrackerConfig } from '../types';

export class ObfuscationEngine {
  private config: TrackerConfig;
  private detectionChecks = {
    adBlockerDetected: false,
    devToolsOpen: false
  };

  constructor(config: TrackerConfig) {
    this.config = config;
    this._runDetectionChecks();
  }

  /**
   * Fire URL with specified obfuscation level
   */
  public fireUrl(
    url: string,
    level: 'minimal' | 'moderate' | 'aggressive' | 'adaptive'
  ): boolean {
    // Check if we should fire (detection checks)
    if (this.detectionChecks.devToolsOpen && level !== 'minimal') {
      return false; // Don't fire if devtools open
    }

    // Select method based on obfuscation level
    switch (level) {
      case 'minimal':
        return this._fireMinimal(url);
      case 'moderate':
        return this._fireModerate(url);
      case 'aggressive':
        return this._fireAggressive(url);
      case 'adaptive':
        return this._fireAdaptive(url);
      default:
        return this._fireMinimal(url);
    }
  }

  /**
   * Minimal obfuscation - simple invisible image
   */
  private _fireMinimal(url: string): boolean {
    try {
      const img = new Image();
      img.style.display = 'none';
      img.src = url;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Moderate obfuscation - sendBeacon with redirect
   */
  private _fireModerate(url: string): boolean {
    try {
      if (navigator.sendBeacon) {
        // Use beacon to send to our endpoint which 302 redirects
        const proxyUrl = `${this.config.endpoint}/proxy?target=${encodeURIComponent(url)}`;
        return navigator.sendBeacon(proxyUrl);
      } else {
        return this._fireMinimal(url);
      }
    } catch {
      return false;
    }
  }

  /**
   * Aggressive obfuscation - multiple techniques
   */
  private _fireAggressive(url: string): boolean {
    try {
      // Use fetch with no-cors mode
      fetch(url, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-cache',
        credentials: 'omit'
      }).catch(() => {});
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Adaptive - choose best method based on detection
   */
  private _fireAdaptive(url: string): boolean {
    if (this.detectionChecks.adBlockerDetected) {
      // Use aggressive mode if ad blocker detected
      return this._fireAggressive(url);
    } else {
      // Use moderate mode otherwise
      return this._fireModerate(url);
    }
  }

  /**
   * Run detection checks
   */
  private _runDetectionChecks() {
    // Check for ad blockers using bait element
    this._checkAdBlocker();
    
    // Check for open devtools
    this._checkDevTools();
  }

  /**
   * Ad blocker detection
   */
  private _checkAdBlocker() {
    // Create bait element
    const bait = document.createElement('div');
    bait.className = 'ad ads adsbox adspace ad-placement';
    bait.style.cssText = 'position:absolute;top:-999px;left:-999px;';
    document.body.appendChild(bait);
    
    setTimeout(() => {
      // Check if element was hidden/removed
      const isBlocked = bait.offsetHeight === 0 ||
                       bait.clientHeight === 0 ||
                       getComputedStyle(bait).display === 'none';
      
      this.detectionChecks.adBlockerDetected = isBlocked;
      document.body.removeChild(bait);
    }, 100);
  }

  /**
   * DevTools detection
   */
  private _checkDevTools() {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    
    this.detectionChecks.devToolsOpen = widthThreshold || heightThreshold;
  }
}
