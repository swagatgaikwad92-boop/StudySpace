import { StudyObject } from '../objects/object-base.js';
import { el } from '../utilities/dom.js';
import { TimerState } from './timer-state.js';
import { playGridWave } from './wave-animation.js';
import { bus } from '../utilities/events.js';

/**
 * Pomodoro as a floating glass object
 */
export class PomodoroObject extends StudyObject {
  constructor(data = {}) {
    super({
      ...data,
      type: 'pomodoro',
      width: data.width ?? 200,
      height: data.height ?? 240,
    });
    this.state = {
      workMinutes: data.state?.workMinutes ?? 25,
      breakMinutes: data.state?.breakMinutes ?? 5,
      ...data.state,
    };
    this.timer = new TimerState({
      workMinutes: this.state.workMinutes,
      breakMinutes: this.state.breakMinutes,
    });
  }

  buildContent(container) {
    container.innerHTML = '';
    const root = this.el;
    if (root) root.classList.add('pomodoro-object');

    const content = el('div', { className: 'pomodoro-content' });
    const ring = el('div', { className: 'pomodoro-ring' });
    const label = el('div', { className: 'pomodoro-label', textContent: 'Ready' });
    const timerEl = el('div', { className: 'pomodoro-timer', textContent: '25:00' });
    const controls = el('div', { className: 'pomodoro-controls' });

    const startBtn = el('button', { className: 'btn btn-primary', type: 'button', textContent: 'Start' });
    const pauseBtn = el('button', { className: 'btn btn-ghost', type: 'button', textContent: 'Pause', style: { display: 'none' } });
    const resetBtn = el('button', { className: 'btn btn-ghost', type: 'button', textContent: 'Reset' });

    controls.append(startBtn, pauseBtn, resetBtn);

    const settings = el('div', { className: 'pomodoro-settings' });
    const workSetting = el('div', { className: 'pomodoro-setting' });
    workSetting.append(
      el('label', { textContent: 'Work' }),
      el('input', { type: 'number', min: '1', max: '90', value: String(this.state.workMinutes), 'aria-label': 'Work minutes' })
    );
    const breakSetting = el('div', { className: 'pomodoro-setting' });
    breakSetting.append(
      el('label', { textContent: 'Break' }),
      el('input', { type: 'number', min: '1', max: '30', value: String(this.state.breakMinutes), 'aria-label': 'Break minutes' })
    );
    settings.append(workSetting, breakSetting);

    content.append(ring, label, timerEl, controls, settings);
    container.append(content);

    // Prevent drag on interactive
    content.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || e.target.closest('input')) e.stopPropagation();
    });

    const workInput = workSetting.querySelector('input');
    const breakInput = breakSetting.querySelector('input');

    workInput.addEventListener('change', () => {
      this.state.workMinutes = Number(workInput.value) || 25;
      this.timer.setDurations(this.state.workMinutes, this.state.breakMinutes);
      this.emit('update');
    });
    breakInput.addEventListener('change', () => {
      this.state.breakMinutes = Number(breakInput.value) || 5;
      this.timer.setDurations(this.state.workMinutes, this.state.breakMinutes);
      this.emit('update');
    });

    startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasIdle = this.timer.mode === 'idle' || this.timer.mode === 'finished';
      this.timer.start();
      if (wasIdle || this.timer.mode === 'work') {
        playGridWave(this.el, 'work');
        bus.emit('pomodoro:started', this.timer.snapshot());
        bus.emit('ecosystem:session-started', { source: 'pomodoro' });
      }
    });

    pauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.timer.pause();
      bus.emit('pomodoro:paused', this.timer.snapshot());
      bus.emit('ecosystem:session-paused', { source: 'pomodoro' });
    });

    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.timer.reset();
      bus.emit('pomodoro:reset', this.timer.snapshot());
    });

    let prevMode = this.timer.mode;
    this.timer.onChange((snap) => {
      timerEl.textContent = snap.display;
      label.textContent = snap.label;
      label.className = 'pomodoro-label ' + (snap.mode === 'work' ? 'work' : snap.mode === 'break' ? 'break' : snap.mode === 'finished' ? 'finished' : '');

      if (snap.running) {
        startBtn.style.display = 'none';
        pauseBtn.style.display = '';
        root?.classList.add('is-running');
      } else {
        startBtn.style.display = '';
        startBtn.textContent = snap.mode === 'finished' ? 'Start' : snap.mode === 'idle' ? 'Start' : 'Resume';
        pauseBtn.style.display = 'none';
        root?.classList.remove('is-running');
      }

      // Mode transitions
      if (prevMode === 'work' && snap.mode === 'break') {
        playGridWave(this.el, 'break');
        bus.emit('pomodoro:break-started', snap);
        bus.emit('ecosystem:session-break', { source: 'pomodoro' });
      }
      if (prevMode !== 'finished' && snap.mode === 'finished') {
        bus.emit('pomodoro:completed', snap);
        bus.emit('ecosystem:session-ended', { source: 'pomodoro', duration: this.state.workMinutes });
      }
      prevMode = snap.mode;
    });

    // Initial
    const snap = this.timer.snapshot();
    timerEl.textContent = snap.display;
  }

  destroy() {
    this.timer?.destroy();
    super.destroy();
  }
}
