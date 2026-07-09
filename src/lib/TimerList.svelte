<script>
  import { createEventDispatcher } from 'svelte';
  import TimerCard from './TimerCard.svelte';

  export let timers = [];

  const dispatch = createEventDispatcher();

  /* ── Drag state ─────────────────────────── */
  let dragIndex = null;
  let overIndex = null;

  /* ── HTML5 Drag handlers ──────────────── */
  function onDragStart(e) {
    dragIndex = e.detail.index;
  }

  function onDragEnd() {
    dragIndex = null;
    overIndex = null;
  }

  function onDragOver(e, idx) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIndex !== null && dragIndex !== idx) {
      overIndex = idx;
    }
  }

  function onDrop(e, idx) {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== idx) {
      dispatch('reorder', { from: dragIndex, to: idx });
    }
    dragIndex = null;
    overIndex = null;
  }

  /* ── Touch drag handlers ────────────────── */
  let touchDragIndex = null;

  function onTouchDragStart(e) {
    touchDragIndex = e.detail.index;
    dragIndex = e.detail.index;
  }

  function onTouchMove(e) {
    if (touchDragIndex === null) return;
    const touchY = e.touches[0].clientY;
    const items = e.currentTarget.querySelectorAll('.timer-item');
    let closest = touchDragIndex;
    let minDist = Infinity;

    items.forEach((item, i) => {
      const rect = item.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const dist = Math.abs(touchY - mid);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });

    overIndex = closest !== touchDragIndex ? closest : null;
  }

  function onTouchEnd() {
    if (touchDragIndex !== null && overIndex !== null && touchDragIndex !== overIndex) {
      dispatch('reorder', { from: touchDragIndex, to: overIndex });
    }
    touchDragIndex = null;
    dragIndex = null;
    overIndex = null;
  }

  /* ── Timer action forwarders ───────────── */
  function forwardStart(e)  { dispatch('start',  e.detail); }
  function forwardPause(e)  { dispatch('pause',  e.detail); }
  function forwardReset(e)  { dispatch('reset',  e.detail); }
  function forwardRemove(e) { dispatch('remove', e.detail); }
</script>

<div
  class="timer-list"
  role="list"
  aria-label="Lista dei timer"
  on:touchmove={onTouchMove}
  on:touchend={onTouchEnd}
>
  {#if timers.length === 0}
    <div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#B0ADA6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <p>Nessun timer attivo. Aggiungine uno qui sopra per iniziare a tracciare le tue attività.</p>
    </div>
  {:else}
    {#each timers as timer, idx (timer.id)}
      <div
        class="timer-item"
        role="listitem"
        on:dragover|preventDefault={(e) => onDragOver(e, idx)}
        on:drop={(e) => onDrop(e, idx)}
      >
        <TimerCard
          {timer}
          index={idx}
          isDragging={dragIndex === idx}
          dragOver={overIndex === idx}
          on:dragstart={onDragStart}
          on:dragend={onDragEnd}
          on:touchdragstart={onTouchDragStart}
          on:start={forwardStart}
          on:pause={forwardPause}
          on:reset={forwardReset}
          on:remove={forwardRemove}
        />
      </div>
    {/each}
  {/if}
</div>

<style>
  .timer-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    touch-action: none;
  }

  .timer-item {
    transition: transform 0.2s;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 52px 24px;
    text-align: center;
    color: #6B6B70;
    background: #FFFFFF;
    border: 2px dashed #E0DDD5;
    border-radius: 12px;
  }
  .empty-state p {
    margin: 14px 0 0;
    font-size: 15px;
    line-height: 1.6;
    max-width: 340px;
  }

  @media (max-width: 480px) {
    .timer-list {
      gap: 6px;
    }
    .empty-state {
      padding: 40px 16px;
    }
  }
</style>
