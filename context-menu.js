import { el } from './utilities/dom.js';

/**
 * Right-click / long-press context menu for objects
 */
export class ContextMenu {
  constructor(objectManager) {
    this.om = objectManager;
    this.menu = document.getElementById('context-menu');
    this._bind();
  }

  _bind() {
    document.addEventListener('contextmenu', (e) => {
      const objEl = e.target.closest('.study-object');
      if (!objEl) {
        this.hide();
        return;
      }
      e.preventDefault();
      const id = objEl.dataset.id;
      this.om.select(id);
      this.show(e.clientX, e.clientY, id);
    });

    document.addEventListener('pointerdown', (e) => {
      if (!e.target.closest('#context-menu')) this.hide();
    });
  }

  show(x, y, objectId) {
    const obj = this.om.get(objectId);
    if (!obj) return;

    this.menu.innerHTML = '';
    this.menu.hidden = false;

    const items = [
      { label: 'Bring to front', action: () => this.om.bringToFront(objectId) },
      { label: obj.titleVisible ? 'Hide title' : 'Show title', action: () => {
        obj.titleVisible = !obj.titleVisible;
        obj.el.classList.toggle('title-visible', obj.titleVisible);
        obj.emit('update');
      }},
      { label: 'Rename', action: () => {
        obj.el.classList.add('title-visible');
        obj.titleInput?.focus();
        obj.titleInput?.select();
      }},
      { divider: true },
      { label: 'Remove', action: () => this.om.remove(objectId), danger: true },
    ];

    for (const item of items) {
      if (item.divider) {
        this.menu.appendChild(el('div', { className: 'popup-menu-divider' }));
        continue;
      }
      const btn = el('button', {
        className: 'popup-menu-item',
        type: 'button',
        textContent: item.label,
        style: item.danger ? { color: 'var(--color-danger)' } : {},
      });
      btn.addEventListener('click', () => {
        item.action();
        this.hide();
      });
      this.menu.appendChild(btn);
    }

    this.menu.style.left = `${Math.min(x, window.innerWidth - 200)}px`;
    this.menu.style.top = `${Math.min(y, window.innerHeight - 200)}px`;
    this.menu.classList.add('open');
  }

  hide() {
    this.menu.classList.remove('open');
    this.menu.hidden = true;
  }
}
