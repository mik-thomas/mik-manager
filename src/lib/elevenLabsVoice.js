/**
 * ElevenLabs text-to-speech (optional). API key is stored in localStorage — fine for personal use;
 * anyone with machine access could extract it. For public apps, use a server-side token instead.
 */

const LS_KEY = 'mik_eleven_api_key';
const LS_VOICE = 'mik_eleven_voice_id';

/** Default voice (user’s ElevenLabs library); override in Settings anytime. */
export const DEFAULT_ELEVEN_VOICE_ID = 'UgBBYS2sOqTuMpoF3BR0';

export const ELEVEN_VOICES_DASHBOARD = 'https://elevenlabs.io/app/voice-library';

export function getElevenLabsApiKey() {
  try {
    return localStorage.getItem(LS_KEY)?.trim() || '';
  } catch {
    return '';
  }
}

export function setElevenLabsApiKey(key) {
  try {
    const t = key.trim();
    if (t) localStorage.setItem(LS_KEY, t);
    else localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event('mik-eleven-voice-settings'));
}

export function getElevenVoiceId() {
  try {
    return localStorage.getItem(LS_VOICE)?.trim() || DEFAULT_ELEVEN_VOICE_ID;
  } catch {
    return DEFAULT_ELEVEN_VOICE_ID;
  }
}

export function setElevenVoiceId(id) {
  try {
    const t = id.trim();
    if (t) localStorage.setItem(LS_VOICE, t);
    else localStorage.removeItem(LS_VOICE);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event('mik-eleven-voice-settings'));
}

export function isElevenLabsConfigured() {
  return getElevenLabsApiKey().length >= 20;
}

/**
 * @param {string} text
 * @param {string} apiKey
 * @param {string} voiceId
 * @param {AbortSignal} [signal]
 * @returns {Promise<Blob>}
 */
export async function synthesizeElevenLabsMp3(text, apiKey, voiceId, signal) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2',
      voice_settings: {
        stability: 0.52,
        similarity_boost: 0.82,
      },
    }),
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      if (j?.detail?.message) detail = j.detail.message;
      else if (typeof j?.detail === 'string') detail = j.detail;
    } catch {
      try {
        detail = await res.text();
      } catch {
        /* keep statusText */
      }
    }
    throw new Error(detail || `ElevenLabs HTTP ${res.status}`);
  }

  return res.blob();
}
