import { FLIGHT_STEPS } from '../lib/flightPlan.js';

export default function FlightStrip({ activeId }) {
  return (
    <div className="flight-strip" role="navigation" aria-label="Day flight plan">
      <div className="flight-rail">
        {FLIGHT_STEPS.map((step) => {
          const active = step.id === activeId;
          return (
            <div
              key={step.id}
              className={`flight-seg ${active ? 'flight-seg--active' : ''} ${step.id === 'turbulence' ? 'flight-seg--turb' : ''} ${step.id === 'cocktails' ? 'flight-seg--cocktails' : ''} ${step.id === 'wellbeing' ? 'flight-seg--wellbeing' : ''}`}
            >
              <span className="flight-seg-dot" />
              <span className="flight-seg-name">{step.label}</span>
              <span className="flight-seg-abbr">{step.short}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
