/**
 * Local "learn how I work" layer: rolling history + simple predictions.
 * Copy reads personal but uses templates + your data — swap in an LLM later if you want.
 */

const STORAGE_KEY = 'mik_learn_v1';

const defaultState = () => ({
  completions: [],
  procrastinations: [],
  settings: {
    defaultSnoozeMinutes: 15,
    graceMinutes: 10,
  },
});

function loadRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      ...defaultState(),
      ...parsed,
      settings: { ...defaultState().settings, ...(parsed.settings || {}) },
    };
  } catch {
    return defaultState();
  }
}

function saveRaw(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function normalizeTaskKey(title) {
  if (!title || typeof title !== 'string') return '';
  return title.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 96);
}

/** Exponential moving average: recent completions weigh more. */
function emaMinutes(minutesList) {
  if (!minutesList.length) return null;
  const alpha = 0.35;
  let ema = minutesList[0];
  for (let i = 1; i < minutesList.length; i++) {
    ema = alpha * minutesList[i] + (1 - alpha) * ema;
  }
  return Math.max(1, Math.round(ema * 10) / 10);
}

export function recordTaskCompletion(title, minutesActual) {
  const taskKey = normalizeTaskKey(title);
  if (!taskKey || minutesActual == null || Number.isNaN(minutesActual)) return;
  const m = Math.max(0.5, Math.round(minutesActual * 10) / 10);
  const state = loadRaw();
  state.completions.push({
    taskKey,
    label: title.trim().slice(0, 200),
    minutes: m,
    at: new Date().toISOString(),
  });
  if (state.completions.length > 500) {
    state.completions = state.completions.slice(-500);
  }
  saveRaw(state);
}

export function recordProcrastination(snoozeMinutes) {
  const m = Math.max(1, Math.round(Number(snoozeMinutes) || 15));
  const state = loadRaw();
  state.procrastinations.push({
    snoozeMinutes: m,
    at: new Date().toISOString(),
  });
  if (state.procrastinations.length > 200) {
    state.procrastinations = state.procrastinations.slice(-200);
  }
  saveRaw(state);
}

export function updateLearnSettings(partial) {
  const state = loadRaw();
  state.settings = { ...state.settings, ...partial };
  saveRaw(state);
}

export function getLearnSettings() {
  return { ...loadRaw().settings };
}

export function getPredictedMinutes(title) {
  const taskKey = normalizeTaskKey(title);
  const state = loadRaw();
  const list = state.completions.filter((c) => c.taskKey === taskKey).map((c) => c.minutes);
  if (!list.length) return null;
  return emaMinutes(list);
}

export function getGlobalTypicalMinutes() {
  const state = loadRaw();
  const list = state.completions.map((c) => c.minutes);
  if (!list.length) return null;
  return emaMinutes(list);
}

export function averageProcrastinationSnoozeMinutes() {
  const state = loadRaw();
  const p = state.procrastinations;
  if (!p.length) return null;
  const sum = p.reduce((a, b) => a + b.snoozeMinutes, 0);
  return Math.round((sum / p.length) * 10) / 10;
}

export function getPatternSummaries() {
  const state = loadRaw();
  const byKey = new Map();
  for (const c of state.completions) {
    if (!byKey.has(c.taskKey)) {
      byKey.set(c.taskKey, { label: c.label, minutes: [] });
    }
    const entry = byKey.get(c.taskKey);
    if (c.label && c.label.length > (entry.label?.length || 0)) entry.label = c.label;
    entry.minutes.push(c.minutes);
  }
  const patterns = [...byKey.entries()].map(([key, v]) => ({
    key,
    label: v.label || key,
    count: v.minutes.length,
    predictedMinutes: emaMinutes(v.minutes),
  }));
  patterns.sort((a, b) => b.count - a.count);
  return patterns;
}

export function getLearnStats() {
  const state = loadRaw();
  return {
    completionCount: state.completions.length,
    procrastinationCount: state.procrastinations.length,
    avgSnooze: averageProcrastinationSnoozeMinutes(),
    globalTypical: getGlobalTypicalMinutes(),
  };
}

export function countCompletionsSinceMs(periodMs) {
  const state = loadRaw();
  const cutoff = Date.now() - periodMs;
  return state.completions.filter((c) => new Date(c.at).getTime() >= cutoff).length;
}

export function countProcrastinationsSinceMs(periodMs) {
  const state = loadRaw();
  const cutoff = Date.now() - periodMs;
  return state.procrastinations.filter((p) => new Date(p.at).getTime() >= cutoff).length;
}

/**
 * Coach copy for the focus surface — uses your history, not an API.
 */
export function buildCoachMessage({
  activeTitle,
  nextTitle,
  predictedActive,
  predictedNext,
  inSnooze,
  snoozeEndsAt,
  graceMinutes,
}) {
  if (inSnooze && snoozeEndsAt) {
    const t = snoozeEndsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `You're allowed to drift. I'll nudge again after ${t}. New tasks still get room to breathe.`;
  }
  const parts = [];
  if (activeTitle) {
    const p = predictedActive != null ? ` You’ve recently needed about ${predictedActive} min for similar blocks.` : '';
    parts.push(`Stay with “${activeTitle}” for now.${p}`);
  }
  if (nextTitle) {
    const p = predictedNext != null ? ` (~${predictedNext} min based on your pace)` : '';
    parts.push(`Next up when you’re ready: ${nextTitle}${p}.`);
  }
  if (graceMinutes != null && graceMinutes > 0) {
    parts.push(`I’ll treat ~${graceMinutes} min past the plan as normal slack, not failure.`);
  }
  return parts.join(' ');
}
