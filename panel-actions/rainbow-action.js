"use strict";

(function () {
  registerStyleChunk(`
    .crazy-rainbow-card {
      background: linear-gradient(130deg, #ffafbd, #ffc3a0, #a1c4fd, #c2ffd8);
      background-size: 200% 200%;
      animation: rainbow-card-flow 3.5s ease-in-out infinite;
      color: #1f174d;
      border-color: rgba(255, 255, 255, 0.8) !important;
    }

    .crazy-rainbow-card .a-color-secondary {
      color: rgba(31, 23, 77, 0.8) !important;
    }

    @keyframes rainbow-card-flow {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `);

  function register(key, factory) {
    window.CrazyPanelActionFactories = window.CrazyPanelActionFactories || {};
    window.CrazyPanelActionFactories[key] = factory;
  }

  function createRainbowAction(shared) {
    const { state, original, constants, dom, utils } = shared;
    const body = dom.getBody;

    return function handleRainbow(button) {
      button.classList.toggle("is-on");
      const isActive = button.classList.contains("is-on");

      if (isActive) {
        if (state.rainbowTimer) {
          window.clearInterval(state.rainbowTimer);
        }
        state.rainbowTimer = window.setInterval(() => {
          const gradient = `linear-gradient(120deg, ${utils.randomColor()} 0%, ${utils.randomColor()} 50%, ${utils.randomColor()} 100%)`;
          body().style.backgroundImage = gradient;
        }, constants.RAINBOW_INTERVAL_MS);
        utils.setCardRainbow(true);
      } else {
        if (state.rainbowTimer) {
          window.clearInterval(state.rainbowTimer);
          state.rainbowTimer = null;
        }
        body().style.backgroundImage = original.background;
        body().style.backgroundColor = original.backgroundColor;
        utils.setCardRainbow(false);
      }
    };
  }

  register("rainbow", createRainbowAction);

  function registerStyleChunk(css) {
    if (!css) return;
    window.CrazyPanelStyleChunks = window.CrazyPanelStyleChunks || [];
    window.CrazyPanelStyleChunks.push(css);
  }
})();
