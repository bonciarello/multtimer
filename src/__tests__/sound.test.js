import { describe, it, expect, beforeEach, vi } from 'vitest';

function mockAudioContext() {
  const gainNode = {
    gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  };
  const oscNode = {
    type: '',
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };

  return {
    currentTime: 0,
    state: 'running',
    destination: {},
    createOscillator: vi.fn(() => oscNode),
    createGain: vi.fn(() => gainNode),
    resume: vi.fn(() => Promise.resolve()),
    close: vi.fn(),
  };
}

describe('playAlarm', () => {
  beforeEach(() => {
    vi.resetModules();
    delete globalThis.AudioContext;
    delete globalThis.webkitAudioContext;
  });

  it('non lancia eccezioni quando AudioContext non è disponibile', async () => {
    const { playAlarm } = await import('../lib/sound.js');
    expect(() => playAlarm()).not.toThrow();
  });

  it('crea oscillator quando AudioContext è disponibile', async () => {
    const fakeCtx = mockAudioContext();
    globalThis.AudioContext = vi.fn(() => fakeCtx);

    const { playAlarm } = await import('../lib/sound.js');
    playAlarm();

    expect(fakeCtx.createOscillator).toHaveBeenCalled();
    expect(fakeCtx.createOscillator).toHaveBeenCalledTimes(4);
  });

  it('riutilizza lo stesso AudioContext a chiamate successive', async () => {
    const fakeCtx = mockAudioContext();
    globalThis.AudioContext = vi.fn(() => fakeCtx);

    const { playAlarm } = await import('../lib/sound.js');
    playAlarm();
    playAlarm();

    // AudioContext constructor should be called only once
    expect(globalThis.AudioContext).toHaveBeenCalledTimes(1);
  });

  it('riprende il contesto se sospeso', async () => {
    const fakeCtx = mockAudioContext();
    fakeCtx.state = 'suspended';
    globalThis.AudioContext = vi.fn(() => fakeCtx);

    const { playAlarm } = await import('../lib/sound.js');
    playAlarm();

    expect(fakeCtx.resume).toHaveBeenCalled();
  });
});
