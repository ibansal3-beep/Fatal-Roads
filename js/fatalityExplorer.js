
/**
 * Fatal Roads — Coordinated Fatality Explorer
 * CSE 478 | NHTSA FARS 2024
 *
 * Coordinated views:
 * 1. Geographic crash-point map
 * 2. Weekday × hour heatmap
 *
 * Interactions:
 * - State -> heatmap filtering
 * - Heatmap -> map filtering
 * - Combined state and time filtering
 * - State dropdown synchronization
 * - Selection feedback
 * - Reset filters
 * - External state/time selection API
 */

const ATLAS_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

export async function renderFatalityExplorer(
  rawData,
  options = {}
) {
  // ----------------------------------------
  // 1. Validate containers and dependencies
  // ----------------------------------------

  const mapContainer = d3.select("#explorer-map");
  const heatContainer = d3.select("#explorer-heatmap");
  const stateSelect = d3.select("#explorer-state");
  const feedback = d3.select("#explorer-feedback");

  const required = [
    [mapContainer, "#explorer-map"],
    [heatContainer, "#explorer-heatmap"],
    [stateSelect, "#explorer-state"],
    [feedback, "#explorer-feedback"]
  ];

  for (const [selection, selector] of required) {
    if (selection.empty()) {
      throw new Error(
        `Fatality Explorer: ${selector} not found.`
      );
    }
  }

  if (typeof d3 === "undefined") {
    throw new Error("D3.js is not loaded.");
  }

  if (typeof topojson === "undefined") {
    throw new Error("TopoJSON is not loaded.");
  }

  if (!Array.isArray(rawData) || !rawData.length) {
    throw new Error(
      "Fatality Explorer requires crash records."
    );
  }

  mapContainer.selectAll("*").remove();
  heatContainer.selectAll("*").remove();

  const format = d3.format(",");

  // ----------------------------------------
  // 2. Normalize crash records
  // ----------------------------------------

  function toNumber(value) {
    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    ) {
      return NaN;
    }

    const result = Number(value);

    return Number.isFinite(result)
      ? result
      : NaN;
  }

  const crashes = rawData.map((d, index) => ({
    key: index,
    id: String(d.st_case ?? index),
    stateCode: toNumber(d.state_code),
    state: String(d.state ?? "Unknown"),
    weekday: toNumber(d.weekday),
    hour: toNumber(d.hour),
    latitude: toNumber(d.latitude),
    longitude: toNumber(d.longitude),
    fatalities: toNumber(d.fatalities)
  }))
  .filter(d =>
    Number.isInteger(d.stateCode) &&
    d.stateCode > 0 &&
    Number.isInteger(d.weekday) &&
    d.weekday >= 1 &&
    d.weekday <= 7 &&
    Number.isInteger(d.hour) &&
    d.hour >= 0 &&
    d.hour <= 23 &&
    Number.isFinite(d.latitude) &&
    Number.isFinite(d.longitude) &&
    d.latitude >= -90 &&
    d.latitude <= 90 &&
    d.longitude >= -180 &&
    d.longitude <= 180 &&
    Number.isFinite(d.fatalities) &&
    d.fatalities >= 0
  );

  if (!crashes.length) {
    throw new Error(
      "Fatality Explorer: no valid crash records."
    );
  }

  console.log(
    "[Explorer] Valid crash records:",
    crashes.length
  );

  // ----------------------------------------
  // 3. Selection state and data indexes
  // ----------------------------------------

  let selectedState = null;
  let selectedTime = null;

  const stateNames = new Map(
    crashes.map(d => [d.stateCode, d.state])
  );

  const byState = d3.group(
    crashes,
    d => d.stateCode
  );

  const stateOptions = [...stateNames.entries()]
    .sort((a, b) =>
      a[1].localeCompare(b[1])
    );

  stateSelect.selectAll("option").remove();

  stateSelect.append("option")
    .attr("value", "")
    .text("All States + D.C.");

  stateSelect.selectAll(".state-option")
    .data(stateOptions)
    .join("option")
    .attr("class", "state-option")
    .attr("value", d => d[0])
    .text(d => d[1]);

  function getStateRecords() {
    return selectedState === null
      ? crashes
      : byState.get(selectedState) || [];
  }

  function matchesTime(d) {
    return selectedTime === null ||
      (
        d.weekday === selectedTime.weekday &&
        d.hour === selectedTime.hour
      );
  }

  // ----------------------------------------
  // 4. Load U.S. geographic boundaries
  // ----------------------------------------

  let topology;

  try {
    topology = await d3.json(ATLAS_URL);
  } catch (error) {
    throw new Error(
      "Unable to load U.S. state boundaries: " +
      error.message
    );
  }

  if (!topology?.objects?.states) {
    throw new Error(
      "Invalid U.S. Atlas TopoJSON structure."
    );
  }

  const features = topojson.feature(
    topology,
    topology.objects.states
  ).features;

  // ----------------------------------------
  // 5. Create geographic map
  // ----------------------------------------

  const mapWidth = 720;
  const mapHeight = 450;

  const projection = d3.geoAlbersUsa()
    .fitSize(
      [mapWidth - 24, mapHeight - 24],
      {
        type: "FeatureCollection",
        features
      }
    );

  const path = d3.geoPath(projection);

  const mapSvg = mapContainer.append("svg")
    .attr(
      "viewBox",
      `0 0 ${mapWidth} ${mapHeight}`
    )
    .attr(
      "preserveAspectRatio",
      "xMidYMid meet"
    )
    .attr("role", "img")
    .attr(
      "aria-label",
      "Interactive U.S. fatal crash-point map."
    );

  const stateLayer = mapSvg.append("g")
    .attr("class", "explorer-state-layer");

  const pointLayer = mapSvg.append("g")
    .attr("class", "explorer-point-layer")
    .style("pointer-events", "none");

  const statePaths = stateLayer
    .selectAll("path")
    .data(features)
    .join("path")
    .attr("class", "explorer-state-path")
    .attr("d", path)
    .attr("tabindex", d =>
      stateNames.has(Number(d.id)) ? 0 : -1
    )
    .attr("role", "button")
    .attr("aria-label", d => {
      const name = stateNames.get(Number(d.id));

      return name
        ? `Select ${name}`
        : "State unavailable";
    });

  // Project coordinates once.
  const projected = crashes.map(d => ({
    ...d,
    point: projection([
      d.longitude,
      d.latitude
    ])
  }))
  .filter(d => d.point !== null);

  const projectedByState = d3.group(
    projected,
    d => d.stateCode
  );

  const tooltip = mapContainer.append("div")
    .attr("class", "explorer-tooltip")
    .style("opacity", 0)
    .style("pointer-events", "none");

  const points = pointLayer
    .selectAll("circle")
    .data(projected, d => d.key)
    .join("circle")
    .attr("class", "explorer-crash-point")
    .attr("cx", d => d.point[0])
    .attr("cy", d => d.point[1])
    .attr("r", 1.65)
    .attr("fill", "#fb7185")
    .attr("fill-opacity", 0.55);

  // ----------------------------------------
  // 6. Create temporal heatmap
  // ----------------------------------------

  const heatWidth = 760;
  const heatHeight = 340;

  const margin = {
    top: 22,
    right: 15,
    bottom: 65,
    left: 88
  };

  const innerWidth =
    heatWidth - margin.left - margin.right;

  const innerHeight =
    heatHeight - margin.top - margin.bottom;

  const heatSvg = heatContainer.append("svg")
    .attr(
      "viewBox",
      `0 0 ${heatWidth} ${heatHeight}`
    )
    .attr(
      "preserveAspectRatio",
      "xMidYMid meet"
    )
    .attr("role", "img")
    .attr(
      "aria-label",
      "Fatal crashes by weekday and hour."
    );

  const g = heatSvg.append("g")
    .attr(
      "transform",
      `translate(${margin.left},${margin.top})`
    );

  const x = d3.scaleBand()
    .domain(d3.range(24))
    .range([0, innerWidth])
    .padding(0.06);

  const y = d3.scaleBand()
    .domain(d3.range(1, 8))
    .range([0, innerHeight])
    .padding(0.08);

  g.append("g")
    .attr("class", "explorer-axis")
    .attr(
      "transform",
      `translate(0,${innerHeight})`
    )
    .call(
      d3.axisBottom(x)
        .tickValues([
          0, 3, 6, 9, 12, 15, 18, 21
        ])
        .tickFormat(d =>
          `${String(d).padStart(2, "0")}:00`
        )
    )
    .selectAll("text")
    .attr(
      "transform",
      "rotate(-30)"
    )
    .style("text-anchor", "end");

  g.append("g")
    .attr("class", "explorer-axis")
    .call(
      d3.axisLeft(y)
        .tickFormat(d => DAYS[d - 1])
        .tickSize(0)
    );

  const heatTooltip = heatContainer.append("div")
    .attr("class", "explorer-tooltip")
    .style("opacity", 0)
    .style("pointer-events", "none");

  const cells = d3.range(1, 8)
    .flatMap(weekday =>
      d3.range(24).map(hour => ({
        weekday,
        hour,
        count: 0
      }))
    );

  const color = d3.scaleSequential()
    .interpolator(d3.interpolateReds);

  const cellRects = g
    .selectAll(".explorer-heat-cell")
    .data(cells)
    .join("rect")
    .attr("class", "explorer-heat-cell")
    .attr("x", d => x(d.hour))
    .attr("y", d => y(d.weekday))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("rx", 2)
    .attr("tabindex", 0)
    .attr("role", "button");

  // ----------------------------------------
  // 7. Tooltip positioning
  // ----------------------------------------

  function positionTooltip(
    parent,
    tip,
    event
  ) {
    const bounds = parent.node()
      .getBoundingClientRect();

    const node = tip.node();

    const left = Math.max(
      8,
      Math.min(
        event.clientX - bounds.left + 12,
        Math.max(
          8,
          bounds.width - node.offsetWidth - 8
        )
      )
    );

    const top = Math.max(
      8,
      Math.min(
        event.clientY - bounds.top + 12,
        Math.max(
          8,
          bounds.height - node.offsetHeight - 8
        )
      )
    );

    tip
      .style("left", `${left}px`)
      .style("top", `${top}px`);
  }

  // ----------------------------------------
  // 8. Update map, heatmap and feedback
  // ----------------------------------------

  function update() {
    const stateRecords = getStateRecords();

    const matchingCrashes = stateRecords
      .filter(matchesTime);

    const statePoints =
      selectedState === null
        ? projected
        : projectedByState.get(selectedState) || [];

    const visiblePoints = statePoints
      .filter(matchesTime);

    const visibleKeys = new Set(
      visiblePoints.map(d => d.key)
    );

    // Geographic points respond to both filters.
    points
      .style("display", d =>
        visibleKeys.has(d.key) ? null : "none"
      )
      .attr(
        "r",
        selectedTime === null ? 1.65 : 2.6
      )
      .attr(
        "fill-opacity",
        selectedTime === null ? 0.55 : 0.9
      );

    // Highlight selected state.
    statePaths
      .classed(
        "selected",
        d =>
          selectedState === Number(d.id)
      )
      .classed(
        "dimmed",
        d =>
          selectedState !== null &&
          selectedState !== Number(d.id)
      )
      .attr("aria-pressed", d =>
        selectedState === Number(d.id)
      );

    // Recalculate heatmap for selected state.
    const counts = d3.rollup(
      stateRecords,
      records => records.length,
      d => `${d.weekday}-${d.hour}`
    );

    const maxCount =
      d3.max([...counts.values()]) || 1;

    color.domain([0, maxCount]);

    cells.forEach(cell => {
      cell.count =
        counts.get(
          `${cell.weekday}-${cell.hour}`
        ) || 0;
    });

    cellRects
      .attr("fill", d => color(d.count))
      .classed(
        "selected",
        d =>
          selectedTime !== null &&
          selectedTime.weekday === d.weekday &&
          selectedTime.hour === d.hour
      )
      .attr("aria-pressed", d =>
        selectedTime !== null &&
        selectedTime.weekday === d.weekday &&
        selectedTime.hour === d.hour
      )
      .attr("aria-label", d =>
        `${DAYS[d.weekday - 1]}, ` +
        `${String(d.hour).padStart(2, "0")}:00, ` +
        `${format(d.count)} fatal crashes`
      );

    // Synchronize dropdown.
    stateSelect.property(
      "value",
      selectedState === null
        ? ""
        : String(selectedState)
    );

    const stateLabel =
      selectedState === null
        ? "All states + D.C."
        : stateNames.get(selectedState);

    const timeLabel =
      selectedTime === null
        ? "All valid hours"
        : `${DAYS[selectedTime.weekday - 1]} ` +
          `${String(selectedTime.hour)
            .padStart(2, "0")}:00–` +
          `${String(selectedTime.hour)
            .padStart(2, "0")}:59`;

    const fatalityCount = d3.sum(
      matchingCrashes,
      d => d.fatalities
    );

    feedback.text(
      `${stateLabel} | ${timeLabel} | ` +
      `${format(matchingCrashes.length)} ` +
      `matching crashes | ` +
      `${format(fatalityCount)} fatalities | ` +
      `${format(visiblePoints.length)} ` +
      `mapped points`
    );

    if (
      typeof options.onFilterChange === "function"
    ) {
      options.onFilterChange({
        stateCode: selectedState,
        time: selectedTime
          ? { ...selectedTime }
          : null,
        crashes: matchingCrashes.length,
        fatalities: fatalityCount,
        mappedPoints: visiblePoints.length
      });
    }
  }

  // ----------------------------------------
  // 9. State selection
  // ----------------------------------------

  function setState(code) {
    if (
      code === null ||
      code === undefined ||
      code === ""
    ) {
      selectedState = null;
    } else {
      const parsed = Number(code);

      selectedState =
        stateNames.has(parsed)
          ? parsed
          : null;
    }

    update();
  }

  function toggleState(code) {
    const parsed = Number(code);

    if (!stateNames.has(parsed)) return;

    selectedState =
      selectedState === parsed
        ? null
        : parsed;

    update();
  }

  statePaths
    .on("click", (event, d) => {
      toggleState(d.id);
    })
    .on("keydown", (event, d) => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        toggleState(d.id);
      }
    });

  stateSelect.on("change", function() {
    setState(this.value);
  });

  // ----------------------------------------
  // 10. Time selection
  // ----------------------------------------

  function setTime(weekday, hour) {
    if (
      weekday === null ||
      weekday === undefined ||
      hour === null ||
      hour === undefined
    ) {
      selectedTime = null;
      update();
      return;
    }

    const day = Number(weekday);
    const selectedHour = Number(hour);

    if (
      !Number.isInteger(day) ||
      day < 1 ||
      day > 7 ||
      !Number.isInteger(selectedHour) ||
      selectedHour < 0 ||
      selectedHour > 23
    ) {
      return;
    }

    selectedTime = {
      weekday: day,
      hour: selectedHour
    };

    update();
  }

  function toggleTime(cell) {
    const same =
      selectedTime !== null &&
      selectedTime.weekday === cell.weekday &&
      selectedTime.hour === cell.hour;

    selectedTime = same
      ? null
      : {
          weekday: cell.weekday,
          hour: cell.hour
        };

    update();
  }

  cellRects
    .on("click", (event, d) => {
      toggleTime(d);
    })
    .on("keydown", (event, d) => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        toggleTime(d);
      }
    });

  // ----------------------------------------
  // 11. Crash-point tooltips
  // ----------------------------------------

  points
    .on("mouseenter mousemove", (event, d) => {
      tooltip.selectAll("*").remove();

      tooltip.append("strong")
        .text(d.state);

      tooltip.append("div")
        .text(
          `${DAYS[d.weekday - 1]}, ` +
          `${String(d.hour).padStart(2, "0")}:00`
        );

      tooltip.append("div")
        .text(
          `Fatalities: ${format(d.fatalities)}`
        );

      tooltip.append("div")
        .text(`Crash ID: ${d.id}`);

      tooltip.style("opacity", 1);

      positionTooltip(
        mapContainer,
        tooltip,
        event
      );
    })
    .on("mouseleave", () => {
      tooltip.style("opacity", 0);
    });

  // ----------------------------------------
  // 12. Heatmap tooltips
  // ----------------------------------------

  cellRects
    .on("mouseenter mousemove", (event, d) => {
      heatTooltip.selectAll("*").remove();

      heatTooltip.append("strong")
        .text(DAYS[d.weekday - 1]);

      heatTooltip.append("div")
        .text(
          `Hour: ${String(d.hour)
            .padStart(2, "0")}:00`
        );

      heatTooltip.append("div")
        .text(
          `Fatal crashes: ${format(d.count)}`
        );

      heatTooltip.style("opacity", 1);

      positionTooltip(
        heatContainer,
        heatTooltip,
        event
      );
    })
    .on("mouseleave", () => {
      heatTooltip.style("opacity", 0);
    });

  // ----------------------------------------
  // 13. Reset filters
  // ----------------------------------------

  function reset() {
    selectedState = null;
    selectedTime = null;

    tooltip.style("opacity", 0);
    heatTooltip.style("opacity", 0);

    update();
  }

  // ----------------------------------------
  // 14. Initialize
  // ----------------------------------------

  update();

  console.log(
    "[Explorer] Initialized successfully."
  );

  // ----------------------------------------
  // 15. Public API
  // ----------------------------------------

  return {
    reset,
    clearSelection: reset,
    setState,
    setTime,

    getFilters() {
      return {
        stateCode: selectedState,
        time: selectedTime
          ? { ...selectedTime }
          : null
      };
    },

    getDataSummary() {
      return {
        rawRecords: rawData.length,
        validRecords: crashes.length,
        mappedPoints: projected.length,
        excludedRecords:
          rawData.length - crashes.length,
        unprojectedRecords:
          crashes.length - projected.length
      };
    }
  };
}
