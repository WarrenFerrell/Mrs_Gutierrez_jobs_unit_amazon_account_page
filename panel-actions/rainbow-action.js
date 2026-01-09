"use strict";

(function () {
  const MAX_RAINBOW_COLORS = 12;
  const MIN_RAINBOW_COLORS = 3;
  const MAX_RAINBOW_SPEED_MS = 2000;
  const MIN_RAINBOW_SPEED_MS = 100;
  const LOCKED_MIN_SPEED_MS = 1050;

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

  function createRainbowHelpers(shared) {
    const { state, original, dom, utils } = shared;
    const body = dom.getBody;

    // Store original card backgrounds
    if (!state.cardOriginals) {
      state.cardOriginals = new Map();
      const cards = utils.getAllCards();
      cards.forEach((card) => {
        const computedStyle = window.getComputedStyle(card);
        state.cardOriginals.set(card, {
          background: card.style.background || computedStyle.background || '',
          backgroundImage: card.style.backgroundImage || computedStyle.backgroundImage || 'none',
          backgroundColor: card.style.backgroundColor || computedStyle.backgroundColor || '',
        });
      });
    }

    function getCardPositionRatio(card) {
      const rect = card.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const viewportWidth = window.innerWidth;
      // Normalize to 0 (left) to 1 (right)
      return Math.max(0, Math.min(1, cardCenterX / viewportWidth));
    }

    function updateCardGradients() {
      const cards = utils.getAllCards();
      const colorCount = state.rainbowColorCount || MIN_RAINBOW_COLORS;
      const viewportWidth = window.innerWidth;
      const intensity = Math.min(
        1,
        Math.max(0, (colorCount - MIN_RAINBOW_COLORS) / (MAX_RAINBOW_COLORS - MIN_RAINBOW_COLORS))
      );
      const solidThreshold = Math.max(0, 0.05 - intensity * 0.05);

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const positionRatio = getCardPositionRatio(card);
        
        if (positionRatio < solidThreshold) {
          // Far left (0-5%): solid color
          const solidColor = utils.randomColor();
          card.style.background = solidColor;
          card.style.backgroundImage = 'none';
          card.style.backgroundSize = '';
          card.style.backgroundPosition = '';
          card.style.backgroundRepeat = '';
        } else {
          // Gradually increase color complexity and localization with slider intensity
          const positionBoost = 0.35 + positionRatio * 0.65;
          const intensityBoost = 0.5 + intensity * 0.5;
          const targetColors = Math.max(
            MIN_RAINBOW_COLORS,
            Math.round(colorCount * positionBoost * intensityBoost)
          );
          const colors = Array.from({ length: targetColors }, () => utils.randomColor());
          
          const stops = colors.map((color, i) => {
            const percent = (i / (colors.length - 1 || 1)) * 100;
            return `${color} ${percent}%`;
          }).join(', ');
          
          // Blend from full-screen gradients to card-local rainbows as intensity grows
          const gradientWidth =
            viewportWidth * (1 - intensity) + Math.max(rect.width, 1) * intensity;
          const gradientOffset = -rect.left * (1 - intensity);

          card.style.background = `linear-gradient(to right, ${stops})`;
          card.style.backgroundSize = `${gradientWidth}px 100%`;
          card.style.backgroundPosition = `${gradientOffset}px 0`;
          card.style.backgroundRepeat = 'no-repeat';
        }
      });
    }

    function updateRainbowGradient() {
      // Update body background (keep for compatibility)
      const colorCount = state.rainbowColorCount || MIN_RAINBOW_COLORS;
      const colors = Array.from({ length: colorCount }, () => utils.randomColor());
      const stops = colors.map((color, i) => {
        const percent = (i / (colorCount - 1)) * 100;
        return `${color} ${percent}%`;
      }).join(', ');
      const gradient = `linear-gradient(120deg, ${stops})`;
      body().style.backgroundImage = gradient;
      
      // Update individual card gradients
      updateCardGradients();
    }

    function restartRainbowTimer() {
      if (state.rainbowTimer) {
        window.clearInterval(state.rainbowTimer);
      }
      const speed = state.rainbowSpeed || 800;
      updateRainbowGradient();
      state.rainbowTimer = window.setInterval(() => {
        updateRainbowGradient();
      }, speed);
    }

    return { updateRainbowGradient, restartRainbowTimer, updateCardGradients };
  }

  function createRainbowAction(shared) {
    const { state, original, dom, utils } = shared;
    const body = dom.getBody;
    const { restartRainbowTimer } = createRainbowHelpers(shared);

    function restoreCardBackgrounds() {
      const cards = utils.getAllCards();
      if (state.cardOriginals) {
        cards.forEach((card) => {
          const original = state.cardOriginals.get(card);
          if (original) {
            card.style.background = original.background;
            card.style.backgroundImage = original.backgroundImage;
            card.style.backgroundColor = original.backgroundColor;
            card.style.backgroundSize = '';
            card.style.backgroundPosition = '';
            card.style.backgroundRepeat = '';
          }
        });
      }
    }

    return function handleRainbow(button) {
      button.classList.toggle("is-on");
      const isActive = button.classList.contains("is-on");

      if (isActive) {
        restartRainbowTimer();
        utils.setCardRainbow(true);
      } else {
        if (state.rainbowTimer) {
          window.clearInterval(state.rainbowTimer);
          state.rainbowTimer = null;
        }
        body().style.backgroundImage = original.background;
        body().style.backgroundColor = original.backgroundColor;
        restoreCardBackgrounds();
        utils.setCardRainbow(false);
      }
    };
  }

  function createRainbowSpeedChangeHandler(shared) {
    const { state, original, dom } = shared;
    const body = dom.getBody;
    const { restartRainbowTimer } = createRainbowHelpers(shared);

    return function handleRainbowSpeedChange(value) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return;
      }
      const minAllowed = state.rainbowSpeedUnlocked ? MIN_RAINBOW_SPEED_MS : LOCKED_MIN_SPEED_MS;
      const clamped = Math.min(MAX_RAINBOW_SPEED_MS, Math.max(minAllowed, numeric));
      state.rainbowSpeed = clamped;
      // If rainbow is active, restart the timer with new speed
      if (state.rainbowTimer) {
        const isActive = body().style.backgroundImage && body().style.backgroundImage !== original.background;
        if (isActive) {
          restartRainbowTimer();
        }
      }
    };
  }

  function createRainbowColorCountChangeHandler(shared) {
    const { state, original, dom } = shared;
    const body = dom.getBody;
    const { updateRainbowGradient } = createRainbowHelpers(shared);

    return function handleRainbowColorCountChange(value) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return;
      }
      state.rainbowColorCount = Math.min(
        MAX_RAINBOW_COLORS,
        Math.max(MIN_RAINBOW_COLORS, Math.round(numeric))
      );
      // If rainbow is active, update immediately with new color count
      if (state.rainbowTimer) {
        const isActive = body().style.backgroundImage && body().style.backgroundImage !== original.background;
        if (isActive) {
          updateRainbowGradient();
        }
      }
    };
  }

  register("rainbow", createRainbowAction);

  // Export handler functions directly - these take shared and value
  function handleRainbowSpeedChange(shared, value) {
    const handler = createRainbowSpeedChangeHandler(shared);
    if (typeof handler === "function") {
      handler(value);
    }
  }

  function handleRainbowColorCountChange(shared, value) {
    const handler = createRainbowColorCountChangeHandler(shared);
    if (typeof handler === "function") {
      handler(value);
    }
  }

  // Register the handler functions
  window.CrazyPanelRainbowHandlers = window.CrazyPanelRainbowHandlers || {};
  window.CrazyPanelRainbowHandlers.handleSpeedChange = handleRainbowSpeedChange;
  window.CrazyPanelRainbowHandlers.handleColorCountChange = handleRainbowColorCountChange;

  function registerStyleChunk(css) {
    if (!css) return;
    window.CrazyPanelStyleChunks = window.CrazyPanelStyleChunks || [];
    window.CrazyPanelStyleChunks.push(css);
  }
})();
