/**
 * Study Space — main application entry
 */
import { openDatabase } from './storage/database.js';
import { CanvasEngine } from './canvas-engine.js';
import { ObjectManager } from './object-manager.js';
import { DragEngine } from './drag-engine.js';
import { ResizeEngine } from './resize-engine.js';
import { ToolsMenu } from './tools/tools-menu.js';
import { PenTool } from './tools/pen.js';
import { FocusTool } from './tools/focus.js';
import { CalculatorObject } from './tools/calculator.js';
import { PomodoroObject } from './pomodoro/pomodoro-ui.js';
import { DabsyContext } from './dabsy/dabsy-context.js';
import { DabsyBridge } from './dabsy/dabsy-bridge.js';
import { DabsyObject } from './dabsy/dabsy-window.js';
import { Ecosystem } from './ecosystem/ecosystem.js';
import { KeyboardEngine } from './keyboard-engine.js';
import { ContextMenu } from './context-menu.js';
import { VideoObject } from './objects/video-object.js';
import { TextObject } from './objects/text-object.js';
import { StickyNoteObject } from './objects/sticky-note-object.js';
import { PDFObject } from './objects/pdf-object.js';
import { ImageObject } from './objects/image-object.js';
import { FallbackObject } from './objects/fallback-object.js';
import { saveFile } from './storage/file-storage.js';
import { uid } from './utilities/id.js';
import { toast } from './utilities/dom.js';
import { bus } from './utilities/events.js';

class StudySpaceApp {
  constructor() {
    this.ready = false;
  }

  async init() {
    try {
      await openDatabase();
    } catch (e) {
      console.error('[App] IndexedDB unavailable', e);
      toast('Storage unavailable — changes may not persist');
    }

    const container = document.getElementById('canvas-container');
    const world = document.getElementById('canvas-world');
    const layer = document.getElementById('objects-layer');

    this.canvas = new CanvasEngine(container, world);
    this.om = new ObjectManager(layer);

    // Register special types
    this.om.registerType('calculator', CalculatorObject);
    this.om.registerType('pomodoro', PomodoroObject);
    this.om.registerType('dabsy', DabsyObject);
    this.om.registerType('sticky', StickyNoteObject);

    this.drag = new DragEngine(this.om, this.canvas);
    this.resize = new ResizeEngine(this.om, this.canvas);
    this.pen = new PenTool(this.canvas);
    this.focus = new FocusTool(this.om);
    this.keyboard = new KeyboardEngine({
      objectManager: this.om,
      focusTool: this.focus,
      penTool: this.pen,
    });
    this.contextMenu = new ContextMenu(this.om);

    // DABSy
    this.dabsyContext = new DabsyContext(this.om, this.canvas);
    this.dabsyBridge = new DabsyBridge(this.dabsyContext);

    // Ecosystem
    this.ecosystem = new Ecosystem();

    // Menus
    this.menus = new ToolsMenu({
      onAdd: (action) => this.handleAdd(action),
      onTool: (action) => this.handleTool(action),
    });

    // File inputs
    this._bindFileInputs();

    // Deselect on background click
    container.addEventListener('pointerdown', (e) => {
      if (!e.target.closest('.study-object') && !e.target.closest('#drawing-layer.active')) {
        this.om.select(null);
      }
    });

    // Restore
    await this.canvas.restore();
    await this.om.restore();

    // Online/offline
    window.addEventListener('online', () => toast('Back online'));
    window.addEventListener('offline', () => toast('You are offline'));

    // Service worker
    this._registerSW();

    this._bindBootstrapEvents();
    this.ready = true;
    window.__studySpaceApp = this;
    bus.emit('app:ready');
    console.info('[Study Space] Ready');
  }

  _bindFileInputs() {
    const pdfInput = document.getElementById('file-pdf');
    const imageInput = document.getElementById('file-image');
    const anyInput = document.getElementById('file-any');
    const cameraInput = document.getElementById('file-camera');

    pdfInput.addEventListener('change', () => {
      const file = pdfInput.files?.[0];
      if (file) this.importPDF(file);
      pdfInput.value = '';
    });
    imageInput.addEventListener('change', () => {
      const file = imageInput.files?.[0];
      if (file) this.importImage(file);
      imageInput.value = '';
    });
    anyInput.addEventListener('change', () => {
      const file = anyInput.files?.[0];
      if (file) this.importFile(file);
      anyInput.value = '';
    });
    cameraInput.addEventListener('change', () => {
      const file = cameraInput.files?.[0];
      if (file) this.importImage(file);
      cameraInput.value = '';
    });
  }


  // Bridge bootstrap custom events → app handlers
  _bindBootstrapEvents() {
    window.addEventListener('ss:add', (e) => {
      if (e.detail?.action) this.handleAdd(e.detail.action);
    });
    window.addEventListener('ss:tool', (e) => {
      if (e.detail?.action) this.handleTool(e.detail.action);
    });
    window.addEventListener('ss:add-video', (e) => {
      if (e.detail?.url) {
        const videoId = VideoObject.extractYouTubeId(e.detail.url);
        if (!videoId) { toast('Could not recognize that YouTube URL'); return; }
        const pos = this.om.findFreePosition(420, 280);
        const obj = new VideoObject({
          x: pos.x, y: pos.y, width: 420, height: 280,
          title: 'Video', state: { videoId, url: e.detail.url },
        });
        this.om.add(obj);
        this.om.select(obj.id);
      }
    });
    window.addEventListener('ss:add-text', () => this.addText());
  }

  handleAdd(action) {
    switch (action) {
      case 'add-pdf':
        document.getElementById('file-pdf').click();
        break;
      case 'add-video':
        this.promptVideo();
        break;
      case 'add-image':
        document.getElementById('file-image').click();
        break;
      case 'add-text':
        this.addText();
        break;
      case 'add-file':
        document.getElementById('file-any').click();
        break;
      case 'add-camera':
        document.getElementById('file-camera').click();
        break;
    }
  }

  handleTool(action) {
    switch (action) {
      case 'tool-sticky':
        this.addSticky();
        break;
      case 'tool-pen':
        this.pen.toggle();
        break;
      case 'tool-focus':
        if (!this.focus.toggle()) {
          toast('Select something to focus on first');
        }
        break;
      case 'tool-calculator':
        this.addCalculator();
        break;
      case 'tool-pomodoro':
        this.addPomodoro();
        break;
      case 'tool-dabsy':
        this.addDabsy();
        break;
    }
  }

  async importPDF(file) {
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      toast('Please choose a PDF file');
      return;
    }
    try {
      const fileId = uid('file');
      await saveFile(fileId, file, { name: file.name });
      const pos = this.om.findFreePosition(400, 520);
      const obj = new PDFObject({
        x: pos.x,
        y: pos.y,
        width: 400,
        height: 520,
        title: file.name.replace(/\.pdf$/i, ''),
        state: { fileId, page: 1, scale: 1.1 },
      });
      this.om.add(obj);
      this.om.select(obj.id);
      toast('PDF added');
    } catch (e) {
      console.error(e);
      toast(e.message || 'Could not import PDF');
    }
  }

  async importImage(file) {
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image');
      return;
    }
    try {
      const fileId = uid('file');
      await saveFile(fileId, file, { name: file.name });
      const pos = this.om.findFreePosition(320, 240);
      const obj = new ImageObject({
        x: pos.x,
        y: pos.y,
        title: file.name,
        state: { fileId },
      });
      this.om.add(obj);
      this.om.select(obj.id);
    } catch (e) {
      toast(e.message || 'Could not import image');
    }
  }

  async importFile(file) {
    if (file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) {
      return this.importPDF(file);
    }
    if (file.type.startsWith('image/')) {
      return this.importImage(file);
    }
    // Fallback
    try {
      const fileId = uid('file');
      await saveFile(fileId, file, { name: file.name });
      const pos = this.om.findFreePosition(240, 140);
      const obj = new FallbackObject({
        x: pos.x,
        y: pos.y,
        title: file.name,
        state: { fileId, fileName: file.name, mimeType: file.type },
      });
      this.om.add(obj);
      toast('File added (preview unavailable)');
    } catch (e) {
      toast(e.message || 'Could not import file');
    }
  }

  promptVideo() {
    const url = window.prompt('Paste a YouTube URL:');
    if (!url) return;
    const videoId = VideoObject.extractYouTubeId(url);
    if (!videoId) {
      toast('Could not recognize that YouTube URL');
      return;
    }
    const pos = this.om.findFreePosition(420, 280);
    const obj = new VideoObject({
      x: pos.x,
      y: pos.y,
      width: 420,
      height: 280,
      title: 'Video',
      state: { videoId, url },
    });
    this.om.add(obj);
    this.om.select(obj.id);
  }

  addText() {
    const pos = this.om.findFreePosition(280, 160);
    const obj = new TextObject({
      x: pos.x,
      y: pos.y,
      title: '',
      state: { content: '' },
    });
    this.om.add(obj);
    this.om.select(obj.id);
  }

  addSticky() {
    const pos = this.om.findFreePosition(200, 180);
    const obj = new StickyNoteObject({
      x: pos.x,
      y: pos.y,
      state: { content: '', color: '' },
    });
    this.om.add(obj);
    this.om.select(obj.id);
  }

  addCalculator() {
    // Only one calculator
    const existing = this.om.getAll().find((o) => o.type === 'calculator');
    if (existing) {
      this.om.select(existing.id);
      this.om.bringToFront(existing.id);
      return;
    }
    const pos = this.om.findFreePosition(240, 320);
    // Prefer edge
    pos.x = Math.max(40, window.innerWidth / this.canvas.zoom - 300);
    const obj = new CalculatorObject({ x: pos.x, y: 80 });
    this.om.add(obj);
    this.om.select(obj.id);
  }

  addPomodoro() {
    const existing = this.om.getAll().find((o) => o.type === 'pomodoro');
    if (existing) {
      this.om.select(existing.id);
      this.om.bringToFront(existing.id);
      return;
    }
    const obj = new PomodoroObject({
      x: 40,
      y: 40,
    });
    this.om.add(obj);
    this.om.select(obj.id);
  }

  addDabsy() {
    const existing = this.om.getAll().find((o) => o.type === 'dabsy');
    if (existing) {
      this.om.select(existing.id);
      this.om.bringToFront(existing.id);
      return;
    }
    // Pass bridge via subclass instance
    const pos = this.om.findFreePosition(280, 260);
    pos.x = 40;
    pos.y = Math.max(40, (window.innerHeight / this.canvas.zoom) - 320);
    const obj = new DabsyObject(
      { x: pos.x, y: pos.y, title: 'DABSy' },
      this.dabsyBridge
    );
    this.om.add(obj);
    this.om.select(obj.id);
  }

  _registerSW() {
    if (!('serviceWorker' in navigator)) return;
    // Relative path for GitHub Pages subpath compatibility
    const swPath = new URL('sw.js', window.location.href).pathname;
    navigator.serviceWorker.register(swPath).then(
      (reg) => console.info('[SW] registered', reg.scope),
      (err) => console.warn('[SW] registration failed', err)
    );
  }
}

// Boot
const app = new StudySpaceApp();
app.init().catch((e) => {
  console.error('[Study Space] init failed', e);
  toast('Something went wrong starting Study Space');
});

export { app };
