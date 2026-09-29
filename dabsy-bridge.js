import { bus } from '../utilities/events.js';

/**
 * Bridge for future DABSy AI integration.
 * No fake AI — exposes context API only.
 */
export class DabsyBridge {
  constructor(contextProvider) {
    this.context = contextProvider;
    this._apiKey = null; // never hardcode
  }

  setApiKey(key) {
    this._apiKey = key || null;
    // Client-side keys are not secret — warn in real integrations
  }

  getContext() {
    return this.context.getContext();
  }

  getSummary() {
    return this.context.getSummary();
  }

  /**
   * Placeholder for future AI call.
   * Returns a calm local response based on context.
   */
  async ask(message) {
    const summary = this.getSummary();
    // Local-only responses — no external API unless configured later
    const lower = (message || '').toLowerCase();

    if (lower.includes('help') || lower.includes('what can')) {
      return "I'm here quietly. I can see what's on your desk — PDFs, notes, videos, and your timer. Ask about your current study material anytime.";
    }
    if (lower.includes('page') || lower.includes('pdf')) {
      const ctx = this.getContext();
      if (ctx.selected?.type === 'pdf') {
        return `You're on page ${ctx.selected.page || '?'} of ${ctx.selected.title || 'your PDF'}.`;
      }
      return "No PDF is selected right now.";
    }
    if (lower.includes('timer') || lower.includes('pomodoro') || lower.includes('focus')) {
      const p = this.getContext().pomodoro;
      if (p?.running) return `Timer is running — ${p.label}: ${p.display}.`;
      return 'No active Pomodoro session.';
    }
    if (lower.includes('desk') || lower.includes('workspace')) {
      return summary;
    }

    return `I can see: ${summary}. (Full AI connection can be linked later — for now I stay local and quiet.)`;
  }
}
