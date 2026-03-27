import { useState, useEffect } from 'react';
import { isVoiceSupported, getVoiceEnabled, setVoiceEnabled, speak } from '../lib/voice.js';

export default function VoicePromptSettings() {
  const [on, setOn] = useState(() => getVoiceEnabled());
  const supported = isVoiceSupported();

  useEffect(() => {
    const sync = () => setOn(getVoiceEnabled());
    window.addEventListener('mik-voice-settings', sync);
    return () => window.removeEventListener('mik-voice-settings', sync);
  }, []);

  const toggle = () => {
    const next = !on;
    setVoiceEnabled(next);
    setOn(next);
    if (next) {
      speak('Voice prompts are on. I will nudge you when the schedule block changes and when a break ends.');
    }
  };

  const test = () => {
    setVoiceEnabled(true);
    setOn(true);
    speak('This is a test. Ready for the next focus block when you are.');
  };

  return (
    <div className="timeline-card settings-card">
      <h2 className="card-title">
        <span>🔊</span> Voice prompts
      </h2>
      {!supported && (
        <p className="settings-note">
          This browser does not support speech synthesis, or it is disabled. Try Chrome or Edge on desktop.
        </p>
      )}
      {supported && (
        <>
          <p className="settings-note">
            Spoken nudges when your <strong>Hourly Focus</strong> block changes and when a <strong>procrastination
            break</strong> ends. Off by default; uses your device voice (nothing is sent to a server).
          </p>
          <div className="voice-row">
            <label className="voice-toggle">
              <input type="checkbox" checked={on} onChange={toggle} />
              <span>Enable voice prompts</span>
            </label>
            <button type="button" className="btn btn-snooze" onClick={test}>
              Test voice
            </button>
          </div>
        </>
      )}
    </div>
  );
}
