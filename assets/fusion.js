(function () {
  const root = document.documentElement;
  const buttons = document.querySelectorAll("[data-theme-button]");
  const modeNames = ["light", "black", "auto", "night"];
  const media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  const params = new URLSearchParams(window.location.search);

  function getStoredChoice() {
    const queryChoice = params.get("theme");
    if (modeNames.includes(queryChoice)) {
      return queryChoice;
    }

    try {
      const saved = localStorage.getItem("fusion-theme");
      return modeNames.includes(saved) ? saved : "auto";
    } catch (error) {
      return "auto";
    }
  }

  function resolveTheme(choice) {
    if (choice === "auto") {
      return media && media.matches ? "black" : "light";
    }
    return choice;
  }

  function applyTheme(choice, persist) {
    const nextChoice = modeNames.includes(choice) ? choice : "auto";
    root.dataset.themeChoice = nextChoice;
    root.dataset.theme = resolveTheme(nextChoice);

    buttons.forEach((button) => {
      const isPressed = button.dataset.themeButton === nextChoice;
      button.setAttribute("aria-pressed", String(isPressed));
    });

    if (persist) {
      try {
        localStorage.setItem("fusion-theme", nextChoice);
      } catch (error) {
        return;
      }
    }
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      applyTheme(button.dataset.themeButton, true);
    });
  });

  if (media) {
    media.addEventListener("change", () => {
      if (root.dataset.themeChoice === "auto") {
        applyTheme("auto", false);
      }
    });
  }

  applyTheme(getStoredChoice(), false);
})();
