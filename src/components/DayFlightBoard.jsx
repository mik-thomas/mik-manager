import { getPlanVsYouSummary, getExpectedMinBlocks } from '../lib/dayPlan.js';
import AirportBoardScreen from './AirportBoardScreen.jsx';

export default function DayFlightBoard({
  scheduleWithDates,
  activeBlockIndex,
  currentMs,
  currentTime,
  checkedSet,
  onToggleBlock,
  weekProgressPercent,
  stressSession,
  onStressStart,
  onStressEnd,
  disruptions,
  onDisruptionChange,
  activeBlock,
  bellCheckins,
  onRingBell,
}) {
  const checkedCount = checkedSet.size;
  const expectedMin = getExpectedMinBlocks(scheduleWithDates, currentMs, activeBlockIndex);
  const summary = getPlanVsYouSummary(scheduleWithDates.length, activeBlockIndex, checkedCount, expectedMin);

  const alignClass =
    summary.label === 'behind' ? 'airport-ticker--behind' : summary.label === 'ahead' ? 'airport-ticker--ahead' : 'airport-ticker--ok';

  return (
    <div className="day-flight-board">
      <AirportBoardScreen
        scheduleWithDates={scheduleWithDates}
        activeBlock={activeBlock}
        currentMs={currentMs}
        currentTime={currentTime}
        checkedSet={checkedSet}
        onToggleBlock={onToggleBlock}
        weekProgressPercent={weekProgressPercent}
        summary={summary}
        alignClass={alignClass}
        stressSession={stressSession}
        onStressStart={onStressStart}
        onStressEnd={onStressEnd}
        disruptions={disruptions}
        onDisruptionChange={onDisruptionChange}
        bellCheckins={bellCheckins}
        onRingBell={onRingBell}
      />
    </div>
  );
}
