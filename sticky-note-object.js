import { StudyObject } from './object-base.js';
import { el } from '../utilities/dom.js';

const COLORS = ['', 'color-blue', 'color-green', 'color-pink', 'color-purple'];

export class StickyNoteObject extends StudyObject {
  constructor(data = {}) {
    super({
      ...data,
      type: 'sticky',
      width: data.width ?? 200,
      height: data.height ?? 180,
    });
    this.state = {
      content: data.state?.content || '',
      color: data.state?.color || '',
      ...data.state,
    };
  }

  buildContent(container) {
    container.innerHTML = '';
    const root = this.el;
    if (root) {
      root.classList.add('sticky-note');
      COLORS.forEach((c) => { if (c) root.classList.remove(c); });
      if (this.state.color) root.classList.add(this.state.color);
    }

    const area = el('textarea', {
      className: 'note-body',
      placeholder: 'Note…',
      'aria-label': 'Sticky note',
    });
    area.value = this.state.content || '';

    area.addEventListener('input', () => {
      this.state.content = area.value;
      this.updatedAt = Date.now();
      this.emit('update');
    });
    area.addEventListener('pointerdown', (e) => e.stopPropagation());
    area.addEventListener('mousedown', (e) => e.stopPropagation());

    // Color cycle on double-click title area or long-press
    const cycleColor = () => {
      const idx = COLORS.indexOf(this.state.color);
      this.state.color = COLORS[(idx + 1) % COLORS.length];
      if (root) {
        COLORS.forEach((c) => { if (c) root.classList.remove(c); });
        if (this.state.color) root.classList.add(this.state.color);
      }
      this.emit('update');
    };

    container.addEventListener('dblclick', (e) => {
      if (e.target === area) return;
      cycleColor();
    });

    container.appendChild(area);
  }
}
