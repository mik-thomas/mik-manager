import DayMapGraphic from './DayMapGraphic.jsx';
import { getTomorrowFirstLegPreview } from '../lib/dayPlan.js';
import { getBlockRowStatus, getBoardStatusPresentation } from '../lib/airportBoardStatus.js';
import StressOmeterBar from './StressOmeterBar.jsx';
import RouteBellBar from './RouteBellBar.jsx';
import WorkingDayClock from './WorkingDayClock.jsx';

export default function AirportBoardScreen({
  scheduleWithDates,
  activeBlock,
  currentMs,
  currentTime,
  checkedSet,
  onToggleBlock,
  weekProgressPercent,
  summary,
  alignClass,
  stressSession,
  onStressStart,
  onStressEnd,
  disruptions = {},
  onDisruptionChange,
  bellCheckins,
  onRingBell,
}) {
  const bells = bellCheckins ?? new Set();
  const hasRungForCurrent = Boolean(activeBlock && bells.has(activeBlock.id));
  const clock = currentTime.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const dateStrShort = currentTime.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const flightsTitleDate = currentTime.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const departuresList = scheduleWithDates.filter((block) => !checkedSet.has(block.id));
  const tomorrowFirst =
    scheduleWithDates.length > 0 ? getTomorrowFirstLegPreview(scheduleWithDates, currentTime) : null;

  return (
    <div className="airport-board-shell">
      <div className="airport-board-fids-strip">
        <div className="airport-board-fids-brand">
          <span className="airport-board-fids-icon-wrap" aria-hidden>
            <svg className="airport-board-fids-plane" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="M21 16v-2l-8-5V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
              />
            </svg>
          </span>
          <span className="airport-board-fids-title">Departures</span>
        </div>
      </div>

      <div className="airport-board-display-head">
        <div className="airport-board-display-head-main">
          <WorkingDayClock currentTime={currentTime} scheduleWithDates={scheduleWithDates} />
          <h2 className="airport-board-flights-title">Flights for {flightsTitleDate}</h2>
        </div>
        <div className="airport-board-clock" aria-live="polite">
          <span className="airport-board-date">{dateStrShort}</span>
          <span className="airport-board-time">{clock}</span>
          <span className="airport-board-tz">Local</span>
        </div>
      </div>

      <div className="airport-board-meta airport-board-meta--compact">
        <div className="airport-board-brand">
          <span className="airport-board-logo">MIK</span>
          <div className="airport-board-titles">
            <span className="airport-board-sub">Daily plan</span>
          </div>
        </div>
        <div className="airport-board-meta-stats">
          <span className="airport-board-meta-pill">
            You {summary.checkedCount}/{summary.scheduleLen}
          </span>
          <span className="airport-board-meta-pill">
            Bells {bells.size}/{scheduleWithDates.length}
          </span>
        </div>
      </div>

      <div className="airport-board-route-panel">
        <div className="airport-board-route-inner">
          <DayMapGraphic
            scheduleWithDates={scheduleWithDates}
            currentMs={currentMs}
            embedded
            showCaption={false}
          />
        </div>
        <div className="airport-board-stats">
          <div className="airport-stat">
            <span className="airport-stat-label">Plan</span>
            <span className="airport-stat-val">
              {summary.planStep || '—'}/{summary.scheduleLen}
            </span>
          </div>
          <div className="airport-stat airport-stat--week">
            <span className="airport-stat-label">Week</span>
            <span className="airport-stat-val">{weekProgressPercent}%</span>
          </div>
        </div>
      </div>

      <RouteBellBar
        activeBlock={activeBlock}
        hasRungForCurrent={hasRungForCurrent}
        onRingBell={onRingBell}
      />

      <p className={`airport-board-ticker ${alignClass}`}>
        {summary.label === 'behind' && <>▸ Behind plan — clear earlier rows or take a break.</>}
        {summary.label === 'on-track' && <>▸ On track — ticks match the clock.</>}
        {summary.label === 'ahead' && <>▸ Ahead of the clock — strong pace.</>}
      </p>

      <div className="airport-board-stress">
        <StressOmeterBar
          key={stressSession ? String(stressSession.startedAt) : 'idle'}
          stressSession={stressSession}
          onStart={onStressStart}
          onEnd={onStressEnd}
        />
      </div>

      {tomorrowFirst ? (
        <div className="airport-board-tomorrow" aria-label="First departure tomorrow">
          <div className="airport-board-tomorrow-inner">
            <span className="airport-board-tomorrow-kicker">First departure tomorrow</span>
            <p className="airport-board-tomorrow-date">{tomorrowFirst.dateLabel}</p>
            <div className="airport-board-tomorrow-leg">
              <span className="airport-board-tomorrow-time">{tomorrowFirst.time}</span>
              <div className="airport-board-tomorrow-dest">
                <span className="airport-board-tomorrow-title">{tomorrowFirst.title}</span>
                {tomorrowFirst.detail ? (
                  <span className="airport-board-tomorrow-detail">{tomorrowFirst.detail}</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="airport-board-table-wrap">
        <div className="airport-board-headrow" aria-hidden>
          <span className="airport-col-t">Time</span>
          <span className="airport-col-r">Destination</span>
          <span className="airport-col-s">Status</span>
          <span className="airport-col-gate">Gate</span>
          <span className="airport-col-ops-h">Plan</span>
        </div>
        <div className="airport-board-rows">
          {departuresList.length === 0 ? (
            <div className="airport-board-empty" role="status">
              All legs checked in — nothing on the departures board.
            </div>
          ) : null}
          {departuresList.map((block, index) => {
            const disruption = disruptions[String(block.id)] ?? null;
            const row = getBlockRowStatus(block, currentMs, false, disruption);
            const statusLine = getBoardStatusPresentation(row, block);
            const isCurrent = Boolean(activeBlock && activeBlock.id === block.id);
            const isOverdue = row.code === 'OPEN';
            const bellRung = bells.has(block.id);
            const gateCode = `A${String(index + 1).padStart(2, '0')}`;
            return (
              <div
                key={block.id}
                className={`airport-board-row airport-board-row--${row.tone} ${isCurrent ? 'airport-board-row--now' : ''} ${isOverdue ? 'airport-board-row--overdue' : ''}`}
              >
                <span className="airport-col-t">{block.time}</span>
                <span
                  className={`airport-col-r ${disruption === 'cancelled' ? 'airport-route--cancelled' : ''}`}
                  title={block.detail}
                >
                  <span className="airport-dest-title">{block.title}</span>
                  <span className="airport-dest-duration">{block.duration} min</span>
                </span>
                <span className="airport-col-s">
                  <span className={`airport-status-text airport-status-text--${row.tone}`}>
                    {statusLine.label}
                  </span>
                </span>
                <span className="airport-col-gate">{gateCode}</span>
                <div className="airport-col-ops">
                  <label className="airport-disrupt-label">
                    <span className="sr-only">Disruption for {block.title}</span>
                    <select
                      className="airport-disrupt-select"
                      value={disruption ?? 'none'}
                      onChange={(e) => onDisruptionChange(block.id, e.target.value)}
                    >
                      <option value="none">—</option>
                      <option value="delay">Delayed</option>
                      <option value="standby">Standby</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </label>
                  <span
                    className={`airport-bell-pip ${bellRung ? 'airport-bell-pip--on' : ''}`}
                    title={bellRung ? 'Bell rung at this station' : 'Bell not rung yet'}
                    aria-hidden
                  >
                    {bellRung ? '✓' : '·'}
                  </span>
                  <label className="airport-ack">
                    <span className="sr-only">Done {block.title}</span>
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => onToggleBlock(block.id)}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <footer className="airport-board-footer">
        <span>
          Ring the bell at each leg when you’re on route — like a driver at the station. Bells are local check-ins; delay
          / standby / cancelled do not change clock times. Information displays are indicative — your day, your pace.
        </span>
      </footer>
    </div>
  );
}
