"use strict";

(function () {
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
    const colors = ["#ffdf6b", "#ff6bd6", "#6bffce", "#6bc8ff", "#ffe36b"];
    const confettiPieces = 600;
    const explosionPoints = 30; // Multiple explosion points across screen

    return function handleConfetti() {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Create multiple explosion points distributed across the screen
      const explosionCenters = [];
      for (let p = 0; p < explosionPoints; p += 1) {
        explosionCenters.push({
          x: Math.random() * viewportWidth,
          y: Math.random() * viewportHeight
        });
      }
      
      for (let i = 0; i < confettiPieces; i += 1) {
        const dot = document.createElement("div");
        dot.className = "confetti-dot";
        
        // Bigger circles: random size between 24px and 36px
        const size = 24 + Math.random() * 12;
        dot.style.width = `${size}px`;
        dot.style.height = `${size}px`;
        
        // Pick a random explosion point
        const center = explosionCenters[i % explosionCenters.length];
        dot.style.left = `${center.x}px`;
        dot.style.top = `${center.y}px`;
        dot.style.background = colors[i % colors.length];
        
        // Explosive spread: random angle and larger distance for more coverage
        const angle = Math.random() * Math.PI * 2;
        const distance = 400 + Math.random() * 600; // 400-1000px explosion radius
        const explodeX = Math.cos(angle) * distance;
        const explodeY = Math.sin(angle) * distance;
        
        // Use CSS custom properties for the animation
        dot.style.setProperty("--explode-x", `${explodeX}px`);
        dot.style.setProperty("--explode-y", `${explodeY}px`);
        
        // Apply animation with unique duration per piece
        const duration = 2 + Math.random() * 0.8;
        dot.style.animation = `confetti-explode ${duration}s ease-out forwards`;
        dot.style.animationDelay = `${Math.random() * 0.3}s`;
        
        document.body.appendChild(dot);
        window.setTimeout(() => dot.remove(), 3500);
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
