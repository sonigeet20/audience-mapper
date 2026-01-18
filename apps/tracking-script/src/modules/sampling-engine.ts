/**
 * Sampling Engine
 * Implements tiered event sampling based on value
 */

import { TrackerConfig, Event } from '../types';

export class SamplingEngine {
  private config: TrackerConfig;
  private upgradedSessions = new Set<string>();
  private queuedEvents: Event[] = [];

  constructor(config: TrackerConfig) {
    this.config = config;
  }

  /**
   * Determine if event should be sampled
   */
  public shouldSample(event: Event): boolean {
    // Always sample high-value events
    if (event.classification === 'high') {
      return true;
    }

    // Check if session has been upgraded
    if (this.upgradedSessions.has(event.session_id)) {
      return true;
    }

    // Apply sampling rate based on classification
    const rate = this._getSamplingRate(event.classification || 'low');
    const shouldSample = Math.random() * 100 < rate;

    // Queue low-value events for potential retroactive sending
    if (!shouldSample && event.classification === 'low') {
      this.queuedEvents.push(event);
      // Keep queue size manageable
      if (this.queuedEvents.length > 100) {
        this.queuedEvents.shift();
      }
    }

    event.sampled = shouldSample;
    event.sampling_rate = rate;

    return shouldSample;
  }

  /**
   * Upgrade session to send all queued events (called on conversion)
   */
  public upgradeSession(sessionId: string) {
    this.upgradedSessions.add(sessionId);
    
    // Send queued events for this session
    const queuedForSession = this.queuedEvents.filter(
      e => e.session_id === sessionId
    );
    
    if (queuedForSession.length > 0) {
      // Return queued events to be sent
      // (would be handled by the main tracker)
      return queuedForSession;
    }
    
    return [];
  }

  /**
   * Get sampling rate for classification
   */
  private _getSamplingRate(classification: 'high' | 'medium' | 'low'): number {
    switch (classification) {
      case 'high':
        return this.config.sampling.high;
      case 'medium':
        return this.config.sampling.medium;
      case 'low':
        return this.config.sampling.low;
      default:
        return 50;
    }
  }
}
