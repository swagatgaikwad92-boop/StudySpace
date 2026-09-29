import { bus } from '../utilities/events.js';

/**
 * Ghibli Calendar bridge — graceful adapter
 */
export class CalendarBridge {
  constructor() {
    this.available = false;
    this._channel = null;

    try {
      this._channel = new BroadcastChannel('study-ecosystem');
      this.available = true;
    } catch {
      this.available = false;
    }

    bus.on('ecosystem:session-ended', (payload) => {
      this.logSession({
        date: new Date().toISOString().slice(0, 10),
        durationMinutes: payload?.duration || 25,
        type: 'pomodoro',
        source: 'study-space',
      });
    });
  }

  logSession(entry) {
    const msg = {
      source: 'study-space',
      type: 'calendar:study-session',
      payload: entry,
      timestamp: Date.now(),
    };
    try {
      this._channel?.postMessage(msg);
    } catch { /* ignore */ }
    try {
      window.dispatchEvent(new CustomEvent('study-space-event', { detail: msg }));
    } catch { /* ignore */ }
  }

  logEvent(name, data = {}) {
    const msg = {
      source: 'study-space',
      type: 'calendar:event',
      payload: { name, ...data },
      timestamp: Date.now(),
    };
    try {
      this._channel?.postMessage(msg);
    } catch { /* ignore */ }
  }

  destroy() {
    try { this._channel?.close(); } catch { /* ignore */ }
  }
}
