import React, { useState, useEffect } from 'react';
import LearnTab from './components/LearnTab.jsx';
import {
  recordTaskCompletion,
  recordProcrastination,
  getPredictedMinutes,
  getLearnSettings,
  buildCoachMessage,
} from './lib/learn';

const SNOOZE_KEY = 'mik_snooze_until';

function readSnoozeFromStorage() {
  const raw = localStorage.getItem(SNOOZE_KEY);
  if (!raw) return null;
  const d = new Date(raw);
  if (d.getTime() <= Date.now()) {
    localStorage.removeItem(SNOOZE_KEY);
    return null;
  }
  return d;
}

const INITIAL_TASKS = [
  { id: 1, localOffice: "N & W Gloucester", assessor: "Helen", eventDate: "15 October 2025", remoteSite: "Site", shadowedBy: "Jeremy" },
  { id: 2, localOffice: "CA Three Rivers", assessor: "Amanda", eventDate: "11 November 2025", remoteSite: "Remote", shadowedBy: "Claire" },
  { id: 3, localOffice: "CA SE Staffs", assessor: "Amanda", eventDate: "18 November 2025", remoteSite: "Site", shadowedBy: "None" }
];

const MOCK_SCHEDULE = [
  { id: 101, time: "09:00", duration: 60, title: "Review Daily Allocations", detail: "Check Work Queue, update statuses" },
  { id: 102, time: "10:00", duration: 60, title: "Prep: Assessor Meeting (CA Three Rivers)", detail: "Review files for Amanda's event" },
  { id: 103, time: "11:00", duration: 60, title: "Meeting with Amanda (Remote)", detail: "Discuss CA Three Rivers site details" },
  { id: 104, time: "12:00", duration: 60, title: "Lunch Break", detail: "Step away from the desk!" },
  { id: 105, time: "13:00", duration: 90, title: "Write-up: Shadow notes for Jeremy", detail: "N & W Gloucester report" },
  { id: 106, time: "14:30", duration: 90, title: "Deep Work: Process CA SE Staffs inputs", detail: "Focus session. Do not disturb." },
  { id: 107, time: "16:00", duration: 60, title: "Daily Review & Wrap-up", detail: "Plan allocations for tomorrow" },
  { id: 108, time: "17:00", duration: 120, title: "End of Day", detail: "Workday is complete" }
];

const createDateFromTime = (timeStr) => {
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
  return d;
};

const scheduleWithDates = MOCK_SCHEDULE.map(block => {
  const startTime = createDateFromTime(block.time);
  const endTime = new Date(startTime.getTime() + block.duration * 60000);
  return { ...block, startTime, endTime };
});

function padZero(num) {
  return num.toString().padStart(2, '0');
}

function App() {
  const [activeTab, setActiveTab] = useState('hourly');
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [activeTaskNotes, setActiveTaskNotes] = useState(
    () => localStorage.getItem('mik_daily_notes') || ''
  );
  const [globalNotes, setGlobalNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mik_global_notes') || '{}');
    } catch {
      return {};
    }
  });
  const [taskTiming, setTaskTiming] = useState(() => {
    const raw = localStorage.getItem('mik_task_timing');
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  });
  const [snoozeUntil, setSnoozeUntil] = useState(() => readSnoozeFromStorage());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setSnoozeUntil((prev) => {
        if (!prev || now.getTime() < prev.getTime()) return prev;
        localStorage.removeItem(SNOOZE_KEY);
        return null;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNotesChange = (e) => {
    setActiveTaskNotes(e.target.value);
    localStorage.setItem('mik_daily_notes', e.target.value);
  };

  const handleGlobalNoteChange = (taskId, text) => {
    const updated = { ...globalNotes, [taskId]: text };
    setGlobalNotes(updated);
    localStorage.setItem('mik_global_notes', JSON.stringify(updated));
  }

  const toggleTimer = (taskId) => {
    setTaskTiming(prev => {
      const current = prev[taskId] || { totalElapsed: 0, isRunning: false, lastStartTime: null };
      const now = new Date().getTime();
      let updated;
      if (current.isRunning) {
        updated = { ...current, isRunning: false, totalElapsed: current.totalElapsed + (now - current.lastStartTime), lastStartTime: null };
      } else {
        updated = { ...current, isRunning: true, lastStartTime: now };
      }
      const newTiming = { ...prev, [taskId]: updated };
      localStorage.setItem('mik_task_timing', JSON.stringify(newTiming));
      return newTiming;
    });
  };

  const getElapsedSeconds = (taskId) => {
    const timing = taskTiming[taskId];
    if (!timing) return 0;
    let elapsed = timing.totalElapsed;
    if (timing.isRunning && timing.lastStartTime) {
      elapsed += (currentTime.getTime() - timing.lastStartTime);
    }
    return Math.floor(elapsed / 1000);
  };

  const formatElapsed = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${padZero(h)}:${padZero(m)}:${padZero(s)}`;
  };

  // Calculate Active Block
  let activeBlockIndex = -1;
  const currentMs = currentTime.getTime();
  for (let i = 0; i < scheduleWithDates.length; i++) {
    if (currentMs >= scheduleWithDates[i].startTime.getTime() && currentMs < scheduleWithDates[i].endTime.getTime()) {
      activeBlockIndex = i;
      break;
    }
  }
  if (activeBlockIndex === -1 && currentMs < scheduleWithDates[0].startTime.getTime()) {
    activeBlockIndex = 0;
  }

  const activeBlock = activeBlockIndex !== -1 ? scheduleWithDates[activeBlockIndex] : null;

  let countdownText = "00:00:00";
  let countdownPercentage = 0;
  if (activeBlock) {
    const remainingMs = Math.max(0, activeBlock.endTime.getTime() - currentMs);
    const totalMs = activeBlock.duration * 60000;
    const h = Math.floor(remainingMs / 3600000);
    const m = Math.floor((remainingMs % 3600000) / 60000);
    const s = Math.floor((remainingMs % 60000) / 1000);
    countdownText = `${padZero(h)}:${padZero(m)}:${padZero(s)}`;
    countdownPercentage = Math.round((remainingMs / totalMs) * 100);
  }

  const formatTimeHM = (date) => `${date.getHours()}:${padZero(date.getMinutes())}`;

  const nextBlock =
    activeBlockIndex >= 0 && activeBlockIndex < scheduleWithDates.length - 1
      ? scheduleWithDates[activeBlockIndex + 1]
      : null;

  const inSnooze = Boolean(snoozeUntil && currentTime < snoozeUntil);
  const graceMinutes = getLearnSettings().graceMinutes;
  const predictedActive = activeBlock ? getPredictedMinutes(activeBlock.title) : null;
  const predictedNext = nextBlock ? getPredictedMinutes(nextBlock.title) : null;
  const coachMessage = buildCoachMessage({
    activeTitle: activeBlock?.title,
    nextTitle: nextBlock?.title,
    predictedActive,
    predictedNext,
    inSnooze,
    snoozeEndsAt: inSnooze ? snoozeUntil : null,
    graceMinutes,
  });

  const handleMarkComplete = () => {
    if (!activeBlock) return;
    const minutes = getElapsedSeconds(activeBlock.id) / 60;
    recordTaskCompletion(activeBlock.title, minutes);
    if (taskTiming[activeBlock.id]?.isRunning) toggleTimer(activeBlock.id);
    window.dispatchEvent(new Event('mik-learn-updated'));
  };

  const handleProcrastinate = (minutes) => {
    const m = minutes ?? getLearnSettings().defaultSnoozeMinutes;
    recordProcrastination(m);
    const end = new Date(currentTime.getTime() + m * 60000);
    setSnoozeUntil(end);
    localStorage.setItem(SNOOZE_KEY, end.toISOString());
    window.dispatchEvent(new Event('mik-learn-updated'));
  };

  const handleEndSnooze = () => {
    setSnoozeUntil(null);
    localStorage.removeItem(SNOOZE_KEY);
  };

  // VIEWS
  const renderHourlyFocus = () => (
    <>
      <div className="greeting">
        <h1>Hourly Tracker</h1>
        <p>{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • Keep momentum, stay on track.</p>
      </div>

      <div className="dashboard-grid">
        <div className="layout-main">
          <div className="active-block">
            {activeBlock ? (
              <>
                <div className={`status-label ${inSnooze ? 'snooze' : ''}`}>
                  <span className={`pulse-led ${inSnooze ? 'snooze-led' : ''}`}></span>
                  {inSnooze
                    ? 'BREAK: SPACE YOU CHOSE'
                    : 'ACTIVE HOUR: NUDGE, NOT SHAME'}
                </div>
                <h2 className="current-task-title">{activeBlock.title}</h2>
                {predictedActive != null && (
                  <p className="predicted-pill">Learned pace: ~{predictedActive} min for similar blocks</p>
                )}
                <div className="countdown">{countdownText}</div>
                <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>Until {formatTimeHM(activeBlock.endTime)}</p>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '24px' }}>
                  <div style={{ height: '100%', width: `${countdownPercentage}%`, background: 'var(--accent)', transition: 'width 1s linear' }} />
                </div>
                <div className="coach-card">
                  <p className="coach-text">{coachMessage}</p>
                  {nextBlock && (
                    <p className="coach-next">
                      Next when you’re ready: <strong>{nextBlock.title}</strong>
                      {predictedNext != null && <span> · ~{predictedNext} min from your history</span>}
                    </p>
                  )}
                </div>
                <div className="block-actions" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <button type="button" className="btn primary" onClick={handleMarkComplete}>
                    Mark complete
                  </button>
                  <button
                    type="button"
                    className={`btn ${taskTiming[activeBlock.id]?.isRunning ? 'danger' : 'success'}`}
                    onClick={() => toggleTimer(activeBlock.id)}
                  >
                    {taskTiming[activeBlock.id]?.isRunning ? '⏹️ Stop timer' : '▶️ Start timer'}
                  </button>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--accent)', minWidth: '100px', display: 'inline-block' }}>
                    {formatElapsed(getElapsedSeconds(activeBlock.id))}
                  </div>
                </div>
                <div className="procrastinate-row">
                  <span className="procrastinate-label">Need procrastination time?</span>
                  <div className="procrastinate-actions">
                    {[5, 10, 15, 25].map((m) => (
                      <button key={m} type="button" className="btn btn-snooze" onClick={() => handleProcrastinate(m)}>
                        {m}m
                      </button>
                    ))}
                    <button type="button" className="btn btn-snooze" onClick={() => handleProcrastinate()}>
                      Default ({getLearnSettings().defaultSnoozeMinutes}m)
                    </button>
                    {inSnooze && (
                      <button type="button" className="btn btn-back" onClick={handleEndSnooze}>
                        I’m back
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="current-task-title" style={{ color: 'var(--success)' }}>You are off the clock!</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>Take some time to rest. No active schedule overrides found.</p>
              </>
            )}
          </div>

          <div className="timeline-card" style={{ flex: 1 }}>
            <h2 className="card-title">My Working Scratchpad</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Notes update contextually or globally. Use this area for quick brainstorming.</p>
            <textarea className="notes-area" placeholder="Drop meeting links, quick thoughts, and shadow notes here..." value={activeTaskNotes} onChange={handleNotesChange} />
          </div>
        </div>

        <div className="timeline-card">
          <h2 className="card-title"><span>🗓️</span> Schedule Timeline</h2>
          <div className="timeline">
            {scheduleWithDates.map((block, index) => {
              let statusClass = "future";
              if (index === activeBlockIndex) statusClass = "active";
              else if (index < activeBlockIndex || (activeBlockIndex === -1 && currentMs > block.endTime.getTime())) statusClass = "past";
              return (
                <div className={`timeline-item ${statusClass}`} key={block.id}>
                  <div className="timeline-dot"></div>
                  <div className="timeline-time">{block.time}</div>
                  <div className="timeline-content">
                    <h4>{block.title}</h4>
                    <p>{block.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );

  const renderWorkQueue = () => {
    const completedCount = Object.keys(globalNotes).filter(k => globalNotes[k]?.toLowerCase().includes('done')).length;
    const progressPercent = INITIAL_TASKS.length === 0 ? 0 : Math.round((completedCount / INITIAL_TASKS.length) * 100);

    return (
      <>
        <div className="greeting">
          <h1>Work Queue</h1>
          <p>Your full allocation and long-term milestones. Add notes or type 'Done' to progress.</p>
        </div>

        <div className="dashboard-grid">
          <div className="task-column">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {INITIAL_TASKS.map(task => {
                let badgeClass = task.remoteSite.toLowerCase() === 'site' ? 'site' : 'remote';
                return (
                  <div className="timeline-card" style={{ padding: '24px', opacity: globalNotes[task.id]?.toLowerCase().includes('done') ? 0.6 : 1 }} key={task.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ fontSize: '18px', fontWeight: '600' }}>{task.localOffice}</div>
                      <div className={`badge ${badgeClass}`} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{task.remoteSite}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      <div><span>👤</span> Assessor: <strong>{task.assessor}</strong></div>
                      <div><span>📅</span> Date: <strong>{task.eventDate}</strong></div>
                      <div><span>👀</span> Shadow: <strong>{task.shadowedBy}</strong></div>
                    </div>
                    <textarea
                      className="notes-area"
                      style={{ marginTop: '0', minHeight: '80px' }}
                      placeholder="Add preparation details or type 'Done' to complete..."
                      value={globalNotes[task.id] || ''}
                      onChange={(e) => handleGlobalNoteChange(task.id, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="timeline-card" style={{ height: 'fit-content' }}>
            <h3 className="card-title" style={{ justifyContent: 'center' }}>Total Progress</h3>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: '120px', height: '120px', borderRadius: '50%', margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                background: `conic-gradient(var(--accent) ${progressPercent}%, rgba(255,255,255,0.1) 0)`
              }}>
                <div style={{ position: 'absolute', inset: '10px', background: 'var(--card-bg)', borderRadius: '50%' }} />
                <span style={{ position: 'relative', fontSize: '28px', fontWeight: 'bold' }}>{progressPercent}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '24px' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '600' }}>{INITIAL_TASKS.length}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Allocated</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--success)' }}>{completedCount}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Completed</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '30px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🚀</span>
              <strong>Live Sync Pending</strong>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>This view currently runs on mock data. We will connect this to the Google Apps Script Web App endpoint soon to pull your live row arrays.</p>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderCalendarSync = () => (
    <>
      <div className="greeting">
        <h1>Calendar Synchronization</h1>
        <p>Your calendar endpoints and routing settings.</p>
      </div>
      <div className="timeline-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>📅</div>
        <h2>Incoming Calendar Integration</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 30px', lineHeight: '1.6' }}>
          By establishing an OAuth endpoint or using Google Calendar's public XML/iCal feed, the Micro Manager will pull your true daily events into the Hourly Focus track automatically.
        </p>
        <button className="btn primary" style={{ padding: '16px 32px', fontSize: '16px' }}>Link Google Workspace Account</button>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '20px' }}>*(Mock configuration mode active)*</p>
      </div>
    </>
  );

  const renderSettings = () => (
    <>
      <div className="greeting">
        <h1>Settings</h1>
        <p>Configure your application preferences.</p>
      </div>
      <div className="timeline-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚙️</div>
        <h2>Application Settings</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 30px', lineHeight: '1.6' }}>
          Settings configuration options will appear here. For now, all preferences are set to their defaults.
        </p>
      </div>
    </>
  );

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="brand">Mik Manager</div>
        <div className={`nav-item ${activeTab === 'hourly' ? 'active' : ''}`} onClick={() => setActiveTab('hourly')}>
          <span>⏱️</span> Hourly Focus
        </div>
        <div className={`nav-item ${activeTab === 'workqueue' ? 'active' : ''}`} onClick={() => setActiveTab('workqueue')}>
          <span>📋</span> Work Queue
        </div>
        <div className={`nav-item ${activeTab === 'learn' ? 'active' : ''}`} onClick={() => setActiveTab('learn')}>
          <span>🧠</span> Learn
        </div>
        <div className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          <span>🗓️</span> Calendar Sync
        </div>
        <div 
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} 
          style={{ marginTop: 'auto' }}
          onClick={() => setActiveTab('settings')}
        >
          <span>⚙️</span> Settings
        </div>
      </div>

      <div className="main-content">
        {activeTab === 'hourly' && renderHourlyFocus()}
        {activeTab === 'workqueue' && renderWorkQueue()}
        {activeTab === 'learn' && <LearnTab />}
        {activeTab === 'calendar' && renderCalendarSync()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
}

export default App;
