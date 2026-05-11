(function () {
  const dividers = document.querySelectorAll("[data-spectrum-divider]");
  const root = document.documentElement;

  function faviconSvg(theme) {
    const isLight = theme === "light";
    const isNight = theme === "night";
    const bg = isLight ? "#ffffff" : "#080808";
    const ink = isLight ? "#080808" : (isNight ? "#ff6b5f" : "#f7f7f3");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="${bg}"/><rect x="18" y="18" width="92" height="92" rx="16" fill="none" stroke="${ink}" stroke-width="6"/><text x="64" y="78" text-anchor="middle" fill="${ink}" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="800" letter-spacing="1">tr</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  function updateFavicon() {
    let icon = document.querySelector('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement("link");
      icon.rel = "icon";
      icon.type = "image/svg+xml";
      document.head.appendChild(icon);
    }
    icon.href = faviconSvg(root.dataset.theme || "light");
  }

  updateFavicon();
  new MutationObserver(updateFavicon).observe(root, {
    attributeFilter: ["data-theme"],
    attributes: true,
  });

  if (!dividers.length) {
    return;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function absorptionLines(count) {
    const lines = [];

    for (let index = 0; index < count; index += 1) {
      const position = randomBetween(2, 98);
      const width = randomBetween(0.08, 0.55);
      const opacity = randomBetween(0.22, 0.72);
      lines.push(
        `linear-gradient(90deg, transparent ${Math.max(0, position - width).toFixed(2)}%, rgba(0, 0, 0, ${opacity.toFixed(2)}) ${position.toFixed(2)}%, transparent ${Math.min(100, position + width).toFixed(2)}%)`
      );
    }

    return lines.join(", ");
  }

  dividers.forEach((divider) => {
    const base = "linear-gradient(90deg, #384fc8 0%, #3faede 24%, #67c97b 45%, #e5ca5a 63%, #e4784e 82%, #9a61bd 100%)";
    divider.style.backgroundImage = `${absorptionLines(34)}, ${base}`;
  });
})();
