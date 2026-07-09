let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Suona una sequenza di quattro note ascendenti (C5→E5→G5→C6)
 * come notifica alla scadenza del timer.
 */
export function playAlarm() {
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 523.25, start: 0,     dur: 0.15 },
    { freq: 659.25, start: 0.15,  dur: 0.15 },
    { freq: 783.99, start: 0.30,  dur: 0.20 },
    { freq: 1046.5, start: 0.50,  dur: 0.35 },
  ];

  notes.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const t = now + start;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.start(t);
    osc.stop(t + dur);
  });
}
