"use strict";

(function () {
  const SUPER_ZOOM_SLIDER_ID = "crazy-size-slider";
  const SUPER_ZOOM_MIN = -4;
  const SUPER_ZOOM_MAX = 8;
  const SUPER_ZOOM_STEP = 0.08;
  const EPSILON = 0.001;
  const CAPTURE_OPTIONS = { capture: true };

  function register(key, factory) {
    window.CrazyPanelActionFactories = window.CrazyPanelActionFactories || {};
    window.CrazyPanelActionFactories[key] = factory;
  }

  function createResetAction(shared) {
    const { state, original, dom, utils } = shared;
    const zoomController = state.__crazySuperZoom || createSuperZoomController(shared);
    state.__crazySuperZoom = zoomController;

    return function handleReset() {
      utils.getPanelButtons().forEach((btn) => btn.classList.remove("is-on"));

      const body = dom.getBody();
      body.style.backgroundImage = original.background;
      body.style.backgroundColor = original.backgroundColor;
      body.classList.remove("crazy-panel-invert", "crazy-panel-wiggle");
      state.wiggleOn = false;

      dom.getDocumentElement().style.fontSize = "";
      const slider = document.getElementById(SUPER_ZOOM_SLIDER_ID);
      if (slider) {
        slider.value = "0";
      }
      zoomController.reset();

      if (state.rainbowTimer) {
        window.clearInterval(state.rainbowTimer);
        state.rainbowTimer = null;
      }

      utils.setCardRainbow(false);
      document.querySelectorAll(".confetti-dot").forEach((el) => el.remove());

      const tornadoHandlers = window.CrazyPanelButtonHandlers;
      if (tornadoHandlers && typeof tornadoHandlers.stopTornado === "function") {
        tornadoHandlers.stopTornado();
      }

      const randomHandlers = window.CrazyPanelRandomHandlers;
      if (randomHandlers) {
        if (typeof randomHandlers.clearWells === "function") {
          randomHandlers.clearWells();
        }
        if (typeof randomHandlers.setMode === "function") {
          randomHandlers.setMode("chaos");
        }
      } else if (state) {
        state.randomMode = "chaos";
      }
    };
  }

  register("reset", createResetAction);

  function createSuperZoomController(shared) {
    const { dom, state, constants = {} } = shared;
    const body = dom.getBody();
    const getPanel =
      (typeof dom.getPanel === "function" && dom.getPanel) ||
      (() => document.getElementById(constants.PANEL_ID || "crazy-play-panel"));

    waitForSlider(bindToSlider);

    function applyZoomFromValue(rawValue) {
      const numeric = clamp(Number(rawValue) || 0, SUPER_ZOOM_MIN, SUPER_ZOOM_MAX);
      state.superZoomValue = numeric;
      const scale = Number((1 + numeric * SUPER_ZOOM_STEP).toFixed(3));

      applyScale(scale);
    }

    function clearZoom() {
      delete state.superZoomValue;
      applyScale(1);
    }

    function bindToSlider() {
      const slider = document.getElementById(SUPER_ZOOM_SLIDER_ID);
      if (!slider || slider.dataset.crazyZoomBound === "true") {
        return;
      }

      const handleInput = (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        applyZoomFromValue(event.target.value);
      };
      slider.addEventListener("input", handleInput, CAPTURE_OPTIONS);
      slider.addEventListener("change", handleInput, CAPTURE_OPTIONS);
      slider.dataset.crazyZoomBound = "true";
      applyZoomFromValue(slider.value);
    }

    function waitForSlider(callback, attempt = 0) {
      if (document.getElementById(SUPER_ZOOM_SLIDER_ID)) {
        callback();
        return;
      }

      if (attempt > 80) {
        return;
      }

      window.setTimeout(() => waitForSlider(callback, attempt + 1), 60);
    }

    return {
      apply: applyZoomFromValue,
      reset: clearZoom,
    };

    function applyScale(scale) {
      const panel = getPanel();
      if (Math.abs(scale - 1) < EPSILON) {
        body.style.removeProperty("transform");
        body.style.removeProperty("transform-origin");
        body.style.removeProperty("--crazy-super-zoom-scale");
        if (panel) {
          panel.style.removeProperty("transform");
          panel.style.removeProperty("transform-origin");
        }
        return;
      }

      body.style.transform = `scale(${scale})`;
      body.style.transformOrigin = "top left";
      body.style.setProperty("--crazy-super-zoom-scale", String(scale));

      if (panel) {
        const inverse = Number((1 / scale).toFixed(3));
        panel.style.transform = `scale(${inverse})`;
        panel.style.transformOrigin = "top left";
      }
    }
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
})();
