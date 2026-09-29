import { StudyObject } from './object-base.js';
import { el } from '../utilities/dom.js';

export class TextObject extends StudyObject {
  constructor(data = {}) {
    super({ ...data, type: 'text', width: data.width ?? 280, height: data.height ?? 160 });
    this.state = {
      content: data.state?.content || '',
      ...data.state,
    };
  }

  buildContent(container) {
    container.innerHTML = '';
    const area = el('textarea', {
      className: 'text-body',
      placeholder: 'Write something…',
      'aria-label': 'Text content',
      value: this.state.content || '',
    });
    // Set value properly
    area.value = this.state.content || '';

    area.addEventListener('input', () => {
      this.state.content = area.value;
      this.updatedAt = Date.now();
      this.emit('update');
    });
    area.addEventListener('pointerdown', (e) => e.stopPropagation());
    area.addEventListener('mousedown', (e) => e.stopPropagation());
    area.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });

    container.appendChild(area);
    this._textarea = area;
  }
}
