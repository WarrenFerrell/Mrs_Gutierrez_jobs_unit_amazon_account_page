"use strict";

(function () {
  const PANEL_ID = "crazy-play-panel";
  const PANEL_TOGGLE_ID = "crazy-panel-toggle";
  const PANEL_WIDTH = 280;
  const RAINBOW_INTERVAL_MS = 800;
  const SUPPORT_SCRIPTS = [{ key: "panel", src: "./panel-actions/panel-template.js" }];

  const ACTION_MODULES = [
    { key: "rainbow", src: "./panel-actions/rainbow-action.js" },
    { key: "buttons", src: "./panel-actions/button-tornado-action.js" },
    { key: "invert", src: "./panel-actions/invert-action.js" },
    { key: "wiggle", src: "./panel-actions/wiggle-action.js" },
    { key: "confetti", src: "./panel-actions/confetti-action.js" },
    { key: "reset", src: "./panel-actions/reset-action.js" },
  ];
  const ALL_SCRIPTS = [...SUPPORT_SCRIPTS, ...ACTION_MODULES];

  const original = {
    background: document.body.style.backgroundImage || "",
    backgroundColor: document.body.style.backgroundColor || "",
  };
  const state = {
    rainbowTimer: null,
    wiggleOn: false,
    panelOpen: true,
    tornadoIntensity: 60,
    rainbowSpeed: 800,
    rainbowColorCount: 3,
  };
  const actionHandlers = {};
  const assets = {
    createPanel: null,
  };
  const shared = {
    state,
    original,
    constants: { PANEL_ID, PANEL_TOGGLE_ID, PANEL_WIDTH, RAINBOW_INTERVAL_MS },
    dom: {
      getPanel: () => document.getElementById(PANEL_ID),
      getBody: () => document.body,
      getDocumentElement: () => document.documentElement,
    },
    utils: {},
  };

  shared.utils.randomColor = randomColor;
  shared.utils.randomBetween = randomBetween;
  shared.utils.setCardRainbow = setCardRainbow;
  shared.utils.getAllCards = () => Array.from(document.querySelectorAll(".ya-card--rich"));
  shared.utils.getPanelButtons = () => Array.from(document.querySelectorAll(`#${PANEL_ID} button`));
  shared.utils.handleZoomChange = handleZoomChange;
  shared.utils.getTornadoIntensity = () => shared.state.tornadoIntensity ?? 60;

  window.CrazyPanelShared = shared;
  window.CrazyPanelActionFactories = window.CrazyPanelActionFactories || {};

  function init() {
    if (document.getElementById(PANEL_ID)) {
      return;
    }

    loadScripts(ALL_SCRIPTS)
      .then(() => {
        initializeAssets();
        initializeActionHandlers();
        applyRegisteredStyles();
        const panel = assets.createPanel({
          shared,
          onAction: handleAction,
          onZoomChange: handleZoomChange,
          onRainbowSpeedChange: handleRainbowSpeedChange,
          onRainbowColorCountChange: handleRainbowColorCountChange,
        });
        document.body.appendChild(panel);
        initializeButtonActionExtras();
        createToggleButton();
        setPanelVisibility(true);
      })
      .catch((error) => {
        console.error("[CrazyPanel] Failed to initialize Crazy Panel", error);
      });
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
    const handler = actionHandlers[action];

    if (typeof handler === "function") {
      handler(button, shared.state);
    } else {
      console.warn(`[CrazyPanel] No handler registered for action "${action}"`);
    }
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

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function setCardRainbow(isRainbow) {
    const cards = document.querySelectorAll(".ya-card--rich");
    cards.forEach((card) => {
      card.classList.toggle("crazy-rainbow-card", isRainbow);
    });
  }

  function handleZoomChange(value) {
    const delta = Number(value);
    document.documentElement.style.fontSize = `${100 + delta * 8}%`;
  }

  function handleRainbowSpeedChange(value) {
    const rainbowHandlers = window.CrazyPanelRainbowHandlers;
    if (rainbowHandlers && typeof rainbowHandlers.handleSpeedChange === "function") {
      rainbowHandlers.handleSpeedChange(shared, value);
    }
  }

  function handleRainbowColorCountChange(value) {
    const rainbowHandlers = window.CrazyPanelRainbowHandlers;
    if (rainbowHandlers && typeof rainbowHandlers.handleColorCountChange === "function") {
      rainbowHandlers.handleColorCountChange(shared, value);
    }
  }

  function loadScripts(modules) {
    return Promise.all(modules.map(({ src }) => loadScript(src)));
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-crazy-action="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === "true") {
          resolve();
          return;
        }
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.dataset.crazyAction = src;
      script.addEventListener(
        "load",
        () => {
          script.dataset.loaded = "true";
          resolve();
        },
        { once: true }
      );
      script.addEventListener(
        "error",
        () => reject(new Error(`Failed to load action script: ${src}`)),
        { once: true }
      );
      document.head.appendChild(script);
    });
  }

  function initializeAssets() {
    const registry = window.CrazyPanelAssets || {};
    assets.createPanel = requireAsset(registry, "createPanel");
  }

  function initializeActionHandlers() {
    const factories = window.CrazyPanelActionFactories || {};
    ACTION_MODULES.forEach(({ key }) => {
      if (typeof factories[key] === "function") {
        actionHandlers[key] = factories[key](shared);
      } else {
        console.warn(`[CrazyPanel] Missing factory for action "${key}"`);
      }
    });
  }

  function requireAsset(registry, name) {
    const asset = registry[name];
    if (typeof asset !== "function") {
      throw new Error(`[CrazyPanel] Missing asset factory "${name}"`);
    }
    return asset;
  }

  function applyRegisteredStyles() {
    const chunks = window.CrazyPanelStyleChunks || [];
    if (!chunks.length) {
      return;
    }

    let style = document.getElementById("crazy-panel-styles");
    if (!style) {
      style = document.createElement("style");
      style.id = "crazy-panel-styles";
      document.head.appendChild(style);
    }
    style.textContent = chunks.join("\n");
  }

  function initializeButtonActionExtras() {
    const handlers = window.CrazyPanelButtonHandlers;
    if (handlers && typeof handlers.initializeTornadoControls === "function") {
      handlers.initializeTornadoControls(shared);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
