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
      const colorCount = state.rainbowColorCount || 3;
      const viewportWidth = window.innerWidth;

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const positionRatio = getCardPositionRatio(card);
        
        if (positionRatio < 0.05) {
          // Far left (0-5%): solid color
          const solidColor = utils.randomColor();
          card.style.background = solidColor;
          card.style.backgroundImage = 'none';
          card.style.backgroundSize = '';
          card.style.backgroundPosition = '';
          card.style.backgroundRepeat = '';
        } else {
          // Create rainbow gradient that spans the whole screen
          // More colors and more vibrant on the right side
          const effectiveColorCount = Math.max(3, Math.floor(3 + positionRatio * (colorCount - 3)));
          const colors = Array.from({ length: effectiveColorCount }, () => utils.randomColor());
          
          const stops = colors.map((color, i) => {
            const percent = (i / (effectiveColorCount - 1)) * 100;
            return `${color} ${percent}%`;
          }).join(', ');
          
          // Create a gradient that spans the entire viewport width
          // The gradient starts at the left edge of the viewport (0) and goes to the right edge
          // Position the background so the card shows the correct portion of this full-screen gradient
          card.style.background = `linear-gradient(to right, ${stops})`;
          card.style.backgroundSize = `${viewportWidth}px 100%`;
          card.style.backgroundPosition = `${-rect.left}px 0`;
          card.style.backgroundRepeat = 'no-repeat';
        }
      });
    }

    function updateRainbowGradient() {
      // Update body background (keep for compatibility)
      const colorCount = state.rainbowColorCount || 3;
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
      state.rainbowSpeed = Math.min(2000, Math.max(100, numeric));
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
      state.rainbowColorCount = Math.min(12, Math.max(3, Math.round(numeric)));
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
