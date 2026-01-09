"use strict";

(function () {
  const TORNADO_CONFIG = {
    sliderMax: 180,
    defaultIntensity: 0,
    minActiveIntensity: 0.02,
    initialSpeedMin: 0.18,
    initialSpeedMax: 1.4,
    wanderPhaseMin: 0,
    wanderPhaseMax: Math.PI * 2,
    wanderSpeedMin: 0.55,
    wanderSpeedMax: 1.55,
    gravityBase: 0.012,
    gravityScale: 0.42,
    dampingBase: 0.1,
    dampingScale: 0.28,
    noiseBase: 0.0009,
    noiseScale: 0.0032,
    centerCaptureBase: 55,
    centerCaptureScale: 180,
    homeCaptureBase: 110,
    homeCaptureScale: 110,
    returnBoostBase: 0.0012,
    returnBoostScale: 0.0036,
    maxDelta: 0.08,
    softening: 5,
    normalizedExponent: 3.4,
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
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1200;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
    const viewportCenterX = viewportWidth / 2;
    const viewportCenterY = viewportHeight / 2;

    runtime.masses = buildMasses(viewportCenterX, viewportCenterY, viewportHeight);

    const baseIntensity = getNormalizedIntensity(runtime.stateRef);

    runtime.cards = cards.map((card) => {
      const rect = card.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;
      const centerOffsetX = viewportCenterX - cardCenterX;
      const centerOffsetY = viewportCenterY - cardCenterY;
      const originVector = { x: -centerOffsetX, y: -centerOffsetY };
      const originDistance = Math.hypot(originVector.x, originVector.y) || 1;
      const originNormal = {
        x: originVector.x / originDistance,
        y: originVector.y / originDistance,
      };
      const { homeTarget, homeNormal } = createHomeTarget(originNormal, originDistance, runtime);
      const intensitySpeedScale = 0.25 + baseIntensity * 1.0;
      const initialSpeed =
        runtime.randomBetween(
          TORNADO_CONFIG.initialSpeedMin,
          TORNADO_CONFIG.initialSpeedMax * intensitySpeedScale
        ) * (0.7 + Math.random() * 0.35);
      const initialAngle = runtime.randomBetween(0, Math.PI * 2);
      let initialVelocity = {
        x: Math.cos(initialAngle) * initialSpeed,
        y: Math.sin(initialAngle) * initialSpeed,
      };
      const centerDirection = { x: centerOffsetX, y: centerOffsetY };
      const dot =
        initialVelocity.x * centerDirection.x + initialVelocity.y * centerDirection.y;
      if (dot > 0) {
        initialVelocity = { x: -initialVelocity.x, y: -initialVelocity.y };
      }

      return {
        el: card,
        baseTransform: card.style.transform || "",
        position: { x: 0, y: 0 },
        velocity: initialVelocity,
        originCenter: { x: cardCenterX, y: cardCenterY },
        home: homeTarget,
        homeNormal,
        originNormal,
        originDistance,
        mode: "inbound",
        wanderPhase: runtime.randomBetween(TORNADO_CONFIG.wanderPhaseMin, TORNADO_CONFIG.wanderPhaseMax),
        wanderSpeed: runtime.randomBetween(TORNADO_CONFIG.wanderSpeedMin, TORNADO_CONFIG.wanderSpeedMax),
      };
    });

    runtime.lastTimestamp = null;
    const step = (timestamp) => animateCards(runtime, timestamp);
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

  function animateCards(runtime, timestamp) {
    if (!runtime.active) {
      return;
    }

    const intensity = getNormalizedIntensity(runtime.stateRef);
    const dtMs = runtime.lastTimestamp ? Math.max(4, Math.min(100, timestamp - runtime.lastTimestamp)) : 16;
    runtime.lastTimestamp = timestamp;
    const dtSeconds = Math.min(TORNADO_CONFIG.maxDelta, dtMs / 1000);
    const frameScale = Math.min(1.2, dtSeconds * 60 || 1);

    const gravityStrength = TORNADO_CONFIG.gravityBase + TORNADO_CONFIG.gravityScale * intensity;
    const damping = TORNADO_CONFIG.dampingBase + TORNADO_CONFIG.dampingScale * intensity;
    const noiseStrength = TORNADO_CONFIG.noiseBase + TORNADO_CONFIG.noiseScale * (0.15 + intensity);
    const centerCaptureRadius = TORNADO_CONFIG.centerCaptureBase + TORNADO_CONFIG.centerCaptureScale * intensity;
    const homeCaptureRadius = TORNADO_CONFIG.homeCaptureBase + TORNADO_CONFIG.homeCaptureScale * intensity;
    const returnBoost = TORNADO_CONFIG.returnBoostBase + TORNADO_CONFIG.returnBoostScale * intensity;
    const gravityActive = intensity > TORNADO_CONFIG.minActiveIntensity;
    const activeMass = runtime.masses[selectMassIndex()];

    runtime.cards.forEach((cardData) => {
      if (!gravityActive) {
        cardData.position.x += cardData.velocity.x * frameScale;
        cardData.position.y += cardData.velocity.y * frameScale;
        const baseTransform = cardData.baseTransform ? `${cardData.baseTransform} ` : "";
        cardData.el.style.transform = `${baseTransform}translate3d(${cardData.position.x}px, ${cardData.position.y}px, 0)`;
        return;
      }
      const targetVector =
        cardData.mode === "inbound"
          ? getMassVector(cardData, activeMass)
          : cardData.home;
      const dx = targetVector.x - cardData.position.x;
      const dy = targetVector.y - cardData.position.y;
      // Discrete solution of ∇²Φ = 4πGρ with a point mass at the viewport center.
      const accGravityX = dx * gravityStrength;
      const accGravityY = dy * gravityStrength;

      cardData.wanderPhase += cardData.wanderSpeed * frameScale * 0.04;
      const accNoiseX = Math.cos(cardData.wanderPhase) * noiseStrength;
      const accNoiseY = Math.sin(cardData.wanderPhase * 0.8) * noiseStrength;

      let ax = accGravityX + accNoiseX;
      let ay = accGravityY + accNoiseY;

      if (cardData.mode === "outbound") {
        ax += cardData.homeNormal.x * returnBoost;
        ay += cardData.homeNormal.y * returnBoost;
      }

      cardData.velocity.x += ax * frameScale;
      cardData.velocity.y += ay * frameScale;

      const dampingFactor = Math.max(0, 1 - damping * frameScale * 0.5);
      cardData.velocity.x *= dampingFactor;
      cardData.velocity.y *= dampingFactor;

      cardData.position.x += cardData.velocity.x * frameScale;
      cardData.position.y += cardData.velocity.y * frameScale;

      const baseTransform = cardData.baseTransform ? `${cardData.baseTransform} ` : "";
      cardData.el.style.transform = `${baseTransform}translate3d(${cardData.position.x}px, ${cardData.position.y}px, 0)`;

      const distanceToCenter = cardData.mode === "inbound" ? Math.hypot(dx, dy) : null;
      const distanceToHome = Math.hypot(cardData.home.x - cardData.position.x, cardData.home.y - cardData.position.y);

      if (cardData.mode === "inbound" && distanceToCenter <= centerCaptureRadius) {
        cardData.mode = "outbound";
        retargetHome(cardData, runtime);
        cardData.velocity.x *= 0.25;
        cardData.velocity.y *= 0.25;
      } else if (cardData.mode === "outbound" && distanceToHome <= homeCaptureRadius) {
        cardData.mode = "inbound";
      }
    });

    runtime.rafId = window.requestAnimationFrame((nextTs) => animateCards(runtime, nextTs));
  }

  function retargetHome(cardData, runtime) {
    const { homeTarget, homeNormal } = createHomeTarget(cardData.originNormal, cardData.originDistance, runtime);
    cardData.home = homeTarget;
    cardData.homeNormal = homeNormal;
  }

  function createHomeTarget(originNormal, originDistance, runtime) {
    const lateral = { x: -originNormal.y, y: originNormal.x };
    const wanderRadius = originDistance * (0.65 + runtime.randomBetween(-0.12, 0.15));
    const lateralShift = runtime.randomBetween(-originDistance * 0.2, originDistance * 0.2);
    const homeTarget = {
      x: originNormal.x * wanderRadius + lateral.x * lateralShift,
      y: originNormal.y * wanderRadius + lateral.y * lateralShift,
    };
    const homeDistance = Math.hypot(homeTarget.x, homeTarget.y) || 1;
    const homeNormal = {
      x: homeTarget.x / homeDistance,
      y: homeTarget.y / homeDistance,
    };
    return { homeTarget, homeNormal };
  }

  function buildMasses(centerX, centerY, viewHeight) {
    const verticalGap = viewHeight * 0.22;
    return [
      { x: centerX, y: centerY - verticalGap },
      { x: centerX, y: centerY },
      { x: centerX, y: centerY + verticalGap },
    ];
  }

  function getMassVector(cardData, mass) {
    return {
      x: mass.x - cardData.originCenter.x,
      y: mass.y - cardData.originCenter.y,
    };
  }

  function selectMassIndex() {
    const roll = Math.random();
    if (roll < 0.4) return 1; // middle mass
    if (roll < 0.7) return 0; // top
    return 2; // bottom
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
