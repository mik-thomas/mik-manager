/**
 * Derived metrics for the dashboard gauges (queue, week, tasks, RAG).
 */

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function getQueueMetrics(tasks, globalNotes) {
  const total = tasks.length;
  const completed = tasks.filter((t) =>
    (globalNotes[t.id] || '').toLowerCase().includes('done')
  ).length;
  const open = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, open, percent };
}

/** 0–100: how far through the current ISO week (Mon 00:00 → next Mon 00:00). */
export function getIsoWeekProgressPercent(now) {
  const d = new Date(now);
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
  const start = new Date(d);
  start.setDate(d.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + WEEK_MS);
  const t = now.getTime() - start.getTime();
  const span = end.getTime() - start.getTime();
  if (span <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((t / span) * 100)));
}

/** Backlog pressure: open items as % of queue (0 = empty queue, 100 = all open). */
export function getBacklogPercent(tasks, globalNotes) {
  const { total, open } = getQueueMetrics(tasks, globalNotes);
  if (total === 0) return 0;
  return Math.round((open / total) * 100);
}

export function getTasksBySite(tasks, globalNotes) {
  let site = { total: 0, done: 0 };
  let remote = { total: 0, done: 0 };
  for (const t of tasks) {
    const isDone = (globalNotes[t.id] || '').toLowerCase().includes('done');
    const isSite = (t.remoteSite || '').toLowerCase() === 'site';
    if (isSite) {
      site.total += 1;
      if (isDone) site.done += 1;
    } else {
      remote.total += 1;
      if (isDone) remote.done += 1;
    }
  }
  return { site, remote };
}

/**
 * RAG health score 0–100: queue completion + weekly throughput, minus heavy procrastination.
 */
export function getRagScore({ queuePercent, completionsWeek, procrastinationsWeek }) {
  let score = queuePercent * 0.55;
  score += Math.min(35, completionsWeek * 4);
  score -= Math.min(25, procrastinationsWeek * 3);
  return Math.round(Math.min(100, Math.max(0, score)));
}

export function getRagBand(score) {
  if (score >= 67) return { label: 'Green', tone: 'green' };
  if (score >= 34) return { label: 'Amber', tone: 'amber' };
  return { label: 'Red', tone: 'red' };
}
