<script>
  import { createEventDispatcher } from 'svelte';

  export let timer;
  export let index;
  export let isDragging = false;
  export let dragOver = false;

  const dispatch = createEventDispatcher();

  function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m
      ? `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`
      : '230, 57, 70';
  }

  $: timerColorRgb = hexToRgb(timer.color);

  $: hours = Math.floor(timer.remainingSeconds / 3600);
  $: mins = Math.floor((timer.remainingSeconds % 3600) / 60);
  $: secs = timer.remainingSeconds % 60;
  $: timeDisplay = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  $: progress = timer.totalSeconds > 0
    ? ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100
    : 0;

  $: statusText = timer.isExpired
    ? 'Scaduto'
    : timer.isRunning
      ? 'In corso'
      : 'In pausa';

  $: toggleLabel = timer.isExpired
    ? 'Riavvia timer'
    : timer.isRunning
      ? 'Metti in pausa'
      : 'Avvia timer';

  $: regionLabel = `Timer: ${timer.name}, ${statusText}, ${timeDisplay}`;

  function onToggle() {
    if (timer.isExpired) {
      dispatch('reset');
    } else if (timer.isRunning) {
      dispatch('pause');
    } else {
      dispatch('start');
    }
  }

  function onReset() {
    dispatch('reset');
  }

  function onRemove() {
    dispatch('remove');
  }

  /* ── HTML5 Drag ─────────────────────────────── */
  function onDragStart(e) {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
    dispatch('dragstart', { index });
  }
  function onDragEnd() {
    dispatch('dragend');
  }

  /* ── Touch drag ─────────────────────────────── */
  function onTouchStart(e) {
    const t = e.touches[0];
    dispatch('touchdragstart', { index, clientY: t.clientY });
  }
</script>

<div
  class="timer-card"
  class:expired={timer.isExpired}
  class:dragging={isDragging}
  class:drag-over={dragOver}
  style="--timer-color: {timer.color}; --timer-color-rgb: {timerColorRgb}"
  role="region"
  aria-label={regionLabel}
>
  <!-- Drag handle -->
  <div
    class="drag-handle"
    draggable="true"
    on:dragstart={onDragStart}
    on:dragend={onDragEnd}
    on:touchstart={onTouchStart}
    aria-label="Trascina per riordinare"
    title="Trascina per riordinare"
    role="button"
    tabindex="0"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="5" r="1.5" />
      <circle cx="15" cy="5" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="15" cy="19" r="1.5" />
    </svg>
  </div>

  <!-- Body -->
  <div class="card-body">
    <div class="card-header">
      <h2 class="timer-name">{timer.name}</h2>
      <span class="status-badge" class:running={timer.isRunning && !timer.isExpired} class:paused={!timer.isRunning && !timer.isExpired} class:expired-badge={timer.isExpired}>
        {statusText}
      </span>
    </div>

    <div class="time-display" aria-atomic="true" aria-live="polite">
      {timeDisplay}
    </div>

    <div
      class="progress-track"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label="Progresso del timer {timer.name}"
    >
      <div
        class="progress-fill"
        style="width: {progress}%; background: {timer.color}"
      ></div>
    </div>

    <div class="card-actions">
      <button
        class="btn btn-primary"
        on:click={onToggle}
        aria-label={toggleLabel}
        title={toggleLabel}
      >
        {#if timer.isExpired || !timer.isRunning}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polygon points="6 4 20 12 6 20 6 4" />
          </svg>
        {:else}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="6" y="4" width="4" height="16" rx="1.5" />
            <rect x="14" y="4" width="4" height="16" rx="1.5" />
          </svg>
        {/if}
      </button>

      <button
        class="btn btn-secondary"
        on:click={onReset}
        aria-label="Azzera timer {timer.name}"
        title="Azzera"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      </button>

      <button
        class="btn btn-danger"
        on:click={onRemove}
        aria-label="Elimina timer {timer.name}"
        title="Elimina"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  </div>
</div>

<style>
  .timer-card {
    display: flex;
    align-items: stretch;
    background: #FFFFFF;
    border: 1px solid #E8E6E1;
    border-left: 4px solid var(--timer-color);
    border-radius: 8px;
    overflow: hidden;
    transition: box-shadow 0.2s, opacity 0.2s, transform 0.2s;
    position: relative;
  }

  .timer-card:hover {
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  }

  .timer-card:focus-within {
    box-shadow: 0 0 0 2px #457BDE;
  }

  .timer-card.dragging {
    opacity: 0.35;
    transform: scale(0.97);
  }

  .timer-card.drag-over {
    box-shadow: 0 0 0 2px #457BDE, 0 4px 16px rgba(69, 123, 222, 0.2);
  }

  /* ── Expired pulse ───────────────────── */
  .timer-card.expired {
    border-left-width: 6px;
    animation: expiredPulse 1.2s ease-in-out infinite;
  }

  @keyframes expiredPulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(var(--timer-color-rgb), 0.4);
    }
    50% {
      box-shadow: 0 0 0 10px rgba(var(--timer-color-rgb), 0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .timer-card.expired {
      animation: none;
      box-shadow: 0 0 0 5px rgba(var(--timer-color-rgb), 0.3);
    }
  }

  /* ── Drag handle ─────────────────────── */
  .drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    min-width: 36px;
    background: #FAF9F6;
    cursor: grab;
    color: #B0ADA6;
    transition: color 0.15s, background 0.15s;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
  }
  .drag-handle:hover {
    color: #5C5A55;
    background: #F0EFEA;
  }
  .drag-handle:focus-visible {
    outline: 2px solid #457BDE;
    outline-offset: -2px;
  }
  .drag-handle:active {
    cursor: grabbing;
  }

  /* ── Body ────────────────────────────── */
  .card-body {
    flex: 1;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .timer-name {
    margin: 0;
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #1A1A1C;
    line-height: 1.3;
    word-break: break-word;
  }

  .status-badge {
    display: inline-block;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    padding: 2px 10px;
    border-radius: 100px;
    line-height: 1.6;
    flex-shrink: 0;
  }

  .status-badge.running {
    background: #E8F5E9;
    color: #2E7D32;
  }
  .status-badge.paused {
    background: #FFF3E0;
    color: #E65100;
  }
  .status-badge.expired-badge {
    background: #FFEBEE;
    color: #C62828;
    animation: badgeBlink 0.7s ease-in-out infinite;
  }

  @keyframes badgeBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }

  @media (prefers-reduced-motion: reduce) {
    .status-badge.expired-badge {
      animation: none;
    }
  }

  /* ── Time display ─────────────────────── */
  .time-display {
    font-family: 'JetBrains Mono', monospace;
    font-size: 38px;
    font-weight: 700;
    color: #1A1A1C;
    line-height: 1.1;
    letter-spacing: 2px;
    font-variant-numeric: tabular-nums;
  }

  .expired .time-display {
    color: #C62828;
  }

  /* ── Progress ─────────────────────────── */
  .progress-track {
    height: 5px;
    background: #F0EFEA;
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 1s linear;
    min-width: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .progress-fill {
      transition: none;
    }
  }

  /* ── Buttons ──────────────────────────── */
  .card-actions {
    display: flex;
    gap: 8px;
    margin-top: 2px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s, transform 0.12s;
    padding: 0;
    flex-shrink: 0;
  }

  .btn:focus-visible {
    outline: 3px solid #457BDE;
    outline-offset: 2px;
  }
  .btn:active {
    transform: scale(0.9);
  }

  .btn-primary {
    background: #1A1A1C;
    color: #FFFFFF;
  }
  .btn-primary:hover {
    background: #333;
  }

  .btn-secondary {
    background: #F0EFEA;
    color: #1A1A1C;
  }
  .btn-secondary:hover {
    background: #E0DDD5;
  }

  .btn-danger {
    background: #FFEBEE;
    color: #C62828;
  }
  .btn-danger:hover {
    background: #FFCDD2;
  }

  /* ── Mobile ───────────────────────────── */
  @media (max-width: 480px) {
    .time-display {
      font-size: 28px;
      letter-spacing: 1px;
    }
    .card-body {
      padding: 10px 12px;
    }
    .btn {
      width: 44px;
      height: 44px;
    }
    .drag-handle {
      width: 40px;
      min-width: 40px;
    }
  }
</style>
