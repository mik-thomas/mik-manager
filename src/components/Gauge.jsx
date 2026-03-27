import { useId } from 'react';

const ARC_LEN = Math.PI * 70;

/**
 * Semi-circular gauge 0–max (default 100). `tone` drives accent color for RAG-style cards.
 */
export default function Gauge({
  value,
  max = 100,
  label,
  sublabel,
  tone = 'accent',
  showValue = true,
}) {
  const gradId = `g${useId().replace(/:/g, '')}`;
  const pct = max <= 0 ? 0 : Math.min(1, Math.max(0, value / max));
  const offset = ARC_LEN * (1 - pct);

  const stroke =
    tone === 'green'
      ? 'var(--gauge-green)'
      : tone === 'amber'
        ? 'var(--gauge-amber)'
        : tone === 'red'
          ? 'var(--gauge-red)'
          : 'var(--accent)';

  const display = max === 100 ? Math.round(value) : `${Math.round(value * 10) / 10}/${max}`;

  return (
    <div className="gauge-card">
      <div className="gauge-svg-wrap" aria-hidden>
        <svg className="gauge-svg" viewBox="0 0 200 120" role="img">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path
            className="gauge-track"
            d="M 30 100 A 70 70 0 0 1 170 100"
            fill="none"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            className="gauge-fill"
            d="M 30 100 A 70 70 0 0 1 170 100"
            fill="none"
            strokeWidth="14"
            strokeLinecap="round"
            stroke={tone === 'accent' ? `url(#${gradId})` : stroke}
            strokeDasharray={ARC_LEN}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        {showValue && (
          <div className="gauge-center">
            <span className="gauge-value">{display}</span>
            <span className="gauge-unit">{max === 100 ? '%' : ''}</span>
          </div>
        )}
      </div>
      <div className="gauge-label">{label}</div>
      {sublabel && <div className="gauge-sublabel">{sublabel}</div>}
    </div>
  );
}
