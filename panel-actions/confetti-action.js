"use strict";

(function () {
  registerStyleChunk(`
    .confetti-dot {
      position: fixed;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      pointer-events: none;
      animation: confetti-fall 1.8s linear forwards;
    }

    @keyframes confetti-fall {
      from { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
      to { transform: translateY(110vh) rotate(360deg); opacity: 0; }
    }
  `);

  function register(key, factory) {
    window.CrazyPanelActionFactories = window.CrazyPanelActionFactories || {};
    window.CrazyPanelActionFactories[key] = factory;
  }

  function createConfettiAction() {
    const colors = ["#ffdf6b", "#ff6bd6", "#6bffce", "#6bc8ff", "#ffe36b"];
    const confettiPieces = 30;

    return function handleConfetti() {
      for (let i = 0; i < confettiPieces; i += 1) {
        const dot = document.createElement("div");
        dot.className = "confetti-dot";
        dot.style.left = `${Math.random() * 100}vw`;
        dot.style.top = `${Math.random() * 10}vh`;
        dot.style.background = colors[i % colors.length];
        dot.style.animationDelay = `${Math.random()}s`;
        dot.style.animationDuration = `${1.2 + Math.random()}s`;
        document.body.appendChild(dot);
        window.setTimeout(() => dot.remove(), 2500);
      }
    };
  }

  register("confetti", createConfettiAction);

  function registerStyleChunk(css) {
    if (!css) return;
    window.CrazyPanelStyleChunks = window.CrazyPanelStyleChunks || [];
    window.CrazyPanelStyleChunks.push(css);
  }
})();
