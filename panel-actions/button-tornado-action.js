"use strict";

(function () {
  const buttonHandlers = window.CrazyPanelButtonHandlers = window.CrazyPanelButtonHandlers || {};

  registerStyleChunk(`
    .crazy-card-wander {
      position: relative;
      animation: crazy-card-wander var(--wander-duration, 4s) ease-in-out infinite;
      will-change: transform;
      z-index: 2;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
    }

    @keyframes crazy-card-wander {
      0% {
        transform: translate(var(--wander-x0, 0px), var(--wander-y0, 0px)) scale(var(--wander-scale, 1));
      }
      25% {
        transform: translate(var(--wander-x1, 0px), var(--wander-y1, 0px)) scale(var(--wander-scale, 1.02));
      }
      50% {
        transform: translate(var(--wander-x2, 0px), var(--wander-y2, 0px)) scale(var(--wander-scale, 1.04));
      }
      75% {
        transform: translate(var(--wander-x3, 0px), var(--wander-y3, 0px)) scale(var(--wander-scale, 1.02));
      }
      100% {
        transform: translate(var(--wander-x4, 0px), var(--wander-y4, 0px)) scale(var(--wander-scale, 1));
      }
    }
  `);

  buttonHandlers.initializeTornadoControls = initializeTornadoControls;

  function register(key, factory) {
    window.CrazyPanelActionFactories = window.CrazyPanelActionFactories || {};
    window.CrazyPanelActionFactories[key] = factory;
  }

  function createButtonTornadoAction(shared) {
    const { utils, state } = shared;

    return function handleButtonTornado(button, externalState) {
      const cards = utils.getAllCards();
      if (!cards.length) {
        launchConfettiFallback();
        return;
      }

      const activeState = externalState || state;
      const intensity = getNormalizedIntensity(activeState);

      const maxDrift = 20 + intensity * 160; // how far buttons wander (px)
      const durationMin = Math.max(1.1, 4.5 - intensity * 3.2);
      const durationMax = durationMin + 1.5;

      cards.forEach((card, index) => {
        const wanderPoints = buildWanderPoints(maxDrift, utils.randomBetween || randomBetween);
        const wanderDuration = (utils.randomBetween || randomBetween)(durationMin, durationMax);
        const wanderScale = (0.98 + Math.random() * 0.12).toFixed(3);
        const delay = (index * 0.08) % 0.8;

        card.classList.add("crazy-card-wander");
        applyPointVariables(card, wanderPoints);
        card.style.setProperty("--wander-duration", `${wanderDuration.toFixed(2)}s`);
        card.style.setProperty("--wander-scale", wanderScale);
        card.style.animationDelay = `${delay.toFixed(2)}s`;
        card.style.zIndex = 2 + (cards.length - index);
      });

      // Clean up after animation completes
      const cleanupDuration = (durationMax + 0.6) * 1000;
      window.setTimeout(() => {
        cards.forEach((card) => {
          card.classList.remove("crazy-card-wander");
          removePointVariables(card);
          card.style.removeProperty("--wander-duration");
          card.style.removeProperty("--wander-scale");
          card.style.removeProperty("animation-delay");
          card.style.removeProperty("z-index");
        });
      }, cleanupDuration);
    };
  }

  function initializeTornadoControls(shared) {
    const slider = document.getElementById("crazy-tornado-slider");
    const label = document.getElementById("crazy-tornado-label");
    if (!slider || !label || !shared || !shared.state) {
      return;
    }

    if (slider.dataset.crazyTornadoBound === "true") {
      return;
    }
    slider.dataset.crazyTornadoBound = "true";

    const startValue = clampTornadoValue(shared.state.tornadoIntensity);
    slider.value = String(startValue);
    updateTornadoLabel(label, startValue);

    slider.addEventListener("input", (event) => {
      const value = clampTornadoValue(event.target.value);
      updateTornadoLabel(label, value);
      applyTornadoState(shared.state, value);
    });
  }

  function applyTornadoState(state, value) {
    if (!state) {
      return;
    }
    state.tornadoIntensity = value;
  }

  function buildWanderPoints(maxDistance, randomBetweenFn) {
    const points = [{ x: 0, y: 0 }];
    for (let i = 0; i < 3; i += 1) {
      points.push({
        x: randomBetweenFn(-maxDistance, maxDistance).toFixed(1),
        y: randomBetweenFn(-maxDistance, maxDistance).toFixed(1),
      });
    }
    points.push({ x: 0, y: 0 });
    return points;
  }

  function applyPointVariables(card, points) {
    points.forEach((point, index) => {
      card.style.setProperty(`--wander-x${index}`, `${point.x}px`);
      card.style.setProperty(`--wander-y${index}`, `${point.y}px`);
    });
  }

  function removePointVariables(card) {
    for (let i = 0; i <= 4; i += 1) {
      card.style.removeProperty(`--wander-x${i}`);
      card.style.removeProperty(`--wander-y${i}`);
    }
  }

  function clampTornadoValue(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 60;
    }
    return Math.min(100, Math.max(0, numeric));
  }

  function updateTornadoLabel(labelEl, value) {
    if (!labelEl) {
      return;
    }
    labelEl.textContent = describeTornadoMood(value);
  }

  function describeTornadoMood(value) {
    if (value <= 15) return "Breezy";
    if (value <= 35) return "Spicy";
    if (value <= 55) return "Wild";
    if (value <= 75) return "Bonkers";
    return "Mayhem";
  }

  function launchConfettiFallback() {
    const colors = ["#ffdf6b", "#ff6bd6", "#6bffce", "#6bc8ff", "#ffe36b"];
    const pieces = 20;

    for (let i = 0; i < pieces; i += 1) {
      const dot = document.createElement("div");
      dot.className = "confetti-dot";
      dot.style.left = `${Math.random() * 100}vw`;
      dot.style.top = `${Math.random() * 10}vh`;
      dot.style.background = colors[i % colors.length];
      dot.style.animationDelay = `${Math.random()}s`;
      dot.style.animationDuration = `${1.0 + Math.random()}s`;
      document.body.appendChild(dot);
      window.setTimeout(() => dot.remove(), 2200);
    }
  }

  register("buttons", createButtonTornadoAction);

  function getNormalizedIntensity(state) {
    if (!state || typeof state.tornadoIntensity !== "number") {
      return 0.6;
    }
    const clamped = Math.min(100, Math.max(0, state.tornadoIntensity));
    return clamped / 100;
  }

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function registerStyleChunk(css) {
    if (!css) return;
    window.CrazyPanelStyleChunks = window.CrazyPanelStyleChunks || [];
    window.CrazyPanelStyleChunks.push(css);
  }
})();
