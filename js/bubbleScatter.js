
/**
 * Fatal Roads — Bubble Scatterplot
 * CSE 478 | NHTSA FARS 2024
 *
 * X-axis: Fatal crashes
 * Y-axis: Fatalities
 * Bubble size: Mean fatalities per crash
 * Bubble color: Mean fatalities per crash
 *
 * Features:
 * - Responsive SVG
 * - Animated bubble entrance
 * - Interactive tooltips
 * - State selection
 * - External state synchronization
 * - Zoom and pan
 * - Keyboard accessibility
 * - Reset controls
 */

export function renderBubbleScatter(data, options = {}) {
  const container = d3.select("#bubble-scatter");

  if (container.empty()) {
    throw new Error(
      "Bubble scatterplot container #bubble-scatter not found."
    );
  }

  container.selectAll("*").remove();

  // ----------------------------------------
  // 1. Configuration
  // ----------------------------------------

  const width = 760;
  const height = 470;

  const margin = {
    top: 30,
    right: 40,
    bottom: 75,
    left: 85
  };

  const innerWidth =
    width - margin.left - margin.right;

  const innerHeight =
    height - margin.top - margin.bottom;

  const format = d3.format(",");
  const formatMean = d3.format(".2f");

  // ----------------------------------------
  // 2. Validate and normalize data
  // ----------------------------------------

  if (!Array.isArray(data)) {
    throw new Error(
      "Bubble scatterplot requires an array of state records."
    );
  }

  const states = data.map(d => {
    const crashes = Number(d.crashes);
    const fatalities = Number(d.fatalities);

    const providedMean =
      d.mean_fatalities_per_crash;

    const mean =
      providedMean !== undefined &&
      providedMean !== null &&
      String(providedMean).trim() !== ""
        ? Number(providedMean)
        : crashes > 0
          ? fatalities / crashes
          : NaN;

    return {
      state_code: Number(d.state_code),
      state: String(d.state ?? "").trim(),
      crashes,
      fatalities,
      mean
    };
  })
  .filter(d =>
    Number.isInteger(d.state_code) &&
    d.state_code > 0 &&
    d.state.length > 0 &&
    Number.isFinite(d.crashes) &&
    Number.isFinite(d.fatalities) &&
    Number.isFinite(d.mean) &&
    d.crashes > 0 &&
    d.fatalities >= 0 &&
    d.mean >= 0
  );

  // Prevent duplicate state records.
  const uniqueStates = Array.from(
    d3.group(states, d => d.state_code),
    ([, records]) => records[0]
  );

  if (uniqueStates.length === 0) {
    container.append("p")
      .attr("class", "chart-error")
      .text(
        "No valid state data available for the bubble scatterplot."
      );

    return {
      clearSelection: () => {},
      resetZoom: () => {},
      setSelectedState: () => {},
      getSelectedState: () => null
    };
  }

  // ----------------------------------------
  // 3. Create responsive SVG
  // ----------------------------------------

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr(
      "aria-label",
      "Scatterplot of U.S. fatal crashes and fatalities by state in 2024."
    );

  const clipId =
    `bubble-clip-${Math.random().toString(36).slice(2, 10)}`;

  svg.append("defs")
    .append("clipPath")
    .attr("id", clipId)
    .append("rect")
    .attr("width", innerWidth)
    .attr("height", innerHeight);

  const g = svg.append("g")
    .attr(
      "transform",
      `translate(${margin.left},${margin.top})`
    );

  // ----------------------------------------
  // 4. Define scales
  // ----------------------------------------

  const maxCrashes =
    d3.max(uniqueStates, d => d.crashes) || 1;

  const maxFatalities =
    d3.max(uniqueStates, d => d.fatalities) || 1;

  const meanExtent =
    d3.extent(uniqueStates, d => d.mean);

  const x = d3.scaleLinear()
    .domain([0, maxCrashes * 1.1])
    .nice()
    .range([0, innerWidth]);

  const y = d3.scaleLinear()
    .domain([0, maxFatalities * 1.1])
    .nice()
    .range([innerHeight, 0]);

  const equalMeans =
    meanExtent[0] === meanExtent[1];

  const radius = equalMeans
    ? () => 10
    : d3.scaleSqrt()
        .domain(meanExtent)
        .range([6, 19]);

  const color = equalMeans
    ? () => "#f87171"
    : d3.scaleSequential()
        .domain(meanExtent)
        .interpolator(d3.interpolateReds);

  // ----------------------------------------
  // 5. Create axes and grid
  // ----------------------------------------

  const grid = g.append("g")
    .attr("class", "bubble-grid");

  const xAxis = g.append("g")
    .attr("class", "bubble-x-axis")
    .attr(
      "transform",
      `translate(0,${innerHeight})`
    );

  const yAxis = g.append("g")
    .attr("class", "bubble-y-axis");

  function updateAxes(transform = d3.zoomIdentity) {
    const zoomedX = transform.rescaleX(x);
    const zoomedY = transform.rescaleY(y);

    xAxis.call(
      d3.axisBottom(zoomedX)
        .ticks(6)
        .tickFormat(format)
    );

    yAxis.call(
      d3.axisLeft(zoomedY)
        .ticks(6)
        .tickFormat(format)
    );

    grid.call(
      d3.axisLeft(zoomedY)
        .ticks(6)
        .tickSize(-innerWidth)
        .tickFormat("")
    );

    grid.select(".domain").remove();
  }

  updateAxes();

  // ----------------------------------------
  // 6. Axis labels
  // ----------------------------------------

  g.append("text")
    .attr("class", "bubble-axis-label")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 58)
    .attr("text-anchor", "middle")
    .text("Fatal Crashes");

  g.append("text")
    .attr("class", "bubble-axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -65)
    .attr("text-anchor", "middle")
    .text("Total Fatalities");

  // ----------------------------------------
  // 7. Plot area and zoom surface
  // ----------------------------------------

  const plot = g.append("g")
    .attr("class", "bubble-plot");

  const zoomSurface = plot.append("rect")
    .attr("class", "bubble-zoom-surface")
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .attr("fill", "transparent")
    .style("cursor", "grab");

  const clippedPlot = plot.append("g")
    .attr("clip-path", `url(#${clipId})`);

  const bubblesGroup = clippedPlot.append("g")
    .attr("class", "bubble-points-group");

  // ----------------------------------------
  // 8. Tooltip
  // ----------------------------------------

  const tooltip = container.append("div")
    .attr("class", "bubble-tooltip")
    .style("opacity", 0);

  function showTooltip(event, d) {
    tooltip
      .html(`
        <strong>${d.state}</strong>
        <div>
          Fatal crashes:
          <b>${format(d.crashes)}</b>
        </div>
        <div>
          Fatalities:
          <b>${format(d.fatalities)}</b>
        </div>
        <div>
          Fatalities per crash:
          <b>${formatMean(d.mean)}</b>
        </div>
      `)
      .style("opacity", 1);

    const bounds =
      container.node().getBoundingClientRect();

    const tooltipNode = tooltip.node();

    const left = Math.max(
      8,
      Math.min(
        event.clientX - bounds.left + 12,
        bounds.width - tooltipNode.offsetWidth - 8
      )
    );

    const top = Math.max(
      8,
      Math.min(
        event.clientY - bounds.top + 12,
        bounds.height - tooltipNode.offsetHeight - 8
      )
    );

    tooltip
      .style("left", `${left}px`)
      .style("top", `${top}px`);
  }

  function hideTooltip() {
    tooltip.style("opacity", 0);
  }

  // ----------------------------------------
  // 9. State selection
  // ----------------------------------------

  let selectedState = null;

  const selectionLabel = container.append("p")
    .attr("class", "bubble-selection")
    .attr("aria-live", "polite")
    .text("Click a bubble to select a state.");

  function updateSelection() {
    bubbles
      .classed(
        "selected",
        d =>
          selectedState !== null &&
          d.state_code === selectedState.state_code
      )
      .classed(
        "dimmed",
        d =>
          selectedState !== null &&
          d.state_code !== selectedState.state_code
      );

    selectionLabel.text(
      selectedState
        ? `Selected: ${selectedState.state} — ` +
          `${format(selectedState.crashes)} fatal crashes`
        : "Click a bubble to select a state."
    );
  }

  function notifySelection() {
    if (typeof options.onStateSelect === "function") {
      options.onStateSelect(selectedState);
    }
  }

  function selectState(d) {
    selectedState =
      selectedState?.state_code === d.state_code
        ? null
        : d;

    updateSelection();
    notifySelection();
  }

  // Set state from another visualization.
  // Does not notify the callback to avoid loops.
  function setSelectedState(stateCode) {
    if (stateCode === null ||
        stateCode === undefined ||
        stateCode === "") {
      selectedState = null;
    } else {
      const code = Number(stateCode);

      selectedState =
        uniqueStates.find(
          d => d.state_code === code
        ) || null;
    }

    updateSelection();
  }

  function clearSelection() {
    selectedState = null;
    updateSelection();
    notifySelection();
  }

  // ----------------------------------------
  // 10. Draw bubbles
  // ----------------------------------------

  const bubbles = bubblesGroup
    .selectAll(".bubble-point")
    .data(uniqueStates, d => d.state_code)
    .join("circle")
    .attr("class", "bubble-point")
    .attr("cx", d => x(d.crashes))
    .attr("cy", d => y(d.fatalities))
    .attr("r", 0)
    .attr("fill", d => color(d.mean))
    .attr("fill-opacity", 0.78)
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 1.2)
    .attr("tabindex", 0)
    .attr("role", "button")
    .attr(
      "aria-label",
      d =>
        `${d.state}: ` +
        `${format(d.crashes)} fatal crashes, ` +
        `${format(d.fatalities)} fatalities`
    );

  bubbles
    .on("mouseenter", showTooltip)
    .on("mousemove", showTooltip)
    .on("mouseleave", hideTooltip)
    .on("click", (event, d) => {
      event.stopPropagation();
      selectState(d);
    })
    .on("keydown", (event, d) => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        selectState(d);
      }
    });

  bubbles.transition()
    .duration(850)
    .delay((d, i) => i * 12)
    .attr("r", d => radius(d.mean));

  // ----------------------------------------
  // 11. Zoom and pan
  // ----------------------------------------

  const zoom = d3.zoom()
    .scaleExtent([1, 6])
    .translateExtent([
      [0, 0],
      [innerWidth, innerHeight]
    ])
    .extent([
      [0, 0],
      [innerWidth, innerHeight]
    ])
    .filter(event => {
      // Allow wheel zoom and primary-button dragging.
      return (
        !event.ctrlKey &&
        (
          event.type === "wheel" ||
          event.type === "touchstart" ||
          event.button === 0
        )
      );
    })
    .on("zoom", event => {
      bubblesGroup.attr(
        "transform",
        event.transform
      );

      updateAxes(event.transform);
    });

  zoomSurface.call(zoom);

  // Wheel zoom should work over the plotted bubbles.
  // Dragging over an individual bubble is intentionally
  // reserved for state selection.
  bubbles.on("wheel.zoom", function(event) {
    event.preventDefault();

    const current = d3.zoomTransform(
      zoomSurface.node()
    );

    const factor =
      Math.pow(2, -event.deltaY * 0.002);

    zoomSurface.call(
      zoom.scaleTo,
      Math.max(
        1,
        Math.min(6, current.k * factor)
      )
    );
  });

  function resetZoom() {
    zoomSurface.transition()
      .duration(550)
      .call(
        zoom.transform,
        d3.zoomIdentity
      );
  }

  // ----------------------------------------
  // 12. Control buttons
  // ----------------------------------------

  const controls = container.append("div")
    .attr("class", "bubble-controls");

  controls.append("button")
    .attr("type", "button")
    .text("Reset Zoom")
    .on("click", resetZoom);

  controls.append("button")
    .attr("type", "button")
    .text("Clear State Selection")
    .on("click", clearSelection);

  // ----------------------------------------
  // 13. Initialize selection
  // ----------------------------------------

  updateSelection();

  // ----------------------------------------
  // 14. Public API
  // ----------------------------------------

  return {
    clearSelection,
    resetZoom,
    setSelectedState,
    getSelectedState: () => selectedState,
    getData: () => uniqueStates
  };
}
