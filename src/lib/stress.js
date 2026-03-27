/**
 * StressOmeter: logged stress periods linked to the schedule block you were in.
 * Local only — for evidence in 1:1s with your line manager.
 */

const STORAGE_KEY = 'mik_stress_v1';

function loadRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { events: [] };
    const p = JSON.parse(raw);
    return { events: Array.isArray(p.events) ? p.events : [] };
  } catch {
    return { events: [] };
  }
}

function saveRaw(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event('mik-stress-updated'));
}

export function getStressEvents() {
  return loadRaw().events.slice().sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
}

export function addStressEvent({
  startedAt,
  endedAt,
  blockId,
  blockTitle,
  blockTime,
  triggerNote,
}) {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  const durationMs = Math.max(0, end - start);
  const durationMinutes = Math.round((durationMs / 60000) * 10) / 10;

  const event = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now()}`,
    startedAt: new Date(startedAt).toISOString(),
    endedAt: new Date(endedAt).toISOString(),
    durationMinutes,
    blockId: blockId ?? null,
    blockTitle: blockTitle || 'Unknown block',
    blockTime: blockTime || '',
    triggerNote: (triggerNote || '').trim(),
  };

  const data = loadRaw();
  data.events.push(event);
  if (data.events.length > 500) {
    data.events = data.events.slice(-500);
  }
  saveRaw(data);
  return event;
}

export function formatDurationShort(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Plain-text report for 1:1 / line manager conversations.
 */
export function generate121Report(events, options = {}) {
  const { maxEvents = 50 } = options;
  const list = events.slice(0, maxEvents);
  const lines = [];
  const gen = new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  lines.push('Stress log — for 1:1 discussion');
  lines.push(`Generated: ${gen}`);
  lines.push('');
  lines.push(
    'Below is a record of stress periods you logged in Mik Manager. Each entry links to the schedule block you were in and how long the stress lasted. Use this as evidence when asking for support.'
  );
  lines.push('');

  if (!list.length) {
    lines.push('No stress events recorded yet.');
    return lines.join('\n');
  }

  let totalMin = 0;
  list.forEach((e, i) => {
    const d = new Date(e.startedAt);
    const day = d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const t0 = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const t1 = new Date(e.endedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    totalMin += e.durationMinutes || 0;

    lines.push(`${i + 1}. ${day}`);
    lines.push(`   Time: ${t0} – ${t1} (~${formatDurationShort(e.durationMinutes)})`);
    lines.push(`   During schedule block: "${e.blockTitle}"${e.blockTime ? ` (slot ${e.blockTime})` : ''}`);
    lines.push(`   What triggered it / context: ${e.triggerNote || 'Not recorded — add notes when you end a session next time.'}`);
    lines.push('');
  });

  lines.push('—');
  lines.push(
    `Summary: ${list.length} event(s) in this export, ~${Math.round(totalMin * 10) / 10} minutes total logged stress time.`
  );
  lines.push('');
  lines.push('This data stays on your device unless you choose to share it.');

  return lines.join('\n');
}
