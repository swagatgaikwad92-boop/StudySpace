import { bus } from '../utilities/events.js';

/**
 * SolveCount activity bridge — event adapter
 * Study Space continues if SolveCount is unavailable.
 */
export class SolveCountBridge {
  constructor() {
    this.available = false;
    this._channel = null;

    try {
      // BroadcastChannel for same-origin sibling apps
      this._channel = new BroadcastChannel('study-ecosystem');
      this._channel.onmessage = (ev) => this._onMessage(ev.data);
      this.available = true;
    } catch {
      this.available = false;
    }

    // Forward Study Space events outward
    const forward = (type) => {
      bus.on(type, (payload) => this.emit(type, payload));
    };
    forward('ecosystem:session-started');
    forward('ecosystem:session-paused');
    forward('ecosystem:session-ended');
    forward('ecosystem:session-break');
    forward('pomodoro:started');
    forward('pomodoro:completed');
  }

  emit(type, payload = {}) {
    const msg = {
      source: 'study-space',
      type,
      payload,
      timestamp: Date.now(),
    };
    try {
      this._channel?.postMessage(msg);
    } catch { /* ignore */ }
    // Also window-level for iframe/embed scenarios
    try {
      window.dispatchEvent(new CustomEvent('study-space-event', { detail: msg }));
    } catch { /* ignore */ }
  }

  _onMessage(data) {
    if (!data || data.source === 'study-space') return;
    // Incoming from SolveCount
    if (data.type === 'solvecount:session-active') {
      bus.emit('solvecount:session-active', data.payload);
    }
    if (data.type === 'solvecount:question-solved') {
      bus.emit('solvecount:question-solved', data.payload);
    }
  }

  destroy() {
    try { this._channel?.close(); } catch { /* ignore */ }
  }
}
