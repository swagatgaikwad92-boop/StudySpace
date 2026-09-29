import { idbGet, idbPut, idbDelete } from './database.js';

export async function saveFile(id, blob, meta = {}) {
  try {
    await idbPut('files', {
      id,
      blob,
      mimeType: blob.type || meta.mimeType || 'application/octet-stream',
      name: meta.name || '',
      size: blob.size,
      createdAt: Date.now(),
    });
  } catch (e) {
    console.warn('[FileStorage] save failed', e);
    if (e.name === 'QuotaExceededError') {
      throw new Error('Not enough storage space for this file.');
    }
    throw e;
  }
}

export async function loadFile(id) {
  try {
    const record = await idbGet('files', id);
    return record || null;
  } catch (e) {
    console.warn('[FileStorage] load failed', e);
    return null;
  }
}

export async function deleteFile(id) {
  try {
    await idbDelete('files', id);
  } catch (e) {
    console.warn('[FileStorage] delete failed', e);
  }
}

/** Create object URL and track for later revoke */
const urlCache = new Map();

export function getObjectURL(id, blob) {
  if (urlCache.has(id)) return urlCache.get(id);
  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}

export function revokeObjectURL(id) {
  const url = urlCache.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(id);
  }
}

export function revokeAllObjectURLs() {
  for (const url of urlCache.values()) URL.revokeObjectURL(url);
  urlCache.clear();
}
