import { StudyObject } from './object-base.js';
import { el } from '../utilities/dom.js';
import { loadFile, getObjectURL } from '../storage/file-storage.js';

export class ImageObject extends StudyObject {
  constructor(data = {}) {
    super({ ...data, type: 'image', width: data.width ?? 320, height: data.height ?? 240 });
    this.state = {
      fileId: data.state?.fileId || null,
      ...data.state,
    };
  }

  buildContent(container) {
    container.innerHTML = '';
    if (!this.state.fileId) {
      container.innerHTML = `<div class="object-error">No image</div>`;
      return;
    }

    this.showLoading(container);
    loadFile(this.state.fileId).then((rec) => {
      if (!rec || !rec.blob) {
        container.innerHTML = `<div class="object-error">Image not found</div>`;
        return;
      }
      const url = getObjectURL(this.state.fileId, rec.blob);
      const img = el('img', {
        src: url,
        alt: this.title || 'Image',
        draggable: 'false',
      });
      img.onload = () => {
        // Preserve aspect if first load and default size
        if (!this.state.sized) {
          const maxW = 480;
          const maxH = 360;
          let w = img.naturalWidth;
          let h = img.naturalHeight;
          if (w > maxW) { h = (h * maxW) / w; w = maxW; }
          if (h > maxH) { w = (w * maxH) / h; h = maxH; }
          this.width = Math.round(w);
          this.height = Math.round(h);
          this.state.sized = true;
          this.applyTransform();
          this.emit('update');
        }
        container.innerHTML = '';
        container.appendChild(img);
      };
      img.onerror = () => {
        container.innerHTML = `<div class="object-error">Could not load image</div>`;
      };
    }).catch(() => {
      container.innerHTML = `<div class="object-error">Could not load image</div>`;
    });
  }

  showLoading(container) {
    container.innerHTML = `<div class="object-loading"><div class="spinner"></div></div>`;
  }
}
