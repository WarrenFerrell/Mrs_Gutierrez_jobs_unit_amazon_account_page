"use strict";

(function () {
  function register(key, factory) {
    window.CrazyPanelActionFactories = window.CrazyPanelActionFactories || {};
    window.CrazyPanelActionFactories[key] = factory;
  }

  function createResetAction(shared) {
    const { state, original, dom, utils } = shared;

    return function handleReset() {
      utils.getPanelButtons().forEach((btn) => btn.classList.remove("is-on"));

      const body = dom.getBody();
      body.style.backgroundImage = original.background;
      body.style.backgroundColor = original.backgroundColor;
      body.classList.remove("crazy-panel-invert", "crazy-panel-wiggle");
      state.wiggleOn = false;

      dom.getDocumentElement().style.fontSize = "";
      const slider = document.getElementById("crazy-size-slider");
      if (slider) {
        slider.value = "0";
      }

      if (state.rainbowTimer) {
        window.clearInterval(state.rainbowTimer);
        state.rainbowTimer = null;
      }

      utils.setCardRainbow(false);
      document.querySelectorAll(".confetti-dot").forEach((el) => el.remove());
    };
  }

  register("reset", createResetAction);
})();
