import { bus } from '../utilities/events.js';

/**
 * Floating tools / add menus
 */
export class ToolsMenu {
  constructor({ onAdd, onTool }) {
    this.onAdd = onAdd;
    this.onTool = onTool;
    this.addMenu = document.getElementById('add-menu');
    this.toolsMenu = document.getElementById('tools-menu');
    this.addBtn = document.getElementById('add-btn');
    this.toolsBtn = document.getElementById('tools-btn');
    this.emptyAdd = document.getElementById('empty-add-btn');
    this.emptyTools = document.getElementById('empty-tools-btn');

    this._bind();
  }

  _bind() {
    this.addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle(this.addMenu, this.addBtn);
    });
    this.toolsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle(this.toolsMenu, this.toolsBtn);
    });
    this.emptyAdd?.addEventListener('click', () => {
      this.open(this.addMenu, this.addBtn);
    });
    this.emptyTools?.addEventListener('click', () => {
      this.open(this.toolsMenu, this.toolsBtn);
    });

    this.addMenu.addEventListener('click', (e) => {
      const item = e.target.closest('[data-action]');
      if (!item) return;
      this.closeAll();
      this.onAdd(item.dataset.action);
    });

    this.toolsMenu.addEventListener('click', (e) => {
      const item = e.target.closest('[data-action]');
      if (!item) return;
      this.closeAll();
      this.onTool(item.dataset.action);
    });

    document.addEventListener('pointerdown', (e) => {
      if (
        !e.target.closest('#add-menu') &&
        !e.target.closest('#tools-menu') &&
        !e.target.closest('#add-btn') &&
        !e.target.closest('#tools-btn')
      ) {
        this.closeAll();
      }
    });
  }

  toggle(menu, anchor) {
    if (menu.classList.contains('open')) {
      this.close(menu);
    } else {
      this.closeAll();
      this.open(menu, anchor);
    }
  }

  open(menu, anchor) {
    const rect = anchor.getBoundingClientRect();
    if (menu === this.addMenu) {
      menu.style.left = `${rect.left + rect.width / 2}px`;
      menu.style.bottom = `${window.innerHeight - rect.top + 8}px`;
      menu.style.top = 'auto';
      menu.style.right = 'auto';
      menu.style.transform = 'translateX(-50%)';
    }
    // tools menu uses CSS positioning
    menu.classList.add('open');
  }

  close(menu) {
    menu.classList.remove('open');
  }

  closeAll() {
    this.addMenu.classList.remove('open');
    this.toolsMenu.classList.remove('open');
  }
}
