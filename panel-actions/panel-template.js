"use strict";

(function () {
  const assets = window.CrazyPanelAssets = window.CrazyPanelAssets || {};
  registerStyleChunk(buildBaseStyles());

  function createPanel(options) {
    const { shared, onAction, onZoomChange } = options;
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

    return panel;
  }

  function getPanelMarkup() {
    return `
      <h2>🌀 Coding Chaos</h2>
      <p>Tap the buttons to remix the page like a wizard.</p>

      <div class="panel-section">
        <button type="button" data-action="rainbow">🌈 Rainbow World</button>
        <button type="button" data-action="buttons">🪄 Button Tornado</button>
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
    `;
  }

  assets.createPanel = createPanel;

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

      #${constants.PANEL_ID} label {
        font-weight: 600;
        font-size: 0.85rem;
        letter-spacing: 0.5px;
      }

      #${constants.PANEL_ID} .slider {
        width: 100%;
        accent-color: #fff;
      }

      #${constants.PANEL_ID} .ghost {
        background: rgba(0, 0, 0, 0.45);
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
