import { useState, useEffect } from 'react';

/**
 * StressOmeter: start when stressed, end to save duration + trigger note, linked to current block.
 */
export default function StressOmeterBar({ stressSession, onStart, onEnd }) {
  const [noteDraft, setNoteDraft] = useState('');
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!stressSession) return;
    const tick = () => {
      setElapsedSec(Math.floor((Date.now() - stressSession.startedAt) / 1000));
    };
    const t0 = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(t0);
      clearInterval(id);
    };
  }, [stressSession]);

  const fmt = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const recording = Boolean(stressSession);

  return (
    <div className="stress-ometer-bar">
      <div className="stress-ometer-head">
        <span className="stress-ometer-label">StressOmeter</span>
        <span className="stress-ometer-hint">
          Tap when stress starts; tap end when it eases. Links to your current flight row.
        </span>
      </div>
      <div className="stress-ometer-body">
        {!recording ? (
          <button type="button" className="btn stress-ometer-start" onClick={onStart}>
            I’m stressed — start recording
          </button>
        ) : (
          <>
            <div className="stress-ometer-active">
              <span className="stress-ometer-pulse" aria-hidden />
              <span className="stress-ometer-time">{fmt(elapsedSec)}</span>
              <span className="stress-ometer-block">
                Linked: <strong>{stressSession.blockTitle}</strong>
                {stressSession.blockTime ? ` · ${stressSession.blockTime}` : ''}
              </span>
            </div>
            <label className="stress-ometer-note-label">
              What triggered it? (for your 1:1 notes)
              <textarea
                className="stress-ometer-note"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="e.g. volume of cases, unclear deadline, conflict…"
                rows={2}
              />
            </label>
            <button
              type="button"
              className="btn stress-ometer-end"
              onClick={() => {
                onEnd(noteDraft);
                setNoteDraft('');
              }}
            >
              End recording &amp; save to flight log
            </button>
          </>
        )}
      </div>
    </div>
  );
}
