/**
 * Per-day checkbox state: which schedule blocks you've marked done vs where time says you are.
 */

const STORAGE_KEY = 'mik_day_checks_v1';

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadDayChecksSet() {
  const key = todayKey();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const all = JSON.parse(raw);
    const arr = Array.isArray(all[key]) ? all[key] : [];
    return new Set(arr.map(Number));
  } catch {
    return new Set();
  }
}

export function saveDayChecksSet(set) {
  const key = todayKey();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[key] = [...set];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

/**
 * Minimum block ticks the clock expects by now (blocks 0..expectedMin-1 should be done).
 */
export function getExpectedMinBlocks(scheduleWithDates, currentMs, activeBlockIndex) {
  const n = scheduleWithDates.length;
  if (n === 0) return 0;
  if (activeBlockIndex >= 0) return activeBlockIndex;
  if (currentMs < scheduleWithDates[0].startTime.getTime()) return 0;
  if (currentMs >= scheduleWithDates[n - 1].endTime.getTime()) return n;
  let e = 0;
  for (let i = 0; i < n; i++) {
    if (currentMs >= scheduleWithDates[i].endTime.getTime()) e = i + 1;
  }
  return e;
}

/**
 * @param {number} scheduleLen
 * @param {number} activeBlockIndex current block index, or -1 in gaps / off
 * @param {number} checkedCount number of blocks ticked done today
 * @param {number} expectedMin from getExpectedMinBlocks
 */
/**
 * First scheduled leg for the next calendar day, using the same template as `scheduleWithDates`
 * (times stay as template clock labels; date is tomorrow relative to `referenceDate`).
 */
export function getTomorrowFirstLegPreview(scheduleWithDates, referenceDate = new Date()) {
  if (!Array.isArray(scheduleWithDates) || scheduleWithDates.length === 0) return null;
  const first = scheduleWithDates[0];
  const d = new Date(referenceDate);
  d.setDate(d.getDate() + 1);
  const dateLabel = d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return {
    dateLabel,
    time: first.time,
    title: first.title,
    detail: first.detail ?? '',
    duration: first.duration,
  };
}

export function getPlanVsYouSummary(scheduleLen, activeBlockIndex, checkedCount, expectedMin) {
  const planStep =
    activeBlockIndex >= 0
      ? activeBlockIndex + 1
      : Math.min(scheduleLen, expectedMin + 1);
  const delta = checkedCount - expectedMin;

  let label = 'on-track';
  if (delta < 0) label = 'behind';
  else if (delta > 0) label = 'ahead';

  return {
    scheduleLen,
    planStep,
    checkedCount,
    expectedMin,
    delta,
    label,
  };
}
