import { useState, useEffect } from 'react';
import { getStressEvents, generate121Report, formatDurationShort } from '../lib/stress.js';

export default function StressReport() {
  const [, bump] = useState(0);

  useEffect(() => {
    const onUpdate = () => bump((n) => n + 1);
    window.addEventListener('mik-stress-updated', onUpdate);
    return () => window.removeEventListener('mik-stress-updated', onUpdate);
  }, []);

  const events = getStressEvents();
  const reportText = generate121Report(events);

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
    } catch {
      /* ignore */
    }
  };

  const totalMin = events.reduce((a, e) => a + (e.durationMinutes || 0), 0);

  return (
    <>
      <div className="greeting">
        <h1>Stress log &amp; 1:1 report</h1>
        <p>
          Evidence you log here stays on this device. Use the <strong>StressOmeter</strong> on Hourly Focus to record
          when stress starts and ends — it attaches to the schedule block you were in.           For a fuller monthly conversation with your line manager, use <strong>Issues log</strong> (tag problems for
          team vs 1:1) and <strong>1:1 alignment</strong> in the sidebar: business plan, team objectives, role spec,
          PDRs, issues, and a combined brief that includes this stress log.
        </p>
      </div>

      <div className="dashboard-grid stress-report-grid">
        <div className="timeline-card">
          <h2 className="card-title">
            <span>📋</span> Recent events
          </h2>
          <p className="settings-note">
            {events.length === 0
              ? 'No sessions yet. When you’re stressed, start recording from the departure board.'
              : `${events.length} session(s) · ~${Math.round(totalMin * 10) / 10} min total logged.`}
          </p>
          <ul className="stress-event-list">
            {events.slice(0, 40).map((e) => {
              const d = new Date(e.startedAt);
              return (
                <li key={e.id} className="stress-event-item">
                  <div className="stress-event-meta">
                    {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
                    {formatDurationShort(e.durationMinutes)}
                  </div>
                  <div className="stress-event-block">{e.blockTitle}</div>
                  {e.triggerNote && <div className="stress-event-note">{e.triggerNote}</div>}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="timeline-card">
          <h2 className="card-title">
            <span>📄</span> Report for line manager (1:1)
          </h2>
          <p className="settings-note">
            Copy this into an email or doc before your 1:1. It summarises dates, duration, linked block, and what you
            said triggered the stress.
          </p>
          <button type="button" className="btn primary" onClick={copyReport}>
            Copy report to clipboard
          </button>
          <pre className="stress-report-pre">{reportText}</pre>
        </div>
      </div>
    </>
  );
}
