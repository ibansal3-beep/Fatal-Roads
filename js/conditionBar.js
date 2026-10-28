
/**
 * Fatal Roads — Categorical Bar Chart
 * CSE 478 | NHTSA FARS 2024
 *
 * Displays fatal crashes grouped by:
 * - Weather
 * - Lighting
 * - Rural / Urban classification
 *
 * Features:
 * - Animated horizontal bars
 * - Category switching
 * - Interactive tooltips
 * - Category selection
 * - External selection synchronization
 * - Responsive SVG
 * - Keyboard accessibility
 * - Reset controls
 */

export function renderConditionBar(datasets, options = {}) {
  const container = d3.select("#condition-bar");
  const selector = d3.select("#condition-type");

  if (container.empty()) {
    throw new Error(
      "Categorical bar chart container #condition-bar not found."
    );
  }

  if (selector.empty()) {
    throw new Error(
      "Category selector #condition-type not found."
    );
  }

  container.selectAll("*").remove();

  // ----------------------------------------
  // 1. Configuration
  // ----------------------------------------

  const width = 760;

  const margin = {
    top: 25,
    right: 55,
    bottom: 65,
    left: 205
  };

  const innerWidth =
    width - margin.left - margin.right;

  const format = d3.format(",");

  const categories = {
    weather: {
      title: "Weather Conditions",
      data: datasets.weather,
      labelFields: [
        "weather",
        "weather_label",
        "condition",
        "category"
      ],
      color: "#f87171"
    },

    lighting: {
      title: "Lighting Conditions",
      data: datasets.lighting,
      labelFields: [
        "lighting",
        "lighting_label",
        "condition",
        "category"
      ],
      color: "#fb923c"
    },

    rural_urban: {
      title: "Rural / Urban Classification",
      data: datasets.ruralUrban,
      labelFields: [
        "rural_urban",
        "rural_urban_label",
        "area",
        "category"
      ],
      color: "#60a5fa"
    }
  };

  // ----------------------------------------
  // 2. Validate input datasets
  // ----------------------------------------

  if (!datasets || typeof datasets !== "object") {
    throw new Error(
      "Categorical bar chart requires a datasets object."
    );
  }

  // ----------------------------------------
  // 3. Data normalization
  // ----------------------------------------

  function firstValue(row, fields) {
    for (const field of fields) {
      const value = row[field];

      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        return value;
      }
    }

    return undefined;
  }

  function normalizeData(type) {
    const config = categories[type];

    if (!Array.isArray(config.data)) {
      throw new Error(
        `Missing or invalid dataset for ${type}.`
      );
    }

    const records = config.data
      .map(row => {
        const rawLabel = firstValue(
          row,
          config.labelFields
        );

        const rawCrashes = firstValue(
          row,
          ["crashes", "fatal_crashes", "count"]
        );

        const rawFatalities = firstValue(
          row,
          ["fatalities", "total_fatalities"]
        );

        return {
          category:
            rawLabel === undefined
              ? "Unknown"
              : String(rawLabel).trim(),

          crashes:
            rawCrashes === undefined
              ? NaN
              : Number(rawCrashes),

          fatalities:
            rawFatalities === undefined
              ? null
              : Number(rawFatalities),

          source: row
        };
      })
      .filter(d =>
        d.category.length > 0 &&
        Number.isFinite(d.crashes) &&
        d.crashes >= 0 &&
        (
          d.fatalities === null ||
          (
            Number.isFinite(d.fatalities) &&
            d.fatalities >= 0
          )
        )
      );

    // Aggregate duplicate category labels.
    const grouped = d3.rollups(
      records,
      values => ({
        crashes: d3.sum(values, d => d.crashes),
        fatalities: values.every(
          d => d.fatalities !== null
        )
          ? d3.sum(values, d => d.fatalities)
          : null
      }),
      d => d.category
    );

    return grouped.map(([category, totals]) => ({
      category,
      crashes: totals.crashes,
      fatalities: totals.fatalities
    }))
    .sort((a, b) =>
      d3.descending(a.crashes, b.crashes)
    );
  }

  // ----------------------------------------
  // 4. Create SVG
  // ----------------------------------------

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} 420`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr(
      "aria-label",
      "Fatal traffic crashes grouped by recorded conditions."
    );

  const g = svg.append("g")
    .attr(
      "transform",
      `translate(${margin.left},${margin.top})`
    );

  const x = d3.scaleLinear()
    .range([0, innerWidth]);

  const y = d3.scaleBand()
    .padding(0.24);

  const grid = g.append("g")
    .attr("class", "condition-grid");

  const xAxis = g.append("g")
    .attr("class", "condition-x-axis");

  const yAxis = g.append("g")
    .attr("class", "condition-y-axis");

  const barsGroup = g.append("g")
    .attr("class", "condition-bars");

  // ----------------------------------------
  // 5. Tooltip and selection feedback
  // ----------------------------------------

  const tooltip = container.append("div")
    .attr("class", "condition-tooltip")
    .style("opacity", 0);

  const selectionLabel = container.append("p")
    .attr("class", "condition-selection")
    .attr("aria-live", "polite")
    .text("Click a bar to select a condition.");

  let activeType = "weather";
  let selectedCondition = null;

  function showTooltip(event, d) {
    const fatalitiesText =
      d.fatalities !== null
        ? `<div>Fatalities:
             <b>${format(d.fatalities)}</b>
           </div>`
        : "";

    tooltip
      .html(`
        <strong>${d.category}</strong>
        <div>
          Fatal crashes:
          <b>${format(d.crashes)}</b>
        </div>
        ${fatalitiesText}
      `)
      .style("opacity", 1);

    const bounds =
      container.node().getBoundingClientRect();

    const node = tooltip.node();

    const left = Math.max(
      8,
      Math.min(
        event.clientX - bounds.left + 12,
        bounds.width - node.offsetWidth - 8
      )
    );

    const top = Math.max(
      8,
      Math.min(
        event.clientY - bounds.top + 12,
        bounds.height - node.offsetHeight - 8
      )
    );

    tooltip
      .style("left", `${left}px`)
      .style("top", `${top}px`);
  }

  function hideTooltip() {
    tooltip.style("opacity", 0);
  }

  function notifySelection() {
    if (
      typeof options.onConditionSelect === "function"
    ) {
      options.onConditionSelect(
        selectedCondition
          ? {
              ...selectedCondition,
              type: activeType
            }
          : null
      );
    }
  }

  function updateSelection() {
    barsGroup.selectAll(".condition-bar")
      .classed(
        "selected",
        d =>
          selectedCondition !== null &&
          d.category === selectedCondition.category
      );

    selectionLabel.text(
      selectedCondition
        ? `Selected: ${selectedCondition.category} — ` +
          `${format(selectedCondition.crashes)} fatal crashes`
        : "Click a bar to select a condition."
    );
  }

  function selectCondition(d) {
    selectedCondition =
      selectedCondition?.category === d.category
        ? null
        : d;

    updateSelection();
    notifySelection();
  }

  // ----------------------------------------
  // 6. Render or update chart
  // ----------------------------------------

  function updateType(type, animate = true) {
    activeType = categories[type]
      ? type
      : "weather";

    selectedCondition = null;

    selector.property("value", activeType);

    const config = categories[activeType];
    const data = normalizeData(activeType);

    // Dynamic chart height.
    const rowHeight = 42;

    const innerHeight = Math.max(
      260,
      data.length * rowHeight
    );

    const height =
      innerHeight + margin.top + margin.bottom;

    svg.attr(
      "viewBox",
      `0 0 ${width} ${height}`
    );

    y.range([0, innerHeight]);
    y.domain(data.map(d => d.category));

    xAxis.attr(
      "transform",
      `translate(0,${innerHeight})`
    );

    if (!data.length) {
      barsGroup.selectAll("*").remove();
      grid.selectAll("*").remove();
      xAxis.selectAll("*").remove();
      yAxis.selectAll("*").remove();

      selectionLabel.text(
        `No valid ${activeType} records found. ` +
        "Check the dataset columns."
      );

      return;
    }

    const maxValue =
      d3.max(data, d => d.crashes) || 1;

    x.domain([0, maxValue * 1.12]).nice();

    const duration = animate ? 600 : 0;

    // Stop previous transitions before
    // switching to a new category.
    barsGroup.selectAll(".condition-bar")
      .interrupt();

    const transition = d3.transition()
      .duration(duration);

    // X-axis
    xAxis.transition(transition)
      .call(
        d3.axisBottom(x)
          .ticks(5)
          .tickFormat(format)
      );

    // Y-axis
    yAxis.transition(transition)
      .call(
        d3.axisLeft(y)
          .tickSize(0)
      );

    // Vertical gridlines
    grid.transition(transition)
      .call(
        d3.axisBottom(x)
          .ticks(5)
          .tickSize(innerHeight)
          .tickFormat("")
      )
      .attr(
        "transform",
        `translate(0,0)`
      );

    // Bars
    barsGroup
      .selectAll(".condition-bar")
      .data(data, d => d.category)
      .join(
        enter => enter.append("rect")
          .attr("class", "condition-bar")
          .attr("x", 0)
          .attr("y", d => y(d.category))
          .attr("width", 0)
          .attr("height", y.bandwidth())
          .attr("rx", 4),

        update => update,

        exit => exit
          .transition()
          .duration(duration)
          .attr("width", 0)
          .remove()
      )
      .attr("fill", config.color)
      .on("mouseenter", showTooltip)
      .on("mousemove", showTooltip)
      .on("mouseleave", hideTooltip)
      .on("click", (event, d) => {
        selectCondition(d);
      })
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr(
        "aria-label",
        d =>
          `${d.category}: ` +
          `${format(d.crashes)} fatal crashes`
      )
      .on("keydown", (event, d) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          selectCondition(d);
        }
      })
      .transition(transition)
      .attr("y", d => y(d.category))
      .attr("width", d => x(d.crashes))
      .attr("height", y.bandwidth());

    updateSelection();

    svg.attr(
      "aria-label",
      `${config.title}: fatal crash counts in 2024.`
    );
  }

  // ----------------------------------------
  // 7. External selection synchronization
  // ----------------------------------------

  function setSelectedCondition(category, type = activeType) {
    if (type !== activeType) {
      updateType(type, false);
    }

    if (
      category === null ||
      category === undefined ||
      category === ""
    ) {
      selectedCondition = null;
    } else {
      const data = normalizeData(activeType);

      selectedCondition =
        data.find(
          d => d.category === String(category)
        ) || null;
    }

    updateSelection();
  }

  function clearSelection() {
    selectedCondition = null;
    updateSelection();
    notifySelection();
  }

  function reset() {
    updateType("weather", false);
    notifySelection();
  }

  // ----------------------------------------
  // 8. Dropdown interaction
  // ----------------------------------------

  selector.on("change", function() {
    updateType(this.value);
    notifySelection();
  });

  // ----------------------------------------
  // 9. Clear selection button
  // ----------------------------------------

  container.append("button")
    .attr("class", "condition-clear-button")
    .attr("type", "button")
    .text("Clear Condition Selection")
    .on("click", clearSelection);

  // ----------------------------------------
  // 10. Initialize
  // ----------------------------------------

  updateType(
    selector.property("value") || "weather",
    false
  );

  // ----------------------------------------
  // 11. Public API
  // ----------------------------------------

  return {
    updateType,
    clearSelection,
    setSelectedCondition,
    reset,
    getSelectedCondition: () => selectedCondition,
    getActiveType: () => activeType
  };
}
