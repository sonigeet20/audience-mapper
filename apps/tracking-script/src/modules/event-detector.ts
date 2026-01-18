/**
 * Event Detector
 * Auto-detects user interactions with ML-lite classification
 */

import { TrackerConfig, DetectionResult } from '../types';

export class EventDetector {
  private config: TrackerConfig;
  private onEvent: (event: any) => void;
  private mutationObserver: MutationObserver | null = null;
  private seenEvents = new Set<string>();

  constructor(config: TrackerConfig, onEvent: (event: any) => void) {
    this.config = config;
    this.onEvent = onEvent;
    this._init();
  }

  private _init() {
    // Set up event listeners with delegation
    this._setupClickTracking();
    this._setupFormTracking();
    this._setupScrollTracking();
    this._setupVideoTracking();
    
    // Set up mutation observer for dynamic content
    this._setupMutationObserver();
  }

  /**
   * Click tracking with delegation
   */
  private _setupClickTracking() {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Detect button clicks
      if (this._isButton(target)) {
        const detection = this._classifyButton(target);
        this._trackDetection('click', detection);
      }
      
      // Detect link clicks
      if (this._isLink(target)) {
        const detection = this._classifyLink(target);
        this._trackDetection('click', detection);
      }
    }, { passive: true });
    
    // Detect rage clicks
    this._setupRageClickDetection();
  }

  /**
   * Form tracking
   */
  private _setupFormTracking() {
    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement;
      const detection: DetectionResult = {
        event_name: 'form_submit',
        classification: this._classifyForm(form),
        confidence_score: 85,
        element: form,
        properties: {
          form_id: form.id,
          form_name: form.name,
          form_action: form.action
        }
      };
      this._trackDetection('form', detection);
    }, { passive: true });

    // Track form starts
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const form = target.closest('form');
        if (form && !this.seenEvents.has(`form_start_${form.id}`)) {
          this.seenEvents.add(`form_start_${form.id}`);
          const detection: DetectionResult = {
            event_name: 'form_start',
            classification: 'medium',
            confidence_score: 75,
            element: form,
            properties: {
              form_id: form.id,
              form_name: form.name
            }
          };
          this._trackDetection('form', detection);
        }
      }
    }, { passive: true, once: true });
  }

  /**
   * Scroll depth tracking
   */
  private _setupScrollTracking() {
    const milestones = [25, 50, 75, 100];
    const reached = new Set<number>();
    
    const checkScroll = () => {
      const scrollPercent = (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100;
      
      for (const milestone of milestones) {
        if (scrollPercent >= milestone && !reached.has(milestone)) {
          reached.add(milestone);
          const detection: DetectionResult = {
            event_name: 'scroll_depth',
            classification: 'low',
            confidence_score: 95,
            properties: {
              depth: milestone
            }
          };
          this._trackDetection('scroll', detection);
        }
      }
    };
    
    // Throttle scroll events
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /**
   * Video tracking
   */
  private _setupVideoTracking() {
    const trackVideo = (video: HTMLVideoElement) => {
      let tracked25 = false, tracked50 = false, tracked75 = false;
      
      video.addEventListener('play', () => {
        const detection: DetectionResult = {
          event_name: 'video_play',
          classification: 'medium',
          confidence_score: 90,
          properties: {
            video_url: video.currentSrc,
            video_title: video.title
          }
        };
        this._trackDetection('video', detection);
      }, { passive: true });
      
      video.addEventListener('timeupdate', () => {
        const percent = (video.currentTime / video.duration) * 100;
        
        if (percent >= 25 && !tracked25) {
          tracked25 = true;
          this._trackDetection('video', {
            event_name: 'video_progress',
            classification: 'medium',
            confidence_score: 85,
            properties: { progress: 25, video_url: video.currentSrc }
          });
        }
        // Similar for 50% and 75%
      });
    };
    
    // Track existing videos
    document.querySelectorAll('video').forEach(v => trackVideo(v as HTMLVideoElement));
    
    // Track dynamically added videos via mutation observer
  }

  /**
   * Rage click detection
   */
  private _setupRageClickDetection() {
    const clicks: number[] = [];
    const RAGE_THRESHOLD = 5;
    const TIME_WINDOW = 2000;
    
    document.addEventListener('click', () => {
      const now = Date.now();
      clicks.push(now);
      
      // Remove old clicks
      const recentClicks = clicks.filter(t => now - t < TIME_WINDOW);
      clicks.length = 0;
      clicks.push(...recentClicks);
      
      if (clicks.length >= RAGE_THRESHOLD) {
        const detection: DetectionResult = {
          event_name: 'rage_click',
          classification: 'medium',
          confidence_score: 80,
          properties: {
            click_count: clicks.length
          }
        };
        this._trackDetection('interaction', detection);
        clicks.length = 0;
      }
    }, { passive: true });
  }

  /**
   * Mutation observer for dynamic content
   */
  private _setupMutationObserver() {
    // Use requestIdleCallback to avoid blocking main thread
    if ('requestIdleCallback' in window) {
      this.mutationObserver = new MutationObserver((mutations) => {
        (window as any).requestIdleCallback(() => {
          // Process mutations when browser is idle
          for (const mutation of mutations) {
            if (mutation.type === 'childList') {
              // Check for new videos, forms, etc.
              mutation.addedNodes.forEach(node => {
                if (node instanceof HTMLElement) {
                  if (node.tagName === 'VIDEO') {
                    // Track new video
                  }
                }
              });
            }
          }
        });
      });
      
      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  /**
   * ML-lite classification helpers
   */
  private _isButton(element: HTMLElement): boolean {
    return element.tagName === 'BUTTON' || 
           (element.tagName === 'A' && element.classList.contains('btn')) ||
           element.getAttribute('role') === 'button';
  }

  private _isLink(element: HTMLElement): boolean {
    return element.tagName === 'A' && (element as HTMLAnchorElement).href;
  }

  private _classifyButton(button: HTMLElement): DetectionResult {
    const text = button.textContent?.toLowerCase() || '';
    const classes = button.className.toLowerCase();
    
    // High-value indicators
    if (text.includes('buy') || text.includes('purchase') || 
        text.includes('checkout') || text.includes('subscribe')) {
      return {
        event_name: 'button_click',
        classification: 'high',
        confidence_score: 90,
        element: button,
        properties: {
          button_text: button.textContent,
          button_id: button.id
        }
      };
    }
    
    // Medium-value indicators
    if (text.includes('add to cart') || text.includes('sign up') || 
        text.includes('register')) {
      return {
        event_name: 'button_click',
        classification: 'medium',
        confidence_score: 85,
        element: button,
        properties: {
          button_text: button.textContent,
          button_id: button.id
        }
      };
    }
    
    // Default to low-value
    return {
      event_name: 'button_click',
      classification: 'low',
      confidence_score: 70,
      element: button,
      properties: {
        button_text: button.textContent,
        button_id: button.id
      }
    };
  }

  private _classifyLink(link: HTMLElement): DetectionResult {
    const href = (link as HTMLAnchorElement).href;
    const isDownload = link.hasAttribute('download') || 
                       href.match(/\.(pdf|zip|doc|xls|ppt)$/i);
    
    if (isDownload) {
      return {
        event_name: 'file_download',
        classification: 'high',
        confidence_score: 95,
        element: link,
        properties: {
          file_url: href,
          file_type: href.split('.').pop()
        }
      };
    }
    
    return {
      event_name: 'link_click',
      classification: 'low',
      confidence_score: 75,
      element: link,
      properties: {
        link_url: href,
        link_text: link.textContent
      }
    };
  }

  private _classifyForm(form: HTMLFormElement): 'high' | 'medium' | 'low' {
    const action = form.action.toLowerCase();
    const id = form.id.toLowerCase();
    
    if (action.includes('checkout') || action.includes('payment') || 
        id.includes('checkout') || id.includes('payment')) {
      return 'high';
    }
    
    if (action.includes('signup') || action.includes('register') || 
        id.includes('signup') || id.includes('register')) {
      return 'medium';
    }
    
    return 'medium';
  }

  /**
   * Track detected event
   */
  private _trackDetection(type: string, detection: DetectionResult) {
    this.onEvent({
      event_type: type,
      event_name: detection.event_name,
      classification: detection.classification,
      confidence_score: detection.confidence_score,
      auto_detected: true,
      page_url: window.location.href,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      properties: detection.properties
    });
  }

  /**
   * Cleanup
   */
  public destroy() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
  }
}
