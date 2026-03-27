/**
 * Per-day disruption flags for schedule blocks (FIDS-style: delay, standby, cancelled).
 * Stored locally by calendar day + block id.
 */

const STORAGE_KEY = 'mik_flight_disruptions_v1';

export const DISRUPTION = {
  DELAY: 'delay',
  STANDBY: 'standby',
  CANCELLED: 'cancelled',
};

function normalizeMap(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === DISRUPTION.DELAY || v === DISRUPTION.STANDBY || v === DISRUPTION.CANCELLED) {
      out[String(k)] = v;
    }
  }
  return out;
}

export function loadDisruptions(dayKey) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const all = JSON.parse(raw);
    return normalizeMap(all[dayKey]);
  } catch {
    return {};
  }
}

export function saveDisruptionsForDay(dayKey, map) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[dayKey] = normalizeMap(map);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event('mik-disruptions-updated'));
  } catch {
    /* ignore */
  }
}
