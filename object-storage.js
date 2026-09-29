import { idbGet, idbGetAll, idbPut, idbDelete } from './database.js';

export async function loadAllObjects() {
  try {
    return await idbGetAll('objects');
  } catch (e) {
    console.warn('[ObjectStorage] loadAll failed', e);
    return [];
  }
}

export async function saveObject(obj) {
  try {
    // Strip non-serializable runtime props
    const record = {
      id: obj.id,
      type: obj.type,
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      zIndex: obj.zIndex,
      createdAt: obj.createdAt,
      updatedAt: Date.now(),
      title: obj.title || '',
      titleVisible: obj.titleVisible !== false,
      state: obj.state || {},
    };
    await idbPut('objects', record);
  } catch (e) {
    console.warn('[ObjectStorage] save failed', e);
    throw e;
  }
}

export async function deleteObjectRecord(id) {
  try {
    await idbDelete('objects', id);
  } catch (e) {
    console.warn('[ObjectStorage] delete failed', e);
  }
}

export async function saveAllObjects(objects) {
  for (const obj of objects) {
    await saveObject(obj);
  }
}
