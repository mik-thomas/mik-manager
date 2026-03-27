import { useState, useEffect } from 'react';
import Gauge from './Gauge.jsx';
import {
  getQueueMetrics,
  getBacklogPercent,
  getTasksBySite,
  getRagScore,
  getRagBand,
} from '../lib/dashboardMetrics.js';
import { countCompletionsSinceMs, countProcrastinationsSinceMs } from '../lib/learn.js';
import { getWorkWeekProgressPercent, TARGET_WEEKLY_HOURS } from '../lib/workSchedule.js';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function Dashboard({ tasks, globalNotes, currentTime }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener('mik-learn-updated', bump);
    window.addEventListener('mik-schedule-updated', bump);
    return () => {
      window.removeEventListener('mik-learn-updated', bump);
      window.removeEventListener('mik-schedule-updated', bump);
    };
  }, []);

  const queue = getQueueMetrics(tasks, globalNotes);
  const weekPct = getWorkWeekProgressPercent(currentTime);
  const backlogPct = getBacklogPercent(tasks, globalNotes);
  const bySite = getTasksBySite(tasks, globalNotes);
  const completionsWeek = countCompletionsSinceMs(WEEK_MS);
  const procrastWeek = countProcrastinationsSinceMs(WEEK_MS);

  const ragScore = getRagScore({
    queuePercent: queue.percent,
    completionsWeek,
    procrastinationsWeek: procrastWeek,
  });
  const rag = getRagBand(ragScore);

  const sitePct =
    bySite.site.total === 0 ? 0 : Math.round((bySite.site.done / bySite.site.total) * 100);
  const remotePct =
    bySite.remote.total === 0 ? 0 : Math.round((bySite.remote.done / bySite.remote.total) * 100);

  return (
    <>
      <div className="greeting">
        <h1>Dashboard</h1>
        <p>
          Queue, week, backlog, and RAG (Red / Amber / Green) at a glance. Data mixes your work queue, this week’s
          rhythm, and Learn history.
        </p>
      </div>

      <div className="dash-gauges">
        <Gauge
          value={queue.percent}
          label="Queue"
          sublabel={`${queue.completed} of ${queue.total} allocations done`}
          tone="accent"
        />
        <Gauge
          value={weekPct}
          label="Week"
          sublabel={`Scheduled work vs ${TARGET_WEEKLY_HOURS}h (Mon–Tue–Thu–Fri, minus leave & bank holidays)`}
          tone="accent"
        />
        <Gauge
          value={backlogPct}
          label="Open backlog"
          sublabel={`${queue.open} task${queue.open === 1 ? '' : 's'} still open in queue`}
          tone={backlogPct > 66 ? 'amber' : 'accent'}
        />
        <Gauge value={ragScore} label="RAG health" sublabel={`${rag.label} — on track score`} tone={rag.tone} />
      </div>

      <div className="dashboard-grid dash-lower">
        <div className="timeline-card dash-panel">
          <h2 className="card-title">
            <span>📊</span> Tasks in queue
          </h2>
          <p className="dash-panel-lead">Site vs remote completion within the current queue.</p>

          <div className="dash-bar-row">
            <div className="dash-bar-head">
              <span>Site</span>
              <span>
                {bySite.site.done}/{bySite.site.total}
              </span>
            </div>
            <div className="dash-bar-track">
              <div className="dash-bar-fill site" style={{ width: `${sitePct}%` }} />
            </div>
          </div>

          <div className="dash-bar-row">
            <div className="dash-bar-head">
              <span>Remote</span>
              <span>
                {bySite.remote.done}/{bySite.remote.total}
              </span>
            </div>
            <div className="dash-bar-track">
              <div className="dash-bar-fill remote" style={{ width: `${remotePct}%` }} />
            </div>
          </div>

          <div className="dash-mini-stats">
            <div>
              <span className="dash-mini-value">{queue.open}</span>
              <span className="dash-mini-label">Open</span>
            </div>
            <div>
              <span className="dash-mini-value">{queue.completed}</span>
              <span className="dash-mini-label">Done</span>
            </div>
            <div>
              <span className="dash-mini-value">{completionsWeek}</span>
              <span className="dash-mini-label">Blocks done (7d)</span>
            </div>
            <div>
              <span className="dash-mini-value">{procrastWeek}</span>
              <span className="dash-mini-label">Snoozes (7d)</span>
            </div>
          </div>
        </div>

        <div className="timeline-card dash-panel rag-panel">
          <h2 className="card-title">
            <span>🚦</span> RAG
          </h2>
          <p className="dash-panel-lead">
            <strong>{rag.label}</strong> — score {ragScore}/100. Green means healthy throughput; amber is watch; red
            means unblock or replan.
          </p>
          <ul className="rag-legend">
            <li>
              <span className="rag-dot green" /> Green (67–100): queue and/or weekly momentum look strong.
            </li>
            <li>
              <span className="rag-dot amber" /> Amber (34–66): mixed — tighten focus or clear one open item.
            </li>
            <li>
              <span className="rag-dot red" /> Red (0–33): heavy backlog or low completion — worth a reset.
            </li>
          </ul>
          <p className="dash-footnote">
            RAG uses typed “done” in Work Queue, hourly completions from Learn, and snooze counts — all local to this
            browser.
          </p>
        </div>
      </div>
    </>
  );
}
