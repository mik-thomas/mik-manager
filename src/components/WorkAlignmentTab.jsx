import { useState, useEffect } from 'react';
import { loadWorkContext, saveWorkContext, generateFullMonth121Pack } from '../lib/workContext.js';
import { getStressEvents } from '../lib/stress.js';
import { getIssues } from '../lib/issuesLog.js';

export default function WorkAlignmentTab() {
  const [ctx, setCtx] = useState(() => loadWorkContext());
  const [, bumpPack] = useState(0);

  useEffect(() => {
    const bump = () => bumpPack((n) => n + 1);
    window.addEventListener('mik-stress-updated', bump);
    window.addEventListener('mik-issues-updated', bump);
    return () => {
      window.removeEventListener('mik-stress-updated', bump);
      window.removeEventListener('mik-issues-updated', bump);
    };
  }, []);

  const update = (key, value) => {
    setCtx((prev) => {
      const next = { ...prev, [key]: value };
      saveWorkContext(next);
      return next;
    });
  };

  const issueList = getIssues();
  const packText = generateFullMonth121Pack(ctx, getStressEvents(), {
    includeStress: true,
    issues: issueList,
  });
  const packAlignmentOnly = generateFullMonth121Pack(ctx, [], {
    includeStress: false,
    issues: issueList,
  });

  const copyFull = async () => {
    try {
      await navigator.clipboard.writeText(packText);
    } catch {
      /* ignore */
    }
  };

  const copyAlignmentOnly = async () => {
    try {
      await navigator.clipboard.writeText(packAlignmentOnly);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <div className="greeting">
        <h1>1:1 alignment</h1>
        <p>
          Link your work to the <strong>business plan</strong>, <strong>team objectives</strong>,{' '}
          <strong>role specification</strong>, and <strong>PDRs</strong>. This gives you a structured monthly brief for
          your line manager instead of relying on memory — and it combines with your{' '}
          <strong>Issues log</strong> (tagged for 1:1 or team) and <strong>StressOmeter</strong> when you copy the full
          pack.
        </p>
      </div>

      <div className="dashboard-grid work-alignment-grid">
        <div className="timeline-card work-alignment-card">
          <h2 className="card-title">
            <span>◇</span> Business plan &amp; priorities
          </h2>
          <p className="settings-note">
            What the organisation or division is trying to achieve — enough context that your manager sees how your work
            ladders up.
          </p>
          <textarea
            className="notes-area work-alignment-textarea"
            value={ctx.businessPlanSummary}
            onChange={(e) => update('businessPlanSummary', e.target.value)}
            placeholder="e.g. key themes from the annual plan, customer outcomes, financial or regulatory priorities…"
            rows={6}
          />
        </div>

        <div className="timeline-card work-alignment-card">
          <h2 className="card-title">
            <span>◇</span> Team objectives &amp; your delivery
          </h2>
          <p className="settings-note">What your team is measured on, and how you contribute in practice.</p>
          <label className="work-alignment-label">Team / group objectives</label>
          <textarea
            className="notes-area work-alignment-textarea"
            value={ctx.teamObjectives}
            onChange={(e) => update('teamObjectives', e.target.value)}
            placeholder="Paste team OKRs, KPIs, or a short summary of shared goals."
            rows={5}
          />
          <label className="work-alignment-label">How I am delivering against them</label>
          <textarea
            className="notes-area work-alignment-textarea"
            value={ctx.myDeliveryAgainstTeam}
            onChange={(e) => update('myDeliveryAgainstTeam', e.target.value)}
            placeholder="Outcomes, examples, metrics, stakeholder feedback — evidence you can cite in a 1:1."
            rows={5}
          />
        </div>

        <div className="timeline-card work-alignment-card">
          <h2 className="card-title">
            <span>◇</span> Job role &amp; specification
          </h2>
          <p className="settings-note">Anchor the conversation in your formal role — responsibilities and scope.</p>
          <label className="work-alignment-label">Role title</label>
          <input
            type="text"
            className="work-alignment-input"
            value={ctx.roleTitle}
            onChange={(e) => update('roleTitle', e.target.value)}
            placeholder="e.g. Senior Assessor, Team Lead…"
          />
          <label className="work-alignment-label">Role specification (summary)</label>
          <textarea
            className="notes-area work-alignment-textarea"
            value={ctx.jobSpecification}
            onChange={(e) => update('jobSpecification', e.target.value)}
            placeholder="Key duties from your JD or role profile — what “good” looks like."
            rows={6}
          />
        </div>

        <div className="timeline-card work-alignment-card">
          <h2 className="card-title">
            <span>◇</span> PDR / objectives cycle
          </h2>
          <p className="settings-note">Personal development review: objectives, development goals, progress since last time.</p>
          <label className="work-alignment-label">Period / cycle name</label>
          <input
            type="text"
            className="work-alignment-input"
            value={ctx.pdrPeriodLabel}
            onChange={(e) => update('pdrPeriodLabel', e.target.value)}
            placeholder="e.g. FY2025–26, H1 2026…"
          />
          <label className="work-alignment-label">Objectives &amp; progress</label>
          <textarea
            className="notes-area work-alignment-textarea"
            value={ctx.pdrObjectivesAndProgress}
            onChange={(e) => update('pdrObjectivesAndProgress', e.target.value)}
            placeholder="Your PDR objectives, training, stretch goals — what’s on track, what needs support."
            rows={7}
          />
        </div>

        <div className="timeline-card work-alignment-card work-alignment-card--wide">
          <h2 className="card-title">
            <span>◇</span> This month’s 1:1 conversation
          </h2>
          <p className="settings-note">
            Plan what you want airtime on before the meeting — wins, risks, decisions, career, wellbeing.
          </p>
          <label className="work-alignment-label">Topics &amp; talking points</label>
          <textarea
            className="notes-area work-alignment-textarea"
            value={ctx.monthly121Topics}
            onChange={(e) => update('monthly121Topics', e.target.value)}
            placeholder="- Win: …&#10;- Risk / blocker: …&#10;- Ask: …"
            rows={6}
          />
          <label className="work-alignment-label">Support or resources needed (optional)</label>
          <textarea
            className="notes-area work-alignment-textarea"
            value={ctx.supportOrResourcesNeeded}
            onChange={(e) => update('supportOrResourcesNeeded', e.target.value)}
            placeholder="Budget, headcount, tooling, clarity on priorities…"
            rows={3}
          />
        </div>

        <div className="timeline-card work-alignment-card work-alignment-card--wide">
          <h2 className="card-title">
            <span>◇</span> Export for your line manager
          </h2>
          <p className="settings-note">
            <strong>Full monthly brief</strong> includes issues (1:1 + team sections), alignment fields, and your stress
            log appendix. <strong>Alignment only</strong> omits stress — issues are still included.
          </p>
          <div className="work-alignment-actions">
            <button type="button" className="btn primary" onClick={copyFull}>
              Copy full monthly brief
            </button>
            <button type="button" className="btn" onClick={copyAlignmentOnly}>
              Copy alignment only (no stress log)
            </button>
          </div>
          <pre className="stress-report-pre work-alignment-preview">{packText}</pre>
        </div>
      </div>
    </>
  );
}
