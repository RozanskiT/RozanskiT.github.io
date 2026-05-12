(function () {
  const container = document.querySelector(".atmosphere-page");

  if (!container) {
    return;
  }

  const root = document.documentElement;
  const form = document.querySelector("[data-atmosphere-controls]");
  const spectrumCanvas = document.querySelector("[data-spectrum-canvas]");
  const depthCanvas = document.querySelector("[data-depth-canvas]");
  const diagram = document.querySelector("[data-layer-diagram]");
  const summary = document.querySelector("[data-summary]");
  const locale = root.lang === "pl" ? "pl" : "en";
  const text = {
    en: {
      wavelength: "wavelength (nm)",
      emergent: "emergent",
      background: "background",
      gasSource: "gas source",
      continuum: "continuum",
      upperPanel: "monochromatic intensity",
      lowerPanel: "normalized intensity",
      normalized: "I_lambda / I_cont",
      cool: "Cool gas removes light near line center.",
      hot: "Hot gas adds line emission above the background.",
      equal: "Equal temperatures erase the line contrast.",
    },
    pl: {
      wavelength: "d\u0142ugo\u015b\u0107 fali (nm)",
      emergent: "wynik",
      background: "t\u0142o",
      gasSource: "gaz",
      continuum: "kontinuum",
      upperPanel: "nat\u0119\u017cenie monochromatyczne",
      lowerPanel: "nat\u0119\u017cenie unormowane",
      normalized: "I_lambda / I_kont",
      cool: "Ch\u0142odniejszy gaz os\u0142abia \u015bwiat\u0142o w centrum linii.",
      hot: "Gor\u0119tszy gaz dodaje emisj\u0119 ponad t\u0142em.",
      equal: "R\u00f3wne temperatury usuwaj\u0105 kontrast linii.",
    },
  }[locale];
  const outputs = new Map(
    Array.from(document.querySelectorAll("[data-output]")).map((output) => [
      output.dataset.output,
      output,
    ])
  );
  const readouts = new Map(
    Array.from(document.querySelectorAll("[data-readout]")).map((item) => [
      item.dataset.readout,
      item,
    ])
  );

  const defaults = {
    backgroundTemperature: 6000,
    layerTemperature: 5000,
    lineDepth: 1.2,
    continuumDepth: 0.02,
    lineCenter: 589,
    lineWidth: 24,
  };

  const wavelengthMin = 380;
  const wavelengthMax = 760;
  const sampleCount = 480;
  const secondRadiationConstant = 1.438776877e-2;

  function valueOf(name) {
    const field = form.elements[name];
    return field ? Number(field.value) : defaults[name];
  }

  function stateFromForm() {
    return {
      backgroundTemperature: valueOf("backgroundTemperature"),
      layerTemperature: valueOf("layerTemperature"),
      lineDepth: valueOf("lineDepth"),
      continuumDepth: valueOf("continuumDepth"),
      lineCenter: valueOf("lineCenter"),
      lineWidth: valueOf("lineWidth"),
    };
  }

  function planck(wavelengthNm, temperature) {
    const wavelengthM = wavelengthNm * 1e-9;
    const exponent = secondRadiationConstant / (wavelengthM * temperature);
    return 1 / (Math.pow(wavelengthM, 5) * Math.expm1(exponent));
  }

  function gaussianDepth(wavelength, state) {
    const distance = (wavelength - state.lineCenter) / state.lineWidth;
    return state.continuumDepth + state.lineDepth * Math.exp(-0.5 * distance * distance);
  }

  function model(state) {
    const points = [];
    let backgroundPeak = 0;
    let equivalentWidth = 0;
    const step = (wavelengthMax - wavelengthMin) / (sampleCount - 1);

    for (let index = 0; index < sampleCount; index += 1) {
      const wavelength = wavelengthMin + index * step;
      const background = planck(wavelength, state.backgroundTemperature);
      const gas = planck(wavelength, state.layerTemperature);
      backgroundPeak = Math.max(backgroundPeak, background);
      const tau = gaussianDepth(wavelength, state);
      const transmission = Math.exp(-tau);
      const emergent = background * transmission + gas * (1 - transmission);
      const continuumTransmission = Math.exp(-state.continuumDepth);
      const continuum = background * continuumTransmission + gas * (1 - continuumTransmission);

      points.push({
        wavelength,
        background,
        gas,
        tau,
        transmission,
        emergent,
        continuum,
      });
    }

    points.forEach((point) => {
      point.backgroundNorm = point.background / backgroundPeak;
      point.gasNorm = point.gas / backgroundPeak;
      point.emergentNorm = point.emergent / backgroundPeak;
      point.continuumNorm = point.continuum / backgroundPeak;
      point.normalizedIntensity = point.emergent / point.continuum;
    });

    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const current = points[index];
      const previousContrast = 1 - previous.emergent / previous.continuum;
      const currentContrast = 1 - current.emergent / current.continuum;
      equivalentWidth += 0.5 * (previousContrast + currentContrast) * (current.wavelength - previous.wavelength);
    }

    return {
      points,
      equivalentWidth,
    };
  }

  function css(name) {
    return getComputedStyle(root).getPropertyValue(name).trim();
  }

  function prepareCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.max(320, Math.round(rect.width * ratio));
    const height = Math.max(220, Math.round(rect.height * ratio));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const context = canvas.getContext("2d");
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return {
      context,
      width: width / ratio,
      height: height / ratio,
    };
  }

  function wavelengthColor(wavelength) {
    let red = 0;
    let green = 0;
    let blue = 0;
    let factor = 0;

    if (wavelength >= 380 && wavelength < 440) {
      red = -(wavelength - 440) / (440 - 380);
      blue = 1;
    } else if (wavelength < 490) {
      green = (wavelength - 440) / (490 - 440);
      blue = 1;
    } else if (wavelength < 510) {
      green = 1;
      blue = -(wavelength - 510) / (510 - 490);
    } else if (wavelength < 580) {
      red = (wavelength - 510) / (580 - 510);
      green = 1;
    } else if (wavelength < 645) {
      red = 1;
      green = -(wavelength - 645) / (645 - 580);
    } else if (wavelength <= 760) {
      red = 1;
    }

    if (wavelength < 420) {
      factor = 0.35 + 0.65 * (wavelength - 380) / (420 - 380);
    } else if (wavelength <= 700) {
      factor = 1;
    } else {
      factor = 0.35 + 0.65 * (760 - wavelength) / (760 - 700);
    }

    return `rgb(${Math.round(red * factor * 255)}, ${Math.round(green * factor * 255)}, ${Math.round(blue * factor * 255)})`;
  }

  function drawAxes(context, box, options) {
    const ink = css("--ink") || "#141414";
    const muted = css("--muted") || "#55534d";
    const line = css("--line") || "#d9d5c8";

    context.save();
    context.strokeStyle = line;
    context.fillStyle = muted;
    context.lineWidth = 1;
    context.font = "12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    context.textBaseline = "middle";

    context.beginPath();
    context.moveTo(box.left, box.top);
    context.lineTo(box.left, box.bottom);
    context.lineTo(box.right, box.bottom);
    context.stroke();

    const xTicks = options.xTicks || [400, 500, 600, 700];
    xTicks.forEach((tick) => {
      const x = options.xScale(tick);
      context.strokeStyle = line;
      context.beginPath();
      context.moveTo(x, box.top);
      context.lineTo(x, box.bottom + (options.xLabel === false ? 0 : 5));
      context.stroke();
      if (options.xLabel !== false) {
        context.fillStyle = muted;
        context.textAlign = "center";
        context.fillText(String(tick), x, box.bottom + 18);
      }
    });

    options.yTicks.forEach((tick) => {
      const y = options.yScale(tick);
      context.strokeStyle = line;
      context.globalAlpha = 0.55;
      context.beginPath();
      context.moveTo(box.left, y);
      context.lineTo(box.right, y);
      context.stroke();
      context.globalAlpha = 1;
      context.fillStyle = muted;
      context.textAlign = "right";
      context.fillText(options.formatY(tick), box.left - 8, y);
    });

    if (options.panelLabel) {
      context.fillStyle = muted;
      context.textAlign = "right";
      context.fillText(options.panelLabel, box.right - 8, box.top + 12);
    }

    if (options.xLabel !== false) {
      context.fillStyle = ink;
      context.textAlign = "right";
      context.fillText(text.wavelength, box.right, box.bottom + 38);
    }
    context.restore();
  }

  function drawLine(context, points, box, xScale, yScale, key, color, width, dash) {
    context.save();
    context.strokeStyle = color;
    context.lineWidth = width;
    context.setLineDash(dash || []);
    context.lineJoin = "round";
    context.lineCap = "round";
    context.beginPath();
    points.forEach((point, index) => {
      const x = xScale(point.wavelength);
      const y = yScale(point[key]);
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
    context.stroke();
    context.restore();
  }

  function drawSpectrum(data, state) {
    const prepared = prepareCanvas(spectrumCanvas);
    const context = prepared.context;
    const width = prepared.width;
    const height = prepared.height;
    const page = css("--page") || "#fffffb";
    const line = css("--line") || "#d9d5c8";
    const muted = css("--muted") || "#55534d";
    const outColor = css("--chart-out") || "#8f2b18";
    const bgColor = css("--chart-bg") || "#315caa";
    const gasColor = css("--chart-gas") || "#2f8d63";
    const left = width < 520 ? 42 : 54;
    const right = width - 14;
    const lowerHeight = Math.max(118, Math.min(170, height * 0.31));
    const upperBox = {
      left,
      right,
      top: 18,
      bottom: height - lowerHeight - 72,
    };
    const lowerBox = {
      left,
      right,
      top: height - lowerHeight - 30,
      bottom: height - 54,
    };
    const fullBox = {
      left: width < 520 ? 42 : 54,
      right: width - 14,
      top: 18,
      bottom: height - 54,
    };

    const maxY = Math.max(
      0.05,
      ...data.points.flatMap((point) => [
        point.backgroundNorm,
        point.gasNorm,
        point.emergentNorm,
        point.continuumNorm,
      ])
    ) * 1.08;

    const xScale = (wavelength) => fullBox.left + (wavelength - wavelengthMin) / (wavelengthMax - wavelengthMin) * (fullBox.right - fullBox.left);
    const yScale = (value) => upperBox.bottom - value / maxY * (upperBox.bottom - upperBox.top);
    const yTicks = [0, maxY / 3, 2 * maxY / 3, maxY];
    const normalizedValues = data.points.map((point) => point.normalizedIntensity);
    const normalizedMin = Math.min(...normalizedValues);
    const normalizedMax = Math.max(...normalizedValues);
    const normalizedPad = Math.max(0.035, (normalizedMax - normalizedMin) * 0.18);
    const normalizedYMin = Math.max(0, Math.min(0.94, normalizedMin - normalizedPad));
    const normalizedYMax = Math.max(1.06, normalizedMax + normalizedPad);
    const normalizedScale = (value) => lowerBox.bottom - (value - normalizedYMin) / (normalizedYMax - normalizedYMin) * (lowerBox.bottom - lowerBox.top);
    const normalizedTicks = [normalizedYMin, 1, normalizedYMax]
      .filter((tick, index, ticks) => ticks.indexOf(tick) === index)
      .sort((a, b) => a - b);

    context.clearRect(0, 0, width, height);
    context.fillStyle = page;
    context.fillRect(0, 0, width, height);

    for (let x = Math.floor(fullBox.left); x < fullBox.right; x += 1) {
      const wavelength = wavelengthMin + (x - fullBox.left) / (fullBox.right - fullBox.left) * (wavelengthMax - wavelengthMin);
      context.fillStyle = wavelengthColor(wavelength);
      context.globalAlpha = 0.2;
      context.fillRect(x, lowerBox.bottom - 14, 1.5, 14);
    }
    context.globalAlpha = 1;

    drawAxes(context, upperBox, {
      xScale,
      yScale,
      yTicks,
      xLabel: false,
      panelLabel: text.upperPanel,
      formatY: (tick) => tick.toFixed(tick >= 1 ? 1 : 2),
    });

    drawAxes(context, lowerBox, {
      xScale,
      yScale: normalizedScale,
      yTicks: normalizedTicks,
      panelLabel: text.normalized,
      formatY: (tick) => tick.toFixed(2),
    });

    drawLine(context, data.points, upperBox, xScale, yScale, "continuumNorm", line, 1.5, [4, 5]);
    drawLine(context, data.points, upperBox, xScale, yScale, "backgroundNorm", bgColor, 1.7, [8, 5]);
    drawLine(context, data.points, upperBox, xScale, yScale, "gasNorm", gasColor, 1.7, [2, 5]);
    drawLine(context, data.points, upperBox, xScale, yScale, "emergentNorm", outColor, 2.7);

    context.save();
    context.strokeStyle = muted;
    context.lineWidth = 1.2;
    context.setLineDash([4, 5]);
    context.beginPath();
    context.moveTo(lowerBox.left, normalizedScale(1));
    context.lineTo(lowerBox.right, normalizedScale(1));
    context.stroke();
    context.restore();

    drawLine(context, data.points, lowerBox, xScale, normalizedScale, "normalizedIntensity", outColor, 2.6);

    const centerX = xScale(state.lineCenter);
    context.save();
    context.strokeStyle = outColor;
    context.globalAlpha = 0.38;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(centerX, upperBox.top);
    context.lineTo(centerX, lowerBox.bottom);
    context.stroke();
    context.restore();

    drawLegend(context, upperBox, [
      [text.emergent, outColor, []],
      [text.background, bgColor, [8, 5]],
      [text.gasSource, gasColor, [2, 5]],
      [text.continuum, line, [4, 5]],
    ]);
  }

  function drawLegend(context, box, items) {
    const page = css("--page") || "#fffffb";
    const ink = css("--ink") || "#141414";
    const line = css("--line") || "#d9d5c8";
    const x = box.left + 10;
    let y = box.top + 14;

    context.save();
    context.font = "12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    context.textBaseline = "middle";
    context.fillStyle = page;
    context.strokeStyle = line;
    context.lineWidth = 1;
    context.globalAlpha = 0.94;
    context.fillRect(x - 8, y - 12, 126, items.length * 20 + 9);
    context.globalAlpha = 1;
    context.strokeRect(x - 8, y - 12, 126, items.length * 20 + 9);

    items.forEach(([label, color, dash]) => {
      context.strokeStyle = color;
      context.lineWidth = label === text.emergent ? 2.5 : 1.7;
      context.setLineDash(dash);
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + 25, y);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = ink;
      context.fillText(label, x + 34, y);
      y += 20;
    });
    context.restore();
  }

  function drawDepth(data, state) {
    const prepared = prepareCanvas(depthCanvas);
    const context = prepared.context;
    const width = prepared.width;
    const height = prepared.height;
    const page = css("--page") || "#fffffb";
    const outColor = css("--chart-out") || "#8f2b18";
    const faint = css("--faint") || "#efede4";
    const box = {
      left: width < 430 ? 42 : 54,
      right: width - 14,
      top: 18,
      bottom: height - 48,
    };
    const maxTau = Math.max(state.continuumDepth + state.lineDepth, 0.2) * 1.12;
    const xScale = (wavelength) => box.left + (wavelength - wavelengthMin) / (wavelengthMax - wavelengthMin) * (box.right - box.left);
    const yScale = (value) => box.bottom - value / maxTau * (box.bottom - box.top);
    const yTicks = [0, maxTau / 2, maxTau];

    context.clearRect(0, 0, width, height);
    context.fillStyle = page;
    context.fillRect(0, 0, width, height);

    context.save();
    context.fillStyle = faint;
    context.beginPath();
    context.moveTo(xScale(wavelengthMin), yScale(0));
    data.points.forEach((point) => {
      context.lineTo(xScale(point.wavelength), yScale(point.tau));
    });
    context.lineTo(xScale(wavelengthMax), yScale(0));
    context.closePath();
    context.fill();
    context.restore();

    drawAxes(context, box, {
      xScale,
      yScale,
      yTicks,
      formatY: (tick) => tick.toFixed(tick >= 1 ? 1 : 2),
    });

    drawLine(context, data.points, box, xScale, yScale, "tau", outColor, 2.4);
  }

  function updateOutputs(state) {
    const formats = {
      backgroundTemperature: (value) => `${Math.round(value)} K`,
      layerTemperature: (value) => `${Math.round(value)} K`,
      lineDepth: (value) => value.toFixed(2),
      continuumDepth: (value) => value.toFixed(2),
      lineCenter: (value) => `${Math.round(value)} nm`,
      lineWidth: (value) => `${Math.round(value)} nm`,
    };

    Object.entries(state).forEach(([key, value]) => {
      const output = outputs.get(key);
      if (output) {
        output.value = formats[key](value);
        output.textContent = formats[key](value);
      }
    });
  }

  function updateReadouts(data, state) {
    const equivalentWidth = data.equivalentWidth;
    const relation = state.layerTemperature < state.backgroundTemperature
      ? text.cool
      : state.layerTemperature > state.backgroundTemperature
        ? text.hot
        : text.equal;

    if (summary) {
      summary.textContent = relation;
    }

    const equivalentWidthNode = readouts.get("equivalentWidth");

    if (equivalentWidthNode) {
      equivalentWidthNode.textContent = `${equivalentWidth.toFixed(2)} nm`;
    }
  }

  function updateDiagram(state) {
    if (!diagram) {
      return;
    }

    const gasLabel = diagram.querySelector("[data-diagram-gas]");
    const backgroundLabel = diagram.querySelector("[data-diagram-background]");
    const opacity = Math.min(0.78, 0.14 + state.lineDepth * 0.09 + state.continuumDepth * 0.16);
    const linePosition = (state.lineCenter - wavelengthMin) / (wavelengthMax - wavelengthMin) * 100;

    diagram.style.setProperty("--gas-alpha", opacity.toFixed(3));
    diagram.style.setProperty("--line-position", `${Math.max(3, Math.min(97, linePosition)).toFixed(1)}%`);

    if (gasLabel) {
      gasLabel.textContent = `${Math.round(state.layerTemperature)} K`;
    }
    if (backgroundLabel) {
      backgroundLabel.textContent = `${Math.round(state.backgroundTemperature)} K`;
    }
  }

  function render() {
    const state = stateFromForm();
    const data = model(state);

    updateOutputs(state);
    updateReadouts(data, state);
    updateDiagram(state);
    drawSpectrum(data, state);
    drawDepth(data, state);
  }

  function reset() {
    Object.entries(defaults).forEach(([key, value]) => {
      if (form.elements[key]) {
        form.elements[key].value = value;
      }
    });
    render();
  }

  form.addEventListener("input", render);
  form.addEventListener("change", render);

  const resetButton = document.querySelector("[data-reset-model]");
  if (resetButton) {
    resetButton.addEventListener("click", reset);
  }

  window.addEventListener("resize", render);
  new MutationObserver(render).observe(root, {
    attributeFilter: ["data-theme"],
    attributes: true,
  });

  render();
})();
