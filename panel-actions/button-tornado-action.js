"use strict";

(function () {
  const TORNADO_CONFIG = {
    sliderMax: 180,
    defaultIntensity: 0,
    minActiveIntensity: 0,
    gravityDeadZone: 0.1,
    gravityLowZoneScale: 0.000001,
    lowUpdateThreshold: 0.42,
    lowUpdateMaxSkip: 5,
    initialSpeedMin: 0.18,
    initialSpeedMax: 1.4,
    wanderPhaseMin: 0,
    wanderPhaseMax: Math.PI * 2,
    wanderSpeedMin: 0.55,
    wanderSpeedMax: 1.55,
    gravityBase: 0.005,
    gravityScale: 0.024,
    gravityExponent: 1.1,
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
    runawayRadiusMultiplierBase: 1.45,
    runawayRadiusMultiplierScale: 1.35,
    runawayGravityBoost: 1.2,
    runawayMinIntensity: 0.55,
    centerBurstThreshold: 0.85,
    centerBurstBoost: 0.6,
    centerBurstNoiseReduction: 0.35,
    massJitterBase: 24,
    massJitterScale: 160,
    tangentBoostBase: 0.0006,
    tangentBoostScale: 0.0022,
    tangentBoostOutboundScale: 0.65,
    favoriteMassBias: 0.55,
  };
  const GRAVITY_WELL_LIMIT = 6;
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
  const randomHandlers = window.CrazyPanelRandomHandlers = window.CrazyPanelRandomHandlers || {};

  registerStyleChunk(`
    .crazy-card-tornado {
      position: relative;
      will-change: transform;
      box-shadow: 0 18px 32px rgba(0, 0, 0, 0.28);
      transition: box-shadow 0.2s ease;
    }

    .crazy-gravity-well-layer {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9998;
      overflow: visible;
    }

    .crazy-gravity-well {
      position: absolute;
      width: 160px;
      height: 160px;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      background: radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.25) 45%, rgba(125,96,255,0.65) 70%, rgba(0,0,0,0) 100%);
      filter: blur(0.5px);
      animation: crazy-well-pulse 3s ease-in-out infinite alternate;
      mix-blend-mode: screen;
      opacity: 0.8;
    }

    .crazy-gravity-well::after {
      content: "";
      position: absolute;
      inset: 20%;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.6);
      animation: crazy-well-ripple 2.4s linear infinite;
    }

    @keyframes crazy-well-pulse {
      0% {
        transform: translate(-50%, -50%) scale(0.85);
        opacity: 0.65;
      }
      100% {
        transform: translate(-50%, -50%) scale(1.1);
        opacity: 1;
      }
    }

    @keyframes crazy-well-ripple {
      0% {
        transform: scale(0.5);
        opacity: 0.8;
      }
      100% {
        transform: scale(1.3);
        opacity: 0;
      }
    }
  `);

  buttonHandlers.initializeTornadoControls = initializeTornadoControls;
  register("gravity", createGravityTornadoAction);
  register("random", createRandomTornadoAction);
  register("point", createPointClickTornadoAction);
  randomHandlers.setMode = (mode) => {
    const shared = window.CrazyPanelShared;
    const normalized = broadcastRandomMode(shared && shared.state, mode);
    const runtime = getSharedRuntime();
    if (!runtime) {
      return;
    }
    if (normalized !== "point") {
      disablePointClickMode(runtime);
    }
  };
  randomHandlers.clearWells = () => {
    const runtime = getSharedRuntime();
    if (runtime && typeof runtime.clearGravityWells === "function") {
      runtime.clearGravityWells();
    }
  };

  function register(key, factory) {
    window.CrazyPanelActionFactories = window.CrazyPanelActionFactories || {};
    window.CrazyPanelActionFactories[key] = factory;
  }

  function createGravityTornadoAction(shared) {
    const { utils, state } = shared;
    const randomBetweenFn = utils.randomBetween || randomBetween;

    return function handleGravityTornado(button, externalState) {
      const cards = utils.getAllCards();
      if (!cards.length) {
        launchConfettiFallback();
        return;
      }

      const runtime = ensureTornadoRuntime(externalState || state);
      runtime.randomBetween = randomBetweenFn;

      if (runtime.active && runtime.mode === "gravity") {
        stopTornado(runtime);
        button.classList.remove("is-on");
        return;
      }

      if (runtime.active) {
        stopTornado(runtime);
      }

      startGravityMode(runtime, button, cards);
    };
  }

  function createRandomTornadoAction(shared) {
    const { utils, state } = shared;
    const randomBetweenFn = utils.randomBetween || randomBetween;

    return function handleRandomTornado(button, externalState) {
      const cards = utils.getAllCards();
      if (!cards.length) {
        launchConfettiFallback();
        return;
      }

      const runtime = ensureTornadoRuntime(externalState || state);
      runtime.randomBetween = randomBetweenFn;

      if (runtime.active && runtime.mode === "random") {
        stopTornado(runtime);
        button.classList.remove("is-on");
        return;
      }

      if (runtime.active) {
        stopTornado(runtime);
      }

      startRandomChaos(runtime, button, cards);
    };
  }

  function createPointClickTornadoAction(shared) {
    const { utils, state } = shared;
    const randomBetweenFn = utils.randomBetween || randomBetween;

    return function handlePointTornado(button, externalState) {
      const cards = utils.getAllCards();
      if (!cards.length) {
        launchConfettiFallback();
        return;
      }

      const runtime = ensureTornadoRuntime(externalState || state);
      runtime.randomBetween = randomBetweenFn;

      if (runtime.active && runtime.mode === "point") {
        stopTornado(runtime);
        button.classList.remove("is-on");
        return;
      }

      if (runtime.active) {
        stopTornado(runtime);
      }

      startPointClickMode(runtime, button, cards);
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
        gravityWells: [],
        gravityWellLayer: null,
        pointClickListener: null,
        cadenceSkips: 0,
      };
    }
    return state.buttonTornadoRuntime;
  }

  function getSharedRuntime() {
    const shared = window.CrazyPanelShared;
    if (!shared || !shared.state) {
      return null;
    }
    return shared.state.buttonTornadoRuntime || null;
  }

  function broadcastRandomMode(sharedState, mode) {
    const normalized = mode === "point" ? "point" : "chaos";
    if (sharedState) {
      sharedState.randomMode = normalized;
    }
    if (typeof document !== "undefined" && document.dispatchEvent) {
      document.dispatchEvent(
        new CustomEvent("crazy-random-mode", {
          detail: { mode: normalized },
        })
      );
    }
    return normalized;
  }

  function startGravityMode(runtime, button, cards) {
    runtime.active = true;
    runtime.mode = "gravity";
    runtime.button = button;
    if (button) {
      button.classList.add("is-on");
    }
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1200;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
    const viewportCenterX = viewportWidth / 2;
    const viewportCenterY = viewportHeight / 2;

    runtime.masses = buildMasses(viewportCenterX, viewportCenterY, viewportWidth, viewportHeight);

    const baseIntensity = getNormalizedIntensity(runtime.stateRef);

    cards.forEach((card) => card.classList.add("crazy-card-tornado"));

    runtime.cards = initializeCardStates(
      cards,
      runtime,
      viewportCenterX,
      viewportCenterY,
      baseIntensity,
      runtime.masses ? runtime.masses.length : 0
    );

    runtime.clearGravityWells = () => clearGravityWells(runtime);
    runtime.lastTimestamp = null;
    runtime.rafId = window.requestAnimationFrame((ts) => runAnimationFrame(runtime, ts));
  }

  function startRandomChaos(runtime, button, cards) {
    runtime.active = true;
    runtime.mode = "random";
    runtime.button = button;
    if (button) {
      button.classList.add("is-on");
    }
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1200;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
    const viewportCenterX = viewportWidth / 2;
    const viewportCenterY = viewportHeight / 2;

    const baseIntensity = getNormalizedIntensity(runtime.stateRef);
    cards.forEach((card) => card.classList.add("crazy-card-tornado"));

    runtime.cards = initializeCardStates(cards, runtime, viewportCenterX, viewportCenterY, baseIntensity, 0);
    runtime.clearGravityWells = () => clearGravityWells(runtime);
    runtime.lastTimestamp = null;
    disablePointClickMode(runtime);
    broadcastRandomMode(runtime.stateRef, "chaos");
    runtime.rafId = window.requestAnimationFrame((ts) => runAnimationFrame(runtime, ts));
  }

  function startPointClickMode(runtime, button, cards) {
    runtime.active = true;
    runtime.mode = "point";
    runtime.button = button;
    if (button) {
      button.classList.add("is-on");
    }
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1200;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
    const viewportCenterX = viewportWidth / 2;
    const viewportCenterY = viewportHeight / 2;

    const baseIntensity = getNormalizedIntensity(runtime.stateRef);
    cards.forEach((card) => card.classList.add("crazy-card-tornado"));

    runtime.cards = initializeCardStates(cards, runtime, viewportCenterX, viewportCenterY, baseIntensity, 0);
    runtime.clearGravityWells = () => clearGravityWells(runtime);
    runtime.lastTimestamp = null;
    enablePointClickMode(runtime);
    broadcastRandomMode(runtime.stateRef, "point");
    runtime.rafId = window.requestAnimationFrame((ts) => runAnimationFrame(runtime, ts));
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
    if (runtime.mode === "point") {
      disablePointClickMode(runtime);
      broadcastRandomMode(runtime.stateRef, "chaos");
    }
    runtime.button = null;
    runtime.mode = null;
    runtime.masses = null;
  }

  function runAnimationFrame(runtime, timestamp) {
    if (!runtime.active) {
      return;
    }
    if (runtime.mode === "gravity") {
      animateGravity(runtime, timestamp);
    } else if (runtime.mode === "random") {
      animateRandomChaos(runtime, timestamp);
    } else if (runtime.mode === "point") {
      animateRandomPointGravity(runtime, timestamp);
    }
  }

  function animateGravity(runtime, timestamp) {
    runGravityStep(runtime, timestamp, () => {
      if (!runtime.masses || !runtime.masses.length) {
        return [];
      }
      const mass = runtime.masses[selectMassIndex()];
      return mass ? [mass] : [];
    });
  }

  function animateRandomChaos(runtime, timestamp) {
    if (!runtime.active) {
      return;
    }

    const intensity = getNormalizedIntensity(runtime.stateRef);
    const dtMs = runtime.lastTimestamp ? Math.max(4, Math.min(100, timestamp - runtime.lastTimestamp)) : 16;
    runtime.lastTimestamp = timestamp;
    const dtSeconds = Math.min(TORNADO_CONFIG.maxDelta, dtMs / 1000);
    const frameScale = Math.min(1.2, dtSeconds * 60 || 1);

    const jitterMagnitude = (2 + intensity * 35) * (Math.PI / 180); // radians
    const driftLimit = 90 + intensity * 780;
    const friction = Math.max(0.9, 0.994 - intensity * 0.012);

    const chaosActive = intensity > TORNADO_CONFIG.minActiveIntensity;

    runtime.cards.forEach((cardData) => {
      if (!chaosActive) {
        cardData.position.x += cardData.velocity.x * frameScale;
        cardData.position.y += cardData.velocity.y * frameScale;
        const baseTransform = cardData.baseTransform ? `${cardData.baseTransform} ` : "";
        cardData.el.style.transform = `${baseTransform}translate3d(${cardData.position.x}px, ${cardData.position.y}px, 0)`;
        return;
      }
      cardData.jitterPhase += (0.25 + intensity * 0.9) * frameScale;
      const currentAngle = Math.atan2(cardData.velocity.y, cardData.velocity.x);
      const anglePerturb =
        runtime.randomBetween(-0.5, 0.5) * jitterMagnitude +
        Math.sin(cardData.jitterPhase) * jitterMagnitude * 0.45;
      const baseSpeed = Math.hypot(cardData.velocity.x, cardData.velocity.y);
      const desiredSpeed =
        runtime.randomBetween(
          TORNADO_CONFIG.initialSpeedMin * (1.6 + intensity * 1.7),
          TORNADO_CONFIG.initialSpeedMax * (2.5 + intensity * 4.5)
        ) * (0.78 + Math.random() * 0.45);
      const blendedSpeed = baseSpeed * 0.4 + desiredSpeed * 0.6;
      const newAngle = currentAngle + anglePerturb;
      cardData.velocity.x = Math.cos(newAngle) * blendedSpeed;
      cardData.velocity.y = Math.sin(newAngle) * blendedSpeed;

      cardData.velocity.x *= friction;
      cardData.velocity.y *= friction;

      cardData.position.x += cardData.velocity.x * frameScale;
      cardData.position.y += cardData.velocity.y * frameScale;

      const distance = Math.hypot(cardData.position.x, cardData.position.y);
      if (distance > driftLimit) {
        const scale = driftLimit / distance;
        cardData.position.x *= scale;
        cardData.position.y *= scale;
        cardData.velocity.x *= 0.5;
        cardData.velocity.y *= 0.5;
      }

      const baseTransform = cardData.baseTransform ? `${cardData.baseTransform} ` : "";
      cardData.el.style.transform = `${baseTransform}translate3d(${cardData.position.x}px, ${cardData.position.y}px, 0)`;
    });

    runtime.rafId = window.requestAnimationFrame((nextTs) => runAnimationFrame(runtime, nextTs));
  }

  function animateRandomPointGravity(runtime, timestamp) {
    runGravityStep(runtime, timestamp, () => runtime.gravityWells || []);
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

  function enablePointClickMode(runtime) {
    if (!runtime) return;
    if (runtime.pointClickListener) {
      return;
    }
    runtime.pointClickListener = (event) => {
      if (!runtime.active || runtime.mode !== "point") {
        return;
      }
      queueGravityWell(runtime, event);
    };
    document.addEventListener("pointerdown", runtime.pointClickListener);
  }

  function disablePointClickMode(runtime) {
    if (!runtime) return;
    if (runtime.pointClickListener) {
      document.removeEventListener("pointerdown", runtime.pointClickListener);
      runtime.pointClickListener = null;
    }
    clearGravityWells(runtime);
  }

  function queueGravityWell(runtime, event) {
    if (!runtime || runtime.mode !== "point") {
      return;
    }
    const shared = window.CrazyPanelShared || {};
    const panelId = shared.constants && shared.constants.PANEL_ID;
    if (panelId && event.target && event.target.closest(`#${panelId}`)) {
      return;
    }
    const x = event.clientX;
    const y = event.clientY;
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return;
    }

    // If Alt key is pressed, delete the closest gravity well
    if (event.altKey) {
      if (!runtime.gravityWells || runtime.gravityWells.length === 0) {
        return;
      }
      
      let closestIndex = -1;
      let minDistance = Infinity;
      
      runtime.gravityWells.forEach((well, index) => {
        if (!well) return;
        const dx = well.x - x;
        const dy = well.y - y;
        const distance = Math.hypot(dx, dy);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });
      
      if (closestIndex >= 0) {
        const removed = runtime.gravityWells.splice(closestIndex, 1)[0];
        if (removed && removed.element) {
          removed.element.remove();
        }
      }
      return;
    }

    // Normal behavior: create a new gravity well
    const intensity = Math.max(0.1, getNormalizedIntensity(runtime.stateRef));
    const strength = 0.35 + intensity * 1.25;
    const element = createGravityWellElement(x, y);
    const layer = ensureGravityWellLayer(runtime);
    layer.appendChild(element);
    runtime.gravityWells.push({
      x,
      y,
      strength,
      element,
    });
    if (runtime.gravityWells.length > GRAVITY_WELL_LIMIT) {
      const removed = runtime.gravityWells.shift();
      if (removed && removed.element) {
        removed.element.remove();
      }
    }
  }

  function clearGravityWells(runtime) {
    if (!runtime || !runtime.gravityWells) {
      return;
    }
    runtime.gravityWells.forEach((well) => {
      if (well && well.element && typeof well.element.remove === "function") {
        well.element.remove();
      }
    });
    runtime.gravityWells = [];
    if (runtime.gravityWellLayer && runtime.gravityWellLayer.parentNode) {
      runtime.gravityWellLayer.parentNode.removeChild(runtime.gravityWellLayer);
    }
    runtime.gravityWellLayer = null;
  }

  function ensureGravityWellLayer(runtime) {
    if (runtime.gravityWellLayer && document.body.contains(runtime.gravityWellLayer)) {
      return runtime.gravityWellLayer;
    }
    const layer = document.createElement("div");
    layer.className = "crazy-gravity-well-layer";
    document.body.appendChild(layer);
    runtime.gravityWellLayer = layer;
    return layer;
  }

  function createGravityWellElement(x, y) {
    const el = document.createElement("div");
    el.className = "crazy-gravity-well";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    return el;
  }

  function buildMasses(centerX, centerY, viewWidth, viewHeight) {
    const verticalGap = viewHeight * 0.22;
    const horizontalGap = viewWidth * 0.18;
    return [
      { x: centerX, y: centerY - verticalGap, strength: 1 }, // top
      { x: centerX, y: centerY, strength: 1 }, // center
      { x: centerX, y: centerY + verticalGap, strength: 1 }, // bottom
      { x: centerX - horizontalGap, y: centerY, strength: 1 }, // left
      { x: centerX + horizontalGap, y: centerY, strength: 1 }, // right
    ];
  }

  function getMassVector(cardData, mass) {
    return {
      x: mass.x - cardData.originCenter.x,
      y: mass.y - cardData.originCenter.y,
    };
  }

  function initializeCardStates(cards, runtime, centerX, centerY, baseIntensity, massCount) {
    return cards.map((card) => {
      const rect = card.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;
      const centerOffsetX = centerX - cardCenterX;
      const centerOffsetY = centerY - cardCenterY;
      const originVector = { x: -centerOffsetX, y: -centerOffsetY };
      const originDistance = Math.hypot(originVector.x, originVector.y) || 1;
      const originNormal = {
        x: originVector.x / originDistance,
        y: originVector.y / originDistance,
      };
      const { homeTarget, homeNormal } = createHomeTarget(originNormal, originDistance, runtime);
      const intensityScale = 0.25 + baseIntensity * 1.0;
      const initialSpeed =
        runtime.randomBetween(
          TORNADO_CONFIG.initialSpeedMin,
          TORNADO_CONFIG.initialSpeedMax * intensityScale
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
        jitterPhase: runtime.randomBetween(0, Math.PI * 2),
        swirlDirection: Math.random() < 0.5 ? 1 : -1,
        preferredMassIndex:
          typeof massCount === "number" && massCount > 0 ? selectMassIndex(massCount) : null,
      };
    });
  }

  function runGravityStep(runtime, timestamp, massSupplier) {
    if (!runtime.active) {
      return;
    }

    const isGravityMode = runtime.mode === "gravity";
    const isPointMode = runtime.mode === "point";

    const intensity = getNormalizedIntensity(runtime.stateRef);
    const deadZone = TORNADO_CONFIG.gravityDeadZone || 0;
    const gravityInputRaw = Math.max(0, intensity - deadZone);
    const intensityAboveDead =
      gravityInputRaw > 0 ? gravityInputRaw / Math.max(0.0001, 1 - deadZone) : 0;
    const lowZoneScale = TORNADO_CONFIG.gravityLowZoneScale || 0;
    const lowZoneValue =
      deadZone > 0 ? Math.min(1, intensity / deadZone) * lowZoneScale : 0;
    const gravityInput = intensityAboveDead > 0 ? intensityAboveDead : lowZoneValue;
    const dtMs = runtime.lastTimestamp ? Math.max(4, Math.min(100, timestamp - runtime.lastTimestamp)) : 16;
    runtime.lastTimestamp = timestamp;
    const dtSeconds = Math.min(TORNADO_CONFIG.maxDelta, dtMs / 1000);
    const frameScale = Math.min(1.2, dtSeconds * 60 || 1);

    const masses = (typeof massSupplier === "function" ? massSupplier() : []) || [];

    const intensityCurve = Math.pow(gravityInput, TORNADO_CONFIG.gravityExponent || 1);
    const gravityStrengthBase = TORNADO_CONFIG.gravityBase + TORNADO_CONFIG.gravityScale * intensityCurve;
    let noiseStrength = TORNADO_CONFIG.noiseBase + TORNADO_CONFIG.noiseScale * (0.15 + gravityInput);
    let centerIntensityBoost = 0;
    if (
      isGravityMode &&
      gravityInput >= TORNADO_CONFIG.centerBurstThreshold &&
      TORNADO_CONFIG.centerBurstThreshold < 1
    ) {
      centerIntensityBoost = Math.min(
        1,
        (gravityInput - TORNADO_CONFIG.centerBurstThreshold) /
          Math.max(0.001, 1 - TORNADO_CONFIG.centerBurstThreshold)
      );
      noiseStrength *= 1 - centerIntensityBoost * TORNADO_CONFIG.centerBurstNoiseReduction;
    }
    const centerCaptureRadius = TORNADO_CONFIG.centerCaptureBase + TORNADO_CONFIG.centerCaptureScale * intensity;
    const homeCaptureRadius = TORNADO_CONFIG.homeCaptureBase + TORNADO_CONFIG.homeCaptureScale * intensity;
    const returnBoost = TORNADO_CONFIG.returnBoostBase + TORNADO_CONFIG.returnBoostScale * intensity;
    const hasActiveMass =
      (isGravityMode && masses.length > 0) ||
      (isPointMode && masses.length > 0);
    const gravityActive = Boolean(hasActiveMass) && gravityInput > TORNADO_CONFIG.minActiveIntensity;

    const updateThreshold = TORNADO_CONFIG.lowUpdateThreshold || 0;
    const maxSkipFrames = Math.max(0, Math.floor(TORNADO_CONFIG.lowUpdateMaxSkip || 0));
    let cadenceSkip = 0;
    if (maxSkipFrames > 0 && updateThreshold > 0 && gravityInput < updateThreshold) {
      const normalized = gravityInput / Math.max(updateThreshold, 0.0001);
      cadenceSkip = Math.max(0, Math.round((1 - normalized) * maxSkipFrames));
    }

    if (cadenceSkip > 0) {
      if (runtime.cadenceSkips > 0) {
        runtime.cadenceSkips -= 1;
        advanceCardsByVelocity(runtime, frameScale);
        runtime.rafId = window.requestAnimationFrame((nextTs) => runAnimationFrame(runtime, nextTs));
        return;
      }
      runtime.cadenceSkips = cadenceSkip;
    } else {
      runtime.cadenceSkips = 0;
    }

    if (!gravityActive) {
      advanceCardsByVelocity(runtime, frameScale);
      runtime.rafId = window.requestAnimationFrame((nextTs) => runAnimationFrame(runtime, nextTs));
      return;
    }

    runtime.cards.forEach((cardData) => {
      let dx = 0;
      let dy = 0;
      let strengthMultiplier = 1;
      let distanceToTarget = 0;

      if (isGravityMode && masses.length) {
        let massIndex = selectMassIndex(masses.length);
        const biasChance = TORNADO_CONFIG.favoriteMassBias || 0;
        if (
          biasChance > 0 &&
          cardData.preferredMassIndex != null &&
          masses[cardData.preferredMassIndex] &&
          Math.random() < biasChance
        ) {
          massIndex = cardData.preferredMassIndex;
        }
        const targetMass = masses[massIndex] || masses[0];
        const targetVector = getMassVector(cardData, targetMass);
        const jitterMax = TORNADO_CONFIG.massJitterBase + TORNADO_CONFIG.massJitterScale * gravityInput;
        if (jitterMax > 0) {
          const randBetween = runtime.randomBetween || randomBetween;
          targetVector.x += randBetween(-jitterMax, jitterMax);
          targetVector.y += randBetween(-jitterMax, jitterMax);
        }
        dx = targetVector.x - cardData.position.x;
        dy = targetVector.y - cardData.position.y;
        distanceToTarget = Math.hypot(dx, dy);
      } else if (isPointMode && masses.length) {
        let closest = null;
        let minDistance = Infinity;
        masses.forEach((mass) => {
          if (!mass) return;
          const vector = getMassVector(cardData, mass);
          const cx = vector.x - cardData.position.x;
          const cy = vector.y - cardData.position.y;
          const distance = Math.hypot(cx, cy);
          if (distance < minDistance) {
            minDistance = distance;
            closest = { dx: cx, dy: cy, strength: typeof mass.strength === "number" ? mass.strength : 1 };
          }
        });

        if (closest) {
          dx = closest.dx;
          dy = closest.dy;
          strengthMultiplier = closest.strength;
          distanceToTarget = Math.hypot(dx, dy);
        } else {
          cardData.position.x += cardData.velocity.x * frameScale;
          cardData.position.y += cardData.velocity.y * frameScale;
          const baseTransform = cardData.baseTransform ? `${cardData.baseTransform} ` : "";
          cardData.el.style.transform = `${baseTransform}translate3d(${cardData.position.x}px, ${cardData.position.y}px, 0)`;
          return;
        }
      }

      let gravityBoost = 1;
      if (isGravityMode && distanceToTarget && gravityInput >= TORNADO_CONFIG.runawayMinIntensity) {
        const runawayRadius =
          Math.max(
            24,
            cardData.originDistance *
              (TORNADO_CONFIG.runawayRadiusMultiplierBase +
                gravityInput * TORNADO_CONFIG.runawayRadiusMultiplierScale)
          );
        if (distanceToTarget > runawayRadius) {
          const overflow = (distanceToTarget - runawayRadius) / Math.max(runawayRadius, 1);
          gravityBoost += overflow * TORNADO_CONFIG.runawayGravityBoost;
        }
        if (centerIntensityBoost > 0) {
          gravityBoost += centerIntensityBoost * TORNADO_CONFIG.centerBurstBoost;
        }
      }

      const accGravityX = dx * gravityStrengthBase * strengthMultiplier * gravityBoost;
      const accGravityY = dy * gravityStrengthBase * strengthMultiplier * gravityBoost;

      cardData.wanderPhase += cardData.wanderSpeed * frameScale * 0.04;
      let ax = accGravityX + Math.cos(cardData.wanderPhase) * noiseStrength;
      let ay = accGravityY + Math.sin(cardData.wanderPhase * 0.8) * noiseStrength;

      if (isGravityMode && gravityInput > 0) {
        const tangentBase = TORNADO_CONFIG.tangentBoostBase || 0;
        const tangentScale = TORNADO_CONFIG.tangentBoostScale || 0;
        let tangentBoost = tangentBase + tangentScale * gravityInput;
        if (cardData.mode === "outbound") {
          tangentBoost *= TORNADO_CONFIG.tangentBoostOutboundScale || 1;
        }
        if (tangentBoost > 0) {
          const tangentX = -dy;
          const tangentY = dx;
          const tangentMag = Math.hypot(tangentX, tangentY) || 1;
          const swirlDir = cardData.swirlDirection || 1;
          ax += (tangentX / tangentMag) * tangentBoost * swirlDir;
          ay += (tangentY / tangentMag) * tangentBoost * swirlDir;
        }
      }

      if (isGravityMode && cardData.mode === "outbound") {
        ax += cardData.homeNormal.x * returnBoost;
        ay += cardData.homeNormal.y * returnBoost;
      }

      cardData.velocity.x += ax * frameScale;
      cardData.velocity.y += ay * frameScale;

      cardData.position.x += cardData.velocity.x * frameScale;
      cardData.position.y += cardData.velocity.y * frameScale;

      const baseTransform = cardData.baseTransform ? `${cardData.baseTransform} ` : "";
      cardData.el.style.transform = `${baseTransform}translate3d(${cardData.position.x}px, ${cardData.position.y}px, 0)`;

      if (isGravityMode) {
        const captureDistance = distanceToTarget || Math.hypot(dx, dy);
        const distanceToHome = Math.hypot(cardData.home.x - cardData.position.x, cardData.home.y - cardData.position.y);

        if (cardData.mode === "inbound" && captureDistance <= centerCaptureRadius) {
          cardData.mode = "outbound";
          retargetHome(cardData, runtime);
          cardData.velocity.x *= 0.25;
          cardData.velocity.y *= 0.25;
        } else if (cardData.mode === "outbound" && distanceToHome <= homeCaptureRadius) {
          cardData.mode = "inbound";
        }
      }
    });

    runtime.rafId = window.requestAnimationFrame((nextTs) => runAnimationFrame(runtime, nextTs));
  }

  function selectMassIndex(count) {
    if (!count || count <= 0) {
      return 0;
    }
    return Math.floor(Math.random() * count);
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

  function advanceCardsByVelocity(runtime, frameScale) {
    if (!runtime || !runtime.cards) {
      return;
    }
    runtime.cards.forEach((cardData) => {
      cardData.position.x += cardData.velocity.x * frameScale;
      cardData.position.y += cardData.velocity.y * frameScale;
      const baseTransform = cardData.baseTransform ? `${cardData.baseTransform} ` : "";
      cardData.el.style.transform = `${baseTransform}translate3d(${cardData.position.x}px, ${cardData.position.y}px, 0)`;
    });
  }

  function registerStyleChunk(css) {
    if (!css) return;
    window.CrazyPanelStyleChunks = window.CrazyPanelStyleChunks || [];
    window.CrazyPanelStyleChunks.push(css);
  }
})();
