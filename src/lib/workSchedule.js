/**
 * Compressed week: Mon, Tue, Thu, Fri — 36.15h target, 08:00–17:30 with ~30m lunch.
 * Bank holidays & annual leave exclude a day. Team meetings & wellbeing are informational.
 */

export const TARGET_WEEKLY_HOURS = 36.15;

/** JS getDay(): 0 Sun … 6 Sat — working Mon(1), Tue(2), Thu(4), Fri(5) */
export const WORKING_WEEKDAYS = new Set([1, 2, 4, 5]);

export const DAY_START_MINUTES = 8 * 60;
export const DAY_END_MINUTES = 17 * 60 + 30;

/** Default lunch block (30m) — adjust here if your break moves */
export const LUNCH_START_MINUTES = 12 * 60;
export const LUNCH_END_MINUTES = 12 * 60 + 30;

export const FIXED_MEETINGS = [
  { day: 2, label: 'Team meeting', start: '09:30', end: '10:00' },
  { day: 4, label: 'Team meeting', start: '12:00', end: '13:00' },
];

export const WELLBEING_HOURS_PER_WEEK = 1;

const STORAGE_KEY = 'mik_schedule_exclusions_v1';

function defaultExclusions() {
  return { bankHolidays: [], annualLeave: [] };
}

export function loadExclusions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultExclusions();
    const p = JSON.parse(raw);
    return {
      bankHolidays: Array.isArray(p.bankHolidays) ? p.bankHolidays : [],
      annualLeave: Array.isArray(p.annualLeave) ? p.annualLeave : [],
    };
  } catch {
    return defaultExclusions();
  }
}

export function saveExclusions(exclusions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(exclusions));
}

export function dateKey(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isCompressedWorkWeekday(d) {
  return WORKING_WEEKDAYS.has(d.getDay());
}

export function isExcludedDate(d, exclusions = loadExclusions()) {
  const key = dateKey(d);
  return exclusions.bankHolidays.includes(key) || exclusions.annualLeave.includes(key);
}

/** True if this calendar day is a paid working day under your pattern (not Wed, not weekend, not leave/holiday). */
export function isWorkingDay(d, exclusions = loadExclusions()) {
  if (!isCompressedWorkWeekday(d)) return false;
  return !isExcludedDate(d, exclusions);
}

export function dailyTargetMinutes() {
  return (TARGET_WEEKLY_HOURS * 60) / 4;
}

function minutesOfDay(d) {
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60 + d.getMilliseconds() / 60000;
}

function overlapLen(a0, a1, b0, b1) {
  const s = Math.max(a0, b0);
  const e = Math.min(a1, b1);
  return Math.max(0, e - s);
}

/**
 * Net work minutes elapsed on `d`'s calendar day up to `now` (same local day as `now`).
 */
export function workMinutesElapsedOnLocalDay(now) {
  const d = new Date(now);
  const exclusions = loadExclusions();
  if (!isWorkingDay(d, exclusions)) return 0;

  const mod = minutesOfDay(now);
  if (mod < DAY_START_MINUTES) return 0;
  const cap = Math.min(mod, DAY_END_MINUTES);
  let gross = cap - DAY_START_MINUTES;
  const lunchOverlap = overlapLen(DAY_START_MINUTES, cap, LUNCH_START_MINUTES, LUNCH_END_MINUTES);
  const net = Math.max(0, gross - lunchOverlap);
  return Math.min(net, dailyTargetMinutes());
}

/**
 * Minutes of scheduled work elapsed this ISO week (Mon 00:00 → Sun) for Mon/Tue/Thu/Fri pattern,
 * excluding bank holidays & annual leave. Capped vs weekly target.
 */
export function getScheduledWorkMinutesElapsedThisWeek(now) {
  const exclusions = loadExclusions();
  const d = new Date(now);
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - diffToMonday);
  weekStart.setHours(0, 0, 0, 0);

  const todayKey = dateKey(now);
  const dailyFull = dailyTargetMinutes();
  let total = 0;

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStart.getTime() + i * 86400000);
    if (!isWorkingDay(dayDate, exclusions)) continue;

    const key = dateKey(dayDate);
    if (key < todayKey) {
      total += dailyFull;
    } else if (key === todayKey) {
      total += workMinutesElapsedOnLocalDay(now);
    }
  }

  return Math.min(total, TARGET_WEEKLY_HOURS * 60);
}

/** 0–100: elapsed scheduled work this week vs 36.15h contract. */
export function getWorkWeekProgressPercent(now) {
  const target = TARGET_WEEKLY_HOURS * 60;
  if (target <= 0) return 0;
  const elapsed = getScheduledWorkMinutesElapsedThisWeek(now);
  return Math.min(100, Math.max(0, Math.round((elapsed / target) * 100)));
}

export function getScheduleSummary() {
  const ex = loadExclusions();
  return {
    targetWeeklyHours: TARGET_WEEKLY_HOURS,
    workingDaysLabel: 'Monday, Tuesday, Thursday, Friday',
    dayHoursLabel: '08:00–17:30 (≈30 min lunch)',
    lunchLabel: `${String(Math.floor(LUNCH_START_MINUTES / 60)).padStart(2, '0')}:${String(LUNCH_START_MINUTES % 60).padStart(2, '0')}–${String(Math.floor(LUNCH_END_MINUTES / 60)).padStart(2, '0')}:${String(LUNCH_END_MINUTES % 60).padStart(2, '0')}`,
    meetings: FIXED_MEETINGS,
    wellbeingHours: WELLBEING_HOURS_PER_WEEK,
    bankHolidaysCount: ex.bankHolidays.length,
    annualLeaveCount: ex.annualLeave.length,
  };
}
