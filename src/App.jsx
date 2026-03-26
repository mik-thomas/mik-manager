import React, { useState, useEffect } from 'react';

// MOCK CALENDAR SCHEDULE (Would eventually sync with Google Calendar / Office365)
// Times are in HH:MM format
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

// Helper to convert time strings "HH:MM" to Date objects for today
const createDateFromTime = (timeStr) => {
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
  return d;
};

// Map schedule to actual dates
const scheduleWithDates = MOCK_SCHEDULE.map(block => {
  const startTime = createDateFromTime(block.time);
  const endTime = new Date(startTime.getTime() + block.duration * 60000);
  return { ...block, startTime, endTime };
});

function padZero(num) {
  return num.toString().padStart(2, '0');
}

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTaskNotes, setActiveTaskNotes] = useState("");
  // Dev override: if you want to test the tracker out of hours, 
  // you can uncomment this to force the time to 1:30 PM (13:30)
  // const [currentTime, setCurrentTime] = useState(createDateFromTime("13:30"));

  useEffect(() => {
    // Load notes specifically for today's active tasks
    const saved = localStorage.getItem('mik_daily_notes') || "";
    setActiveTaskNotes(saved);

    // Update real-time clock every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // To force dev time progressing:
      // setCurrentTime(prev => new Date(prev.getTime() + 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNotesChange = (e) => {
    setActiveTaskNotes(e.target.value);
    localStorage.setItem('mik_daily_notes', e.target.value);
  };

  // Find the exact active block
  let activeBlockIndex = -1;
  const currentMs = currentTime.getTime();

  for (let i = 0; i < scheduleWithDates.length; i++) {
    if (currentMs >= scheduleWithDates[i].startTime.getTime() && currentMs < scheduleWithDates[i].endTime.getTime()) {
      activeBlockIndex = i;
      break;
    }
  }

  // If before 9 AM, default to first block
  if (activeBlockIndex === -1 && currentMs < scheduleWithDates[0].startTime.getTime()) {
    activeBlockIndex = 0;
  }

  const activeBlock = activeBlockIndex !== -1 ? scheduleWithDates[activeBlockIndex] : null;

  // Calculate Countdown
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

  const formatTimeHM = (date) => {
    return `${date.getHours()}:${padZero(date.getMinutes())}`;
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div className="brand">Mik Manager</div>
        <div className="nav-item active"><span>⏱️</span> Hourly Focus</div>
        <div className="nav-item"><span>📋</span> Work Queue</div>
        <div className="nav-item"><span>🗓️</span> Calendar Sync</div>
        <div className="nav-item" style={{ marginTop: 'auto' }}><span>⚙️</span> Settings</div>
      </div>

      <div className="main-content">
        <div className="greeting">
          <h1>Hourly Tracker</h1>
          <p>{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • Keep momentum, stay on track.</p>
        </div>

        <div className="dashboard-grid">
          {/* LEFT: The IMMEDIATE Focus */}
          <div className="layout-main">
            <div className="active-block">
              {activeBlock ? (
                <>
                  <div className="status-label">
                    <span className="pulse-led"></span>
                    ACTIVE HOUR: YOU SHOULD BE DOING THIS NOW
                  </div>
                  <h2 className="current-task-title">{activeBlock.title}</h2>
                  <div className="countdown">{countdownText}</div>
                  <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
                    Until {formatTimeHM(activeBlock.endTime)}
                  </p>

                  {/* Visual Progress Bar for the Hour */}
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '32px' }}>
                    <div style={{ height: '100%', width: \`\${countdownPercentage}%\`, background: 'var(--accent)', transition: 'width 1s linear' }} />
                  </div>

                  <div className="block-actions">
                    <button className="btn primary">Mark Complete</button>
                    <button className="btn">Ask for Details</button>
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
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                Notes update contextually or globally. Use this area for quick brainstorming.
              </p>
              <textarea
                className="notes-area"
                placeholder="Drop meeting links, quick thoughts, and shadow notes here..."
                value={activeTaskNotes}
                onChange={handleNotesChange}
              />
            </div>
          </div>

          {/* RIGHT: The Day's Timeline */}
          <div className="timeline-card">
            <h2 className="card-title"><span>🗓️</span> Schedule Timeline</h2>
            <div className="timeline">
              {scheduleWithDates.map((block, index) => {
                let statusClass = "future";
                if (index === activeBlockIndex) statusClass = "active";
                else if (index < activeBlockIndex || (activeBlockIndex === -1 && currentMs > block.endTime.getTime())) statusClass = "past";

                return (
                  <div className={\`timeline-item \${statusClass}\`} key={block.id}>
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
    </div>
    </div >
  );
}

export default App;
