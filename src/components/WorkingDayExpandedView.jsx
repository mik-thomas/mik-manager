import { useEffect, useId, useRef } from 'react';
import {
  DAY_START_MINUTES,
  DAY_END_MINUTES,
  LUNCH_START_MINUTES,
  LUNCH_END_MINUTES,
} from '../lib/workSchedule.js';

/** Large square so radial labels + cards stay inside the viewBox */
const VIEW = 960;
const CX = VIEW / 2;
const CY = VIEW / 2;
const R_OUTER = 175;
const OUTER_STROKE = 28;
const R_DIAL = 122;
const R_HOUR_LABELS = 112;
const R_LEADER_ON_DIAL = R_DIAL - 16;
const R_LABEL_BASE = R_OUTER + OUTER_STROKE / 2 + 40;
const LANE_STEP = 36;

function minutesOfDay(date) {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

function angleForWorkWindow(mins) {
  const span = DAY_END_MINUTES - DAY_START_MINUTES;
  const frac = (mins - DAY_START_MINUTES) / span;
  return -Math.PI / 2 + frac * 2 * Math.PI;
}

function polar(r, angleRad) {
  return {
    x: CX + r * Math.cos(angleRad),
    y: CY + r * Math.sin(angleRad),
  };
}

function arcPathWorkWindow(startMin, endMin) {
  const a0 = angleForWorkWindow(startMin);
  const a1 = angleForWorkWindow(endMin);
  const p0 = polar(R_OUTER, a0);
  const p1 = polar(R_OUTER, a1);
  let delta = a1 - a0;
  while (delta < 0) delta += 2 * Math.PI;
  while (delta > 2 * Math.PI) delta -= 2 * Math.PI;
  const largeArc = delta > Math.PI ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${R_OUTER} ${R_OUTER} 0 ${largeArc} 1 ${p1.x} ${p1.y}`;
}

function angle12hFromMinutes(m) {
  const hoursFloat = m / 60;
  const h12 = hoursFloat % 12;
  const t = h12 === 0 ? 0 : h12;
  return -Math.PI / 2 + (t / 12) * 2 * Math.PI;
}

function angle12hFromDate(d) {
  return angle12hFromMinutes(minutesOfDay(d));
}

function angleForHour12(h) {
  const t = h === 12 ? 0 : h;
  return -Math.PI / 2 + (t / 12) * 2 * Math.PI;
}

function nowDotWorkWindow(date) {
  const mo = minutesOfDay(date);
  const clamped = Math.min(DAY_END_MINUTES, Math.max(DAY_START_MINUTES, mo));
  const a = angleForWorkWindow(clamped);
  return polar(R_OUTER, a);
}

const NET_WORK_MINUTES =
  DAY_END_MINUTES - DAY_START_MINUTES - (LUNCH_END_MINUTES - LUNCH_START_MINUTES);
const NET_WORK_HOURS = Math.round(NET_WORK_MINUTES / 60);

function assignLabelLanes(blocks) {
  const items = blocks.map((block) => ({
    block,
    angle: angle12hFromDate(block.startTime),
  }));
  items.sort((a, b) => a.angle - b.angle);
  let lane = 0;
  for (let i = 0; i < items.length; i++) {
    if (i === 0) {
      items[i].lane = 0;
      continue;
    }
    let delta = items[i].angle - items[i - 1].angle;
    while (delta < 0) delta += 2 * Math.PI;
    if (delta < 0.13) lane = Math.min(lane + 1, 4);
    else lane = 0;
    items[i].lane = lane;
  }
  return items;
}

export default function WorkingDayExpandedView({ currentTime, scheduleWithDates, onClose }) {
  const closeBtnRef = useRef(null);
  const titleId = useId();
  const labelId = useId();

  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const morningPath = arcPathWorkWindow(DAY_START_MINUTES, LUNCH_START_MINUTES);
  const afternoonPath = arcPathWorkWindow(LUNCH_END_MINUTES, DAY_END_MINUTES);
  const dot = nowDotWorkWindow(currentTime);
  const mo = minutesOfDay(currentTime);
  const inWindow = mo >= DAY_START_MINUTES && mo <= DAY_END_MINUTES;
  const hoursAround = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  const blocks = Array.isArray(scheduleWithDates) ? scheduleWithDates : [];
  const labeled = assignLabelLanes(blocks);

  const fmtTime = (d) =>
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div
      className="working-day-expanded-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        id="working-day-expanded-dialog"
        className="working-day-expanded-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={labelId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="working-day-expanded-head">
          <h2 id={titleId} className="working-day-expanded-title">
            Day at a glance
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            className="working-day-expanded-close"
            onClick={onClose}
            aria-label="Close expanded clock"
          >
            ✕
          </button>
        </div>
        <p id={labelId} className="working-day-expanded-hint">
          Schedule blocks radiate from their start time on the 12h dial. Orange ring = contract window;
          gap = lunch.
        </p>

        <div className="working-day-expanded-svg-wrap">
          <svg
            className="working-day-expanded-svg"
            viewBox={`0 0 ${VIEW} ${VIEW}`}
            role="img"
            aria-label={`Expanded day clock for ${currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`}
          >
            <circle className="working-day-expanded-dial" cx={CX} cy={CY} r={R_DIAL} fill="none" />

            {hoursAround.map((h) => {
              const a = angleForHour12(h);
              const p = polar(R_HOUR_LABELS, a);
              return (
                <text
                  key={h}
                  className="working-day-expanded-hour"
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {h}
                </text>
              );
            })}

            <text
              className="working-day-expanded-center-val"
              x={CX}
              y={CY - 14}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {NET_WORK_HOURS}
            </text>
            <text
              className="working-day-expanded-center-unit"
              x={CX}
              y={CY + 26}
              textAnchor="middle"
              dominantBaseline="central"
            >
              HR
            </text>

            <path
              className="working-day-expanded-arc working-day-expanded-arc--track"
              d={morningPath}
              fill="none"
              strokeWidth={OUTER_STROKE + 4}
              strokeLinecap="round"
            />
            <path
              className="working-day-expanded-arc working-day-expanded-arc--track"
              d={afternoonPath}
              fill="none"
              strokeWidth={OUTER_STROKE + 4}
              strokeLinecap="round"
            />
            <path
              className="working-day-expanded-arc working-day-expanded-arc--work"
              d={morningPath}
              fill="none"
              strokeWidth={OUTER_STROKE}
              strokeLinecap="round"
            />
            <path
              className="working-day-expanded-arc working-day-expanded-arc--work"
              d={afternoonPath}
              fill="none"
              strokeWidth={OUTER_STROKE}
              strokeLinecap="round"
            />

            {labeled.map(({ block, angle, lane }) => {
              const rLabel = R_LABEL_BASE + lane * LANE_STEP;
              const pClock = polar(R_LEADER_ON_DIAL, angle);
              const pLabel = polar(rLabel, angle);
              const ux = Math.cos(angle);
              const uy = Math.sin(angle);
              const lineLen = Math.hypot(pLabel.x - pClock.x, pLabel.y - pClock.y);
              const shorten = Math.min(44, Math.max(0, lineLen * 0.18));
              const pLineEnd = {
                x: pLabel.x - ux * shorten,
                y: pLabel.y - uy * shorten,
              };
              const timeStr = fmtTime(block.startTime);
              return (
                <g key={block.id} className="working-day-expanded-slot">
                  <line
                    className="working-day-expanded-leader"
                    x1={pClock.x}
                    y1={pClock.y}
                    x2={pLineEnd.x}
                    y2={pLineEnd.y}
                  />
                  <foreignObject
                    x={pLabel.x - 92}
                    y={pLabel.y - 28}
                    width={184}
                    height={56}
                    className="working-day-expanded-fo"
                  >
                    <div className="working-day-expanded-card">
                      <span className="working-day-expanded-card-time">{timeStr}</span>
                      <span className="working-day-expanded-card-title">{block.title}</span>
                    </div>
                  </foreignObject>
                </g>
              );
            })}

            <circle
              className={`working-day-expanded-now ${inWindow ? '' : 'working-day-expanded-now--off'}`}
              cx={dot.x}
              cy={dot.y}
              r={9}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
