/**
 * Web Audio: classic three-note cabin PA chime + low inflight-style ambience under announcements.
 * Speech synthesis still uses the OS voice; ambience plays in parallel in the same audio context.
 */

const Ctor = typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null;

let sharedCtx = null;

export function isWebAudioSupported() {
  return Boolean(Ctor);
}

/** @returns {Promise<AudioContext | null>} */
export async function ensureAudioContext() {
  if (!Ctor) return null;
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new Ctor();
  }
  if (sharedCtx.state === 'suspended') {
    try {
      await sharedCtx.resume();
    } catch {
      return null;
    }
  }
  return sharedCtx.state === 'running' ? sharedCtx : null;
}

/**
 * Airbus-style triple chime: three descending “bells”, clearly separated.
 * @param {{ masterGain?: number }} [opts]
 */
export function playTripleBellChime(ctx, opts = {}) {
  const masterGain = opts.masterGain ?? 0.62;
  const t0 = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = masterGain;
  master.connect(ctx.destination);

  /** Two partials for a slightly metallic bell decay */
  function strike(hz, start, dur) {
    const f1 = ctx.createOscillator();
    const f2 = ctx.createOscillator();
    f1.type = 'sine';
    f2.type = 'sine';
    f1.frequency.setValueAtTime(hz, start);
    f2.frequency.setValueAtTime(hz * 2.01, start);

    const g1 = ctx.createGain();
    const g2 = ctx.createGain();
    const mix = ctx.createGain();

    const peak1 = 0.5;
    const peak2 = 0.09;
    g1.gain.setValueAtTime(0.001, start);
    g1.gain.linearRampToValueAtTime(peak1, start + 0.018);
    g1.gain.exponentialRampToValueAtTime(0.001, start + dur);

    g2.gain.setValueAtTime(0.001, start);
    g2.gain.linearRampToValueAtTime(peak2, start + 0.022);
    g2.gain.exponentialRampToValueAtTime(0.001, start + dur * 0.92);

    f1.connect(g1);
    f2.connect(g2);
    g1.connect(mix);
    g2.connect(mix);
    mix.connect(master);

    f1.start(start);
    f2.start(start);
    f1.stop(start + dur + 0.06);
    f2.stop(start + dur + 0.06);
  }

  strike(1318.51, t0 + 0.0, 0.32); // E6
  strike(987.77, t0 + 0.19, 0.34); // B5
  strike(783.99, t0 + 0.4, 0.38); // G5
}

/**
 * Looping filtered noise ≈ cabin air / distant engine bed (very quiet vs speech).
 * @returns {{ fadeOut: (sec?: number) => void, stop: () => void }}
 */
export function startInflightAmbience(ctx) {
  const sampleRate = ctx.sampleRate;
  const seconds = 4;
  const n = Math.floor(sampleRate * seconds);
  const buffer = ctx.createBuffer(1, n, sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < n; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    const pink = b0 + b1 + b2 + white * 0.5362;
    data[i] = pink * 0.11;
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;

  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 90;

  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 520;
  lp.Q.value = 0.45;

  const shelf = ctx.createBiquadFilter();
  shelf.type = 'lowshelf';
  shelf.frequency.value = 220;
  shelf.gain.value = 4;

  const g = ctx.createGain();
  g.gain.value = 0.001;

  src.connect(hp);
  hp.connect(lp);
  lp.connect(shelf);
  shelf.connect(g);
  g.connect(ctx.destination);

  const now = ctx.currentTime;
  g.gain.setValueAtTime(0.001, now);
  g.gain.linearRampToValueAtTime(0.11, now + 0.4);

  src.start(now);

  let fadeTimer = null;

  return {
    fadeOut(sec = 0.5) {
      const t = ctx.currentTime;
      g.gain.cancelScheduledValues(t);
      const v = Math.max(0.001, g.gain.value);
      g.gain.setValueAtTime(v, t);
      g.gain.linearRampToValueAtTime(0.001, t + sec);
      if (fadeTimer) window.clearTimeout(fadeTimer);
      fadeTimer = window.setTimeout(() => this.stop(), sec * 1000 + 120);
    },
    stop() {
      if (fadeTimer) {
        window.clearTimeout(fadeTimer);
        fadeTimer = null;
      }
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
      try {
        src.disconnect();
        hp.disconnect();
        lp.disconnect();
        shelf.disconnect();
        g.disconnect();
      } catch {
        /* ignore */
      }
    },
  };
}

/** Milliseconds after third bell before starting ambience + speech */
export const TRIPLE_CHIME_TO_SPEECH_MS = 920;
