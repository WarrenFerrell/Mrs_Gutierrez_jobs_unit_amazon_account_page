"use strict";

(function () {
  const PANEL_ID = "crazy-play-panel";
  const PANEL_TOGGLE_ID = "crazy-panel-toggle";
  const PANEL_WIDTH = 280;
  const RAINBOW_INTERVAL_MS = 800;
  const original = {
    background: document.body.style.backgroundImage || "",
    backgroundColor: document.body.style.backgroundColor || "",
  };
  const state = {
    rainbowTimer: null,
    wiggleOn: false,
    panelOpen: true,
  };

  function init() {
    if (document.getElementById(PANEL_ID)) {
      return;
    }

    injectStyles();
    const panel = buildPanel();
    document.body.appendChild(panel);
    createToggleButton();
    setPanelVisibility(true);
  }

  function injectStyles() {
    if (document.getElementById("crazy-panel-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "crazy-panel-styles";
    style.textContent = `
      :root {
        --crazy-panel-width: ${PANEL_WIDTH}px;
      }

      body.crazy-panel-offset {
        margin-left: var(--crazy-panel-width);
        transition: margin-left 0.3s ease;
      }

      body.crazy-panel-closed {
        margin-left: 0;
      }

      #${PANEL_ID} {
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

      body.crazy-panel-closed #${PANEL_ID} {
        transform: translateX(calc(-1 * var(--crazy-panel-width)));
      }

      #${PANEL_ID} h2 {
        font-size: 1.8rem;
        margin: 0;
        line-height: 1.1;
      }

      #${PANEL_ID} p {
        margin: 0;
        font-size: 0.95rem;
      }

      #${PANEL_ID} button {
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

      #${PANEL_ID} button:hover {
        transform: scale(1.04);
        background: rgba(0, 0, 0, 0.2);
      }

      #${PANEL_ID} button:focus-visible {
        outline: 3px solid #fff;
        outline-offset: 2px;
      }

      #${PANEL_ID} button.is-on {
        background: #00ffc3;
        color: #1f174d;
      }

      #${PANEL_ID} .panel-section {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }

      #${PANEL_ID} label {
        font-weight: 600;
        font-size: 0.85rem;
        letter-spacing: 0.5px;
      }

      #${PANEL_ID} .slider {
        width: 100%;
        accent-color: #fff;
      }

      #${PANEL_ID} .ghost {
        background: rgba(0, 0, 0, 0.45);
      }

      body.crazy-panel-invert {
        filter: invert(1) hue-rotate(180deg);
      }

      body.crazy-panel-invert #${PANEL_ID} {
        filter: invert(1) hue-rotate(180deg);
      }

      body.crazy-panel-wiggle *:not(#${PANEL_ID}):not(#${PANEL_ID} *) {
        animation: crazy-wiggle 0.4s infinite alternate;
      }

      @keyframes crazy-wiggle {
        from { transform: rotate(-1deg) translateX(-1px); }
        to   { transform: rotate(1deg) translateX(1px); }
      }

      .flying-fun {
        position: fixed;
        padding: 0.35rem 0.8rem;
        border-radius: 999px;
        background: #fff6;
        color: #2c1b5a;
        font-weight: 700;
        pointer-events: none;
        animation: fly-around 8s linear forwards;
        backdrop-filter: blur(4px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      }

      @keyframes fly-around {
        from {
          transform: translate(var(--start-x), var(--start-y)) scale(0.8);
          opacity: 0.85;
        }
        to {
          transform: translate(var(--end-x), var(--end-y)) scale(1.25);
          opacity: 0;
        }
      }

      .confetti-dot {
        position: fixed;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        pointer-events: none;
        animation: confetti-fall 1.8s linear forwards;
      }

      @keyframes confetti-fall {
        from { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
        to { transform: translateY(110vh) rotate(360deg); opacity: 0; }
      }

      #${PANEL_TOGGLE_ID} {
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

      #${PANEL_TOGGLE_ID}:hover {
        transform: scale(1.05) translateY(-2px);
        box-shadow: 0 20px 32px rgba(0,0,0,0.4);
      }

      #${PANEL_TOGGLE_ID}:focus-visible {
        outline: 3px solid #fff;
        outline-offset: 4px;
      }

      #${PANEL_TOGGLE_ID}.is-closed {
        opacity: 0.8;
      }

      #${PANEL_TOGGLE_ID} span {
        display: inline-block;
        transition: transform 0.3s ease;
      }

      #${PANEL_TOGGLE_ID}.is-closed span {
        transform: rotate(-90deg);
      }

      body.crazy-panel-offset #${PANEL_TOGGLE_ID} {
        left: calc(var(--crazy-panel-width) + 1rem);
      }
    `;

    document.head.appendChild(style);
  }

  function buildPanel() {
    const panel = document.createElement("aside");
    panel.id = PANEL_ID;
    panel.innerHTML = `
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

    panel.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => handleAction(btn));
    });

    const slider = panel.querySelector("#crazy-size-slider");
    slider.addEventListener("input", (event) => {
      const delta = Number(event.target.value);
      document.documentElement.style.fontSize = `${100 + delta * 8}%`;
    });

    return panel;
  }

  function createToggleButton() {
    if (document.getElementById(PANEL_TOGGLE_ID)) {
      return;
    }

    const button = document.createElement("button");
    button.id = PANEL_TOGGLE_ID;
    button.type = "button";
    button.setAttribute("aria-label", "Toggle fun control panel");
    button.setAttribute("aria-expanded", "true");
    button.innerHTML = "<span>🎨</span>";
    button.addEventListener("click", () => setPanelVisibility(!state.panelOpen));
    document.body.appendChild(button);
  }

  function handleAction(button) {
    const action = button.getAttribute("data-action");

    switch (action) {
      case "rainbow":
        toggleRainbow(button);
        break;
      case "buttons":
        launchButtonStorm();
        break;
      case "invert":
        button.classList.toggle("is-on");
        document.body.classList.toggle("crazy-panel-invert");
        break;
      case "wiggle":
        button.classList.toggle("is-on");
        document.body.classList.toggle("crazy-panel-wiggle");
        state.wiggleOn = !state.wiggleOn;
        break;
      case "confetti":
        sprinkleConfetti();
        break;
      case "reset":
        resetEffects();
        break;
      default:
        break;
    }
  }

  function toggleRainbow(button) {
    button.classList.toggle("is-on");
    const isActive = button.classList.contains("is-on");

    if (isActive) {
      state.rainbowTimer = window.setInterval(() => {
        const gradient = `linear-gradient(120deg, ${randomColor()} 0%, ${randomColor()} 50%, ${randomColor()} 100%)`;
        document.body.style.backgroundImage = gradient;
      }, RAINBOW_INTERVAL_MS);
    } else if (state.rainbowTimer) {
      window.clearInterval(state.rainbowTimer);
      state.rainbowTimer = null;
      document.body.style.backgroundImage = original.background;
      document.body.style.backgroundColor = original.backgroundColor;
    }
  }

  function launchButtonStorm() {
    const words = ["Wow!", "Zap!", "Code!", "Boom!", "Go!", "Yay!", "LOL!", "Pop!", "Hi!", "Go Go!", "Yes!", "Woosh!"];
    const count = 12;

    for (let i = 0; i < count; i += 1) {
      const label = words[Math.floor(Math.random() * words.length)];
      const flyer = document.createElement("div");
      flyer.className = "flying-fun";
      flyer.textContent = label;
      flyer.style.setProperty("--start-x", `${randomBetween(-20, 20)}vw`);
      flyer.style.setProperty("--start-y", `${randomBetween(-10, 10)}vh`);
      flyer.style.setProperty("--end-x", `${randomBetween(-30, 30)}vw`);
      flyer.style.setProperty("--end-y", `${randomBetween(40, 110)}vh`);
      flyer.style.left = `${randomBetween(20, 75)}vw`;
      flyer.style.top = `${randomBetween(5, 30)}vh`;
      flyer.style.background = randomPastel();
      document.body.appendChild(flyer);
      window.setTimeout(() => flyer.remove(), 8200);
    }
  }

  function sprinkleConfetti() {
    const colors = ["#ffdf6b", "#ff6bd6", "#6bffce", "#6bc8ff", "#ffe36b"];
    const confettiPieces = 30;

    for (let i = 0; i < confettiPieces; i += 1) {
      const dot = document.createElement("div");
      dot.className = "confetti-dot";
      dot.style.left = `${Math.random() * 100}vw`;
      dot.style.top = `${Math.random() * 10}vh`;
      dot.style.background = colors[i % colors.length];
      dot.style.animationDelay = `${Math.random()}s`;
      dot.style.animationDuration = `${1.2 + Math.random()}s`;
      document.body.appendChild(dot);
      window.setTimeout(() => dot.remove(), 2500);
    }
  }

  function resetEffects() {
    const panel = document.getElementById(PANEL_ID);
    panel?.querySelectorAll("button").forEach((btn) => btn.classList.remove("is-on"));

    document.body.style.backgroundImage = original.background;
    document.body.style.backgroundColor = original.backgroundColor;
    document.body.classList.remove("crazy-panel-invert", "crazy-panel-wiggle");
    document.documentElement.style.fontSize = "";

    if (state.rainbowTimer) {
      window.clearInterval(state.rainbowTimer);
      state.rainbowTimer = null;
    }

    document.querySelectorAll(".flying-fun, .confetti-dot").forEach((el) => el.remove());
  }

  function setPanelVisibility(open) {
    state.panelOpen = open;
    const panel = document.getElementById(PANEL_ID);
    const toggle = document.getElementById(PANEL_TOGGLE_ID);

    if (panel) {
      panel.setAttribute("aria-hidden", open ? "false" : "true");
    }

    if (toggle) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.classList.toggle("is-closed", !open);
    }

    document.body.classList.toggle("crazy-panel-offset", open);
    document.body.classList.toggle("crazy-panel-closed", !open);
  }

  function randomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 85%, 65%)`;
  }

  function randomPastel() {
    const hue = Math.floor(Math.random() * 360);
    return `hsla(${hue}, 80%, 75%, 0.8)`;
  }

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
