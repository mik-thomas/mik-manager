import { useState, useEffect } from 'react';
import {
  getLearnStats,
  getPatternSummaries,
  getLearnSettings,
  updateLearnSettings,
} from '../lib/learn';

export default function LearnTab() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener('mik-learn-updated', bump);
    const onVis = () => {
      if (document.visibilityState === 'visible') bump();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('mik-learn-updated', bump);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const stats = getLearnStats();
  const patterns = getPatternSummaries();
  const settings = getLearnSettings();

  const onGraceChange = (e) => {
    const v = parseInt(e.target.value, 10);
    if (!Number.isNaN(v) && v >= 0 && v <= 120) {
      updateLearnSettings({ graceMinutes: v });
      setTick((t) => t + 1);
    }
  };

  const onDefaultSnoozeChange = (e) => {
    const v = parseInt(e.target.value, 10);
    if (!Number.isNaN(v) && v >= 1 && v <= 120) {
      updateLearnSettings({ defaultSnoozeMinutes: v });
      setTick((t) => t + 1);
    }
  };

  return (
    <>
      <div className="greeting">
        <h1>Learn</h1>
        <p>
          The assistant remembers how long blocks actually take and how often you pause — so nudges match you, not a
          generic calendar.
        </p>
      </div>

      <div className="dashboard-grid learn-grid">
        <div className="timeline-card learn-summary">
          <h2 className="card-title">
            <span>📊</span> Signals so far
          </h2>
          <div className="learn-stats-row">
            <div>
              <div className="learn-stat-value">{stats.completionCount}</div>
              <div className="learn-stat-label">Finished blocks logged</div>
            </div>
            <div>
              <div className="learn-stat-value">{stats.procrastinationCount}</div>
              <div className="learn-stat-label">“Procrastinating” breaks</div>
            </div>
            <div>
              <div className="learn-stat-value">
                {stats.avgSnooze != null ? `${stats.avgSnooze}m` : '—'}
              </div>
              <div className="learn-stat-label">Avg snooze length</div>
            </div>
            <div>
              <div className="learn-stat-value">
                {stats.globalTypical != null ? `${stats.globalTypical}m` : '—'}
              </div>
              <div className="learn-stat-label">Typical focus chunk</div>
            </div>
          </div>
          <p className="learn-hint">
            Mark blocks complete on Hourly Focus and use “I’m procrastinating” when you need space — both teach the
            model. A future version can plug in a real LLM; today it’s transparent math on your device.
          </p>
        </div>

        <div className="timeline-card learn-settings-card">
          <h2 className="card-title">
            <span>⚙️</span> Slack & nudges
          </h2>
          <label className="learn-field">
            <span>Grace after plan (minutes)</span>
            <input
              type="number"
              min={0}
              max={120}
              value={settings.graceMinutes}
              onChange={onGraceChange}
            />
          </label>
          <p className="learn-field-help">
            Extra buffer before the coach treats you as “late” — keeps procrastination from feeling like a siren.
          </p>
          <label className="learn-field">
            <span>Default snooze (minutes)</span>
            <input
              type="number"
              min={1}
              max={120}
              value={settings.defaultSnoozeMinutes}
              onChange={onDefaultSnoozeChange}
            />
          </label>
        </div>

        <div className="timeline-card learn-patterns">
          <h2 className="card-title">
            <span>🧠</span> Patterns by block title
          </h2>
          {patterns.length === 0 ? (
            <p className="learn-empty">Complete a few blocks from Hourly Focus to see predictions here.</p>
          ) : (
            <ul className="learn-pattern-list">
              {patterns.map((p) => (
                <li key={p.key}>
                  <div className="learn-pattern-title">{p.label}</div>
                  <div className="learn-pattern-meta">
                    ~{p.predictedMinutes} min · {p.count} sample{p.count === 1 ? '' : 's'}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
