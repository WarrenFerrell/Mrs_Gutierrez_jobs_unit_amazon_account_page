"use strict";

(function () {
  // Configuration
  const CONFIG = {
    colors: ["#ffdf6b", "#ff6bd6", "#6bffce", "#6bc8ff", "#ffe36b"],
    confettiPieces: 600,
    explosionPoints: 30,
    sizeMin: 24,
    sizeMax: 36,
    distanceMin: 400,
    distanceMax: 1000,
    durationMin: 2,
    durationMax: 2.8,
    animationDelayMax: 0.3,
    cleanupTimeout: 3500
  };

  registerStyleChunk(`
    .confetti-dot {
      position: fixed;
      border-radius: 50%;
      pointer-events: none;
      opacity: 1;
      transform-origin: center center;
    }

    @keyframes confetti-explode {
      from { 
        transform: translate(0, 0) rotate(0deg) scale(1); 
        opacity: 1; 
      }
      to { 
        transform: translate(var(--explode-x), var(--explode-y)) rotate(720deg) scale(0.3); 
        opacity: 0; 
      }
    }
  `);

  function register(key, factory) {
    window.CrazyPanelActionFactories = window.CrazyPanelActionFactories || {};
    window.CrazyPanelActionFactories[key] = factory;
  }

  function createConfettiAction() {
    return function handleConfetti() {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      blastActiveTornadoCards();
      
      // Create multiple explosion points distributed across the screen
      const explosionCenters = [];
      for (let p = 0; p < CONFIG.explosionPoints; p += 1) {
        explosionCenters.push({
          x: Math.random() * viewportWidth,
          y: Math.random() * viewportHeight
        });
      }
      
      for (let i = 0; i < CONFIG.confettiPieces; i += 1) {
        const dot = document.createElement("div");
        dot.className = "confetti-dot";
        
        // Bigger circles: random size between min and max
        const size = CONFIG.sizeMin + Math.random() * (CONFIG.sizeMax - CONFIG.sizeMin);
        dot.style.width = `${size}px`;
        dot.style.height = `${size}px`;
        
        // Pick a random explosion point
        const center = explosionCenters[i % explosionCenters.length];
        dot.style.left = `${center.x}px`;
        dot.style.top = `${center.y}px`;
        dot.style.background = CONFIG.colors[i % CONFIG.colors.length];
        
        // Explosive spread: random angle and larger distance for more coverage
        const angle = Math.random() * Math.PI * 2;
        const distance = CONFIG.distanceMin + Math.random() * (CONFIG.distanceMax - CONFIG.distanceMin);
        const explodeX = Math.cos(angle) * distance;
        const explodeY = Math.sin(angle) * distance;
        
        // Use CSS custom properties for the animation
        dot.style.setProperty("--explode-x", `${explodeX}px`);
        dot.style.setProperty("--explode-y", `${explodeY}px`);
        
        // Apply animation with unique duration per piece
        const duration = CONFIG.durationMin + Math.random() * (CONFIG.durationMax - CONFIG.durationMin);
        dot.style.animation = `confetti-explode ${duration}s ease-out forwards`;
        dot.style.animationDelay = `${Math.random() * CONFIG.animationDelayMax}s`;
        
        document.body.appendChild(dot);
        window.setTimeout(() => dot.remove(), CONFIG.cleanupTimeout);
      }
    };
  }

  register("confetti", createConfettiAction);

  function blastActiveTornadoCards() {
    const shared = window.CrazyPanelShared;
    const state = shared && shared.state;
    const runtime = state && state.buttonTornadoRuntime;
    if (
      !runtime ||
      !runtime.active ||
      !Array.isArray(runtime.cards) ||
      runtime.cards.length === 0 ||
      ["gravity", "random", "point"].indexOf(runtime.mode) === -1
    ) {
      return false;
    }

    const sliderMax = 180;
    const intensity = Math.max(0, Math.min(sliderMax, Number(state.tornadoIntensity) || 0));
    const normalized = Math.pow(intensity / sliderMax, 0.85);
    const baseSpeed = 16 + normalized * 70;

    runtime.cards.forEach((card) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = baseSpeed * (0.75 + Math.random() * 0.6);
      card.velocity.x = Math.cos(angle) * speed;
      card.velocity.y = Math.sin(angle) * speed;
      card.position.x += card.velocity.x * 0.2;
      card.position.y += card.velocity.y * 0.2;

      const baseTransform = card.baseTransform ? `${card.baseTransform} ` : "";
      card.el.style.transform = `${baseTransform}translate3d(${card.position.x}px, ${card.position.y}px, 0)`;
    });

    return true;
  }

  function registerStyleChunk(css) {
    if (!css) return;
    window.CrazyPanelStyleChunks = window.CrazyPanelStyleChunks || [];
    window.CrazyPanelStyleChunks.push(css);
  }
})();
