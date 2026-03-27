import { useState, useEffect } from 'react';
import {
  getIssues,
  addIssue,
  updateIssue,
  deleteIssue,
  RAISE_IN,
  RAISE_IN_LABEL,
  generateTeamMeetingIssuesBrief,
} from '../lib/issuesLog.js';

export default function IssuesLogTab() {
  const [issues, setIssues] = useState(() => getIssues());
  const [draft, setDraft] = useState('');
  const [raiseIn, setRaiseIn] = useState(RAISE_IN.ONE_TO_ONE);

  const refresh = () => setIssues(getIssues());

  useEffect(() => {
    const onUp = () => refresh();
    window.addEventListener('mik-issues-updated', onUp);
    return () => window.removeEventListener('mik-issues-updated', onUp);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const created = addIssue({ text: draft, raiseIn });
    if (created) {
      setDraft('');
      refresh();
    }
  };

  const changeRaise = (id, next) => {
    updateIssue(id, { raiseIn: next });
    refresh();
  };

  const remove = (id) => {
    deleteIssue(id);
    refresh();
  };

  const teamBrief = generateTeamMeetingIssuesBrief(issues);

  const copyTeamBrief = async () => {
    try {
      await navigator.clipboard.writeText(teamBrief);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <div className="greeting">
        <h1>Issues log</h1>
        <p>
          When you hit a problem, log it here and choose <strong>where you plan to raise it</strong>:{' '}
          <strong>Team meeting</strong>, <strong>Line manager (1:1)</strong>, or <strong>Both</strong>. Items appear in
          the right export: <strong>1:1 alignment</strong> monthly brief (1:1 + both) and you can copy a{' '}
          <strong>team meeting</strong> list below (team + both).
        </p>
      </div>

      <div className="dashboard-grid issues-log-grid">
        <div className="timeline-card issues-log-card">
          <h2 className="card-title">
            <span>◇</span> Log an issue
          </h2>
          <form onSubmit={submit} className="issues-log-form">
            <label className="work-alignment-label">What happened / what’s blocked?</label>
            <textarea
              className="notes-area work-alignment-textarea"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Describe the problem, impact, or question you need to surface."
              rows={4}
              required
            />
            <label className="work-alignment-label">Raise in</label>
            <select
              className="issues-log-select"
              value={raiseIn}
              onChange={(e) => setRaiseIn(e.target.value)}
              aria-label="Where to raise this issue"
            >
              <option value={RAISE_IN.TEAM}>{RAISE_IN_LABEL[RAISE_IN.TEAM]}</option>
              <option value={RAISE_IN.ONE_TO_ONE}>{RAISE_IN_LABEL[RAISE_IN.ONE_TO_ONE]}</option>
              <option value={RAISE_IN.BOTH}>{RAISE_IN_LABEL[RAISE_IN.BOTH]}</option>
            </select>
            <button type="submit" className="btn primary issues-log-submit">
              Add to log
            </button>
          </form>
        </div>

        <div className="timeline-card issues-log-card issues-log-card--wide">
          <h2 className="card-title">
            <span>◇</span> Your issues
          </h2>
          {issues.length === 0 ? (
            <p className="settings-note">No issues yet. Add one when something blocks you or needs a forum.</p>
          ) : (
            <ul className="issues-log-list">
              {issues.map((issue) => (
                <li key={issue.id} className="issues-log-item">
                  <div className="issues-log-item-head">
                    <span className="issues-log-date">
                      {new Date(issue.createdAt).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <select
                      className="issues-log-select issues-log-select--inline"
                      value={issue.raiseIn}
                      onChange={(e) => changeRaise(issue.id, e.target.value)}
                      aria-label="Where to raise this issue"
                    >
                      <option value={RAISE_IN.TEAM}>{RAISE_IN_LABEL[RAISE_IN.TEAM]}</option>
                      <option value={RAISE_IN.ONE_TO_ONE}>{RAISE_IN_LABEL[RAISE_IN.ONE_TO_ONE]}</option>
                      <option value={RAISE_IN.BOTH}>{RAISE_IN_LABEL[RAISE_IN.BOTH]}</option>
                    </select>
                    <button type="button" className="btn issues-log-delete" onClick={() => remove(issue.id)}>
                      Remove
                    </button>
                  </div>
                  <p className="issues-log-text">{issue.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="timeline-card issues-log-card issues-log-card--wide">
          <h2 className="card-title">
            <span>◇</span> Team meeting copy
          </h2>
          <p className="settings-note">
            Plain list of issues tagged <strong>Team meeting</strong> or <strong>Both</strong>. Paste into notes or an
            agenda.
          </p>
          <button type="button" className="btn primary" onClick={copyTeamBrief}>
            Copy team meeting brief
          </button>
          <pre className="stress-report-pre work-alignment-preview">{teamBrief}</pre>
        </div>
      </div>
    </>
  );
}
