/**
 * Tools / Add menu item routing.
 * Open/close is handled by bootstrap.js so menus always work.
 * This module only routes selected actions into the app.
 */
export class ToolsMenu {
  constructor({ onAdd, onTool }) {
    this.onAdd = onAdd;
    this.onTool = onTool;
    this.addMenu = document.getElementById('add-menu');
    this.toolsMenu = document.getElementById('tools-menu');

    // Only route item clicks — bootstrap owns open/close on the floating buttons
    this.addMenu?.addEventListener('click', (e) => {
      const item = e.target.closest('[data-action]');
      if (!item) return;
      // bootstrap also fires ss:add; prefer module path when ready
      if (typeof this.onAdd === 'function') {
        e.stopPropagation();
        window.__studySpaceBootstrap?.closeAll?.();
        this.onAdd(item.dataset.action);
      }
    });

    this.toolsMenu?.addEventListener('click', (e) => {
      const item = e.target.closest('[data-action]');
      if (!item) return;
      if (typeof this.onTool === 'function') {
        e.stopPropagation();
        window.__studySpaceBootstrap?.closeAll?.();
        this.onTool(item.dataset.action);
      }
    });
  }

  closeAll() {
    window.__studySpaceBootstrap?.closeAll?.();
  }
}
