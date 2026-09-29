import { bus } from '../utilities/events.js';
import { prefersReducedMotion } from '../utilities/dom.js';

/**
 * Focus mode — emphasize selected content
 */
export class FocusTool {
  constructor(objectManager) {
    this.om = objectManager;
    this.active = false;
    this.overlay = document.getElementById('focus-overlay');

    this.overlay.addEventListener('click', () => this.deactivate());
  }

  activate() {
    const selected = this.om.selectedId ? this.om.get(this.om.selectedId) : null;
    if (!selected) {
      // Focus first content object if any
      const content = this.om.getAll().find((o) =>
        ['pdf', 'video', 'image', 'text'].includes(o.type)
      );
      if (content) {
        this.om.select(content.id);
      } else {
        return false;
      }
    }

    this.active = true;
    document.body.classList.add('focus-mode');
    this.overlay.classList.add('active');

    const obj = this.om.get(this.om.selectedId);
    if (obj) obj.setFocused(true);

    bus.emit('focus:activated');
    return true;
  }

  deactivate() {
    this.active = false;
    document.body.classList.remove('focus-mode');
    this.overlay.classList.remove('active');

    for (const obj of this.om.getAll()) {
      obj.setFocused(false);
    }

    bus.emit('focus:deactivated');
  }

  toggle() {
    if (this.active) this.deactivate();
    else this.activate();
  }
}
