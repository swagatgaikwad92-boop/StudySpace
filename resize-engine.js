/**
 * Resize objects via handles
 */
export class ResizeEngine {
  constructor(objectManager, canvasEngine) {
    this.om = objectManager;
    this.canvas = canvasEngine;
    this._resizing = null;
    this._dir = null;
    this._start = null;
    this._objStart = null;
    this._bind();
  }

  _bind() {
    const layer = this.om.layer;

    layer.addEventListener('pointerdown', (e) => {
      const handle = e.target.closest('.resize-handle');
      if (!handle) return;

      const objEl = handle.closest('.study-object');
      if (!objEl) return;

      e.preventDefault();
      e.stopPropagation();

      const id = objEl.dataset.id;
      const obj = this.om.get(id);
      if (!obj) return;

      this.om.select(id);
      this._resizing = obj;
      this._dir = handle.dataset.dir;
      this._start = { x: e.clientX, y: e.clientY };
      this._objStart = {
        x: obj.x,
        y: obj.y,
        w: obj.width,
        h: obj.height,
      };
      obj.el.classList.add('is-resizing');
      handle.setPointerCapture?.(e.pointerId);
    });

    layer.addEventListener('pointermove', (e) => {
      if (!this._resizing) return;
      const z = this.canvas.zoom;
      const dx = (e.clientX - this._start.x) / z;
      const dy = (e.clientY - this._start.y) / z;
      const o = this._objStart;
      const dir = this._dir;
      let x = o.x, y = o.y, w = o.w, h = o.h;
      const minW = 120;
      const minH = 80;

      if (dir.includes('e')) w = Math.max(minW, o.w + dx);
      if (dir.includes('s')) h = Math.max(minH, o.h + dy);
      if (dir.includes('w')) {
        w = Math.max(minW, o.w - dx);
        x = o.x + (o.w - w);
      }
      if (dir.includes('n')) {
        h = Math.max(minH, o.h - dy);
        y = o.y + (o.h - h);
      }

      this._resizing.x = x;
      this._resizing.y = y;
      this._resizing.width = w;
      this._resizing.height = h;
      this._resizing.applyTransform();
    });

    const end = () => {
      if (!this._resizing) return;
      this._resizing.el.classList.remove('is-resizing');
      this._resizing.updatedAt = Date.now();
      this._resizing.emit('update');
      this._resizing = null;
      this._dir = null;
    };
    layer.addEventListener('pointerup', end);
    layer.addEventListener('pointercancel', end);
  }
}
