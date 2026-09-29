import { prefersReducedMotion } from '../utilities/dom.js';

/**
 * Subtle grid wave effect originating from a point
 */
export function playGridWave(originEl, type = 'work') {
  if (prefersReducedMotion()) return;

  const wave = document.getElementById('grid-wave');
  if (!wave) return;

  let x = 50;
  let y = 50;

  if (originEl) {
    const rect = originEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x = (cx / window.innerWidth) * 100;
    y = (cy / window.innerHeight) * 100;
  }

  wave.style.setProperty('--wave-x', `${x}%`);
  wave.style.setProperty('--wave-y', `${y}%`);
  wave.classList.remove('active', 'break-wave');
  // Force reflow
  void wave.offsetWidth;

  if (type === 'break') wave.classList.add('break-wave');
  wave.classList.add('active');

  setTimeout(() => {
    wave.classList.remove('active', 'break-wave');
  }, 1300);
}
