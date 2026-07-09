import { writable } from 'svelte/store';

const STORAGE_KEY = 'multitimer-timers';

export function loadTimers() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.map(t => ({
          id: t.id || '',
          name: t.name || '',
          color: t.color || '#457BDE',
          totalSeconds: Math.max(1, t.totalSeconds || 60),
          remainingSeconds: Math.min(t.remainingSeconds ?? t.totalSeconds, t.totalSeconds ?? 60),
          isRunning: false,
          isExpired: (t.remainingSeconds ?? t.totalSeconds) <= 0,
          createdAt: t.createdAt || Date.now(),
        }));
      }
    }
  } catch (e) {
    // Dati corrotti — ignora
  }
  return [];
}

export function persistTimers(timers) {
  try {
    const slim = timers.map(t => ({
      id: t.id,
      name: t.name,
      color: t.color,
      totalSeconds: t.totalSeconds,
      remainingSeconds: t.remainingSeconds,
      createdAt: t.createdAt,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
  } catch (e) {
    // Storage pieno o non disponibile
  }
}

function createTimerStore() {
  const { subscribe, set, update } = writable(loadTimers());

  let currentTimers = [];
  subscribe(value => { currentTimers = value; });

  let persistTimer = null;
  function schedulePersist() {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => persistTimers(currentTimers), 300);
  }
  function persistNow() {
    clearTimeout(persistTimer);
    persistTimers(currentTimers);
  }

  return {
    subscribe,

    addTimer(name, hours, minutes, seconds, color) {
      const h = Math.max(0, Math.min(99, Number(hours) || 0));
      const m = Math.max(0, Math.min(59, Number(minutes) || 0));
      const s = Math.max(0, Math.min(59, Number(seconds) || 0));
      const totalSeconds = h * 3600 + m * 60 + s;
      if (totalSeconds <= 0 || !name || !name.trim()) return null;

      const timer = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        name: name.trim(),
        color,
        totalSeconds,
        remainingSeconds: totalSeconds,
        isRunning: false,
        isExpired: false,
        createdAt: Date.now(),
      };

      update(t => [...t, timer]);
      persistNow();
      return timer;
    },

    removeTimer(id) {
      update(t => t.filter(ti => ti.id !== id));
      persistNow();
    },

    updateTimer(id, changes) {
      update(t => t.map(ti => ti.id === id ? { ...ti, ...changes } : ti));
      schedulePersist();
    },

    reorder(fromIndex, toIndex) {
      update(t => {
        const result = [...t];
        const [removed] = result.splice(fromIndex, 1);
        result.splice(toIndex, 0, removed);
        return result;
      });
      persistNow();
    },

    /** Restituisce gli id dei timer appena scaduti */
    tick() {
      const expired = [];
      update(t => t.map(ti => {
        if (ti.isRunning && ti.remainingSeconds > 0) {
          const next = ti.remainingSeconds - 1;
          if (next <= 0) {
            expired.push(ti.id);
            return { ...ti, remainingSeconds: 0, isRunning: false, isExpired: true };
          }
          return { ...ti, remainingSeconds: next };
        }
        return ti;
      }));
      schedulePersist();
      return expired;
    },

    /** Ferma tutti i timer in esecuzione (utile all'unmount) */
    pauseAll() {
      update(t => t.map(ti => ti.isRunning ? { ...ti, isRunning: false } : ti));
      persistNow();
    },
  };
}

export const timerStore = createTimerStore();
