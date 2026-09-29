import { bus } from './utilities/events.js';
import { PDFObject } from './objects/pdf-object.js';
import { VideoObject } from './objects/video-object.js';
import { ImageObject } from './objects/image-object.js';
import { TextObject } from './objects/text-object.js';
import { FallbackObject } from './objects/fallback-object.js';
import { StickyNoteObject } from './objects/sticky-note-object.js';
import { saveObject, deleteObjectRecord, loadAllObjects } from './storage/object-storage.js';
import { deleteFile } from './storage/file-storage.js';
import { debounce } from './utilities/dom.js';

const TYPE_MAP = {
  pdf: PDFObject,
  video: VideoObject,
  image: ImageObject,
  text: TextObject,
  fallback: FallbackObject,
  sticky: StickyNoteObject,
  // Special objects registered later
};

export class ObjectManager {
  constructor(layerEl) {
    this.layer = layerEl;
    this.objects = new Map();
    this.selectedId = null;
    this.maxZ = 10;
    this._save = debounce(() => this.persistAll(), 400);
  }

  registerType(type, Cls) {
    TYPE_MAP[type] = Cls;
  }

  async restore() {
    const records = await loadAllObjects();
    // Sort by zIndex
    records.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    for (const rec of records) {
      try {
        this.createFromData(rec, false);
      } catch (e) {
        console.warn('[ObjectManager] restore failed for', rec.id, e);
      }
    }
    this.updateEmptyState();
  }

  createFromData(data, persist = true) {
    const Cls = TYPE_MAP[data.type] || FallbackObject;
    const obj = new Cls(data);
    this.add(obj, persist);
    return obj;
  }

  add(obj, persist = true) {
    if (this.objects.has(obj.id)) return obj;

    this.maxZ = Math.max(this.maxZ, obj.zIndex || 10);
    obj.zIndex = obj.zIndex || ++this.maxZ;

    const el = obj.render();
    this.layer.appendChild(el);
    this.objects.set(obj.id, obj);

    obj.on('update', () => this._save());
    obj.on('delete', () => this.remove(obj.id));

    if (persist) {
      this._save();
      bus.emit('object:created', obj);
    }

    this.updateEmptyState();
    return obj;
  }

  remove(id) {
    const obj = this.objects.get(id);
    if (!obj) return;

    // Cleanup file if any
    if (obj.state?.fileId) {
      deleteFile(obj.state.fileId).catch(() => {});
    }

    obj.destroy();
    this.objects.delete(id);
    deleteObjectRecord(id).catch(() => {});

    if (this.selectedId === id) {
      this.selectedId = null;
      bus.emit('selection:changed', null);
    }

    this.updateEmptyState();
    bus.emit('object:removed', id);
  }

  get(id) {
    return this.objects.get(id);
  }

  getAll() {
    return Array.from(this.objects.values());
  }

  select(id) {
    if (this.selectedId && this.objects.has(this.selectedId)) {
      this.objects.get(this.selectedId).setSelected(false);
    }
    this.selectedId = id;
    if (id && this.objects.has(id)) {
      const obj = this.objects.get(id);
      obj.setSelected(true);
      this.bringToFront(id);
      bus.emit('selection:changed', obj);
    } else {
      bus.emit('selection:changed', null);
    }
  }

  bringToFront(id) {
    const obj = this.objects.get(id);
    if (!obj) return;
    this.maxZ += 1;
    obj.zIndex = this.maxZ;
    obj.applyTransform();
    this._save();
  }

  /** Find free space near a point or center */
  findFreePosition(width = 300, height = 220, preferNear = null) {
    const margin = 24;
    const startX = preferNear ? preferNear.x + preferNear.width + margin : 80;
    const startY = preferNear ? preferNear.y : 80;
    const step = 40;
    let x = startX;
    let y = startY;
    const maxAttempts = 40;

    for (let i = 0; i < maxAttempts; i++) {
      let overlap = false;
      for (const obj of this.objects.values()) {
        if (
          x < obj.x + obj.width + margin &&
          x + width + margin > obj.x &&
          y < obj.y + obj.height + margin &&
          y + height + margin > obj.y
        ) {
          overlap = true;
          break;
        }
      }
      if (!overlap) return { x, y };
      x += step;
      if (x > 900) {
        x = 80;
        y += step + 20;
      }
    }
    // Fallback: random-ish
    return {
      x: 60 + Math.random() * 200,
      y: 60 + Math.random() * 150,
    };
  }

  async persistAll() {
    for (const obj of this.objects.values()) {
      try {
        await saveObject(obj);
      } catch (e) {
        console.warn('[ObjectManager] persist', e);
      }
    }
  }

  updateEmptyState() {
    const empty = document.getElementById('empty-state');
    if (!empty) return;
    if (this.objects.size === 0) {
      empty.classList.remove('hidden');
    } else {
      empty.classList.add('hidden');
    }
  }
}
