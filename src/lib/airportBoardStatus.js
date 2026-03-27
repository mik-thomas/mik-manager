/**
 * Row status for airport-style day board.
 * Optional `disruption`: 'delay' | 'standby' | 'cancelled' — overrides time-based code.
 */

export function getBlockRowStatus(block, currentMs, checked, disruption) {
  if (disruption === 'cancelled') {
    return { code: 'CANCELLED', tone: 'cancelled' };
  }
  if (disruption === 'standby') {
    return { code: 'STANDBY', tone: 'standby' };
  }
  if (disruption === 'delay') {
    return { code: 'DELAYED', tone: 'delayed' };
  }

  const s = block.startTime.getTime();
  const e = block.endTime.getTime();
  if (currentMs < s) {
    return { code: 'SCHEDULED', tone: 'scheduled' };
  }
  if (currentMs >= s && currentMs < e) {
    return { code: 'BOARDING', tone: 'boarding' };
  }
  if (checked) {
    return { code: 'COMPLETE', tone: 'complete' };
  }
  return { code: 'OPEN', tone: 'open' };
}

/**
 * Human-readable status line for modern FIDS-style boards (sentence case, no pills).
 */
export function getBoardStatusPresentation(row, block) {
  switch (row.code) {
    case 'SCHEDULED':
      return { label: `Gate opens ${block.time}`, tone: row.tone };
    case 'BOARDING':
      return { label: 'Boarding', tone: row.tone };
    case 'OPEN':
      return { label: 'Flight closing', tone: row.tone };
    case 'COMPLETE':
      return { label: 'Departed', tone: row.tone };
    case 'DELAYED':
      return { label: 'Delayed', tone: row.tone };
    case 'STANDBY':
      return { label: 'Standby', tone: row.tone };
    case 'CANCELLED':
      return { label: 'Cancelled', tone: row.tone };
    default:
      return { label: row.code, tone: row.tone };
  }
}
