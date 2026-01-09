"use strict";

(function () {
  registerStyleChunk(`
    .crazy-card-chaos {
      animation: card-chaos var(--chaos-duration, 1.6s) ease-in-out infinite alternate;
      position: relative;
      z-index: 2;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
    }

    @keyframes card-chaos {
      from {
        transform: translate(0, 0) rotate(0deg) scale(1);
      }
      to {
        transform: translate(var(--chaos-x, 12px), var(--chaos-y, -12px)) rotate(var(--chaos-rotate, 3deg)) scale(1.03);
      }
    }
  `);

  function register(key, factory) {
    window.CrazyPanelActionFactories = window.CrazyPanelActionFactories || {};
    window.CrazyPanelActionFactories[key] = factory;
  }

  function createButtonTornadoAction(shared) {
    const { utils } = shared;

    return function handleButtonTornado() {
      const cards = utils.getAllCards();
      if (!cards.length) {
        launchConfettiFallback();
        return;
      }

      cards.forEach((card, index) => {
        card.classList.add("crazy-card-chaos");
        card.style.setProperty("--chaos-x", `${utils.randomBetween(-35, 35)}px`);
        card.style.setProperty("--chaos-y", `${utils.randomBetween(-25, 25)}px`);
        card.style.setProperty("--chaos-rotate", `${utils.randomBetween(-4, 4)}deg`);
        card.style.setProperty("--chaos-duration", `${1.2 + Math.random()}s`);
        card.style.zIndex = 2 + (cards.length - index);
      });

      window.setTimeout(() => {
        cards.forEach((card) => {
          card.classList.remove("crazy-card-chaos");
          card.style.removeProperty("--chaos-x");
          card.style.removeProperty("--chaos-y");
          card.style.removeProperty("--chaos-rotate");
          card.style.removeProperty("--chaos-duration");
          card.style.removeProperty("z-index");
        });
      }, 4500);
    };
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

  function registerStyleChunk(css) {
    if (!css) return;
    window.CrazyPanelStyleChunks = window.CrazyPanelStyleChunks || [];
    window.CrazyPanelStyleChunks.push(css);
  }
})();
