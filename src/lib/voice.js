/**
 * Voice prompts via the Web Speech API (works in most desktop browsers; Safari may need a first tap).
 */

const KEY_ENABLED = 'mik_voice_enabled';

export function isVoiceSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function getVoiceEnabled() {
  return localStorage.getItem(KEY_ENABLED) === '1';
}

export function setVoiceEnabled(on) {
  localStorage.setItem(KEY_ENABLED, on ? '1' : '0');
  window.dispatchEvent(new Event('mik-voice-settings'));
}

/** Cancel any queued speech (e.g. before a new line). */
export function cancelSpeech() {
  if (isVoiceSupported()) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Speak plain text. No-ops if unsupported or disabled.
 * @param {string} text
 * @param {{ rate?: number, pitch?: number }} [opts]
 */
export function speak(text, opts = {}) {
  if (!isVoiceSupported() || !getVoiceEnabled() || !text?.trim()) return;

  const { rate = 1, pitch = 1 } = opts;
  cancelSpeech();

  const u = new SpeechSynthesisUtterance(text.trim());
  u.rate = Math.min(1.2, Math.max(0.7, rate));
  u.pitch = Math.min(1.1, Math.max(0.8, pitch));
  u.lang = 'en-GB';

  window.speechSynthesis.speak(u);
}
