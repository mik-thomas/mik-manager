import { playRouteBellSound } from '../lib/routeBell.js';

/**
 * Prompt to "ring the bell" at the current schedule leg (train-driver checkpoint).
 */
export default function RouteBellBar({ activeBlock, hasRungForCurrent, onRingBell }) {
  if (!activeBlock) return null;

  if (hasRungForCurrent) {
    return (
      <div className="route-bell-bar route-bell-bar--done" role="status">
        <span className="route-bell-done-icon" aria-hidden>
          ✓
        </span>
        <span className="route-bell-done-text">
          Bell rung for this station — <strong>{activeBlock.title}</strong>
        </span>
      </div>
    );
  }

  return (
    <div className="route-bell-bar route-bell-bar--pending" role="alert" aria-live="polite">
      <div className="route-bell-bar-inner">
        <span className="route-bell-icon" aria-hidden>
          ◆
        </span>
        <div className="route-bell-copy">
          <span className="route-bell-title">Route checkpoint</span>
          <span className="route-bell-sub">
            You’re on this leg of the plan — ring the bell when you’re present on route (like a driver at the station).
          </span>
        </div>
        <button
          type="button"
          className="btn primary route-bell-btn"
          onClick={() => {
            playRouteBellSound();
            onRingBell(activeBlock.id);
          }}
        >
          Ring bell
        </button>
      </div>
    </div>
  );
}
