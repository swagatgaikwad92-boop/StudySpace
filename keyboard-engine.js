import { bus } from './utilities/events.js';

/**
 * Global keyboard shortcuts
 */
export class KeyboardEngine {
  constructor({ objectManager, focusTool, penTool }) {
    this.om = objectManager;
    this.focus = focusTool;
    this.pen = penTool;

    document.addEventListener('keydown', (e) => {
      // Don't intercept when typing
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
        if (e.key === 'Escape') e.target.blur();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.om.selectedId) {
          e.preventDefault();
          this.om.remove(this.om.selectedId);
        }
      }

      if (e.key === 'Escape') {
        if (this.focus.active) {
          this.focus.deactivate();
        } else if (this.pen.active) {
          this.pen.deactivate();
        } else {
          this.om.select(null);
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (this.pen.active) {
          e.preventDefault();
          if (e.shiftKey) this.pen.redo();
          else this.pen.undo();
        }
      }

      if (e.key === 'f' && !e.metaKey && !e.ctrlKey) {
        this.focus.toggle();
      }
    });
  }
}
