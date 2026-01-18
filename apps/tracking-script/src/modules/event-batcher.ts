/**
 * Event Batcher
 * Batches events before sending to reduce network requests
 */

import { TrackerConfig, Event } from '../types';

export class EventBatcher {
  private config: TrackerConfig;
  private queue: Event[] = [];
  private batchSize = 100;
  private maxWaitTime = 5000; // 5 seconds
  private timer: NodeJS.Timeout | null = null;

  constructor(config: TrackerConfig) {
    this.config = config;
  }

  /**
   * Add event to batch queue
   */
  public add(event: Event) {
    this.queue.push(event);

    // Send if batch size reached
    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      // Set timer for max wait time
      this.timer = setTimeout(() => this.flush(), this.maxWaitTime);
    }
  }

  /**
   * Flush events to server
   */
  public flush(force = false) {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Send based on data collection mode
    if (this.config.dataCollectionMode === 'client_only') {
      this._sendToClientEndpoints(events);
    } else if (this.config.dataCollectionMode === 'server_only') {
      this._sendToServer(events, force);
    } else {
      // Both: send to both endpoints
      this._sendToClientEndpoints(events);
      this._sendToServer(events, force);
    }
  }

  /**
   * Send events to server endpoint
   */
  private _sendToServer(events: Event[], force = false) {
    const payload = JSON.stringify({
      events,
      tracking_code: this.config.trackingCode,
      timestamp: new Date().toISOString()
    });

    // Use sendBeacon for reliable delivery during page unload
    if (force && navigator.sendBeacon) {
      navigator.sendBeacon(
        this.config.endpoint,
        new Blob([payload], { type: 'application/json' })
      );
      return;
    }

    // Use fetch with retry
    this._sendWithRetry(this.config.endpoint, payload, 3);
  }

  /**
   * Send to client-side endpoints (platform pixels)
   */
  private _sendToClientEndpoints(events: Event[]) {
    // This would fire platform-specific pixels
    // Implementation depends on configured platforms
  }

  /**
   * Send with exponential backoff retry
   */
  private async _sendWithRetry(
    url: string,
    payload: string,
    retriesLeft: number
  ) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: payload,
        keepalive: true
      });

      if (!response.ok && retriesLeft > 0) {
        // Retry with exponential backoff
        const delay = Math.pow(2, 3 - retriesLeft) * 1000;
        setTimeout(() => {
          this._sendWithRetry(url, payload, retriesLeft - 1);
        }, delay);
      }
    } catch (error) {
      if (retriesLeft > 0) {
        const delay = Math.pow(2, 3 - retriesLeft) * 1000;
        setTimeout(() => {
          this._sendWithRetry(url, payload, retriesLeft - 1);
        }, delay);
      } else {
        console.error('[Tracker] Failed to send events:', error);
      }
    }
  }
}
