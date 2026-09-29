import { StudyObject } from '../objects/object-base.js';
import { el } from '../utilities/dom.js';

/**
 * Compact glass calculator as a spatial object
 */
export class CalculatorObject extends StudyObject {
  constructor(data = {}) {
    super({
      ...data,
      type: 'calculator',
      width: data.width ?? 240,
      height: data.height ?? 320,
    });
    this.state = {
      display: data.state?.display || '0',
      ...data.state,
    };
    this._expr = '';
    this._resetNext = false;
  }

  buildContent(container) {
    container.innerHTML = '';
    const root = this.el;
    if (root) root.classList.add('calculator-object');

    const display = el('div', {
      className: 'calculator-display',
      textContent: this.state.display || '0',
      'aria-live': 'polite',
    });

    const keys = [
      ['C', '⌫', '%', '÷'],
      ['7', '8', '9', '×'],
      ['4', '5', '6', '−'],
      ['1', '2', '3', '+'],
      ['0', '.', '='],
    ];

    const grid = el('div', { className: 'calculator-keys' });

    const opMap = { '÷': '/', '×': '*', '−': '-', '+': '+' };

    for (const row of keys) {
      for (const key of row) {
        const isOp = ['÷', '×', '−', '+', '%'].includes(key);
        const isEq = key === '=';
        const btn = el('button', {
          className: `calc-key${isOp ? ' op' : ''}${isEq ? ' eq' : ''}${key === '0' ? ' span-2' : ''}`,
          type: 'button',
          textContent: key,
          'data-key': key,
        });
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._press(key, display, opMap);
        });
        btn.addEventListener('pointerdown', (e) => e.stopPropagation());
        grid.appendChild(btn);
      }
    }

    container.append(display, grid);
    this._display = display;

    // Keyboard support when selected
    this._keyHandler = (e) => {
      if (!this.el?.classList.contains('object-selected')) return;
      const k = e.key;
      if (/[0-9.]/.test(k)) this._press(k, display, opMap);
      else if (k === '+') this._press('+', display, opMap);
      else if (k === '-') this._press('−', display, opMap);
      else if (k === '*') this._press('×', display, opMap);
      else if (k === '/') this._press('÷', display, opMap);
      else if (k === 'Enter' || k === '=') this._press('=', display, opMap);
      else if (k === 'Escape' || k === 'c' || k === 'C') this._press('C', display, opMap);
      else if (k === 'Backspace') this._press('⌫', display, opMap);
      else return;
      e.preventDefault();
    };
    document.addEventListener('keydown', this._keyHandler);
  }

  _press(key, display, opMap) {
    if (key === 'C') {
      this._expr = '';
      this.state.display = '0';
      this._resetNext = false;
    } else if (key === '⌫') {
      if (this._resetNext) {
        this._expr = '';
        this.state.display = '0';
        this._resetNext = false;
      } else {
        this.state.display = this.state.display.slice(0, -1) || '0';
        this._expr = this.state.display;
      }
    } else if (key === '=') {
      try {
        const safe = this._expr.replace(/[^0-9+\-*/.()%\s]/g, '');
        // eslint-disable-next-line no-new-func
        let result = Function(`"use strict"; return (${safe})`)();
        if (typeof result === 'number' && isFinite(result)) {
          result = Math.round(result * 1e10) / 1e10;
          this.state.display = String(result);
          this._expr = String(result);
        } else {
          this.state.display = 'Error';
          this._expr = '';
        }
      } catch {
        this.state.display = 'Error';
        this._expr = '';
      }
      this._resetNext = true;
    } else if (opMap[key]) {
      if (this._resetNext) this._resetNext = false;
      this._expr = this.state.display + opMap[key];
      this.state.display = this._expr;
    } else if (key === '%') {
      try {
        const n = parseFloat(this.state.display) / 100;
        this.state.display = String(n);
        this._expr = String(n);
      } catch { /* ignore */ }
    } else {
      // digit or dot
      if (this._resetNext || this.state.display === '0' || this.state.display === 'Error') {
        this.state.display = key === '.' ? '0.' : key;
        this._expr = this.state.display;
        this._resetNext = false;
      } else {
        if (key === '.' && this.state.display.includes('.')) return;
        this.state.display += key;
        this._expr += key;
      }
    }
    display.textContent = this.state.display;
    this.updatedAt = Date.now();
    this.emit('update');
  }

  destroy() {
    if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
    super.destroy();
  }
}
