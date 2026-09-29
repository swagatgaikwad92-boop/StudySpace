/** Lightweight event bus */
class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  on(event, fn) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    const set = this._listeners.get(event);
    if (set) set.delete(fn);
  }

  emit(event, data) {
    const set = this._listeners.get(event);
    if (set) {
      for (const fn of set) {
        try { fn(data); } catch (e) { console.error(`[EventBus] ${event}`, e); }
      }
    }
  }

  once(event, fn) {
    const wrap = (data) => {
      this.off(event, wrap);
      fn(data);
    };
    return this.on(event, wrap);
  }
}

export const bus = new EventBus();
