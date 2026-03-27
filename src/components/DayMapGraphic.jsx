/**
 * SVG “day map”: arc path = working day, markers = blocks, aircraft = now.
 */

import { useId } from 'react';

const W = 520;
const H = 112;

function pointOnArc(p) {
  const u = Math.min(1, Math.max(0, p));
  const x = 28 + u * (W - 56);
  const midY = H * 0.58;
  const amp = H * 0.32;
  const y = midY + Math.sin(u * Math.PI) * -amp;
  return { x, y };
}

function tangentAngle(p) {
  const e = 0.008;
  const a = pointOnArc(p);
  const b = pointOnArc(Math.min(1, p + e));
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

export default function DayMapGraphic({ scheduleWithDates, currentMs, embedded = false, showCaption = true }) {
  const gid = useId().replace(/:/g, '');
  const n = scheduleWithDates.length;
  if (n === 0) return null;

  const t0 = scheduleWithDates[0].startTime.getTime();
  const t1 = scheduleWithDates[n - 1].endTime.getTime();
  const span = t1 - t0;
  let p = span <= 0 ? 0 : (currentMs - t0) / span;
  p = Math.min(1, Math.max(0, p));

  const pos = pointOnArc(p);
  const angle = tangentAngle(p);

  const pathD = (() => {
    const steps = 48;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const pt = pointOnArc(u);
      d += (i === 0 ? 'M' : 'L') + `${pt.x.toFixed(1)} ${pt.y.toFixed(1)} `;
    }
    return d.trim();
  })();

  const blockDots = scheduleWithDates.map((block) => {
    const bt = block.startTime.getTime();
    let u = span <= 0 ? 0 : (bt - t0) / span;
    u = Math.min(1, Math.max(0, u));
    return { id: block.id, ...pointOnArc(u) };
  });

  const status =
    currentMs < t0 ? 'At the gate' : currentMs >= t1 ? 'Arrived' : 'Inflight';

  const skyId = `dayMapSky-${gid}`;
  const trailId = `dayMapTrail-${gid}`;

  return (
    <div className={`day-map-graphic ${embedded ? 'day-map-graphic--embedded' : ''}`}>
      {!embedded && (
        <div className="day-map-head">
          <span className="day-map-kicker">Day map</span>
          <span className="day-map-status">{status}</span>
        </div>
      )}
      <svg
        className="day-map-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Day map: ${status}. Aircraft position along today’s schedule.`}
      >
        <defs>
          <linearGradient id={skyId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={embedded ? 'rgba(120, 53, 15, 0.35)' : 'rgba(30, 58, 138, 0.45)'} />
            <stop offset="100%" stopColor={embedded ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 23, 42, 0.2)'} />
          </linearGradient>
          <linearGradient id={trailId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(251, 191, 36, 0.2)" />
            <stop offset="50%" stopColor="rgba(251, 191, 36, 0.55)" />
            <stop offset="100%" stopColor="rgba(52, 211, 153, 0.35)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={W} height={H} fill={`url(#${skyId})`} rx="10" />

        <path
          d={pathD}
          fill="none"
          stroke={`url(#${trailId})`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
        <path
          d={pathD}
          fill="none"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.85"
        />

        {blockDots.map((dot) => (
          <g key={dot.id}>
            <circle
              cx={dot.x}
              cy={dot.y}
              r="5"
              fill="rgba(15, 23, 42, 0.9)"
              stroke="rgba(251, 191, 36, 0.45)"
              strokeWidth="1.5"
            />
            <circle cx={dot.x} cy={dot.y} r="2" fill="rgba(254, 243, 199, 0.95)" />
          </g>
        ))}

        <g transform={`translate(${pos.x}, ${pos.y}) rotate(${angle})`}>
          <g className="day-map-plane">
            <path
              d="M -14 0 L 10 -3 L 18 -8 L 22 -8 L 20 0 L 22 8 L 18 8 L 10 3 L -14 0 Z"
              fill="#fef3c7"
              stroke="rgba(15, 23, 42, 0.55)"
              strokeWidth="0.8"
            />
            <path d="M -6 -10 L 2 -14 L 6 -14 L 4 -8 Z" fill="#fbbf24" opacity="0.95" />
          </g>
        </g>
      </svg>
      {showCaption && (
        <p className="day-map-caption">Aircraft tracks the clock along today&apos;s schedule — dots are your day&apos;s blocks.</p>
      )}
    </div>
  );
}
