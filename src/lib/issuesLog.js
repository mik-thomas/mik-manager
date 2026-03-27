/**
 * Issues log: problems you hit, tagged where you plan to raise them (team / 1:1 / both).
 * Local only — localStorage on this device.
 */

const STORAGE_KEY = 'mik_issues_log_v1';
const MAX_ISSUES = 200;

export const RAISE_IN = {
  TEAM: 'team',
  ONE_TO_ONE: 'one-to-one',
  BOTH: 'both',
};

export const RAISE_IN_LABEL = {
  [RAISE_IN.TEAM]: 'Team meeting',
  [RAISE_IN.ONE_TO_ONE]: 'Line manager (1:1)',
  [RAISE_IN.BOTH]: 'Both',
};

function loadRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { issues: [] };
    const p = JSON.parse(raw);
    return { issues: Array.isArray(p.issues) ? p.issues : [] };
  } catch {
    return { issues: [] };
  }
}

function saveRaw(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event('mik-issues-updated'));
}

export function getIssues() {
  return loadRaw()
    .issues.slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function addIssue({ text, raiseIn }) {
  const t = (text || '').trim();
  if (!t) return null;
  const valid = [RAISE_IN.TEAM, RAISE_IN.ONE_TO_ONE, RAISE_IN.BOTH];
  const r = valid.includes(raiseIn) ? raiseIn : RAISE_IN.ONE_TO_ONE;

  const issue = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `i-${Date.now()}`,
    text: t,
    raiseIn: r,
    createdAt: new Date().toISOString(),
  };

  const data = loadRaw();
  data.issues.unshift(issue);
  if (data.issues.length > MAX_ISSUES) {
    data.issues = data.issues.slice(0, MAX_ISSUES);
  }
  saveRaw(data);
  return issue;
}

export function updateIssue(id, partial) {
  const data = loadRaw();
  const idx = data.issues.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  const next = { ...data.issues[idx], ...partial };
  if (partial.raiseIn != null) {
    const valid = [RAISE_IN.TEAM, RAISE_IN.ONE_TO_ONE, RAISE_IN.BOTH];
    if (!valid.includes(next.raiseIn)) next.raiseIn = RAISE_IN.ONE_TO_ONE;
  }
  if (partial.text != null) next.text = String(partial.text).trim();
  data.issues[idx] = next;
  saveRaw(data);
  return true;
}

export function deleteIssue(id) {
  const data = loadRaw();
  data.issues = data.issues.filter((i) => i.id !== id);
  saveRaw(data);
}

export function issuesFor121(issues) {
  return issues.filter((i) => i.raiseIn === RAISE_IN.ONE_TO_ONE || i.raiseIn === RAISE_IN.BOTH);
}

export function issuesForTeamMeeting(issues) {
  return issues.filter((i) => i.raiseIn === RAISE_IN.TEAM || i.raiseIn === RAISE_IN.BOTH);
}

/**
 * Standalone copy for team meetings (issues tagged team or both).
 */
export function generateTeamMeetingIssuesBrief(issues) {
  const list = issuesForTeamMeeting(issues);
  const gen = new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const lines = [];
  lines.push('Team meeting — issues to raise');
  lines.push(`Generated: ${gen}`);
  lines.push('');
  lines.push(
    'Items you marked as “Team meeting” or “Both”. Use as a prompt list — edit before sharing if needed.'
  );
  lines.push('');

  if (!list.length) {
    lines.push('No issues logged for team meeting yet. Add them in Mik Manager → Issues log.');
    return lines.join('\n');
  }

  list.forEach((issue, i) => {
    const d = new Date(issue.createdAt);
    const when = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const tag = issue.raiseIn === RAISE_IN.BOTH ? ' (also for 1:1)' : '';
    lines.push(`${i + 1}. [${when}]${tag}`);
    lines.push(`   ${issue.text}`);
    lines.push('');
  });

  lines.push('—');
  lines.push(`Total: ${list.length} issue(s).`);
  return lines.join('\n');
}
