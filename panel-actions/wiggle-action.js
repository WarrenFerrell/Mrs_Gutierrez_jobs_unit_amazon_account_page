"use strict";

(function () {
  const constants = (window.CrazyPanelShared && window.CrazyPanelShared.constants) || {};
  const panelId = constants.PANEL_ID || "crazy-play-panel";

  registerStyleChunk(`
    body.crazy-panel-wiggle *:not(#${panelId}):not(#${panelId} *) {
      animation: crazy-panel-wiggle 0.4s infinite alternate;
    }

    @keyframes crazy-panel-wiggle {
      from { transform: rotate(-1deg) translateX(-1px); }
      to { transform: rotate(1deg) translateX(1px); }
    }
  `);

  function register(key, factory) {
    window.CrazyPanelActionFactories = window.CrazyPanelActionFactories || {};
    window.CrazyPanelActionFactories[key] = factory;
  }

  function createWiggleAction(shared) {
    const { dom, state } = shared;

    return function handleWiggle(button) {
      button.classList.toggle("is-on");
      const body = dom.getBody();
      const isActive = body.classList.toggle("crazy-panel-wiggle");
      state.wiggleOn = isActive;
    };
  }

  register("wiggle", createWiggleAction);

  function registerStyleChunk(css) {
    if (!css) return;
    window.CrazyPanelStyleChunks = window.CrazyPanelStyleChunks || [];
    window.CrazyPanelStyleChunks.push(css);
  }
})();
