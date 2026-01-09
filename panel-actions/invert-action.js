"use strict";

(function () {
  const constants = (window.CrazyPanelShared && window.CrazyPanelShared.constants) || {};
  const panelId = constants.PANEL_ID || "crazy-play-panel";

  registerStyleChunk(`
    body.crazy-panel-invert {
      filter: invert(1) hue-rotate(180deg);
    }

    body.crazy-panel-invert #${panelId} {
      filter: invert(1) hue-rotate(180deg);
    }
  `);

  function register(key, factory) {
    window.CrazyPanelActionFactories = window.CrazyPanelActionFactories || {};
    window.CrazyPanelActionFactories[key] = factory;
  }

  function createInvertAction(shared) {
    const { dom } = shared;

    return function handleInvert(button) {
      button.classList.toggle("is-on");
      dom.getBody().classList.toggle("crazy-panel-invert");
    };
  }

  register("invert", createInvertAction);

  function registerStyleChunk(css) {
    if (!css) return;
    window.CrazyPanelStyleChunks = window.CrazyPanelStyleChunks || [];
    window.CrazyPanelStyleChunks.push(css);
  }
})();
