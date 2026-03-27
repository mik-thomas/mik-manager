import { useState } from 'react';
import { getLegGuidance, setLegGuidance } from '../lib/legGuidance.js';

/**
 * Contextual guidance for the active schedule block — edit once, see whenever you’re on this leg.
 * Parent should set `key={activeBlock.id}` so state resets when the leg changes.
 */
export default function LegGuidanceCard({ activeBlock }) {
  const [text, setText] = useState(() => getLegGuidance(activeBlock.id));
  const [draft, setDraft] = useState(() => getLegGuidance(activeBlock.id));
  const [editing, setEditing] = useState(false);

  if (!activeBlock) return null;

  const save = () => {
    setLegGuidance(activeBlock.id, draft);
    setText(draft.trim());
    setEditing(false);
  };

  const cancel = () => {
    setDraft(text);
    setEditing(false);
  };

  const hasContent = Boolean(text.trim());

  return (
    <div className="leg-guidance-card">
      <div className="leg-guidance-head">
        <div>
          <span className="leg-guidance-kicker">Leg guidance</span>
          <p className="leg-guidance-lead">
            Stakeholders, checks, links — only for <strong>{activeBlock.title}</strong>
          </p>
        </div>
        {!editing && (
          <button type="button" className="btn leg-guidance-edit-btn" onClick={() => setEditing(true)}>
            {hasContent ? 'Edit' : 'Add'}
          </button>
        )}
      </div>

      {editing ? (
        <div className="leg-guidance-edit">
          <textarea
            className="notes-area leg-guidance-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Who is this for? What does “done” look like? Links or files? One line per bullet."
            rows={5}
            aria-label="Guidance for this schedule block"
          />
          <div className="leg-guidance-edit-actions">
            <button type="button" className="btn primary" onClick={save}>
              Save
            </button>
            <button type="button" className="btn" onClick={cancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : hasContent ? (
        <div className="leg-guidance-body" role="region" aria-label="Saved guidance for this block">
          {text.split('\n').map((line, i) => (
            <p key={i} className="leg-guidance-line">
              {line || '\u00A0'}
            </p>
          ))}
        </div>
      ) : (
        <p className="leg-guidance-empty">
          No guidance saved for this leg yet. Tap <strong>Add</strong> to note stakeholders, outcomes, or links.
        </p>
      )}
    </div>
  );
}
