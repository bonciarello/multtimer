<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  const PRESET_COLORS = [
    { value: '#E63946', label: 'Rosso corsa' },
    { value: '#F4A261', label: 'Arancione solare' },
    { value: '#E9C46A', label: 'Giallo miele' },
    { value: '#2A9D8F', label: 'Verde smeraldo' },
    { value: '#457BDE', label: 'Blu elettrico' },
    { value: '#9B5DE5', label: 'Viola ametista' },
    { value: '#F72585', label: 'Rosa acceso' },
    { value: '#06D6A0', label: 'Turchese brillante' },
  ];

  let name = '';
  let hours = 0;
  let minutes = 5;
  let seconds = 0;
  let selectedColor = PRESET_COLORS[0].value;
  let errors = {};

  function validate() {
    errors = {};
    if (!name.trim()) {
      errors.name = 'Inserisci un nome per il timer';
    }
    const h = Math.max(0, Number(hours) || 0);
    const m = Math.max(0, Number(minutes) || 0);
    const s = Math.max(0, Number(seconds) || 0);
    const total = h * 3600 + m * 60 + s;
    if (total <= 0) {
      errors.time = 'Imposta una durata maggiore di zero';
    } else if (total > 86400) {
      errors.time = 'La durata massima è 24 ore';
    }
    return Object.keys(errors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    dispatch('add', {
      name: name.trim(),
      hours: Math.max(0, Number(hours) || 0),
      minutes: Math.max(0, Number(minutes) || 0),
      seconds: Math.max(0, Number(seconds) || 0),
      color: selectedColor,
    });
    name = '';
    hours = 0;
    minutes = 5;
    seconds = 0;
    errors = {};
    document.getElementById('timer-name')?.focus();
  }

  function onKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }
</script>

<form class="timer-form" on:submit|preventDefault={handleSubmit} novalidate>
  <div class="form-row">
    <div class="field name-field">
      <label for="timer-name">Nome attività</label>
      <input
        id="timer-name"
        type="text"
        bind:value={name}
        placeholder="es. Pomodoro, Riunione, Pausa"
        maxlength="40"
        autocomplete="off"
        on:keydown={onKeydown}
        aria-invalid={errors.name ? 'true' : undefined}
        aria-describedby={errors.name ? 'name-error' : undefined}
      />
      {#if errors.name}
        <span id="name-error" class="error" role="alert">{errors.name}</span>
      {/if}
    </div>

    <fieldset class="field time-field">
      <legend class="field-label">Durata</legend>
      <div class="time-inputs">
        <div class="time-unit">
          <label for="timer-hours">Ore</label>
          <input
            id="timer-hours"
            type="number"
            inputmode="numeric"
            bind:value={hours}
            min="0"
            max="23"
            on:keydown={onKeydown}
          />
        </div>
        <span class="time-sep" aria-hidden="true">:</span>
        <div class="time-unit">
          <label for="timer-minutes">Min</label>
          <input
            id="timer-minutes"
            type="number"
            inputmode="numeric"
            bind:value={minutes}
            min="0"
            max="59"
            on:keydown={onKeydown}
          />
        </div>
        <span class="time-sep" aria-hidden="true">:</span>
        <div class="time-unit">
          <label for="timer-seconds">Sec</label>
          <input
            id="timer-seconds"
            type="number"
            inputmode="numeric"
            bind:value={seconds}
            min="0"
            max="59"
            on:keydown={onKeydown}
          />
        </div>
      </div>
      {#if errors.time}
        <span class="error" role="alert">{errors.time}</span>
      {/if}
    </fieldset>
  </div>

  <div class="form-row">
    <fieldset class="field color-field">
      <legend class="field-label">Colore</legend>
      <div class="color-swatches" role="radiogroup" aria-label="Seleziona un colore per il timer">
        {#each PRESET_COLORS as color}
          <button
            type="button"
            class="color-swatch"
            class:selected={selectedColor === color.value}
            style="--swatch-color: {color.value}"
            on:click={() => { selectedColor = color.value; }}
            aria-label={color.label}
            aria-pressed={selectedColor === color.value}
          />
        {/each}
      </div>
    </fieldset>

    <button type="submit" class="btn-add">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      Aggiungi timer
    </button>
  </div>
</form>

<style>
  .timer-form {
    background: #FFFFFF;
    border: 1px solid #E8E6E1;
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 16px;
  }

  .form-row {
    display: flex;
    gap: 16px;
    align-items: flex-end;
    flex-wrap: wrap;
  }
  .form-row + .form-row {
    margin-top: 14px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    border: none;
    padding: 0;
    margin: 0;
  }

  .name-field {
    flex: 1 1 200px;
    min-width: 160px;
  }
  .name-field input {
    width: 100%;
    box-sizing: border-box;
  }

  .time-field {
    flex: 0 0 auto;
  }

  .field-label,
  label:not(.time-unit label) {
    font-size: 12px;
    font-weight: 600;
    color: #6B6B70;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    display: block;
    margin: 0;
    padding: 0;
  }

  legend.field-label {
    margin-bottom: 4px;
  }

  input[type='text'],
  input[type='number'] {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 16px;
    padding: 9px 12px;
    border: 2px solid #E8E6E1;
    border-radius: 8px;
    background: #FAF9F6;
    color: #1A1A1C;
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
  }

  input:focus {
    border-color: #457BDE;
    box-shadow: 0 0 0 3px rgba(69, 123, 222, 0.15);
  }

  input[aria-invalid='true'] {
    border-color: #E63946;
  }
  input[aria-invalid='true']:focus {
    box-shadow: 0 0 0 3px rgba(230, 57, 70, 0.15);
  }

  input[type='number'] {
    width: 56px;
    text-align: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    font-weight: 600;
    -moz-appearance: textfield;
  }
  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .time-inputs {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .time-unit {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .time-unit label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6B6B70;
  }

  .time-sep {
    font-family: 'JetBrains Mono', monospace;
    font-size: 18px;
    font-weight: 700;
    color: #B0ADA6;
    margin-bottom: 16px;
    user-select: none;
  }

  .error {
    font-size: 13px;
    font-weight: 500;
    color: #E63946;
    margin-top: 2px;
  }

  .color-field {
    flex: 0 0 auto;
  }

  .color-swatches {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
  }

  .color-swatch {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 3px solid transparent;
    background: var(--swatch-color);
    cursor: pointer;
    padding: 0;
    transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
    outline: none;
  }
  .color-swatch:hover {
    transform: scale(1.15);
  }
  .color-swatch:focus-visible {
    box-shadow: 0 0 0 3px rgba(69, 123, 222, 0.45);
  }
  .color-swatch.selected {
    border-color: #1A1A1C;
    box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px #1A1A1C;
    transform: scale(1.1);
  }

  .btn-add {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: #1A1A1C;
    color: #FFFFFF;
    border: none;
    border-radius: 8px;
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, transform 0.12s;
    min-height: 44px;
    white-space: nowrap;
    align-self: flex-end;
  }
  .btn-add:hover {
    background: #333;
  }
  .btn-add:focus-visible {
    outline: 3px solid #457BDE;
    outline-offset: 2px;
  }
  .btn-add:active {
    transform: scale(0.97);
  }

  @media (max-width: 600px) {
    .timer-form {
      padding: 12px 14px;
    }
    .form-row {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }
    .name-field {
      min-width: 0;
    }
    .time-inputs {
      justify-content: flex-start;
    }
    .btn-add {
      width: 100%;
      justify-content: center;
    }
    .color-swatches {
      gap: 8px;
    }
    .color-swatch {
      width: 36px;
      height: 36px;
    }
  }
</style>
