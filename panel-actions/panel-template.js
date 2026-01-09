"use strict";

(function () {
  const assets = window.CrazyPanelAssets = window.CrazyPanelAssets || {};
  const CRAZY_SPEED_LOCKED_MAX = 1050;
  const CRAZY_SPEED_UNLOCKED_MAX = 2000;
  registerStyleChunk(buildBaseStyles());

  function createPanel(options) {
    const {
      shared,
      onAction,
      onZoomChange,
      onRainbowSpeedChange,
      onRainbowColorCountChange,
      onRainbowSpeedUnlockToggle,
    } = options;
    const { constants } = shared;
    const panel = document.createElement("aside");
    panel.id = constants.PANEL_ID;
    panel.innerHTML = getPanelMarkup();

    panel.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => onAction(btn));
    });

    const slider = panel.querySelector("#crazy-size-slider");
    if (slider) {
      slider.addEventListener("input", (event) => onZoomChange(event.target.value));
    }

    const rainbowSpeedSlider = panel.querySelector("#crazy-rainbow-speed-slider");
    const unlockButton = panel.querySelector("#crazy-speed-unlock-btn");
    const safetyToggle = panel.querySelector("#crazy-safety-menu-toggle");
    const safetyPanel = panel.querySelector("#crazy-safety-menu-panel");
    const speedState = shared && shared.state ? shared.state : {};
    let crazySpeedUnlocked = Boolean(speedState.rainbowSpeedUnlocked);
    if (rainbowSpeedSlider && typeof onRainbowSpeedChange === "function") {
      const initialSpeed = getInitialRainbowSpeed(shared);
      // Invert for display: speed value 800ms -> slider value 1300 (which maps back to 800ms)
      rainbowSpeedSlider.value = 2100 - initialSpeed;
      rainbowSpeedSlider.addEventListener("input", (event) => {
        const sliderValue = applySpeedSliderLimit(clampRainbowSpeed(event.target.value));
        const speed = sliderValueToSpeed(sliderValue);
        onRainbowSpeedChange(speed);
      });
      applySpeedLockState();
    }

    const rainbowColorCountSlider = panel.querySelector("#crazy-rainbow-color-count-slider");
    if (rainbowColorCountSlider && typeof onRainbowColorCountChange === "function") {
      const initialColorCount = getInitialRainbowColorCount(shared);
      rainbowColorCountSlider.value = initialColorCount;
      rainbowColorCountSlider.addEventListener("input", (event) => {
        const value = clampRainbowColorCount(event.target.value);
        onRainbowColorCountChange(value);
      });
    }

    function sliderValueToSpeed(value) {
      return 2100 - Number(value);
    }

    function applySpeedSliderLimit(value) {
      const max = crazySpeedUnlocked ? CRAZY_SPEED_UNLOCKED_MAX : CRAZY_SPEED_LOCKED_MAX;
      const numericValue = Number(value);
      if (Number.isNaN(numericValue)) {
        return max;
      }
      return Math.min(max, numericValue);
    }

    function applySpeedLockState() {
      if (rainbowSpeedSlider) {
        const maxValue = crazySpeedUnlocked ? CRAZY_SPEED_UNLOCKED_MAX : CRAZY_SPEED_LOCKED_MAX;
        rainbowSpeedSlider.max = String(maxValue);
        if (Number(rainbowSpeedSlider.value) > maxValue) {
          rainbowSpeedSlider.value = String(maxValue);
          const enforcedSpeed = sliderValueToSpeed(maxValue);
          onRainbowSpeedChange(enforcedSpeed);
        }
      }
      if (unlockButton) {
        unlockButton.classList.toggle("is-on", crazySpeedUnlocked);
        unlockButton.setAttribute("aria-pressed", String(crazySpeedUnlocked));
        unlockButton.textContent = crazySpeedUnlocked ? "Lock Crazy Speed" : "Unlock Crazy Speed";
      }
    }

    if (unlockButton && typeof onRainbowSpeedUnlockToggle === "function") {
      unlockButton.addEventListener("click", () => {
        crazySpeedUnlocked = !crazySpeedUnlocked;
        onRainbowSpeedUnlockToggle(crazySpeedUnlocked);
        applySpeedLockState();
      });
    }

    if (safetyToggle && safetyPanel) {
      safetyToggle.addEventListener("click", () => {
        const isOpen = safetyToggle.getAttribute("aria-expanded") === "true";
        safetyToggle.setAttribute("aria-expanded", String(!isOpen));
        safetyPanel.classList.toggle("is-open", !isOpen);
      });
    }

    return panel;
  }

  function getPanelMarkup() {
    return `
      <h2>🌀 Coding Chaos</h2>
      <p>Tap the buttons to remix the page like a wizard.</p>

      <div class="panel-section">
        <button type="button" data-action="rainbow">🌈 Rainbow World</button>
      </div>

      <div class="panel-section panel-section--tornado">
        <div class="panel-section__header">
          <label for="crazy-rainbow-speed-slider">Rainbow Speed</label>
        </div>
        <input
          id="crazy-rainbow-speed-slider"
          class="slider slider--tornado"
          type="range"
          min="100"
          max="2000"
          step="50"
          value="100"
          aria-label="Rainbow speed"
        />
        <p class="slider-hint">Slow motion ↔ Lightning fast</p>
      </div>

      <div class="panel-section panel-section--tornado">
        <div class="panel-section__header">
          <label for="crazy-rainbow-color-count-slider">Color Count</label>
        </div>
        <input
          id="crazy-rainbow-color-count-slider"
          class="slider slider--tornado"
          type="range"
          min="3"
          max="12"
          step="1"
          value="3"
          aria-label="Number of colors in rainbow"
        />
        <p class="slider-hint">Simple ↔ Ultra vibrant</p>
      </div>

      <div class="panel-section">
        <button type="button" data-action="buttons">🪄 Button Tornado</button>
      </div>

      <div class="panel-section panel-section--tornado">
        <div class="panel-section__header">
          <label for="crazy-tornado-slider">Tornado Craziness</label>
          <span id="crazy-tornado-label" class="panel-chip">Breezy</span>
        </div>
        <input
          id="crazy-tornado-slider"
          class="slider slider--tornado"
          type="range"
          min="0"
          max="180"
          step="3"
          value="10"
          aria-label="Button tornado craziness"
        />
        <p class="slider-hint">Giggle breeze ↔ Sock-blowing mayhem</p>
      </div>

      <div class="panel-section">
        <button type="button" data-action="invert">🧪 Flip Colors</button>
        <button type="button" data-action="wiggle">💃 Dance Party</button>
      </div>

      <div class="panel-section">
        <label for="crazy-size-slider">Super Zoom</label>
        <input id="crazy-size-slider" class="slider" type="range" min="-4" max="8" value="0" />
      </div>

      <div class="panel-section">
        <button type="button" data-action="confetti">🎉 Confetti Boom</button>
        <button type="button" data-action="reset" class="ghost">🧹 Calm Everything</button>
      </div>

      <div class="safety-menu">
        <button
          type="button"
          id="crazy-safety-menu-toggle"
          class="safety-menu__toggle"
          aria-haspopup="true"
          aria-expanded="false"
          aria-controls="crazy-safety-menu-panel"
        >
          ☰ Safety Menu
        </button>
        <div id="crazy-safety-menu-panel" class="safety-menu__panel" role="region" aria-label="Safety controls">
          <p class="safety-menu__label">Rainbow speed needs an adult unlock.</p>
          <button type="button" id="crazy-speed-unlock-btn" class="ghost" aria-pressed="false">
            Unlock Crazy Speed
          </button>
        </div>
      </div>
    `;
  }

  assets.createPanel = createPanel;

  function clampRainbowSpeed(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 2000;
    }
    // Clamp to slider range (100 to 2000)
    return Math.min(2000, Math.max(100, numeric));
  }

  function getInitialRainbowSpeed(shared) {
    if (!shared || !shared.state) {
      return 2000;
    }
    return shared.state.rainbowSpeed ?? 2000;
  }

  function clampRainbowColorCount(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 3;
    }
    return Math.min(12, Math.max(3, Math.round(numeric)));
  }

  function getInitialRainbowColorCount(shared) {
    if (!shared || !shared.state) {
      return 3;
    }
    return clampRainbowColorCount(shared.state.rainbowColorCount ?? 3);
  }

  function buildBaseStyles() {
    const shared = window.CrazyPanelShared;
    const constants = (shared && shared.constants) || {
      PANEL_ID: "crazy-play-panel",
      PANEL_TOGGLE_ID: "crazy-panel-toggle",
      PANEL_WIDTH: 280,
    };

    return `
      :root {
        --crazy-panel-width: ${constants.PANEL_WIDTH}px;
      }

      body.crazy-panel-offset {
        margin-left: var(--crazy-panel-width);
        transition: margin-left 0.3s ease;
      }

      body.crazy-panel-closed {
        margin-left: 0;
      }

      #${constants.PANEL_ID} {
        position: fixed;
        left: 0;
        top: 0;
        width: var(--crazy-panel-width);
        height: 100vh;
        background: linear-gradient(180deg, #ff8a00, #ff3c7d 45%, #725bff);
        color: #fff;
        font-family: "Comic Sans MS", "Baloo 2", "Trebuchet MS", sans-serif;
        z-index: 10000;
        padding: 1.25rem 1rem 2rem;
        box-shadow: 6px 0 24px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
        transform: translateX(0);
        transition: transform 0.4s ease;
      }

      body.crazy-panel-closed #${constants.PANEL_ID} {
        transform: translateX(calc(-1 * var(--crazy-panel-width)));
      }

      #${constants.PANEL_ID} h2 {
        font-size: 1.8rem;
        margin: 0;
        line-height: 1.1;
      }

      #${constants.PANEL_ID} p {
        margin: 0;
        font-size: 0.95rem;
      }

      #${constants.PANEL_ID} button {
        border: none;
        border-radius: 999px;
        padding: 0.55rem 0.9rem;
        font-size: 1rem;
        font-weight: 700;
        text-transform: capitalize;
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
        cursor: pointer;
        transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
      }

      #${constants.PANEL_ID} button:hover {
        transform: scale(1.04);
        background: rgba(0, 0, 0, 0.2);
      }

      #${constants.PANEL_ID} button:focus-visible {
        outline: 3px solid #fff;
        outline-offset: 2px;
      }

      #${constants.PANEL_ID} button.is-on {
        background: #00ffc3;
        color: #1f174d;
      }

      #${constants.PANEL_ID} .panel-section {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }

      #${constants.PANEL_ID} .panel-section--tornado {
        gap: 0.2rem;
      }

      #${constants.PANEL_ID} .panel-section__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.35rem;
      }

      #${constants.PANEL_ID} label {
        font-weight: 600;
        font-size: 0.85rem;
        letter-spacing: 0.5px;
      }

      #${constants.PANEL_ID} .slider {
        width: 100%;
        accent-color: #fff;
      }

      #${constants.PANEL_ID} .panel-chip {
        font-size: 0.72rem;
        background: rgba(0, 0, 0, 0.32);
        border-radius: 999px;
        padding: 0.15rem 0.6rem;
        font-weight: 700;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        white-space: nowrap;
      }

      #${constants.PANEL_ID} .slider-hint {
        margin: 0;
        font-size: 0.72rem;
        letter-spacing: 0.4px;
        opacity: 0.85;
      }

      #${constants.PANEL_ID} .ghost {
        background: rgba(0, 0, 0, 0.45);
      }

      #${constants.PANEL_ID} .safety-menu {
        margin-top: auto;
        position: relative;
        padding-top: 0.5rem;
      }

      #${constants.PANEL_ID} .safety-menu__toggle {
        width: 100%;
        display: flex;
        justify-content: center;
        gap: 0.4rem;
        align-items: center;
        border: none;
        border-radius: 999px;
        background: rgba(0,0,0,0.35);
        color: #fff;
        font-weight: 700;
        padding: 0.5rem 0.75rem;
        cursor: pointer;
        box-shadow: 0 6px 16px rgba(0,0,0,0.35);
      }

      #${constants.PANEL_ID} .safety-menu__toggle:focus-visible {
        outline: 3px solid #fff;
        outline-offset: 2px;
      }

      #${constants.PANEL_ID} .safety-menu__panel {
        position: absolute;
        right: 0;
        bottom: calc(100% + 0.5rem);
        width: calc(100% - 0.5rem);
        background: rgba(0,0,0,0.6);
        border-radius: 1rem;
        padding: 0.8rem;
        box-shadow: 0 10px 24px rgba(0,0,0,0.45);
        opacity: 0;
        pointer-events: none;
        transform: translateY(8px);
        transition: opacity 0.2s ease, transform 0.2s ease;
      }

      #${constants.PANEL_ID} .safety-menu__panel.is-open {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
      }

      #${constants.PANEL_ID} .safety-menu__label {
        margin: 0 0 0.5rem;
        font-size: 0.75rem;
        line-height: 1.2;
        color: rgba(255,255,255,0.9);
      }

      #${constants.PANEL_TOGGLE_ID} {
        position: fixed;
        bottom: 1rem;
        left: 1rem;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        border: none;
        background: conic-gradient(from 90deg, #ff9a9e, #fad0c4, #fad0c4, #fbc2eb, #a6c1ee, #fbc2eb, #ff9a9e);
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.35);
        cursor: pointer;
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
        color: #2c1b5a;
        font-size: 1.75rem;
      }

      #${constants.PANEL_TOGGLE_ID}:hover {
        transform: scale(1.05) translateY(-2px);
        box-shadow: 0 20px 32px rgba(0,0,0,0.4);
      }

      #${constants.PANEL_TOGGLE_ID}:focus-visible {
        outline: 3px solid #fff;
        outline-offset: 4px;
      }

      #${constants.PANEL_TOGGLE_ID}.is-closed {
        opacity: 0.8;
      }

      #${constants.PANEL_TOGGLE_ID} span {
        display: inline-block;
        transition: transform 0.3s ease;
      }

      #${constants.PANEL_TOGGLE_ID}.is-closed span {
        transform: rotate(-90deg);
      }

      body.crazy-panel-offset #${constants.PANEL_TOGGLE_ID} {
        left: calc(var(--crazy-panel-width) + 1rem);
      }
    `;
  }

  function registerStyleChunk(css) {
    if (!css) return;
    window.CrazyPanelStyleChunks = window.CrazyPanelStyleChunks || [];
    window.CrazyPanelStyleChunks.push(css);
  }
})();
