import { idbGet, idbPut } from './database.js';

export async function getSetting(key, fallback = null) {
  try {
    const rec = await idbGet('settings', key);
    return rec ? rec.value : fallback;
  } catch {
    return fallback;
  }
}

export async function setSetting(key, value) {
  try {
    await idbPut('settings', { key, value, updatedAt: Date.now() });
  } catch (e) {
    console.warn('[SettingsStorage] set failed', e);
  }
}
