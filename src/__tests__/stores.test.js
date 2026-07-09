import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock localStorage condiviso
const storage = {};
globalThis.localStorage = {
  getItem: vi.fn((key) => storage[key] ?? null),
  setItem: vi.fn((key, value) => { storage[key] = value; }),
  removeItem: vi.fn((key) => { delete storage[key]; }),
  clear: vi.fn(() => { Object.keys(storage).forEach(k => delete storage[k]); }),
};

function clearStorage() {
  Object.keys(storage).forEach(k => delete storage[k]);
  vi.clearAllMocks();
}

describe('loadTimers', () => {
  beforeEach(clearStorage);

  it('restituisce array vuoto se localStorage è vuoto', async () => {
    const { loadTimers } = await import('../lib/stores.js');
    expect(loadTimers()).toEqual([]);
  });

  it('carica timer validi dal localStorage', async () => {
    storage['multitimer-timers'] = JSON.stringify([
      { id: 'a1', name: 'Test', color: '#E63946', totalSeconds: 300, remainingSeconds: 150, createdAt: 1000 },
    ]);

    const { loadTimers } = await import('../lib/stores.js');
    const result = loadTimers();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test');
    expect(result[0].isRunning).toBe(false);
  });

  it('gestisce localStorage corrotto restituendo array vuoto', async () => {
    storage['multitimer-timers'] = '{invalid';

    const { loadTimers } = await import('../lib/stores.js');
    expect(loadTimers()).toEqual([]);
  });

  it('imposta isExpired=true se remainingSeconds è 0', async () => {
    storage['multitimer-timers'] = JSON.stringify([
      { id: 'a2', name: 'Zero', color: '#000', totalSeconds: 60, remainingSeconds: 0, createdAt: 1000 },
    ]);

    const { loadTimers } = await import('../lib/stores.js');
    const result = loadTimers();
    expect(result[0].isExpired).toBe(true);
  });
});

describe('persistTimers', () => {
  beforeEach(clearStorage);

  it('salva i timer in localStorage in formato slim', async () => {
    const { persistTimers } = await import('../lib/stores.js');
    persistTimers([
      { id: 'x1', name: 'A', color: '#111', totalSeconds: 60, remainingSeconds: 30, isRunning: true, isExpired: false, createdAt: 1 },
    ]);

    const stored = JSON.parse(storage['multitimer-timers']);
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('x1');
    expect(stored[0].isRunning).toBeUndefined();
  });
});

/* ── Test del timerStore (singleton, usiamo un unico describe) ──── */

describe('timerStore', () => {
  let timerStore;
  let current;
  let unsub;

  beforeEach(async () => {
    clearStorage();
    // Ricarica il modulo per avere uno store pulito
    vi.resetModules();
    const mod = await import('../lib/stores.js');
    timerStore = mod.timerStore;
    current = [];
    unsub = timerStore.subscribe(v => { current = v; });
  });

  afterEach(() => {
    if (unsub) unsub();
  });

  it('aggiunge un timer valido', () => {
    const t = timerStore.addTimer('Pomodoro', 0, 25, 0, '#E63946');
    expect(t).not.toBeNull();
    expect(t.name).toBe('Pomodoro');
    expect(t.totalSeconds).toBe(1500);
    expect(current).toHaveLength(1);
  });

  it('rifiuta timer con nome vuoto', () => {
    const t = timerStore.addTimer('  ', 0, 5, 0, '#000');
    expect(t).toBeNull();
    expect(current).toHaveLength(0);
  });

  it('rifiuta timer con durata zero', () => {
    const t = timerStore.addTimer('Test', 0, 0, 0, '#000');
    expect(t).toBeNull();
  });

  it('decrementa i secondi dei timer in esecuzione', () => {
    timerStore.addTimer('T1', 0, 1, 0, '#111');
    const id = current[0].id;
    timerStore.updateTimer(id, { isRunning: true });

    const expired = timerStore.tick();

    expect(expired).toHaveLength(0);
    expect(current[0].remainingSeconds).toBe(59);
  });

  it('segnala i timer appena scaduti', () => {
    timerStore.addTimer('T1', 0, 0, 1, '#111');
    const id = current[0].id;
    timerStore.updateTimer(id, { isRunning: true });

    const expired = timerStore.tick();

    expect(expired).toHaveLength(1);
    expect(current[0].isExpired).toBe(true);
    expect(current[0].isRunning).toBe(false);
  });

  it('mette in pausa un timer', () => {
    timerStore.addTimer('T1', 0, 1, 0, '#111');
    const id = current[0].id;
    timerStore.updateTimer(id, { isRunning: true });
    expect(current[0].isRunning).toBe(true);

    timerStore.updateTimer(id, { isRunning: false });
    expect(current[0].isRunning).toBe(false);
  });

  it('rimuove un timer', () => {
    timerStore.addTimer('T1', 0, 1, 0, '#111');
    const id = current[0].id;
    expect(current).toHaveLength(1);

    timerStore.removeTimer(id);
    expect(current).toHaveLength(0);
  });

  it('riordina i timer correttamente', () => {
    timerStore.addTimer('A', 0, 1, 0, '#111');
    timerStore.addTimer('B', 0, 2, 0, '#222');
    timerStore.addTimer('C', 0, 3, 0, '#333');

    timerStore.reorder(0, 2);

    expect(current[0].name).toBe('B');
    expect(current[1].name).toBe('C');
    expect(current[2].name).toBe('A');
  });

  it('resetta un timer scaduto', () => {
    timerStore.addTimer('T1', 0, 0, 1, '#111');
    const id = current[0].id;
    timerStore.updateTimer(id, { isRunning: true });
    timerStore.tick(); // scade

    expect(current[0].isExpired).toBe(true);

    timerStore.updateTimer(id, {
      remainingSeconds: current[0].totalSeconds,
      isRunning: false,
      isExpired: false,
    });

    expect(current[0].isExpired).toBe(false);
    expect(current[0].remainingSeconds).toBe(current[0].totalSeconds);
  });

  it('pauseAll ferma tutti i timer', () => {
    timerStore.addTimer('T1', 0, 1, 0, '#111');
    timerStore.addTimer('T2', 0, 2, 0, '#222');

    timerStore.updateTimer(current[0].id, { isRunning: true });
    timerStore.updateTimer(current[1].id, { isRunning: true });

    timerStore.pauseAll();

    expect(current[0].isRunning).toBe(false);
    expect(current[1].isRunning).toBe(false);
  });
});
