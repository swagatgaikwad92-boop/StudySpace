import { SolveCountBridge } from './solvecount-bridge.js';
import { CalendarBridge } from './calendar-bridge.js';
import { bus } from '../utilities/events.js';

/**
 * Ecosystem coordinator
 */
export class Ecosystem {
  constructor() {
    this.solveCount = new SolveCountBridge();
    this.calendar = new CalendarBridge();

    // Expose for debugging / external hooks
    window.__studySpaceEcosystem = {
      emit: (type, payload) => bus.emit(type, payload),
      on: (type, fn) => bus.on(type, fn),
    };
  }

  destroy() {
    this.solveCount.destroy();
    this.calendar.destroy();
  }
}
