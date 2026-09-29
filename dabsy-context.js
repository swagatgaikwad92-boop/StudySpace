import { bus } from '../utilities/events.js';

/**
 * Collects workspace context for DABSy
 */
export class DabsyContext {
  constructor(objectManager, canvasEngine) {
    this.om = objectManager;
    this.canvas = canvasEngine;
    this._pomodoroState = null;

    bus.on('selection:changed', (obj) => {
      this._selected = obj;
    });
    bus.on('pomodoro:started', (s) => { this._pomodoroState = s; });
    bus.on('pomodoro:paused', (s) => { this._pomodoroState = s; });
    bus.on('pomodoro:completed', (s) => { this._pomodoroState = s; });
    bus.on('pomodoro:break-started', (s) => { this._pomodoroState = s; });
  }

  getContext() {
    const objects = this.om.getAll().map((o) => ({
      id: o.id,
      type: o.type,
      title: o.title,
      page: o.state?.page,
      videoId: o.state?.videoId,
    }));

    const selected = this._selected
      ? {
          id: this._selected.id,
          type: this._selected.type,
          title: this._selected.title,
          page: this._selected.state?.page,
        }
      : null;

    return {
      timestamp: Date.now(),
      objectCount: objects.length,
      objects,
      selected,
      viewport: {
        x: this.canvas.x,
        y: this.canvas.y,
        zoom: this.canvas.zoom,
      },
      pomodoro: this._pomodoroState,
      online: navigator.onLine,
    };
  }

  getSummary() {
    const ctx = this.getContext();
    const parts = [];
    if (ctx.selected) {
      parts.push(`Looking at ${ctx.selected.type}${ctx.selected.title ? `: ${ctx.selected.title}` : ''}`);
      if (ctx.selected.page) parts.push(`page ${ctx.selected.page}`);
    }
    if (ctx.pomodoro?.running) {
      parts.push(`Pomodoro ${ctx.pomodoro.label}: ${ctx.pomodoro.display}`);
    }
    if (ctx.objectCount === 0) parts.push('Empty desk');
    else parts.push(`${ctx.objectCount} items on desk`);
    return parts.join(' · ') || 'Quiet desk';
  }
}
