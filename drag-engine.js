/**
 * Drag objects on the canvas
 */
export class DragEngine {
  constructor(objectManager, canvasEngine) {
    this.om = objectManager;
    this.canvas = canvasEngine;
    this._dragging = null;
    this._start = null;
    this._objStart = null;
    this._bind();
  }

  _bind() {
    const layer = this.om.layer;

    layer.addEventListener('pointerdown', (e) => {
      const handle = e.target.closest('.resize-handle');
      if (handle) return; // resize engine handles this

      const objEl = e.target.closest('.study-object');
      if (!objEl) return;

      // Don't drag if interacting with interactive content
      if (
        e.target.closest('textarea') ||
        e.target.closest('input') ||
        e.target.closest('iframe') ||
        e.target.closest('button') ||
        e.target.closest('.pdf-viewer') ||
        e.target.closest('.calculator-keys') ||
        e.target.closest('.dabsy-input') ||
        e.target.closest('.video-controls')
      ) {
        // Still select
        const id = objEl.dataset.id;
        this.om.select(id);
        return;
      }

      const id = objEl.dataset.id;
      const obj = this.om.get(id);
      if (!obj) return;

      e.preventDefault();
      e.stopPropagation();

      this.om.select(id);
      this._dragging = obj;
      this._start = { x: e.clientX, y: e.clientY };
      this._objStart = { x: obj.x, y: obj.y };
      obj.el.classList.add('is-dragging');
      obj.el.setPointerCapture?.(e.pointerId);
    });

    layer.addEventListener('pointermove', (e) => {
      if (!this._dragging) return;
      const dx = (e.clientX - this._start.x) / this.canvas.zoom;
      const dy = (e.clientY - this._start.y) / this.canvas.zoom;
      this._dragging.x = this._objStart.x + dx;
      this._dragging.y = this._objStart.y + dy;
      this._dragging.applyTransform();
    });

    const end = (e) => {
      if (!this._dragging) return;
      this._dragging.el.classList.remove('is-dragging');
      this._dragging.updatedAt = Date.now();
      this._dragging.emit('update');
      this._dragging = null;
      this._start = null;
      this._objStart = null;
    };
    layer.addEventListener('pointerup', end);
    layer.addEventListener('pointercancel', end);
  }
}
