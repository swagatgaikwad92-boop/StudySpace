import { bus } from './utilities/events.js';
import { clamp, prefersReducedMotion } from './utilities/dom.js';
import { saveWorkspace, loadWorkspace } from './storage/workspace-storage.js';
import { debounce } from './utilities/dom.js';

/**
 * Pan + zoom spatial canvas
 */
export class CanvasEngine {
  constructor(containerEl, worldEl) {
    this.container = containerEl;
    this.world = worldEl;
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.minZoom = 0.35;
    this.maxZoom = 2.5;
    this._panning = false;
    this._lastPointer = null;
    this._pointers = new Map();
    this._lastPinchDist = null;
    this._save = debounce(() => this.persist(), 500);

    this._bind();
  }

  async restore() {
    const data = await loadWorkspace();
    if (data?.viewport) {
      this.x = data.viewport.x || 0;
      this.y = data.viewport.y || 0;
      this.zoom = data.viewport.zoom || 1;
      this.apply();
    }
  }

  persist() {
    saveWorkspace({
      viewport: { x: this.x, y: this.y, zoom: this.zoom },
    }).catch(() => {});
  }

  apply() {
    this.world.style.transform = `translate(${this.x}px, ${this.y}px) scale(${this.zoom})`;
    this._save();
    bus.emit('viewport:changed', { x: this.x, y: this.y, zoom: this.zoom });
  }

  screenToWorld(clientX, clientY) {
    const rect = this.container.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    return {
      x: (sx - this.x) / this.zoom,
      y: (sy - this.y) / this.zoom,
    };
  }

  panBy(dx, dy) {
    this.x += dx;
    this.y += dy;
    this.apply();
  }

  zoomAt(clientX, clientY, factor) {
    const rect = this.container.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const newZoom = clamp(this.zoom * factor, this.minZoom, this.maxZoom);
    const ratio = newZoom / this.zoom;
    this.x = sx - (sx - this.x) * ratio;
    this.y = sy - (sy - this.y) * ratio;
    this.zoom = newZoom;
    this.apply();
  }

  _bind() {
    // Wheel zoom
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.08 : 0.92;
      this.zoomAt(e.clientX, e.clientY, factor);
    }, { passive: false });

    // Multi-pointer for pan / pinch
    this.container.addEventListener('pointerdown', (e) => {
      // Only pan on background (not on objects)
      if (e.target.closest('.study-object') || e.target.closest('#drawing-layer.active')) return;
      this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.container.setPointerCapture?.(e.pointerId);

      if (this._pointers.size === 1) {
        this._panning = true;
        this._lastPointer = { x: e.clientX, y: e.clientY };
        this.container.classList.add('is-panning');
      } else if (this._pointers.size === 2) {
        this._panning = false;
        const pts = Array.from(this._pointers.values());
        this._lastPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    });

    this.container.addEventListener('pointermove', (e) => {
      if (!this._pointers.has(e.pointerId)) return;
      this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (this._pointers.size === 2) {
        const pts = Array.from(this._pointers.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (this._lastPinchDist) {
          const factor = dist / this._lastPinchDist;
          const midX = (pts[0].x + pts[1].x) / 2;
          const midY = (pts[0].y + pts[1].y) / 2;
          this.zoomAt(midX, midY, factor);
        }
        this._lastPinchDist = dist;

        // Also pan with midpoint
        // (simplified)
      } else if (this._panning && this._lastPointer) {
        const dx = e.clientX - this._lastPointer.x;
        const dy = e.clientY - this._lastPointer.y;
        this.panBy(dx, dy);
        this._lastPointer = { x: e.clientX, y: e.clientY };
      }
    });

    const endPointer = (e) => {
      this._pointers.delete(e.pointerId);
      if (this._pointers.size < 2) this._lastPinchDist = null;
      if (this._pointers.size === 0) {
        this._panning = false;
        this._lastPointer = null;
        this.container.classList.remove('is-panning');
      }
    };
    this.container.addEventListener('pointerup', endPointer);
    this.container.addEventListener('pointercancel', endPointer);

    // Prevent default touch gestures
    this.container.addEventListener('gesturestart', (e) => e.preventDefault());
  }
}
