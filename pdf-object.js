import { StudyObject } from './object-base.js';
import { el } from '../utilities/dom.js';
import { loadFile, getObjectURL } from '../storage/file-storage.js';

/**
 * PDF object with real rendering via PDF.js
 */
export class PDFObject extends StudyObject {
  constructor(data = {}) {
    super({ ...data, type: 'pdf', width: data.width ?? 400, height: data.height ?? 520 });
    this.state = {
      page: 1,
      scale: 1.1,
      totalPages: 0,
      fileId: data.state?.fileId || null,
      ...data.state,
    };
    this._pdfDoc = null;
    this._rendering = false;
  }

  buildContent(container) {
    container.innerHTML = '';
    const viewer = el('div', { className: 'pdf-viewer', id: `pdf-viewer-${this.id}` });
    const toolbar = el('div', { className: 'pdf-toolbar' });

    const prevBtn = el('button', {
      className: 'btn-icon-sm btn',
      type: 'button',
      'aria-label': 'Previous page',
      title: 'Previous page',
      innerHTML: '<svg viewBox="0 0 24 24" width="14" height="14"><polyline points="15 18 9 12 15 6"/></svg>',
    });
    const pageInfo = el('span', { className: 'pdf-page-info', textContent: '– / –' });
    const nextBtn = el('button', {
      className: 'btn-icon-sm btn',
      type: 'button',
      'aria-label': 'Next page',
      title: 'Next page',
      innerHTML: '<svg viewBox="0 0 24 24" width="14" height="14"><polyline points="9 18 15 12 9 6"/></svg>',
    });
    const zoomOut = el('button', {
      className: 'btn-icon-sm btn',
      type: 'button',
      'aria-label': 'Zoom out',
      innerHTML: '<svg viewBox="0 0 24 24" width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    });
    const zoomIn = el('button', {
      className: 'btn-icon-sm btn',
      type: 'button',
      'aria-label': 'Zoom in',
      innerHTML: '<svg viewBox="0 0 24 24" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    });

    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); this.goPage(-1); });
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); this.goPage(1); });
    zoomOut.addEventListener('click', (e) => { e.stopPropagation(); this.setScale(this.state.scale - 0.15); });
    zoomIn.addEventListener('click', (e) => { e.stopPropagation(); this.setScale(this.state.scale + 0.15); });

    // Prevent scroll from bubbling to canvas pan
    viewer.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
    viewer.addEventListener('pointerdown', (e) => e.stopPropagation());
    viewer.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });

    toolbar.append(prevBtn, pageInfo, nextBtn, zoomOut, zoomIn);
    container.append(viewer, toolbar);

    this._viewer = viewer;
    this._pageInfo = pageInfo;

    this.loadPDF();
  }

  async loadPDF() {
    if (!this.state.fileId) {
      this.showError('No PDF file attached.');
      return;
    }

    this.showLoading();

    try {
      // Wait for PDF.js
      if (typeof pdfjsLib === 'undefined') {
        await this._waitForPdfJs();
      }
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const fileRec = await loadFile(this.state.fileId);
      if (!fileRec || !fileRec.blob) {
        this.showError('PDF file not found in storage.');
        return;
      }

      const url = getObjectURL(this.state.fileId, fileRec.blob);
      const loadingTask = pdfjsLib.getDocument(url);
      this._pdfDoc = await loadingTask.promise;
      this.state.totalPages = this._pdfDoc.numPages;
      this.state.page = Math.min(this.state.page || 1, this.state.totalPages);
      await this.renderPage();
    } catch (err) {
      console.error('[PDFObject]', err);
      this.showError('Could not open this PDF.');
    }
  }

  _waitForPdfJs(timeout = 8000) {
    return new Promise((resolve, reject) => {
      if (typeof pdfjsLib !== 'undefined') return resolve();
      const start = Date.now();
      const check = () => {
        if (typeof pdfjsLib !== 'undefined') return resolve();
        if (Date.now() - start > timeout) return reject(new Error('PDF.js load timeout'));
        setTimeout(check, 100);
      };
      check();
    });
  }

  async renderPage() {
    if (!this._pdfDoc || this._rendering) return;
    this._rendering = true;
    try {
      const page = await this._pdfDoc.getPage(this.state.page);
      const viewport = page.getViewport({ scale: this.state.scale });
      const canvas = document.createElement('canvas');
      canvas.className = 'pdf-page-canvas';
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;

      this._viewer.innerHTML = '';
      this._viewer.appendChild(canvas);
      this._pageInfo.textContent = `${this.state.page} / ${this.state.totalPages}`;
    } catch (err) {
      console.error('[PDFObject] render', err);
      this.showError('Failed to render page.');
    } finally {
      this._rendering = false;
    }
  }

  goPage(delta) {
    if (!this._pdfDoc) return;
    const next = Math.max(1, Math.min(this.state.totalPages, this.state.page + delta));
    if (next !== this.state.page) {
      this.state.page = next;
      this.updatedAt = Date.now();
      this.renderPage();
      this.emit('update');
    }
  }

  setScale(scale) {
    this.state.scale = Math.max(0.5, Math.min(2.5, scale));
    this.updatedAt = Date.now();
    this.renderPage();
    this.emit('update');
  }

  showLoading() {
    if (this._viewer) {
      this._viewer.innerHTML = `<div class="object-loading"><div class="spinner"></div><span>Loading PDF…</span></div>`;
    }
  }

  showError(msg) {
    if (this._viewer) {
      this._viewer.innerHTML = `<div class="object-error">${msg}</div>`;
    }
  }

  destroy() {
    this._pdfDoc = null;
    super.destroy();
  }
}
