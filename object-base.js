import { uid } from '../utilities/id.js';
import { el } from '../utilities/dom.js';

/**
 * Base class for all spatial objects on the desk.
 */
export class StudyObject {
  constructor(data = {}) {
    this.id = data.id || uid('obj');
    this.type = data.type || 'base';
    this.x = data.x ?? 100;
    this.y = data.y ?? 100;
    this.width = data.width ?? 320;
    this.height = data.height ?? 240;
    this.zIndex = data.zIndex ?? 10;
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
    this.title = data.title ?? '';
    this.titleVisible = data.titleVisible !== false;
    this.state = data.state || {};
    this.el = null;
    this._listeners = [];
  }

  /** Build DOM element */
  render() {
    const root = el('div', {
      className: `study-object ${this.type}-object`,
      id: `obj-${this.id}`,
      'data-id': this.id,
      'data-type': this.type,
      role: 'group',
      'aria-label': this.title || this.type,
      style: {
        left: `${this.x}px`,
        top: `${this.y}px`,
        width: `${this.width}px`,
        height: `${this.height}px`,
        zIndex: this.zIndex,
      },
    });

    // Titlebar
    const titlebar = el('div', { className: 'object-titlebar' });
    const titleInput = el('input', {
      className: 'object-title',
      type: 'text',
      value: this.title,
      placeholder: this.type,
      'aria-label': 'Object title',
    });
    titleInput.addEventListener('change', () => {
      this.title = titleInput.value;
      this.updatedAt = Date.now();
      this.emit('update');
    });
    titleInput.addEventListener('pointerdown', (e) => e.stopPropagation());
    titleInput.addEventListener('mousedown', (e) => e.stopPropagation());

    const actions = el('div', { className: 'object-title-actions' });
    const hideBtn = el('button', {
      className: 'btn-icon-sm btn',
      type: 'button',
      title: 'Hide title',
      'aria-label': 'Hide title',
      innerHTML: '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
    });
    hideBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.titleVisible = false;
      root.classList.remove('title-visible');
      this.emit('update');
    });

    const closeBtn = el('button', {
      className: 'btn-icon-sm btn',
      type: 'button',
      title: 'Remove',
      'aria-label': 'Remove object',
      innerHTML: '<svg viewBox="0 0 24 24" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    });
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.emit('delete');
    });

    actions.append(hideBtn, closeBtn);
    titlebar.append(titleInput, actions);

    if (this.titleVisible) root.classList.add('title-visible');

    // Content
    const content = el('div', { className: 'object-content' });
    this.buildContent(content);

    // Resize handles
    const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'].map((dir) =>
      el('div', { className: `resize-handle ${dir}`, 'data-dir': dir })
    );

    root.append(titlebar, content, ...handles);
    this.el = root;
    this.titleInput = titleInput;
    this.contentEl = content;

    return root;
  }

  /** Override in subclasses */
  buildContent(container) {
    container.innerHTML = `<div class="object-loading"><span>Loading…</span></div>`;
  }

  applyTransform() {
    if (!this.el) return;
    this.el.style.left = `${this.x}px`;
    this.el.style.top = `${this.y}px`;
    this.el.style.width = `${this.width}px`;
    this.el.style.height = `${this.height}px`;
    this.el.style.zIndex = this.zIndex;
  }

  setSelected(selected) {
    if (!this.el) return;
    this.el.classList.toggle('object-selected', selected);
  }

  setFocused(focused) {
    if (!this.el) return;
    this.el.classList.toggle('object-focused', focused);
  }

  on(event, fn) {
    this._listeners.push({ event, fn });
  }

  emit(event, data) {
    for (const l of this._listeners) {
      if (l.event === event) {
        try { l.fn(data); } catch (e) { console.error(e); }
      }
    }
  }

  destroy() {
    this._listeners = [];
    if (this.el) {
      this.el.remove();
      this.el = null;
    }
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      zIndex: this.zIndex,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      title: this.title,
      titleVisible: this.titleVisible,
      state: this.state,
    };
  }
}
