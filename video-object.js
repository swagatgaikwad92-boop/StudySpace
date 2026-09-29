import { StudyObject } from './object-base.js';
import { el } from '../utilities/dom.js';

/**
 * YouTube video object
 */
export class VideoObject extends StudyObject {
  constructor(data = {}) {
    super({ ...data, type: 'video', width: data.width ?? 420, height: data.height ?? 280 });
    this.state = {
      videoId: data.state?.videoId || null,
      url: data.state?.url || '',
      ...data.state,
    };
  }

  static extractYouTubeId(url) {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const p of patterns) {
      const m = url.trim().match(p);
      if (m) return m[1];
    }
    return null;
  }

  buildContent(container) {
    container.innerHTML = '';
    if (!this.state.videoId) {
      container.innerHTML = `<div class="object-error">Invalid or missing YouTube URL</div>`;
      return;
    }

    const wrap = el('div', {
      style: { position: 'relative', width: '100%', height: '100%', background: '#000' },
    });

    // Use privacy-enhanced embed
    const iframe = el('iframe', {
      className: 'video-embed',
      src: `https://www.youtube-nocookie.com/embed/${this.state.videoId}?enablejsapi=1&rel=0&modestbranding=1`,
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen',
      allowfullscreen: 'true',
      title: this.title || 'YouTube video',
      loading: 'lazy',
    });

    // Prevent drag when interacting with video
    iframe.addEventListener('pointerdown', (e) => e.stopPropagation());
    wrap.addEventListener('pointerdown', (e) => {
      // Allow drag from edges only
      const rect = wrap.getBoundingClientRect();
      const edge = 12;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x > edge && x < rect.width - edge && y > edge && y < rect.height - edge) {
        e.stopPropagation();
      }
    });

    // Compact seek controls overlay
    const controls = el('div', { className: 'video-controls' });
    const back10 = el('button', {
      className: 'btn-icon-sm btn',
      type: 'button',
      style: { color: 'white' },
      title: '-10s',
      'aria-label': 'Back 10 seconds',
      textContent: '−10',
    });
    const fwd10 = el('button', {
      className: 'btn-icon-sm btn',
      type: 'button',
      style: { color: 'white' },
      title: '+10s',
      'aria-label': 'Forward 10 seconds',
      textContent: '+10',
    });

    // Note: YouTube iframe API would be needed for real seek; show toast for now
    back10.addEventListener('click', (e) => {
      e.stopPropagation();
      // Limited without YT API; user can use native controls
    });
    fwd10.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    controls.append(back10, fwd10);
    wrap.append(iframe, controls);
    container.append(wrap);

    // Offline check
    if (!navigator.onLine) {
      const offline = el('div', {
        className: 'object-error',
        style: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', color: '#fff' },
        textContent: 'Video unavailable offline',
      });
      wrap.append(offline);
    }
  }
}
