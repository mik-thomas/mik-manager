/**
 * Voice prompts: optional ElevenLabs TTS, else Web Speech API.
 * Cabin triple-chime + inflight bed via Web Audio when available.
 */

import {
  synthesizeElevenLabsMp3,
  isElevenLabsConfigured,
  getElevenLabsApiKey,
  getElevenVoiceId,
} from './elevenLabsVoice.js';
import {
  ensureAudioContext,
  isWebAudioSupported,
  playTripleBellChime,
  startInflightAmbience,
  TRIPLE_CHIME_TO_SPEECH_MS,
} from './voiceAircraft.js';

const KEY_ENABLED = 'mik_voice_enabled';

let pendingSpeechTimer = null;
let inflightHandle = null;
let fetchAbort = null;
/** @type {HTMLAudioElement | null} */
let currentAudio = null;

export function isVoiceSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** True if we can play announcements (system voice and/or ElevenLabs). */
export function canPlayVoicePrompts() {
  return isVoiceSupported() || isElevenLabsConfigured();
}

export function getVoiceEnabled() {
  return localStorage.getItem(KEY_ENABLED) === '1';
}

export function setVoiceEnabled(on) {
  localStorage.setItem(KEY_ENABLED, on ? '1' : '0');
  window.dispatchEvent(new Event('mik-voice-settings'));
}

function endInflightBed() {
  inflightHandle?.fadeOut(0.55);
  inflightHandle = null;
}

function cleanupCurrentAudio() {
  if (!currentAudio) return;
  try {
    currentAudio.pause();
    const src = currentAudio.src;
    currentAudio.removeAttribute('src');
    currentAudio.load();
    if (src.startsWith('blob:')) URL.revokeObjectURL(src);
  } catch {
    /* ignore */
  }
  currentAudio = null;
}

/** Cancel chime delay, inflight bed, fetch, streamed audio, and speech synthesis. */
export function cancelSpeech() {
  if (pendingSpeechTimer != null) {
    window.clearTimeout(pendingSpeechTimer);
    pendingSpeechTimer = null;
  }
  fetchAbort?.abort();
  fetchAbort = null;
  cleanupCurrentAudio();
  inflightHandle?.fadeOut(0.12);
  inflightHandle = null;
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
  if (!getVoiceEnabled() || !text?.trim()) return;
  if (!canPlayVoicePrompts()) return;

  const trimmed = text.trim();
  const { rate = 1, pitch = 1 } = opts;
  const useEleven = isElevenLabsConfigured();

  cancelSpeech();

  const runSystemUtterance = () => {
    if (!getVoiceEnabled() || !isVoiceSupported()) {
      endInflightBed();
      return;
    }
    const u = new SpeechSynthesisUtterance(trimmed);
    u.rate = Math.min(1.2, Math.max(0.7, rate));
    u.pitch = Math.min(1.1, Math.max(0.8, pitch));
    u.lang = 'en-GB';
    u.onend = endInflightBed;
    u.onerror = endInflightBed;
    window.speechSynthesis.speak(u);
  };

  const runElevenLabs = async (ctx, signal) => {
    const apiKey = getElevenLabsApiKey();
    const voiceId = getElevenVoiceId();
    const blob = await synthesizeElevenLabsMp3(trimmed, apiKey, voiceId, signal);
    if (!getVoiceEnabled() || signal.aborted) return;
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    currentAudio = audio;
    audio.src = url;
    audio.onended = () => {
      cleanupCurrentAudio();
      endInflightBed();
    };
    audio.onerror = () => {
      cleanupCurrentAudio();
      endInflightBed();
    };
    try {
      await audio.play();
    } catch {
      cleanupCurrentAudio();
      if (isVoiceSupported() && !signal.aborted) runSystemUtterance();
      else endInflightBed();
    }
  };

  const afterChimes = async (ctx) => {
    if (!getVoiceEnabled()) return;
    const ac = new AbortController();
    fetchAbort = ac;
    if (ctx) inflightHandle = startInflightAmbience(ctx);
    try {
      if (useEleven) {
        await runElevenLabs(ctx, ac.signal);
      } else {
        runSystemUtterance();
      }
    } catch (e) {
      if (ac.signal.aborted) return;
      console.warn('Voice announcement failed, falling back if possible.', e);
      if (isVoiceSupported()) runSystemUtterance();
      else {
        inflightHandle?.fadeOut(0.12);
        inflightHandle = null;
      }
    } finally {
      fetchAbort = null;
    }
  };

  if (!isWebAudioSupported()) {
    void (async () => {
      if (useEleven) {
        const ac = new AbortController();
        fetchAbort = ac;
        try {
          await runElevenLabs(null, ac.signal);
        } catch (e) {
          if (!ac.signal.aborted && isVoiceSupported()) runSystemUtterance();
        } finally {
          fetchAbort = null;
        }
      } else {
        runSystemUtterance();
      }
    })();
    return;
  }

  void (async () => {
    const ctx = await ensureAudioContext();
    if (ctx) playTripleBellChime(ctx);
    if (!ctx) {
      void afterChimes(null);
      return;
    }
    pendingSpeechTimer = window.setTimeout(() => {
      pendingSpeechTimer = null;
      void afterChimes(ctx);
    }, TRIPLE_CHIME_TO_SPEECH_MS);
  })();
}
