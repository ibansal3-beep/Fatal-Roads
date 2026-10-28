
/**
 * Fatal Roads — U.S. State Choropleth Map
 * CSE 478 | NHTSA FARS 2024
 *
 * Visualization:
 * - Fatal crashes or fatalities by state
 *
 * Features:
 * - U.S. state choropleth
 * - FIPS state matching
 * - Metric switching
 * - Animated color updates
 * - Interactive tooltips
 * - State selection
 * - External selection synchronization
 * - Keyboard accessibility
 * - Reset controls
 */

const MAP_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

export async function renderStateMap(
  stateData,
  options = {}
) {
  // ----------------------------------------
  // 1. Validate dependencies and containers
  // ----------------------------------------

  if (typeof d3 === "undefined") {
    throw new Error("D3.js is not loaded.");
  }

  if (typeof topojson === "undefined") {
    throw new Error("TopoJSON is not loaded.");
  }

  const container = d3.select("#state-map");
  const metricSelect = d3.select("#map-metric");

  if (container.empty()) {
    throw new Error(
      "State map container #state-map not found."
    );
  }

  if (!Array.isArray(stateData)) {
    throw new Error(
      "State map requires an array of state records."
    );
  }

  container.selectAll("*").remove();

  const onStateSelect =
    typeof options.onStateSelect === "function"
      ? options.onStateSelect
      : () => {};

  const format = d3.format(",");

  // ----------------------------------------
  // 2. Normalize state data
  // ----------------------------------------

  function numeric(value) {
    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    ) {
      return NaN;
    }

    return Number(value);
  }

  const normalizedStates = stateData.map(d => {
    const crashes = numeric(d.crashes);
    const fatalities = numeric(d.fatalities);

    return {
      state_code: numeric(d.state_code),
      state: String(d.state ?? "").trim(),
      crashes,
      fatalities,
      mean_fatalities_per_crash:
        crashes > 0
          ? fatalities / crashes
          : 0
    };
  })
  .filter(d =>
    Number.isInteger(d.state_code) &&
    d.state_code > 0 &&
    d.state.length > 0 &&
    Number.isFinite(d.crashes) &&
    d.crashes >= 0 &&
    Number.isFinite(d.fatalities) &&
    d.fatalities >= 0
  );

  if (!normalizedStates.length) {
    throw new Error(
      "State map has no valid state records."
    );
  }

  const stateLookup = new Map(
    normalizedStates.map(d => [
      d.state_code,
      d
    ])
  );

  if (stateLookup.size !== normalizedStates.length) {
    console.warn(
      "[StateMap] Duplicate state codes detected."
    );
  }

  // ----------------------------------------
  // 3. Load U.S. state boundaries
  // ----------------------------------------

  let topology;

  try {
    topology = await d3.json(MAP_URL);
  } catch (error) {
    throw new Error(
      "Unable to load U.S. state boundaries: " +
      error.message
    );
  }

  if (!topology?.objects?.states) {
    throw new Error(
      "Invalid TopoJSON: states object not found."
    );
  }

  const features = topojson.feature(
    topology,
    topology.objects.states
  ).features;

  // ----------------------------------------
  // 4. Create responsive SVG
  // ----------------------------------------

  const width = 975;
  const height = 610;

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr(
      "preserveAspectRatio",
      "xMidYMid meet"
    )
    .attr("role", "img")
    .attr(
      "aria-label",
      "U.S. fatal traffic crashes by state in 2024."
    );

  const projection = d3.geoAlbersUsa()
    .fitSize(
      [width - 50, height - 40],
      {
        type: "FeatureCollection",
        features
      }
    );

  const path = d3.geoPath(projection);

  const mapLayer = svg.append("g")
    .attr("class", "states-layer");

  // ----------------------------------------
  // 5. Tooltip
  // ----------------------------------------

  const tooltip = container.append("div")
    .attr("class", "map-tooltip")
    .style("opacity", 0)
    .style("pointer-events", "none");

  function updateTooltip(event, feature) {
    const d = stateLookup.get(Number(feature.id));

    if (!d) return;

    tooltip.selectAll("*").remove();

    tooltip.append("strong")
      .text(d.state);

    tooltip.append("div")
      .text(
        `Fatal crashes: ${format(d.crashes)}`
      );

    tooltip.append("div")
      .text(
        `Fatalities: ${format(d.fatalities)}`
      );

    tooltip.append("div")
      .text(
        `Fatalities per crash: ` +
        d.mean_fatalities_per_crash.toFixed(2)
      );

    tooltip.style("opacity", 1);

    const bounds =
      container.node().getBoundingClientRect();

    const node = tooltip.node();

    const left = Math.max(
      8,
      Math.min(
        event.clientX - bounds.left + 15,
        Math.max(
          8,
          bounds.width - node.offsetWidth - 8
        )
      )
    );

    const top = Math.max(
      8,
      Math.min(
        event.clientY - bounds.top + 15,
        Math.max(
          8,
          bounds.height - node.offsetHeight - 8
        )
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
  // 6. State paths
  // ----------------------------------------

  const statePaths = mapLayer
    .selectAll(".state-path")
    .data(features)
    .join("path")
    .attr("class", "state-path")
    .attr("d", path)
    .attr("tabindex", d =>
      stateLookup.has(Number(d.id)) ? 0 : -1
    )
    .attr("role", "button")
    .attr("aria-label", d => {
      const record = stateLookup.get(Number(d.id));

      return record
        ? `Select ${record.state}`
        : "State data unavailable";
    });

  // ----------------------------------------
  // 7. Color scale and legend
  // ----------------------------------------

  const colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateReds);

  const legend = container.append("div")
    .attr("class", "map-legend");

  const legendTitle = legend.append("span")
    .attr("class", "legend-title");

  const legendBar = legend.append("div")
    .attr("class", "legend-gradient");

  const legendLabels = legend.append("div")
    .attr("class", "legend-labels");

  // ----------------------------------------
  // 8. Selection feedback
  // ----------------------------------------

  const selectionInfo = container.append("div")
    .attr("class", "map-selection")
    .attr("aria-live", "polite")
    .text("Click a state to select it.");

  let metric = "crashes";
  let selectedState = null;

  function updateSelection() {
    statePaths
      .classed(
        "selected",
        d =>
          selectedState !== null &&
          Number(d.id) === selectedState
      )
      .classed(
        "dimmed",
        d =>
          selectedState !== null &&
          Number(d.id) !== selectedState
      )
      .attr(
        "aria-pressed",
        d =>
          selectedState !== null &&
          Number(d.id) === selectedState
      );

    const record =
      selectedState === null
        ? null
        : stateLookup.get(selectedState);

    selectionInfo.text(
      record
        ? `Selected: ${record.state} — ` +
          `${format(record.crashes)} fatal crashes, ` +
          `${format(record.fatalities)} fatalities`
        : "Click a state to select it."
    );

    hideTooltip();
  }

  function notifySelection() {
    const record =
      selectedState === null
        ? null
        : stateLookup.get(selectedState);

    onStateSelect(record || null);
  }

  function toggleState(feature) {
    const code = Number(feature.id);

    if (!stateLookup.has(code)) return;

    selectedState =
      selectedState === code
        ? null
        : code;

    updateSelection();
    notifySelection();
  }

  // ----------------------------------------
  // 9. External state synchronization
  // ----------------------------------------

  function setSelectedState(stateCode) {
    if (
      stateCode === null ||
      stateCode === undefined ||
      stateCode === ""
    ) {
      selectedState = null;
    } else {
      const code = Number(stateCode);

      selectedState =
        stateLookup.has(code)
          ? code
          : null;
    }

    // Do not invoke callback here.
    updateSelection();
  }

  function clearSelection() {
    selectedState = null;
    updateSelection();
    notifySelection();
  }

  // ----------------------------------------
  // 10. Metric switching
  // ----------------------------------------

  function updateMetric(
    newMetric,
    animate = true
  ) {
    metric =
      newMetric === "fatalities"
        ? "fatalities"
        : "crashes";

    if (!metricSelect.empty()) {
      metricSelect.property("value", metric);
    }

    const maxValue = d3.max(
      normalizedStates,
      d => d[metric]
    ) || 1;

    colorScale.domain([0, maxValue]);

    statePaths.interrupt();

    statePaths
      .transition()
      .duration(animate ? 600 : 0)
      .attr("fill", feature => {
        const record = stateLookup.get(
          Number(feature.id)
        );

        return record
          ? colorScale(record[metric])
          : "#344256";
      });

    legendTitle.text(
      metric === "crashes"
        ? "Fatal crashes by state"
        : "Fatalities by state"
    );

    const gradientStops = d3.range(0, 101)
      .map(i =>
        colorScale(maxValue * i / 100)
      );

    legendBar.style(
      "background",
      `linear-gradient(to right, ` +
      gradientStops.join(",") +
      `)`
    );

    legendLabels.selectAll("*").remove();

    legendLabels.append("span")
      .text("0");

    legendLabels.append("span")
      .text(format(maxValue));

    svg.attr(
      "aria-label",
      `U.S. map showing ${metric} by state in 2024.`
    );
  }

  // ----------------------------------------
  // 11. Map interactions
  // ----------------------------------------

  statePaths
    .on("mouseenter", function(event, d) {
      if (!stateLookup.has(Number(d.id))) return;

      d3.select(this).classed("hovered", true);
      updateTooltip(event, d);
    })
    .on("mousemove", (event, d) => {
      if (stateLookup.has(Number(d.id))) {
        updateTooltip(event, d);
      }
    })
    .on("mouseleave", function() {
      d3.select(this).classed("hovered", false);
      hideTooltip();
    })
    .on("click", (event, d) => {
      toggleState(d);
    })
    .on("keydown", (event, d) => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        toggleState(d);
      }
    });

  // ----------------------------------------
  // 12. Metric dropdown
  // ----------------------------------------

  if (!metricSelect.empty()) {
    metricSelect.on("change", function() {
      updateMetric(this.value);
    });
  }

  // ----------------------------------------
  // 13. Clear selection button
  // ----------------------------------------

  container.append("button")
    .attr("type", "button")
    .attr("class", "map-reset-button")
    .text("Clear State Selection")
    .on("click", clearSelection);

  // ----------------------------------------
  // 14. Reset function
  // ----------------------------------------

  function reset() {
    selectedState = null;
    updateSelection();
    updateMetric("crashes", false);
    notifySelection();
  }

  // ----------------------------------------
  // 15. Initialize
  // ----------------------------------------

  const initialMetric = metricSelect.empty()
    ? "crashes"
    : metricSelect.property("value");

  updateMetric(initialMetric, false);
  updateSelection();

  console.log(
    "[StateMap] Initialized successfully."
  );

  // ----------------------------------------
  // 16. Public API
  // ----------------------------------------

  return {
    updateMetric,
    clearSelection,
    setSelectedState,
    reset,
    getSelectedState: () => selectedState,
    getMetric: () => metric
  };
}
