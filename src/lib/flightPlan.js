/**
 * Maps the working day to a simple flight plan: boarding → take off → … → leaving.
 * Turbulence overlays when you’ve chosen a procrastination break (snooze).
 */

export const FLIGHT_STEPS = [
  { id: 'boarding', label: 'Boarding', short: 'Board', hint: 'Gate open — settle before lift-off.' },
  { id: 'takeoff', label: 'Take off', short: 'Go', hint: 'First block — day is moving.' },
  { id: 'inflight', label: 'Inflight', short: 'Cruise', hint: 'In the cruise — keep the heading.' },
  { id: 'turbulence', label: 'Turbulence', short: 'Bump', hint: 'Choppy air — you paused on purpose.' },
  { id: 'descent', label: 'Descent', short: 'Down', hint: 'Bringing altitude down for wrap-up.' },
  { id: 'landing', label: 'Landing', short: 'Final', hint: 'Final approach — land the day.' },
  { id: 'leaving', label: 'Leaving', short: 'Out', hint: 'Off the runway — rest.' },
  {
    id: 'wellbeing',
    label: 'Wellbeing',
    short: 'Care',
    hint: 'Protected wellbeing time — move, breathe, reset.',
  },
  {
    id: 'cocktails',
    label: 'Cocktails & rest',
    short: 'Rest',
    hint: 'Off the clock — no active block. Unwind or recharge.',
  },
];

const byId = Object.fromEntries(FLIGHT_STEPS.map((s) => [s.id, s]));

/** True when this hourly block is your wellbeing slot (title/detail keyword or explicit flag). */
export function isWellbeingBlock(block) {
  if (!block) return false;
  if (block.wellbeing === true) return true;
  const blob = `${block.title || ''} ${block.detail || ''}`;
  return /\bwellbeing\b/i.test(blob) || /\bwell-being\b/i.test(blob);
}

/** Shown on the flight plan when there is no active schedule block (same as “off the clock” in Hourly Focus). */
export const COCKTAILS_FLIGHT_PLAN = {
  activeId: 'cocktails',
  meta: byId.cocktails,
};

/**
 * @param {object} p
 * @param {Array<{ startTime: Date, endTime: Date }>} p.scheduleWithDates
 * @param {number} p.currentMs
 * @param {number} p.activeBlockIndex -1 if none
 * @param {boolean} p.inSnooze
 */
export function getFlightPlanState({ scheduleWithDates, currentMs, activeBlockIndex, inSnooze }) {
  const n = scheduleWithDates.length;
  if (n === 0) {
    return { activeId: 'inflight', meta: byId.inflight };
  }

  const firstStart = scheduleWithDates[0].startTime.getTime();
  const lastEnd = scheduleWithDates[n - 1].endTime.getTime();

  if (inSnooze && activeBlockIndex >= 0) {
    return { activeId: 'turbulence', meta: byId.turbulence };
  }

  if (currentMs < firstStart) {
    return { activeId: 'boarding', meta: byId.boarding };
  }

  if (currentMs >= lastEnd) {
    return { activeId: 'leaving', meta: byId.leaving };
  }

  if (activeBlockIndex === -1) {
    return { activeId: 'inflight', meta: { ...byId.inflight, hint: 'Between blocks — still inflight.' } };
  }

  const activeBlock = scheduleWithDates[activeBlockIndex];
  if (isWellbeingBlock(activeBlock)) {
    return { activeId: 'wellbeing', meta: byId.wellbeing };
  }

  const idx = activeBlockIndex;

  if (n === 1) {
    return { activeId: 'inflight', meta: { ...byId.inflight, hint: 'Single block day — stay on course.' } };
  }

  if (idx === 0) {
    return { activeId: 'takeoff', meta: byId.takeoff };
  }

  if (idx === n - 1) {
    return { activeId: 'landing', meta: byId.landing };
  }

  if (idx === n - 2) {
    return { activeId: 'descent', meta: byId.descent };
  }

  return { activeId: 'inflight', meta: byId.inflight };
}
