(() => {
  const DISABLED_CLASS = "crazy-links-disabled";
  let intercepting = false;

  function setInterception(active) {
    if (intercepting === active) {
      return;
    }
    intercepting = active;
    if (intercepting) {
      document.body.classList.add(DISABLED_CLASS);
      document.addEventListener("click", handleClick, true);
    } else {
      document.body.classList.remove(DISABLED_CLASS);
      document.removeEventListener("click", handleClick, true);
    }
  }

  function handleClick(event) {
    const link = event.target && event.target.closest && event.target.closest("a[href]");
    if (!link) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function applyInitialState() {
    const shared = window.CrazyPanelShared;
    if (shared && shared.state && shared.state.randomMode === "point") {
      setInterception(true);
    }
  }

  function ensureStyles() {
    if (document.getElementById("crazy-link-disable-styles")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "crazy-link-disable-styles";
    style.textContent = `
      body.${DISABLED_CLASS} a[href] {
        cursor: not-allowed !important;
      }
    `;
    document.head.appendChild(style);
  }

  document.addEventListener("crazy-random-mode", (event) => {
    const mode = event && event.detail && event.detail.mode;
    setInterception(mode === "point");
  });

  const ready = () => {
    ensureStyles();
    applyInitialState();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready, { once: true });
  } else {
    ready();
  }
})();
