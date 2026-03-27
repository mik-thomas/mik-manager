import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DAY_START_MINUTES,
  DAY_END_MINUTES,
  LUNCH_START_MINUTES,
  LUNCH_END_MINUTES,
} from '../lib/workSchedule.js';
import WorkingDayExpandedView from './WorkingDayExpandedView.jsx';

const VIEW = 100;
const CX = VIEW / 2;
const CY = VIEW / 2;
const R_OUTER = 44;
const OUTER_STROKE = 7;
const R_DIAL = 32;
const R_HOUR_LABELS = 30;

function minutesOfDay(date) {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

function angleForMinutes(mins) {
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

function arcPathOuter(startMin, endMin) {
  const a0 = angleForMinutes(startMin);
  const a1 = angleForMinutes(endMin);
  const p0 = polar(R_OUTER, a0);
  const p1 = polar(R_OUTER, a1);
  let delta = a1 - a0;
  while (delta < 0) delta += 2 * Math.PI;
  while (delta > 2 * Math.PI) delta -= 2 * Math.PI;
  const largeArc = delta > Math.PI ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${R_OUTER} ${R_OUTER} 0 ${largeArc} 1 ${p1.x} ${p1.y}`;
}

function angleForHour12(h) {
  const t = h === 12 ? 0 : h;
  return -Math.PI / 2 + (t / 12) * 2 * Math.PI;
}

function nowDotOuter(date) {
  const mo = minutesOfDay(date);
  const clamped = Math.min(DAY_END_MINUTES, Math.max(DAY_START_MINUTES, mo));
  const a = angleForMinutes(clamped);
  return polar(R_OUTER, a);
}

const NET_WORK_MINUTES =
  DAY_END_MINUTES - DAY_START_MINUTES - (LUNCH_END_MINUTES - LUNCH_START_MINUTES);
const NET_WORK_HOURS = Math.round(NET_WORK_MINUTES / 60);

export default function WorkingDayClock({ currentTime, scheduleWithDates = [] }) {
  const [open, setOpen] = useState(false);
  const hasSchedule = Array.isArray(scheduleWithDates) && scheduleWithDates.length > 0;

  const onClose = useCallback(() => setOpen(false), []);

  const morningPath = arcPathOuter(DAY_START_MINUTES, LUNCH_START_MINUTES);
  const afternoonPath = arcPathOuter(LUNCH_END_MINUTES, DAY_END_MINUTES);
  const dot = nowDotOuter(currentTime);
  const mo = minutesOfDay(currentTime);
  const inWindow = mo >= DAY_START_MINUTES && mo <= DAY_END_MINUTES;

  const label = `Work day 08:00–17:30; lunch 12:00–12:30 gap on outer ring; inner dial 12 hour. Net work ${NET_WORK_HOURS} hours. Now ${currentTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}.`;
  const hoursAround = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  return (
    <>
      <button
        type="button"
        className="working-day-clock-trigger"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="working-day-expanded-dialog"
        title={
          hasSchedule
            ? 'Expand: day map with schedule blocks'
            : 'Expand: larger clock (add schedule on the board for callouts)'
        }
        aria-label={
          hasSchedule
            ? `Open expanded day clock. ${label}`
            : `Open expanded day clock. ${label} No schedule blocks to show yet.`
        }
      >
        <svg
          className="working-day-clock-svg"
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          width={76}
          height={76}
          aria-hidden
          focusable="false"
        >
          <circle className="working-day-clock-dial" cx={CX} cy={CY} r={R_DIAL} fill="none" />

          {hoursAround.map((h) => {
            const a = angleForHour12(h);
            const p = polar(R_HOUR_LABELS, a);
            return (
              <text
                key={h}
                className="working-day-clock-hour"
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {h}
              </text>
            );
          })}

          <text className="working-day-clock-center-val" x={CX} y={CY - 4} textAnchor="middle" dominantBaseline="central">
            {NET_WORK_HOURS}
          </text>
          <text className="working-day-clock-center-unit" x={CX} y={CY + 9} textAnchor="middle" dominantBaseline="central">
            HR
          </text>

          <path
            className="working-day-clock-arc working-day-clock-arc--track"
            d={morningPath}
            fill="none"
            strokeWidth={OUTER_STROKE + 2}
            strokeLinecap="round"
          />
          <path
            className="working-day-clock-arc working-day-clock-arc--track"
            d={afternoonPath}
            fill="none"
            strokeWidth={OUTER_STROKE + 2}
            strokeLinecap="round"
          />
          <path
            className="working-day-clock-arc working-day-clock-arc--work"
            d={morningPath}
            fill="none"
            strokeWidth={OUTER_STROKE}
            strokeLinecap="round"
          />
          <path
            className="working-day-clock-arc working-day-clock-arc--work"
            d={afternoonPath}
            fill="none"
            strokeWidth={OUTER_STROKE}
            strokeLinecap="round"
          />

          <circle
            className={`working-day-clock-now ${inWindow ? '' : 'working-day-clock-now--off'}`}
            cx={dot.x}
            cy={dot.y}
            r={4}
          />
        </svg>
      </button>

      {open &&
        createPortal(
          <WorkingDayExpandedView currentTime={currentTime} scheduleWithDates={scheduleWithDates} onClose={onClose} />,
          document.body
        )}
    </>
  );
}
