import { useState } from 'react';
import {
  loadExclusions,
  saveExclusions,
  getScheduleSummary,
  TARGET_WEEKLY_HOURS,
  FIXED_MEETINGS,
  WELLBEING_HOURS_PER_WEEK,
} from '../lib/workSchedule.js';
import VoicePromptSettings from './VoicePromptSettings.jsx';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDateLines(text) {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const out = [];
  const bad = [];
  for (const line of lines) {
    if (DATE_RE.test(line)) {
      const d = new Date(`${line}T12:00:00`);
      if (!Number.isNaN(d.getTime())) out.push(line);
      else bad.push(line);
    } else {
      bad.push(line);
    }
  }
  return { dates: [...new Set(out)].sort(), bad };
}

export default function ScheduleSettings() {
  const summary = getScheduleSummary();
  const [bankText, setBankText] = useState(() => loadExclusions().bankHolidays.join('\n'));
  const [leaveText, setLeaveText] = useState(() => loadExclusions().annualLeave.join('\n'));
  const [saved, setSaved] = useState(false);
  const [hint, setHint] = useState('');

  const handleSave = () => {
    const b = parseDateLines(bankText);
    const l = parseDateLines(leaveText);
    const bad = [...b.bad, ...l.bad];
    if (bad.length) {
      setHint(`Skipped lines that are not YYYY-MM-DD: ${bad.slice(0, 5).join(', ')}${bad.length > 5 ? '…' : ''}`);
    } else {
      setHint('');
    }
    saveExclusions({ bankHolidays: b.dates, annualLeave: l.dates });
    setSaved(true);
    window.dispatchEvent(new Event('mik-schedule-updated'));
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <div className="greeting">
        <h1>Settings</h1>
        <p>Your compressed week, hours, and days off — used for the Dashboard “Week” gauge.</p>
      </div>

      <div className="dashboard-grid settings-grid">
        <div className="timeline-card settings-card">
          <h2 className="card-title">
            <span>📋</span> Your contract pattern
          </h2>
          <ul className="settings-facts">
            <li>
              <strong>{TARGET_WEEKLY_HOURS}h</strong> per week ({summary.workingDaysLabel} — no Wednesday).
            </li>
            <li>
              <strong>{summary.dayHoursLabel}</strong> (lunch {summary.lunchLabel}).
            </li>
            <li>
              <strong>Wellbeing:</strong> {WELLBEING_HOURS_PER_WEEK}h flex in the week (take anytime — not auto-blocked yet).
            </li>
            <li>
              <strong>Team meetings:</strong>{' '}
              {FIXED_MEETINGS.map((m) => `${m.day === 2 ? 'Tue' : 'Thu'} ${m.start}–${m.end}`).join('; ')}.
            </li>
          </ul>
          <p className="settings-note">
            Bank holidays and annual leave below remove a day from “working” for the week gauge. Add UK bank dates you
            observe, plus any leave you’ve booked.
          </p>
        </div>

        <div className="timeline-card settings-card">
          <h2 className="card-title">
            <span>🚫</span> Bank holidays
          </h2>
          <p className="settings-field-help">One date per line, format <code>YYYY-MM-DD</code> (e.g. 2025-12-25).</p>
          <textarea
            className="notes-area settings-dates"
            value={bankText}
            onChange={(e) => setBankText(e.target.value)}
            placeholder={'2025-12-25\n2026-01-01'}
            rows={6}
          />
        </div>

        <div className="timeline-card settings-card">
          <h2 className="card-title">
            <span>🏖️</span> Annual leave
          </h2>
          <p className="settings-field-help">Booked leave days — same format, one per line.</p>
          <textarea
            className="notes-area settings-dates"
            value={leaveText}
            onChange={(e) => setLeaveText(e.target.value)}
            placeholder={'2026-08-10\n2026-08-11'}
            rows={6}
          />
        </div>

        <VoicePromptSettings />
      </div>

      <div className="settings-actions">
        <button type="button" className="btn primary" onClick={handleSave}>
          Save schedule &amp; exclusions
        </button>
        {saved && <span className="settings-saved">Saved.</span>}
        {hint && <span className="settings-hint">{hint}</span>}
      </div>
    </>
  );
}
