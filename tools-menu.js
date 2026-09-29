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

    this._bind();
  }

  _bind() {
    this.addBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle(this.addMenu, this.addBtn);
    });
    this.toolsBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle(this.toolsMenu, this.toolsBtn);
    });

    this.addMenu?.addEventListener('click', (e) => {
      const item = e.target.closest('[data-action]');
      if (!item) return;
      this.closeAll();
      this.onAdd(item.dataset.action);
    });

    this.toolsMenu?.addEventListener('click', (e) => {
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
    if (!menu || !anchor) return;
    if (menu.classList.contains('open')) {
      this.close(menu);
    } else {
      this.closeAll();
      this.open(menu, anchor);
    }
  }

  open(menu, anchor) {
    if (!menu || !anchor) return;
    menu.hidden = false;
    const rect = anchor.getBoundingClientRect();
    if (menu === this.addMenu) {
      menu.style.left = `${rect.left + rect.width / 2}px`;
      menu.style.bottom = `${window.innerHeight - rect.top + 10}px`;
      menu.style.top = 'auto';
      menu.style.right = 'auto';
      menu.style.transform = 'translateX(-50%)';
    } else {
      menu.style.right = `${Math.max(12, window.innerWidth - rect.right)}px`;
      menu.style.bottom = `${window.innerHeight - rect.top + 10}px`;
      menu.style.left = 'auto';
      menu.style.top = 'auto';
      menu.style.transform = 'none';
    }
    requestAnimationFrame(() => menu.classList.add('open'));
  }

  close(menu) {
    if (!menu) return;
    menu.classList.remove('open');
    setTimeout(() => { menu.hidden = true; }, 160);
  }

  closeAll() {
    this.close(this.addMenu);
    this.close(this.toolsMenu);
  }
}
