import { StudyObject } from './object-base.js';
import { el } from '../utilities/dom.js';

export class FallbackObject extends StudyObject {
  constructor(data = {}) {
    super({ ...data, type: 'fallback', width: data.width ?? 240, height: data.height ?? 140 });
    this.state = {
      fileName: data.state?.fileName || 'Unknown file',
      mimeType: data.state?.mimeType || '',
      ...data.state,
    };
  }

  buildContent(container) {
    container.innerHTML = '';
    const icon = el('div', { textContent: '📄', style: { fontSize: '28px' } });
    const name = el('div', {
      textContent: this.state.fileName,
      style: { fontWeight: '500', wordBreak: 'break-all', textAlign: 'center' },
    });
    const hint = el('div', {
      textContent: 'Preview not available',
      style: { fontSize: '12px', color: 'var(--color-text-muted)' },
    });
    container.append(icon, name, hint);
  }
}
