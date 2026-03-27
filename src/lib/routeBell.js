/**
 * Route bell check-ins — like a driver ringing at each station along the daily plan.
 * Per calendar day + block id. Local only.
 */

const STORAGE_KEY = 'mik_route_bells_v1';

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

function saveAll(all) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event('mik-bells-updated'));
}

/** @returns {Set<number>} block ids that have been rung today */
export function getBellCheckinsForDay(dayKey) {
  const all = loadAll();
  const day = all[dayKey];
  if (!day || typeof day !== 'object') return new Set();
  return new Set(Object.keys(day).map((k) => Number(k)));
}

export function hasRungBell(dayKey, blockId) {
  const all = loadAll();
  const day = all[dayKey];
  if (!day) return false;
  return Boolean(day[String(blockId)]);
}

export function recordBellCheckin(dayKey, blockId) {
  const all = loadAll();
  if (!all[dayKey]) all[dayKey] = {};
  all[dayKey][String(blockId)] = new Date().toISOString();
  saveAll(all);
}

/** Short ding — Web Audio API, no external assets */
export function playRouteBellSound() {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close();
  } catch {
    /* ignore */
  }
}
