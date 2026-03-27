import { useState, useEffect } from 'react';
import {
  canPlayVoicePrompts,
  getVoiceEnabled,
  setVoiceEnabled,
  speak,
} from '../lib/voice.js';
import {
  getElevenLabsApiKey,
  setElevenLabsApiKey,
  getElevenVoiceId,
  setElevenVoiceId,
  isElevenLabsConfigured,
  DEFAULT_ELEVEN_VOICE_ID,
  ELEVEN_VOICES_DASHBOARD,
} from '../lib/elevenLabsVoice.js';

export default function VoicePromptSettings() {
  const [on, setOn] = useState(() => getVoiceEnabled());
  const supported = canPlayVoicePrompts();
  const [apiKeyInput, setApiKeyInput] = useState(() => getElevenLabsApiKey());
  const [voiceIdInput, setVoiceIdInput] = useState(() => getElevenVoiceId());
  const [elevenSaved, setElevenSaved] = useState(false);

  useEffect(() => {
    const sync = () => setOn(getVoiceEnabled());
    window.addEventListener('mik-voice-settings', sync);
    return () => window.removeEventListener('mik-voice-settings', sync);
  }, []);

  useEffect(() => {
    const sync = () => {
      setApiKeyInput(getElevenLabsApiKey());
      setVoiceIdInput(getElevenVoiceId());
    };
    window.addEventListener('mik-eleven-voice-settings', sync);
    return () => window.removeEventListener('mik-eleven-voice-settings', sync);
  }, []);

  const persistEleven = () => {
    setElevenLabsApiKey(apiKeyInput);
    setElevenVoiceId(voiceIdInput);
    setElevenSaved(true);
    window.setTimeout(() => setElevenSaved(false), 2000);
  };

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
          Add an <strong>ElevenLabs API key</strong> below, or use a browser with speech synthesis (Chrome / Edge on
          desktop).
        </p>
      )}
      {supported && (
        <>
          <p className="settings-note">
            Spoken nudges when your <strong>Hourly Focus</strong> block changes and when a <strong>procrastination
            break</strong> ends. Each cue uses the <strong>three-note cabin chime</strong> and{' '}
            <strong>inflight-style cabin bed</strong>, then either <strong>ElevenLabs</strong> (if configured) or your
            <strong> system voice</strong>.
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

          <div className="voice-eleven">
            <h3 className="voice-eleven-title">ElevenLabs (optional)</h3>
            <p className="settings-field-help">
              Clearer voices than the browser. Create an API key under{' '}
              <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noreferrer">
                ElevenLabs → API keys
              </a>
              . Pick a voice in the{' '}
              <a href={ELEVEN_VOICES_DASHBOARD} target="_blank" rel="noreferrer">
                voice library
              </a>{' '}
              and paste its <strong>Voice ID</strong> (a default is filled in; change anytime).
            </p>
            <p className="settings-field-help voice-eleven-warn">
              Your key is stored in <strong>localStorage</strong> on this machine only — fine for personal use, but
              anyone with access to this device or the built JS could extract it. Usage bills your ElevenLabs account.
              If the browser blocks the request (CORS), try another network or use system voice only.
            </p>
            <label className="voice-eleven-field">
              <span>API key</span>
              <input
                type="password"
                className="voice-eleven-input"
                autoComplete="off"
                placeholder="xi_… or your ElevenLabs key"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
            </label>
            <label className="voice-eleven-field">
              <span>Voice ID</span>
              <input
                type="text"
                className="voice-eleven-input"
                spellCheck={false}
                placeholder={`Default: ${DEFAULT_ELEVEN_VOICE_ID.slice(0, 8)}…`}
                value={voiceIdInput}
                onChange={(e) => setVoiceIdInput(e.target.value)}
              />
            </label>
            <div className="voice-eleven-actions">
              <button type="button" className="btn primary" onClick={persistEleven}>
                Save ElevenLabs settings
              </button>
              {elevenSaved && <span className="settings-saved">Saved.</span>}
              {isElevenLabsConfigured() && (
                <span className="voice-eleven-active">Using ElevenLabs for announcements.</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
