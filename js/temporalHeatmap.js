
/**
 * Fatal Roads — Temporal Heatmap
 * CSE 478 | NHTSA FARS 2024
 *
 * Visualization:
 * - Fatal crashes by weekday and hour
 *
 * Features:
 * - 7 × 24 temporal grid
 * - Numeric weekday normalization
 * - Duplicate record aggregation
 * - Color scale and legend
 * - Interactive tooltips
 * - Cell selection
 * - External selection synchronization
 * - Keyboard accessibility
 * - Responsive SVG
 * - Reset controls
 */

export function renderTemporalHeatmap(data, options = {}) {
  // ----------------------------------------
  // 1. Validate inputs
  // ----------------------------------------

  if (typeof d3 === "undefined") {
    throw new Error("D3.js is not loaded.");
  }

  const container = d3.select("#temporal-heatmap");

  if (container.empty()) {
    throw new Error(
      "Temporal heatmap container #temporal-heatmap not found."
    );
  }

  if (!Array.isArray(data)) {
    throw new Error(
      "Temporal heatmap requires an array of records."
    );
  }

  container.selectAll("*").remove();

  const format = d3.format(",");

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  const hours = d3.range(24);

  const dayNames = {
    "1": "Sunday",
    "2": "Monday",
    "3": "Tuesday",
    "4": "Wednesday",
    "5": "Thursday",
    "6": "Friday",
    "7": "Saturday"
  };

  const dayCodes = new Map(
    days.map((day, index) => [day, index + 1])
  );

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

  // ----------------------------------------
  // 2. Normalize and validate data
  // ----------------------------------------

  const validData = data.map(d => {
    const rawDay = String(d.weekday ?? "").trim();

    const weekday = dayNames[rawDay] ||
      days.find(
        day => day.toLowerCase() === rawDay.toLowerCase()
      ) ||
      null;

    return {
      weekday,
      hour: numeric(d.hour),
      crashes: numeric(d.crashes)
    };
  })
  .filter(d =>
    days.includes(d.weekday) &&
    Number.isInteger(d.hour) &&
    d.hour >= 0 &&
    d.hour <= 23 &&
    Number.isFinite(d.crashes) &&
    d.crashes >= 0
  );

  if (!validData.length) {
    container.append("p")
      .attr("class", "chart-error")
      .text("No valid weekday/hour data available.");

    return {
      clearSelection: () => {},
      setSelectedCell: () => {},
      reset: () => {},
      getSelectedCell: () => null
    };
  }

  // ----------------------------------------
  // 3. Aggregate duplicate combinations
  // ----------------------------------------

  const lookup = d3.rollup(
    validData,
    records => d3.sum(records, d => d.crashes),
    d => d.weekday,
    d => d.hour
  );

  const cells = days.flatMap(weekday =>
    hours.map(hour => ({
      weekday,
      weekdayCode: dayCodes.get(weekday),
      hour,
      crashes: lookup.get(weekday)?.get(hour) ?? 0
    }))
  );

  const observedCells = d3.sum(
    [...lookup.values()],
    hourMap => hourMap.size
  );

  if (observedCells < 168) {
    console.warn(
      `[TemporalHeatmap] ${168 - observedCells} ` +
      "weekday/hour combinations are missing."
    );
  }

  // ----------------------------------------
  // 4. Chart dimensions
  // ----------------------------------------

  const width = 850;
  const height = 360;

  const margin = {
    top: 20,
    right: 20,
    bottom: 70,
    left: 85
  };

  const innerWidth =
    width - margin.left - margin.right;

  const innerHeight =
    height - margin.top - margin.bottom;

  // ----------------------------------------
  // 5. Create SVG
  // ----------------------------------------

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr(
      "preserveAspectRatio",
      "xMidYMid meet"
    )
    .attr("role", "img")
    .attr(
      "aria-label",
      "Heatmap of fatal crashes by weekday and hour in 2024."
    );

  const g = svg.append("g")
    .attr(
      "transform",
      `translate(${margin.left},${margin.top})`
    );

  // ----------------------------------------
  // 6. Scales
  // ----------------------------------------

  const x = d3.scaleBand()
    .domain(hours)
    .range([0, innerWidth])
    .padding(0.06);

  const y = d3.scaleBand()
    .domain(days)
    .range([0, innerHeight])
    .padding(0.08);

  const maxCrashes =
    d3.max(cells, d => d.crashes) || 1;

  const color = d3.scaleSequential()
    .domain([0, maxCrashes])
    .interpolator(d3.interpolateReds);

  // ----------------------------------------
  // 7. Heatmap cells
  // ----------------------------------------

  const rects = g
    .selectAll(".heatmap-cell")
    .data(
      cells,
      d => `${d.weekday}-${d.hour}`
    )
    .join("rect")
    .attr("class", "heatmap-cell")
    .attr("x", d => x(d.hour))
    .attr("y", d => y(d.weekday))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("rx", 3)
    .attr("fill", d => color(d.crashes))
    .attr("tabindex", 0)
    .attr("role", "button");

  // ----------------------------------------
  // 8. Axes
  // ----------------------------------------

  g.append("g")
    .attr("class", "heatmap-x-axis")
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
    .attr("transform", "rotate(-35)")
    .style("text-anchor", "end");

  g.append("g")
    .attr("class", "heatmap-y-axis")
    .call(
      d3.axisLeft(y)
        .tickSize(0)
    );

  g.select(".heatmap-y-axis .domain").remove();

  // ----------------------------------------
  // 9. Tooltip
  // ----------------------------------------

  const tooltip = container.append("div")
    .attr("class", "heatmap-tooltip")
    .style("opacity", 0)
    .style("pointer-events", "none");

  function showTooltip(event, d) {
    tooltip.selectAll("*").remove();

    tooltip.append("strong")
      .text(d.weekday);

    tooltip.append("div")
      .text(
        `Hour: ${String(d.hour).padStart(2, "0")}:00`
      );

    tooltip.append("div")
      .text(
        `Fatal crashes: ${format(d.crashes)}`
      );

    tooltip.style("opacity", 1);

    const bounds =
      container.node().getBoundingClientRect();

    const node = tooltip.node();

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

    tooltip
      .style("left", `${left}px`)
      .style("top", `${top}px`);
  }

  function hideTooltip() {
    tooltip.style("opacity", 0);
  }

  // ----------------------------------------
  // 10. Selection state
  // ----------------------------------------

  let selectedCell = null;

  const selectionLabel = container.append("p")
    .attr("class", "heatmap-selection")
    .attr("aria-live", "polite")
    .text(
      "Click a cell to select a weekday and hour."
    );

  function updateSelection() {
    rects
      .classed(
        "selected",
        d =>
          selectedCell !== null &&
          d.weekday === selectedCell.weekday &&
          d.hour === selectedCell.hour
      )
      .attr(
        "aria-pressed",
        d =>
          selectedCell !== null &&
          d.weekday === selectedCell.weekday &&
          d.hour === selectedCell.hour
      )
      .attr("aria-label", d =>
        `${d.weekday}, ` +
        `${String(d.hour).padStart(2, "0")}:00, ` +
        `${format(d.crashes)} fatal crashes`
      );

    selectionLabel.text(
      selectedCell
        ? `Selected: ${selectedCell.weekday}, ` +
          `${String(selectedCell.hour).padStart(2, "0")}:00 — ` +
          `${format(selectedCell.crashes)} fatal crashes`
        : "Click a cell to select a weekday and hour."
    );
  }

  function notifySelection() {
    if (
      typeof options.onCellSelect === "function"
    ) {
      options.onCellSelect(
        selectedCell
          ? { ...selectedCell }
          : null
      );
    }
  }

  function selectCell(d) {
    const same =
      selectedCell !== null &&
      selectedCell.weekday === d.weekday &&
      selectedCell.hour === d.hour;

    selectedCell = same ? null : d;

    updateSelection();
    notifySelection();
  }

  // ----------------------------------------
  // 11. External selection synchronization
  // ----------------------------------------

  function setSelectedCell(weekday, hour) {
    if (
      weekday === null ||
      weekday === undefined ||
      hour === null ||
      hour === undefined
    ) {
      selectedCell = null;
      updateSelection();
      return;
    }

    const rawDay = String(weekday).trim();

    const normalizedDay =
      dayNames[rawDay] ||
      days.find(
        day =>
          day.toLowerCase() === rawDay.toLowerCase()
      );

    const parsedHour = Number(hour);

    selectedCell = cells.find(d =>
      d.weekday === normalizedDay &&
      d.hour === parsedHour
    ) || null;

    // External synchronization does not
    // invoke onCellSelect.
    updateSelection();
  }

  function clearSelection() {
    selectedCell = null;
    updateSelection();
    notifySelection();
  }

  function reset() {
    clearSelection();
  }

  // ----------------------------------------
  // 12. Cell interactions
  // ----------------------------------------

  rects
    .on("mouseenter", showTooltip)
    .on("mousemove", showTooltip)
    .on("mouseleave", hideTooltip)
    .on("click", (event, d) => {
      selectCell(d);
    })
    .on("keydown", (event, d) => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        selectCell(d);
      }
    });

  // ----------------------------------------
  // 13. Color legend
  // ----------------------------------------

  const legend = container.append("div")
    .attr("class", "heatmap-legend");

  legend.append("span")
    .text("Fewer crashes");

  legend.append("div")
    .attr("class", "heatmap-legend-gradient");

  legend.append("span")
    .text("More crashes");

  // ----------------------------------------
  // 14. Clear selection button
  // ----------------------------------------

  container.append("button")
    .attr("type", "button")
    .attr("class", "heatmap-clear-button")
    .text("Clear Time Selection")
    .on("click", clearSelection);

  // ----------------------------------------
  // 15. Initialize
  // ----------------------------------------

  updateSelection();

  console.log(
    "[TemporalHeatmap] Initialized:",
    cells.length,
    "cells"
  );

  // ----------------------------------------
  // 16. Public API
  // ----------------------------------------

  return {
    clearSelection,
    setSelectedCell,
    reset,

    getSelectedCell() {
      return selectedCell
        ? { ...selectedCell }
        : null;
    },

    getDataSummary() {
      return {
        validInputRows: validData.length,
        observedCombinations: observedCells,
        totalCells: cells.length,
        totalCrashes: d3.sum(
          cells,
          d => d.crashes
        )
      };
    }
  };
}
