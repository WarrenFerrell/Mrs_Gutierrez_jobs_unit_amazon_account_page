"use strict";

(function () {
  const TORNADO_CONFIG = {
    sliderMax: 180,
    defaultIntensity: 10,
    chaosSeedMin: 0.18,
    chaosSeedMax: 0.82,
    logisticRXMin: 3.4,
    logisticRXMax: 3.7,
    logisticRYMin: 3.5,
    logisticRYMax: 3.8,
    speedMin: 0.65,
    speedMax: 1.05,
    horizontalBase: 0.015,
    horizontalScale: 0.45,
    verticalBase: 20,
    verticalScale: 180,
    tiltBase: 2,
    tiltScale: 10,
    stepBase: 0.00025,
    stepScale: 0.0032,
    normalizedExponent: 2.4,
  };
  const MOOD_RANGES = [
    { max: 20, label: "Breezy" },
    { max: 40, label: "Gusty" },
    { max: 60, label: "Spicy" },
    { max: 90, label: "Wild" },
    { max: 120, label: "Rowdy" },
    { max: 150, label: "Bonkers" },
    { max: TORNADO_CONFIG.sliderMax, label: "Mayhem" },
  ];
  const buttonHandlers = window.CrazyPanelButtonHandlers = window.CrazyPanelButtonHandlers || {};

  registerStyleChunk(`
    .crazy-card-tornado {
      position: relative;
      will-change: transform;
      box-shadow: 0 18px 32px rgba(0, 0, 0, 0.28);
      transition: box-shadow 0.2s ease;
    }
  `);

  buttonHandlers.initializeTornadoControls = initializeTornadoControls;

  function register(key, factory) {
    window.CrazyPanelActionFactories = window.CrazyPanelActionFactories || {};
    window.CrazyPanelActionFactories[key] = factory;
  }

  function createButtonTornadoAction(shared) {
    const { utils, state } = shared;
    const randomBetweenFn = utils.randomBetween || randomBetween;

    return function handleButtonTornado(button, externalState) {
      const cards = utils.getAllCards();
      if (!cards.length) {
        launchConfettiFallback();
        return;
      }

      const runtime = ensureTornadoRuntime(externalState || state);
      runtime.button = button;
      runtime.randomBetween = randomBetweenFn;

      if (runtime.active) {
        stopTornado(runtime);
        button.classList.remove("is-on");
        return;
      }

      cards.forEach((card) => card.classList.add("crazy-card-tornado"));
      button.classList.add("is-on");
      startTornado(runtime, cards);
    };
  }

  buttonHandlers.stopTornado = () => {
    const shared = window.CrazyPanelShared;
    if (!shared || !shared.state || !shared.state.buttonTornadoRuntime) {
      return;
    }
    stopTornado(shared.state.buttonTornadoRuntime);
  };

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
    updateTornadoLabel(label, startValue, slider);

    slider.addEventListener("input", (event) => {
      const value = clampTornadoValue(event.target.value);
      updateTornadoLabel(label, value, slider);
      applyTornadoState(shared.state, value);
    });
  }

  function applyTornadoState(state, value) {
    if (!state) {
      return;
    }
    state.tornadoIntensity = value;
  }

  function ensureTornadoRuntime(state) {
    if (!state.buttonTornadoRuntime) {
      state.buttonTornadoRuntime = {
        active: false,
        rafId: null,
        cards: [],
        stateRef: state,
        button: null,
        randomBetween: randomBetween,
      };
    }
    return state.buttonTornadoRuntime;
  }

  function startTornado(runtime, cards) {
    runtime.active = true;
    runtime.cards = cards.map((card) => {
      const rect = card.getBoundingClientRect();
      const viewportCenter = (window.innerWidth || document.documentElement.clientWidth || 1200) / 2;
      const direction = rect.left < viewportCenter ? 1 : -1;
      return {
        el: card,
        baseTransform: card.style.transform || "",
        direction,
        progress: 0,
        chaosX: runtime.randomBetween(TORNADO_CONFIG.chaosSeedMin, TORNADO_CONFIG.chaosSeedMax),
        chaosY: runtime.randomBetween(TORNADO_CONFIG.chaosSeedMin, TORNADO_CONFIG.chaosSeedMax),
        rX: runtime.randomBetween(TORNADO_CONFIG.logisticRXMin, TORNADO_CONFIG.logisticRXMax),
        rY: runtime.randomBetween(TORNADO_CONFIG.logisticRYMin, TORNADO_CONFIG.logisticRYMax),
        speed: runtime.randomBetween(TORNADO_CONFIG.speedMin, TORNADO_CONFIG.speedMax),
      };
    });

    const step = () => animateCards(runtime);
    runtime.rafId = window.requestAnimationFrame(step);
  }

  function stopTornado(runtime) {
    if (!runtime.active) {
      return;
    }
    runtime.active = false;
    if (runtime.rafId) {
      window.cancelAnimationFrame(runtime.rafId);
      runtime.rafId = null;
    }
    runtime.cards.forEach((cardData) => {
      cardData.el.style.transform = cardData.baseTransform;
      cardData.el.classList.remove("crazy-card-tornado");
    });
    runtime.cards = [];
    if (runtime.button) {
      runtime.button.classList.remove("is-on");
    }
  }

  function animateCards(runtime) {
    if (!runtime.active) {
      return;
    }

    const intensity = getNormalizedIntensity(runtime.stateRef);
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1200;
    const horizontalTravel =
      viewportWidth * (TORNADO_CONFIG.horizontalBase + TORNADO_CONFIG.horizontalScale * intensity);
    const verticalRange = TORNADO_CONFIG.verticalBase + intensity * TORNADO_CONFIG.verticalScale;
    const chaosTilt = TORNADO_CONFIG.tiltBase + intensity * TORNADO_CONFIG.tiltScale;
    const baseStep = TORNADO_CONFIG.stepBase + intensity * TORNADO_CONFIG.stepScale;

    runtime.cards.forEach((cardData) => {
      cardData.chaosX = logisticStep(cardData.chaosX, cardData.rX);
      cardData.chaosY = logisticStep(cardData.chaosY, cardData.rY);

      const speedBoost = (0.35 + cardData.chaosX * 0.65) * cardData.speed;
      cardData.progress += baseStep * speedBoost;

      if (cardData.progress >= 1) {
        cardData.progress = 0;
        cardData.direction *= -1;
      }

      const eased = easeInOutCubic(cardData.progress);
      const horizontalOffset = cardData.direction * horizontalTravel * eased;
      const verticalOffset = (cardData.chaosY - 0.5) * 2 * verticalRange;
      const rotation = (cardData.chaosX - 0.5) * 2 * chaosTilt;

      const baseTransform = cardData.baseTransform ? `${cardData.baseTransform} ` : "";
      cardData.el.style.transform = `${baseTransform}translate3d(${horizontalOffset}px, ${verticalOffset}px, 0) rotate(${rotation}deg)`;
    });

    runtime.rafId = window.requestAnimationFrame(() => animateCards(runtime));
  }

  function logisticStep(value, r) {
    const next = r * value * (1 - value);
    if (next <= 0) return 0.001;
    if (next >= 1) return 0.999;
    return next;
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function clampTornadoValue(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return TORNADO_CONFIG.defaultIntensity;
    }
    return Math.min(TORNADO_CONFIG.sliderMax, Math.max(0, numeric));
  }

  function updateTornadoLabel(labelEl, value, sliderEl) {
    if (!labelEl) {
      return;
    }
    const mood = describeTornadoMood(value);
    labelEl.textContent = mood;
    if (sliderEl) {
      sliderEl.setAttribute("aria-valuetext", mood);
    }
  }

  function describeTornadoMood(value) {
    const numeric = Number(value);
    for (let i = 0; i < MOOD_RANGES.length; i += 1) {
      if (numeric <= MOOD_RANGES[i].max) {
        return MOOD_RANGES[i].label;
      }
    }
    return MOOD_RANGES[MOOD_RANGES.length - 1].label;
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
    const raw =
      !state || typeof state.tornadoIntensity !== "number"
        ? TORNADO_CONFIG.defaultIntensity
        : clampTornadoValue(state.tornadoIntensity);
    const normalized = raw / TORNADO_CONFIG.sliderMax;
    return Math.pow(normalized, TORNADO_CONFIG.normalizedExponent);
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
