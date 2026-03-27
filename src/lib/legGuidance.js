/**
 * Per–schedule-block guidance: tips, stakeholders, links — shown when that block is active.
 * Keyed by block id (same ids as your day schedule). Local only.
 */

const STORAGE_KEY = 'mik_leg_guidance_v1';

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    return p && typeof p === 'object' ? p : {};
  } catch {
    return {};
  }
}

function saveAll(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event('mik-leg-guidance-updated'));
}

export function getLegGuidance(blockId) {
  if (blockId == null) return '';
  const all = loadAll();
  const v = all[String(blockId)];
  return typeof v === 'string' ? v : '';
}

export function setLegGuidance(blockId, text) {
  if (blockId == null) return;
  const all = loadAll();
  const t = (text || '').trim();
  if (!t) {
    delete all[String(blockId)];
  } else {
    all[String(blockId)] = t;
  }
  saveAll(all);
}
