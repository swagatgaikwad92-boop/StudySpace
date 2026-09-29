import { bus } from '../utilities/events.js';
import { idbGet, idbPut } from '../storage/database.js';
import { toast } from '../utilities/dom.js';

/**
 * Workspace drawing layer
 */
export class PenTool {
  constructor(canvasEngine) {
    this.canvas = canvasEngine;
    this.layer = document.getElementById('drawing-layer');
    this.canvasEl = document.getElementById('drawing-canvas');
    this.ctx = this.canvasEl.getContext('2d');
    this.active = false;
    this.drawing = false;
    this.strokeSize = 2;
    this.color = '#2c2a26';
    this.erasing = false;
    this.strokes = [];
    this.redoStack = [];
    this._currentStroke = null;

    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());
    this._bindUI();
    this._bindDraw();
    this.load();
  }

  _resizeCanvas() {
    // Large enough world space
    const size = 4000;
    this.canvasEl.width = size;
    this.canvasEl.height = size;
    this.canvasEl.style.width = size + 'px';
    this.canvasEl.style.height = size + 'px';
    this.redraw();
  }

  activate() {
    this.active = true;
    this.layer.classList.add('active');
    document.getElementById('pen-toolbar').classList.add('visible');
    bus.emit('pen:activated');
  }

  deactivate() {
    this.active = false;
    this.layer.classList.remove('active');
    document.getElementById('pen-toolbar').classList.remove('visible');
    this.erasing = false;
    this.save();
  }

  toggle() {
    if (this.active) this.deactivate();
    else this.activate();
  }

  _bindUI() {
    const toolbar = document.getElementById('pen-toolbar');
    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-pen-action], .pen-size-btn, .pen-color-btn');
      if (!btn) return;

      if (btn.dataset.penAction === 'done') {
        this.deactivate();
        return;
      }
      if (btn.dataset.penAction === 'undo') { this.undo(); return; }
      if (btn.dataset.penAction === 'redo') { this.redo(); return; }
      if (btn.dataset.penAction === 'clear') { this.clear(); return; }
      if (btn.dataset.penAction === 'erase') {
        this.erasing = !this.erasing;
        btn.classList.toggle('active', this.erasing);
        this.layer.style.cursor = this.erasing ? 'cell' : 'crosshair';
        return;
      }
      if (btn.dataset.size) {
        this.strokeSize = Number(btn.dataset.size);
        toolbar.querySelectorAll('.pen-size-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.erasing = false;
        return;
      }
      if (btn.dataset.color) {
        this.color = btn.dataset.color;
        toolbar.querySelectorAll('.pen-color-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.erasing = false;
        return;
      }
    });
  }

  _bindDraw() {
    const start = (e) => {
      if (!this.active) return;
      e.preventDefault();
      e.stopPropagation();
      this.drawing = true;
      const world = this.canvas.screenToWorld(e.clientX, e.clientY);
      this._currentStroke = {
        points: [{ x: world.x, y: world.y }],
        color: this.erasing ? 'erase' : this.color,
        size: this.strokeSize * (this.erasing ? 3 : 1),
      };
    };

    const move = (e) => {
      if (!this.drawing || !this._currentStroke) return;
      e.preventDefault();
      const world = this.canvas.screenToWorld(e.clientX, e.clientY);
      this._currentStroke.points.push({ x: world.x, y: world.y });
      this._drawStroke(this._currentStroke, true);
    };

    const end = () => {
      if (!this.drawing) return;
      this.drawing = false;
      if (this._currentStroke && this._currentStroke.points.length > 1) {
        this.strokes.push(this._currentStroke);
        this.redoStack = [];
        this.save();
      }
      this._currentStroke = null;
    };

    this.layer.addEventListener('pointerdown', start);
    this.layer.addEventListener('pointermove', move);
    this.layer.addEventListener('pointerup', end);
    this.layer.addEventListener('pointercancel', end);
  }

  _drawStroke(stroke, partial = false) {
    const ctx = this.ctx;
    const pts = stroke.points;
    if (pts.length < 2) return;

    ctx.save();
    if (stroke.color === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
    }
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  redraw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
    for (const s of this.strokes) this._drawStroke(s);
  }

  undo() {
    if (this.strokes.length === 0) return;
    this.redoStack.push(this.strokes.pop());
    this.redraw();
    this.save();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    this.strokes.push(this.redoStack.pop());
    this.redraw();
    this.save();
  }

  clear() {
    this.strokes = [];
    this.redoStack = [];
    this.redraw();
    this.save();
    toast('Drawing cleared');
  }

  async save() {
    try {
      await idbPut('drawings', { id: 'main', strokes: this.strokes, updatedAt: Date.now() });
    } catch (e) {
      console.warn('[Pen] save', e);
    }
  }

  async load() {
    try {
      const rec = await idbGet('drawings', 'main');
      if (rec?.strokes) {
        this.strokes = rec.strokes;
        this.redraw();
      }
    } catch (e) {
      console.warn('[Pen] load', e);
    }
  }
}
