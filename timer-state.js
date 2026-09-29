/**
 * Pure Pomodoro timer state machine
 */
export class TimerState {
  constructor(options = {}) {
    this.workMinutes = options.workMinutes ?? 25;
    this.breakMinutes = options.breakMinutes ?? 5;
    this.mode = 'idle'; // idle | work | break | finished
    this.remainingMs = this.workMinutes * 60 * 1000;
    this.running = false;
    this._interval = null;
    this._listeners = [];
  }

  onChange(fn) {
    this._listeners.push(fn);
  }

  _emit() {
    const snapshot = this.snapshot();
    for (const fn of this._listeners) {
      try { fn(snapshot); } catch (e) { console.error(e); }
    }
  }

  snapshot() {
    return {
      mode: this.mode,
      remainingMs: this.remainingMs,
      running: this.running,
      workMinutes: this.workMinutes,
      breakMinutes: this.breakMinutes,
      label: this._label(),
      display: this._format(this.remainingMs),
    };
  }

  _label() {
    if (this.mode === 'work') return 'Focus';
    if (this.mode === 'break') return 'Break';
    if (this.mode === 'finished') return 'Done';
    return 'Ready';
  }

  _format(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  setDurations(workMin, breakMin) {
    this.workMinutes = Math.max(1, Math.min(90, workMin));
    this.breakMinutes = Math.max(1, Math.min(30, breakMin));
    if (!this.running && this.mode === 'idle') {
      this.remainingMs = this.workMinutes * 60 * 1000;
    }
    this._emit();
  }

  start() {
    if (this.mode === 'idle' || this.mode === 'finished') {
      this.mode = 'work';
      this.remainingMs = this.workMinutes * 60 * 1000;
    }
    if (this.running) return;
    this.running = true;
    this._lastTick = Date.now();
    this._interval = setInterval(() => this._tick(), 250);
    this._emit();
  }

  pause() {
    this.running = false;
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
    this._emit();
  }

  reset() {
    this.pause();
    this.mode = 'idle';
    this.remainingMs = this.workMinutes * 60 * 1000;
    this._emit();
  }

  _tick() {
    const now = Date.now();
    const delta = now - this._lastTick;
    this._lastTick = now;
    this.remainingMs -= delta;

    if (this.remainingMs <= 0) {
      this.remainingMs = 0;
      if (this.mode === 'work') {
        this.mode = 'break';
        this.remainingMs = this.breakMinutes * 60 * 1000;
        this._emit();
        // Continue into break automatically
      } else if (this.mode === 'break') {
        this.mode = 'finished';
        this.running = false;
        clearInterval(this._interval);
        this._interval = null;
        this._emit();
      }
    } else {
      this._emit();
    }
  }

  destroy() {
    this.pause();
    this._listeners = [];
  }
}
