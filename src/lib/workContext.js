/**
 * Work alignment: business plan, role/spec, team objectives, PDRs — for structured 1:1 prep with your line manager.
 * All data stays in localStorage on this device.
 */

import { generate121Report } from './stress.js';
import { issuesFor121, issuesForTeamMeeting, RAISE_IN } from './issuesLog.js';

const STORAGE_KEY = 'mik_work_context_v1';

export const DEFAULT_WORK_CONTEXT = {
  businessPlanSummary: '',
  teamObjectives: '',
  myDeliveryAgainstTeam: '',
  roleTitle: '',
  jobSpecification: '',
  pdrPeriodLabel: '',
  pdrObjectivesAndProgress: '',
  monthly121Topics: '',
  supportOrResourcesNeeded: '',
};

export function loadWorkContext() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_WORK_CONTEXT };
    const p = JSON.parse(raw);
    return { ...DEFAULT_WORK_CONTEXT, ...p };
  } catch {
    return { ...DEFAULT_WORK_CONTEXT };
  }
}

export function saveWorkContext(data) {
  const next = { ...DEFAULT_WORK_CONTEXT, ...data };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('mik-work-context-updated'));
}

function nonEmpty(s) {
  return typeof s === 'string' && s.trim().length > 0;
}

/**
 * Plain-text brief for line manager: alignment context + optional stress appendix.
 */
function formatIssueList(issues, emptyNote) {
  if (!issues.length) {
    return [`(${emptyNote})`];
  }
  const out = [];
  issues.forEach((issue, i) => {
    const d = new Date(issue.createdAt);
    const when = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const both = issue.raiseIn === RAISE_IN.BOTH ? ' [both forums]' : '';
    out.push(`${i + 1}. [${when}]${both}`);
    out.push(`   ${issue.text}`);
  });
  return out;
}

export function generateFullMonth121Pack(workContext, stressEvents, options = {}) {
  const { includeStress = true, maxStressEvents = 50, issues = [], includeIssues = true } = options;
  const gen = new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const lines = [];
  lines.push('Monthly 1:1 brief — alignment & conversation prep');
  lines.push(`Generated: ${gen}`);
  lines.push('');
  lines.push(
    'Use the sections below to ground your conversation in the business plan, team objectives, your role, and PDRs. Edit the source in Mik Manager under “1:1 alignment”.'
  );
  lines.push('');
  lines.push('═'.repeat(56));
  lines.push('1. BUSINESS PLAN & ORG PRIORITIES');
  lines.push('═'.repeat(56));
  lines.push(
    nonEmpty(workContext.businessPlanSummary)
      ? workContext.businessPlanSummary.trim()
      : '(Not filled in yet — add how your organisation’s / division’s plan applies to your work.)'
  );
  lines.push('');

  lines.push('═'.repeat(56));
  lines.push('2. TEAM OBJECTIVES & YOUR DELIVERY');
  lines.push('═'.repeat(56));
  lines.push('Team / group objectives (what the team is measured on):');
  lines.push(
    nonEmpty(workContext.teamObjectives)
      ? workContext.teamObjectives.trim()
      : '(Not filled in yet — paste or summarise team OKRs / objectives.)'
  );
  lines.push('');
  lines.push('How I am delivering against those objectives:');
  lines.push(
    nonEmpty(workContext.myDeliveryAgainstTeam)
      ? workContext.myDeliveryAgainstTeam.trim()
      : '(Not filled in yet — concrete examples, outcomes, evidence.)'
  );
  lines.push('');

  lines.push('═'.repeat(56));
  lines.push('3. JOB ROLE & SPECIFICATION');
  lines.push('═'.repeat(56));
  if (nonEmpty(workContext.roleTitle)) {
    lines.push(`Role: ${workContext.roleTitle.trim()}`);
    lines.push('');
  }
  lines.push(
    nonEmpty(workContext.jobSpecification)
      ? workContext.jobSpecification.trim()
      : '(Not filled in yet — key responsibilities from your job description / role spec.)'
  );
  lines.push('');

  lines.push('═'.repeat(56));
  lines.push('4. PDR / OBJECTIVES CYCLE');
  lines.push('═'.repeat(56));
  if (nonEmpty(workContext.pdrPeriodLabel)) {
    lines.push(`Period: ${workContext.pdrPeriodLabel.trim()}`);
    lines.push('');
  }
  lines.push(
    nonEmpty(workContext.pdrObjectivesAndProgress)
      ? workContext.pdrObjectivesAndProgress.trim()
      : '(Not filled in yet — PDR objectives, development goals, and progress since last review.)'
  );
  lines.push('');

  lines.push('═'.repeat(56));
  lines.push('5. THIS MONTH — WHAT TO RAISE WITH YOUR LINE MANAGER');
  lines.push('═'.repeat(56));
  lines.push(
    nonEmpty(workContext.monthly121Topics)
      ? workContext.monthly121Topics.trim()
      : '(Not filled in yet — bullet what you want airtime on: wins, risks, decisions, career.)'
  );
  lines.push('');

  if (nonEmpty(workContext.supportOrResourcesNeeded)) {
    lines.push('Support or resources that would help:');
    lines.push(workContext.supportOrResourcesNeeded.trim());
    lines.push('');
  }

  if (includeIssues) {
    const for121 = issuesFor121(issues);
    const forTeam = issuesForTeamMeeting(issues);

    lines.push('═'.repeat(56));
    lines.push('6. ISSUES LOG — RAISE WITH LINE MANAGER (1:1 OR BOTH)');
    lines.push('═'.repeat(56));
    lines.push(
      ...formatIssueList(
        for121,
        'No issues tagged for 1:1 — add them in Mik Manager → Issues log'
      )
    );
    lines.push('');

    lines.push('═'.repeat(56));
    lines.push('7. ISSUES LOG — RAISE IN TEAM MEETING (TEAM OR BOTH)');
    lines.push('═'.repeat(56));
    lines.push(
      ...formatIssueList(
        forTeam,
        'No issues tagged for team meeting — add them in Mik Manager → Issues log'
      )
    );
    lines.push('');
  }

  if (includeStress) {
    lines.push('═'.repeat(56));
    lines.push(`${includeIssues ? '8' : '6'}. STRESS LOG (appendix — evidence from StressOmeter)`);
    lines.push('═'.repeat(56));
    lines.push('');
    const stressBlock = generate121Report(stressEvents, { maxEvents: maxStressEvents });
    lines.push(stressBlock);
  } else {
    lines.push('—');
    lines.push('Stress log appendix omitted from this export.');
  }

  lines.push('');
  lines.push('This brief is generated locally; review and edit before sharing.');

  return lines.join('\n');
}
