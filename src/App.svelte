<script>
  import { onDestroy } from 'svelte';
  import { timerStore } from './lib/stores.js';
  import { playAlarm } from './lib/sound.js';
  import TimerForm from './lib/TimerForm.svelte';
  import TimerList from './lib/TimerList.svelte';

  let timers = [];
  let tickInterval = null;
  let expiredSet = new Set();

  const unsub = timerStore.subscribe(v => { timers = v; });

  /* ── Tick engine ──────────────────────── */
  function startTick() {
    if (tickInterval) return;
    tickInterval = setInterval(() => {
      const justExpired = timerStore.tick();
      for (const id of justExpired) {
        if (!expiredSet.has(id)) {
          expiredSet.add(id);
          playAlarm();
        }
      }
      // Pulisci id di timer ormai rimossi
      const liveIds = new Set(timers.map(t => t.id));
      for (const id of expiredSet) {
        if (!liveIds.has(id)) expiredSet.delete(id);
      }
      // Ferma il tick se nessun timer è in esecuzione
      if (!timers.some(t => t.isRunning)) stopTick();
    }, 1000);
  }

  function stopTick() {
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
  }

  /* ── Azioni ────────────────────────────── */
  function handleAdd(e) {
    const { name, hours, minutes, seconds, color } = e.detail;
    const t = timerStore.addTimer(name, hours, minutes, seconds, color);
    if (t) {
      // Avvia automaticamente il timer appena creato
      timerStore.updateTimer(t.id, { isRunning: true });
      expiredSet.delete(t.id);
      startTick();
    }
  }

  function handleStart(e) {
    timerStore.updateTimer(e.detail.id, { isRunning: true, isExpired: false });
    expiredSet.delete(e.detail.id);
    startTick();
  }

  function handlePause(e) {
    timerStore.updateTimer(e.detail.id, { isRunning: false });
  }

  function handleReset(e) {
    const timer = timers.find(t => t.id === e.detail.id);
    if (timer) {
      timerStore.updateTimer(timer.id, {
        remainingSeconds: timer.totalSeconds,
        isRunning: false,
        isExpired: false,
      });
      expiredSet.delete(timer.id);
    }
  }

  function handleRemove(e) {
    timerStore.removeTimer(e.detail.id);
    expiredSet.delete(e.detail.id);
  }

  function handleReorder(e) {
    timerStore.reorder(e.detail.from, e.detail.to);
  }

  onDestroy(() => {
    stopTick();
    timerStore.pauseAll();
    unsub();
  });
</script>

<div class="app">
  <header class="app-header">
    <h1 class="app-title">MultiTimer</h1>
    <p class="app-subtitle">
      Crea e gestisci più timer visivi per le tue attività. Assegna nome e colore,
      avvia il conto alla rovescia e ricevi una notifica sonora allo scadere.
    </p>
  </header>

  <main class="app-main" id="main-content">
    <TimerForm on:add={handleAdd} />

    <section aria-label="Timer attivi">
      <TimerList
        {timers}
        on:start={handleStart}
        on:pause={handlePause}
        on:reset={handleReset}
        on:remove={handleRemove}
        on:reorder={handleReorder}
      />
    </section>
  </main>

  <footer class="app-footer">
    <p>Tutti i dati sono salvati in locale sul tuo browser. Nessuna informazione viene trasmessa a server esterni.</p>
  </footer>
</div>

<style>
  :global(*),
  :global(*::before),
  :global(*::after) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 16px;
    line-height: 1.6;
    color: #1A1A1C;
    background: #FAF9F6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  :global(:focus-visible) {
    outline: 3px solid #457BDE;
    outline-offset: 2px;
  }

  :global(:focus:not(:focus-visible)) {
    outline: none;
  }

  .app {
    max-width: 680px;
    margin: 0 auto;
    padding: 20px 16px 24px;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }

  .app-header {
    margin-bottom: 20px;
  }

  .app-title {
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-size: 30px;
    font-weight: 700;
    color: #1A1A1C;
    margin: 0 0 6px;
    line-height: 1.15;
    letter-spacing: -0.6px;
  }

  .app-subtitle {
    font-size: 15px;
    color: #6B6B70;
    margin: 0;
    line-height: 1.55;
    max-width: 52ch;
  }

  .app-main {
    flex: 1;
  }

  .app-footer {
    margin-top: 28px;
    padding-top: 14px;
    border-top: 1px solid #E8E6E1;
    text-align: center;
  }

  .app-footer p {
    font-size: 13px;
    color: #B0ADA6;
    margin: 0;
    line-height: 1.5;
  }

  @media (max-width: 480px) {
    .app {
      padding: 14px 10px 20px;
    }
    .app-title {
      font-size: 24px;
      letter-spacing: -0.4px;
    }
    .app-subtitle {
      font-size: 14px;
    }
  }
</style>
