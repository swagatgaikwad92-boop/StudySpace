import { idbGet, idbPut } from './database.js';

const WORKSPACE_ID = 'main';

export async function loadWorkspace() {
  try {
    const data = await idbGet('workspace', WORKSPACE_ID);
    return data || {
      id: WORKSPACE_ID,
      viewport: { x: 0, y: 0, zoom: 1 },
      updatedAt: Date.now(),
    };
  } catch (e) {
    console.warn('[WorkspaceStorage] load failed', e);
    return {
      id: WORKSPACE_ID,
      viewport: { x: 0, y: 0, zoom: 1 },
      updatedAt: Date.now(),
    };
  }
}

export async function saveWorkspace(data) {
  try {
    await idbPut('workspace', {
      id: WORKSPACE_ID,
      ...data,
      updatedAt: Date.now(),
    });
  } catch (e) {
    console.warn('[WorkspaceStorage] save failed', e);
    if (e.name === 'QuotaExceededError') {
      throw new Error('Storage full. Try removing some large files.');
    }
    throw e;
  }
}
