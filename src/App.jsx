import React, { useState, useEffect, useRef, useMemo } from 'react';
import LearnTab from './components/LearnTab.jsx';
import Dashboard from './components/Dashboard.jsx';
import ScheduleSettings from './components/ScheduleSettings.jsx';
import {
  recordTaskCompletion,
  recordProcrastination,
  getPredictedMinutes,
  getLearnSettings,
  buildCoachMessage,
} from './lib/learn';
import { speak, getVoiceEnabled } from './lib/voice.js';
import FlightStrip from './components/FlightStrip.jsx';
import { getFlightPlanState, COCKTAILS_FLIGHT_PLAN } from './lib/flightPlan.js';
import DayFlightBoard from './components/DayFlightBoard.jsx';
import TaskBuilder from './components/TaskBuilder.jsx';
import { loadTasks } from './lib/taskStore.js';
import { todayKey, loadDayChecksSet, saveDayChecksSet } from './lib/dayPlan.js';
import { loadDisruptions, saveDisruptionsForDay } from './lib/flightDisruptions.js';
import { getBellCheckinsForDay, recordBellCheckin } from './lib/routeBell.js';
import { getWorkWeekProgressPercent } from './lib/workSchedule.js';
import { addStressEvent } from './lib/stress.js';
import StressReport from './components/StressReport.jsx';
import WorkAlignmentTab from './components/WorkAlignmentTab.jsx';
import IssuesLogTab from './components/IssuesLogTab.jsx';
import LegGuidanceCard from './components/LegGuidanceCard.jsx';

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
  const [tasks, setTasks] = useState(() => loadTasks(INITIAL_TASKS));
  const [dayChecks, setDayChecks] = useState(() => loadDayChecksSet());
  const [dayKey, setDayKey] = useState(() => todayKey());
  const [dayDisruptions, setDayDisruptions] = useState(() => loadDisruptions(todayKey()));
  const [bellCheckins, setBellCheckins] = useState(() => getBellCheckinsForDay(todayKey()));
  const [stressSession, setStressSession] = useState(null);

  const voiceBootRef = useRef(false);
  const prevBlockIdRef = useRef(null);
  const prevSnoozeRef = useRef(null);

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

  useEffect(() => {
    const sync = () => setTasks(loadTasks(INITIAL_TASKS));
    window.addEventListener('mik-tasks-updated', sync);
    return () => window.removeEventListener('mik-tasks-updated', sync);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const k = todayKey();
      if (k !== dayKey) {
        setDayKey(k);
        setDayChecks(loadDayChecksSet());
      }
    }, 15000);
    return () => clearInterval(t);
  }, [dayKey]);

  useEffect(() => {
    setDayDisruptions(loadDisruptions(dayKey));
  }, [dayKey]);

  useEffect(() => {
    setBellCheckins(getBellCheckinsForDay(dayKey));
  }, [dayKey]);

  useEffect(() => {
    const sync = () => setBellCheckins(getBellCheckinsForDay(dayKey));
    window.addEventListener('mik-bells-updated', sync);
    return () => window.removeEventListener('mik-bells-updated', sync);
  }, [dayKey]);

  const toggleDayCheck = (blockId) => {
    setDayChecks((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      saveDayChecksSet(next);
      return next;
    });
  };

  const handleDisruptionChange = (blockId, status) => {
    setDayDisruptions((prev) => {
      const next = { ...prev };
      const key = String(blockId);
      if (status === 'none') delete next[key];
      else next[key] = status;
      saveDisruptionsForDay(dayKey, next);
      return next;
    });
  };

  const { activeBlock, activeBlockIndex } = useMemo(() => {
    let idx = -1;
    const currentMs = currentTime.getTime();
    for (let i = 0; i < scheduleWithDates.length; i++) {
      if (currentMs >= scheduleWithDates[i].startTime.getTime() && currentMs < scheduleWithDates[i].endTime.getTime()) {
        idx = i;
        break;
      }
    }
    if (idx === -1 && currentMs < scheduleWithDates[0].startTime.getTime()) {
      idx = 0;
    }
    const block = idx !== -1 ? scheduleWithDates[idx] : null;
    return { activeBlock: block, activeBlockIndex: idx };
  }, [currentTime]);

  useEffect(() => {
    if (!getVoiceEnabled()) {
      if (activeBlock) prevBlockIdRef.current = activeBlock.id;
      else prevBlockIdRef.current = null;
      return;
    }
    if (!activeBlock) {
      prevBlockIdRef.current = null;
      return;
    }
    if (!voiceBootRef.current) {
      voiceBootRef.current = true;
      prevBlockIdRef.current = activeBlock.id;
      return;
    }
    if (prevBlockIdRef.current === activeBlock.id) return;
    prevBlockIdRef.current = activeBlock.id;
    speak(`Now: ${activeBlock.title}.`);
  }, [activeBlock]);

  useEffect(() => {
    if (!getVoiceEnabled()) {
      prevSnoozeRef.current = snoozeUntil;
      return;
    }
    const prev = prevSnoozeRef.current;
    if (prev && !snoozeUntil) {
      speak('Break time is over. Ready when you are.');
    }
    prevSnoozeRef.current = snoozeUntil;
  }, [snoozeUntil]);

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

  const currentMs = currentTime.getTime();

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

  const handleStressStart = () => {
    if (stressSession) return;
    const block = activeBlock;
    setStressSession({
      startedAt: Date.now(),
      blockId: block?.id ?? null,
      blockTitle: block?.title ?? 'Off schedule / no active block',
      blockTime: block?.time ?? '',
    });
  };

  const handleRingBell = (blockId) => {
    recordBellCheckin(dayKey, blockId);
    setBellCheckins(getBellCheckinsForDay(dayKey));
  };

  const handleStressEnd = (triggerNote) => {
    if (!stressSession) return;
    addStressEvent({
      startedAt: stressSession.startedAt,
      endedAt: Date.now(),
      blockId: stressSession.blockId,
      blockTitle: stressSession.blockTitle,
      blockTime: stressSession.blockTime,
      triggerNote,
    });
    setStressSession(null);
  };

  // VIEWS
  const renderHourlyFocus = () => {
    const offClock = !activeBlock;
    const flightPlan = offClock
      ? COCKTAILS_FLIGHT_PLAN
      : getFlightPlanState({
          scheduleWithDates,
          currentMs,
          activeBlockIndex,
          inSnooze,
        });
    const weekPct = getWorkWeekProgressPercent(currentTime);

    return (
    <>
      <div className="greeting">
        <h1>Hourly Tracker</h1>
        <p>
          {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • Flight plan for
          the day — <strong>ring the bell</strong> at each leg when you’re on route, tick blocks to stay aligned, and use{' '}
          <strong>Disrupt</strong> for delay, standby, or cancelled (detail lives in Task Builder).
        </p>
      </div>

      <div className="flight-plan-card">
        <div className="flight-plan-lead">
          <span className="flight-plan-kicker">{offClock ? 'Off the clock' : "Today's flight"}</span>
          <p className="flight-plan-headline">{flightPlan.meta.label}</p>
          <p className="flight-plan-sub">{flightPlan.meta.hint}</p>
        </div>
        <FlightStrip activeId={flightPlan.activeId} />
      </div>

      <DayFlightBoard
        scheduleWithDates={scheduleWithDates}
        activeBlockIndex={activeBlockIndex}
        currentMs={currentMs}
        currentTime={currentTime}
        checkedSet={dayChecks}
        onToggleBlock={toggleDayCheck}
        weekProgressPercent={weekPct}
        stressSession={stressSession}
        onStressStart={handleStressStart}
        onStressEnd={handleStressEnd}
        disruptions={dayDisruptions}
        onDisruptionChange={handleDisruptionChange}
        activeBlock={activeBlock}
        bellCheckins={bellCheckins}
        onRingBell={handleRingBell}
      />

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
                <div className="coach-card coach-card--compact">
                  <p className="coach-text">{coachMessage}</p>
                  {nextBlock && (
                    <p className="coach-next">
                      Next when you’re ready: <strong>{nextBlock.title}</strong>
                      {predictedNext != null && <span> · ~{predictedNext} min from your history</span>}
                    </p>
                  )}
                </div>
                <LegGuidanceCard key={activeBlock.id} activeBlock={activeBlock} />
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

        <div className="timeline-card schedule-timeline-card">
          <h2 className="card-title">
            <span>◇</span> Schedule timeline
          </h2>
          <ul className="schedule-timeline">
            {scheduleWithDates.map((block, index) => {
              let statusClass = 'future';
              if (index === activeBlockIndex) statusClass = 'active';
              else if (index < activeBlockIndex || (activeBlockIndex === -1 && currentMs > block.endTime.getTime())) {
                statusClass = 'past';
              }
              return (
                <li className={`schedule-timeline-item schedule-timeline-item--${statusClass}`} key={block.id}>
                  <span className="schedule-timeline-marker" aria-hidden />
                  <div className="schedule-timeline-panel">
                    <div className="schedule-timeline-heading">
                      <span className="schedule-timeline-time">{block.time}</span>
                      <h4 className="schedule-timeline-title">{block.title}</h4>
                    </div>
                    <p className="schedule-timeline-detail">{block.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
    );
  };

  const renderWorkQueue = () => {
    const completedCount = Object.keys(globalNotes).filter(k => globalNotes[k]?.toLowerCase().includes('done')).length;
    const progressPercent = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

    return (
      <>
        <div className="greeting">
          <h1>Work Queue</h1>
          <p>Your full allocation and long-term milestones. Add notes or type 'Done' to progress.</p>
        </div>

        <div className="dashboard-grid">
          <div className="task-column">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tasks.map(task => {
                let badgeClass = task.remoteSite.toLowerCase() === 'site' ? 'site' : 'remote';
                const heading = task.title || task.localOffice || 'Task';
                return (
                  <div className="timeline-card" style={{ padding: '24px', opacity: globalNotes[task.id]?.toLowerCase().includes('done') ? 0.6 : 1 }} key={task.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ fontSize: '18px', fontWeight: '600' }}>{heading}</div>
                      <div className={`badge ${badgeClass}`} style={{ background: 'rgba(251, 191, 36, 0.12)', color: '#fcd34d', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.04em' }}>{task.remoteSite}</div>
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
                  <div style={{ fontSize: '20px', fontWeight: '600' }}>{tasks.length}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Allocated</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--success)' }}>{completedCount}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Completed</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '30px', padding: '16px', background: 'rgba(251, 191, 36, 0.08)', borderRadius: '6px', border: '1px solid rgba(251, 191, 36, 0.25)' }}>
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

  const renderSettings = () => <ScheduleSettings />;

  return (
    <div className="app-container fids-shell">
      <div className="sidebar">
        <div className="sidebar-brand-block">
          <div className="brand" title="Mik Manager">
            MIK
          </div>
          <div className="sidebar-tagline">Operations display</div>
        </div>
        <div className={`nav-item ${activeTab === 'hourly' ? 'active' : ''}`} onClick={() => setActiveTab('hourly')}>
          <span className="nav-glyph" aria-hidden>
            ◆
          </span>{' '}
          Hourly focus
        </div>
        <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <span className="nav-glyph" aria-hidden>
            ▤
          </span>{' '}
          Dashboard
        </div>
        <div className={`nav-item ${activeTab === 'taskbuilder' ? 'active' : ''}`} onClick={() => setActiveTab('taskbuilder')}>
          <span className="nav-glyph" aria-hidden>
            ✎
          </span>{' '}
          Task builder
        </div>
        <div className={`nav-item ${activeTab === 'workqueue' ? 'active' : ''}`} onClick={() => setActiveTab('workqueue')}>
          <span className="nav-glyph" aria-hidden>
            ☰
          </span>{' '}
          Work queue
        </div>
        <div className={`nav-item ${activeTab === 'learn' ? 'active' : ''}`} onClick={() => setActiveTab('learn')}>
          <span className="nav-glyph" aria-hidden>
            ◉
          </span>{' '}
          Learn
        </div>
        <div className={`nav-item ${activeTab === 'stress' ? 'active' : ''}`} onClick={() => setActiveTab('stress')}>
          <span className="nav-glyph" aria-hidden>
            ●
          </span>{' '}
          Stress log
        </div>
        <div className={`nav-item ${activeTab === 'issues' ? 'active' : ''}`} onClick={() => setActiveTab('issues')}>
          <span className="nav-glyph" aria-hidden>
            !
          </span>{' '}
          Issues log
        </div>
        <div className={`nav-item ${activeTab === 'alignment' ? 'active' : ''}`} onClick={() => setActiveTab('alignment')}>
          <span className="nav-glyph" aria-hidden>
            ☷
          </span>{' '}
          1:1 alignment
        </div>
        <div className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          <span className="nav-glyph" aria-hidden>
            ⌗
          </span>{' '}
          Calendar sync
        </div>
        <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} style={{ marginTop: 'auto' }} onClick={() => setActiveTab('settings')}>
          <span className="nav-glyph" aria-hidden>
            ⚙
          </span>{' '}
          Settings
        </div>
      </div>

      <div className="main-content">
        {activeTab === 'hourly' && renderHourlyFocus()}
        {activeTab === 'dashboard' && (
          <Dashboard tasks={tasks} globalNotes={globalNotes} currentTime={currentTime} />
        )}
        {activeTab === 'taskbuilder' && <TaskBuilder seedTasks={INITIAL_TASKS} />}
        {activeTab === 'workqueue' && renderWorkQueue()}
        {activeTab === 'learn' && <LearnTab />}
        {activeTab === 'stress' && <StressReport />}
        {activeTab === 'issues' && <IssuesLogTab />}
        {activeTab === 'alignment' && <WorkAlignmentTab />}
        {activeTab === 'calendar' && renderCalendarSync()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
}

export default App;
