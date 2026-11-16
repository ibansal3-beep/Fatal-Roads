
/**
 * Fatal Roads — Monthly Trend
 * CSE 478 | NHTSA FARS 2024
 *
 * Visualization:
 * - Monthly fatal crash and fatality trends
 *
 * Features:
 * - Crashes / fatalities metric switching
 * - Animated line and area chart
 * - Interactive tooltips
 * - Month selection
 * - External selection synchronization
 * - Responsive SVG
 * - Keyboard accessibility
 * - Reset controls
 */

export function renderMonthlyTrend(data, options = {}) {
  // ----------------------------------------
  // 1. Validate container and input
  // ----------------------------------------

  const container = d3.select("#monthly-trend");
  const metricSelect = d3.select("#monthly-metric");

  if (container.empty()) {
    throw new Error(
      "Monthly trend container #monthly-trend not found."
    );
  }

  if (!Array.isArray(data)) {
    throw new Error(
      "Monthly trend requires an array of records."
    );
  }

  container.selectAll("*").remove();

  const monthNames = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December"
  ];

  const format = d3.format(",");

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
  // 2. Normalize monthly data
  // ----------------------------------------

  const validRecords = data.map(d => ({
    month: numeric(d.month),
    crashes: numeric(d.crashes),
    fatalities: numeric(d.fatalities)
  }))
  .filter(d =>
    Number.isInteger(d.month) &&
    d.month >= 1 &&
    d.month <= 12 &&
    Number.isFinite(d.crashes) &&
    d.crashes >= 0 &&
    Number.isFinite(d.fatalities) &&
    d.fatalities >= 0
  );

  const monthlyMap = d3.rollup(
    validRecords,
    rows => ({
      crashes: d3.sum(rows, d => d.crashes),
      fatalities: d3.sum(rows, d => d.fatalities)
    }),
    d => d.month
  );

  // Always preserve January through December.
  const monthlyData = d3.range(1, 13).map(month => {
    const record = monthlyMap.get(month);

    return {
      month,
      crashes: record?.crashes ?? null,
      fatalities: record?.fatalities ?? null
    };
  });

  if (!validRecords.length) {
    container.append("p")
      .attr("class", "chart-error")
      .text("No valid monthly data available.");

    return {
      updateMetric: () => {},
      clearSelection: () => {},
      setSelectedMonth: () => {},
      reset: () => {},
      getSelectedMonth: () => null
    };
  }

  // ----------------------------------------
  // 3. Chart dimensions
  // ----------------------------------------

  const width = 720;
  const height = 410;

  const margin = {
    top: 30,
    right: 30,
    bottom: 75,
    left: 80
  };

  const innerWidth =
    width - margin.left - margin.right;

  const innerHeight =
    height - margin.top - margin.bottom;

  // ----------------------------------------
  // 4. Create SVG
  // ----------------------------------------

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr(
      "aria-label",
      "Monthly U.S. fatal crashes and fatalities in 2024."
    );

  const gradientId =
    `monthly-gradient-${Math.random().toString(36).slice(2, 10)}`;

  const defs = svg.append("defs");

  const gradient = defs.append("linearGradient")
    .attr("id", gradientId)
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");

  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#f87171")
    .attr("stop-opacity", 0.35);

  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#f87171")
    .attr("stop-opacity", 0.02);

  const g = svg.append("g")
    .attr(
      "transform",
      `translate(${margin.left},${margin.top})`
    );

  // ----------------------------------------
  // 5. Scales and axes
  // ----------------------------------------

  const x = d3.scaleLinear()
    .domain([1, 12])
    .range([0, innerWidth]);

  const y = d3.scaleLinear()
    .range([innerHeight, 0]);

  const grid = g.append("g")
    .attr("class", "monthly-grid");

  const xAxis = g.append("g")
    .attr("class", "monthly-x-axis")
    .attr(
      "transform",
      `translate(0,${innerHeight})`
    );

  const yAxis = g.append("g")
    .attr("class", "monthly-y-axis");

  xAxis.call(
    d3.axisBottom(x)
      .tickValues(d3.range(1, 13))
      .tickFormat(d =>
        monthNames[d - 1].slice(0, 3)
      )
  );

  // ----------------------------------------
  // 6. Line and area generators
  // ----------------------------------------

  const line = d3.line()
    .defined(d => d.value !== null)
    .x(d => x(d.month))
    .y(d => y(d.value))
    .curve(d3.curveMonotoneX);

  const area = d3.area()
    .defined(d => d.value !== null)
    .x(d => x(d.month))
    .y0(innerHeight)
    .y1(d => y(d.value))
    .curve(d3.curveMonotoneX);

  const areaPath = g.append("path")
    .attr("class", "monthly-area")
    .attr("fill", `url(#${gradientId})`);

  const linePath = g.append("path")
    .attr("class", "monthly-line")
    .attr("fill", "none")
    .attr("stroke", "#f87171")
    .attr("stroke-width", 3);

  const pointsGroup = g.append("g")
    .attr("class", "monthly-points");

  // ----------------------------------------
  // 7. Tooltip and selection feedback
  // ----------------------------------------

  const tooltip = container.append("div")
    .attr("class", "monthly-tooltip")
    .style("opacity", 0);

  const selectionLabel = container.append("p")
    .attr("class", "monthly-selection")
    .attr("aria-live", "polite")
    .text("Click a month to select it.");

  let metric = "crashes";
  let selectedMonth = null;

  function showTooltip(event, d) {
    tooltip
      .html(`
        <strong>${monthNames[d.month - 1]} 2024</strong>
        <div>
          Fatal crashes:
          <b>${format(d.crashes)}</b>
        </div>
        <div>
          Fatalities:
          <b>${format(d.fatalities)}</b>
        </div>
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

  // ----------------------------------------
  // 8. Month selection
  // ----------------------------------------

  function updateSelection() {
    pointsGroup.selectAll(".monthly-point")
      .classed(
        "selected",
        d => d.month === selectedMonth
      )
      .attr(
        "aria-pressed",
        d => d.month === selectedMonth
      );

    selectionLabel.text(
      selectedMonth === null
        ? "Click a month to select it."
        : `Selected: ${monthNames[selectedMonth - 1]} 2024`
    );
  }

  function notifySelection() {
    if (
      typeof options.onMonthSelect === "function"
    ) {
      const record = monthlyData.find(
        d => d.month === selectedMonth
      );

      options.onMonthSelect(
        selectedMonth === null
          ? null
          : record
      );
    }
  }

  function selectMonth(d) {
    selectedMonth =
      selectedMonth === d.month
        ? null
        : d.month;

    updateSelection();
    notifySelection();
  }

  function setSelectedMonth(month) {
    if (
      month === null ||
      month === undefined ||
      month === ""
    ) {
      selectedMonth = null;
    } else {
      const parsed = Number(month);

      selectedMonth =
        Number.isInteger(parsed) &&
        monthlyMap.has(parsed)
          ? parsed
          : null;
    }

    updateSelection();
  }

  function clearSelection() {
    selectedMonth = null;
    updateSelection();
    notifySelection();
  }

  // ----------------------------------------
  // 9. Metric switching and rendering
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

    const chartData = monthlyData.map(d => ({
      ...d,
      value: d[metric]
    }));

    const maxValue = d3.max(
      chartData,
      d => d.value
    ) || 1;

    y.domain([0, maxValue * 1.12]).nice();

    const duration = animate ? 650 : 0;

    // Interrupt any unfinished animations.
    areaPath.interrupt();
    linePath.interrupt();
    pointsGroup.selectAll(".monthly-point")
      .interrupt();

    const transition = d3.transition()
      .duration(duration);

    yAxis.transition(transition)
      .call(
        d3.axisLeft(y)
          .ticks(6)
          .tickFormat(format)
      );

    grid.transition(transition)
      .call(
        d3.axisLeft(y)
          .ticks(6)
          .tickSize(-innerWidth)
          .tickFormat("")
      );

    grid.select(".domain").remove();

    areaPath
      .datum(chartData)
      .transition(transition)
      .attr("d", area);

    linePath
      .datum(chartData)
      .transition(transition)
      .attr("d", line);

    pointsGroup
      .selectAll(".monthly-point")
      .data(
        chartData.filter(d => d.value !== null),
        d => d.month
      )
      .join(
        enter => enter.append("circle")
          .attr("class", "monthly-point")
          .attr("cx", d => x(d.month))
          .attr("cy", innerHeight)
          .attr("r", 5)
          .attr("fill", "#f87171")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 1.5),

        update => update,

        exit => exit.remove()
      )
      .on("mouseenter", showTooltip)
      .on("mousemove", showTooltip)
      .on("mouseleave", hideTooltip)
      .on("click", (event, d) => {
        selectMonth(d);
      })
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", d =>
        `${monthNames[d.month - 1]}: ` +
        `${format(d.value)} ${metric}`
      )
      .on("keydown", (event, d) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          selectMonth(d);
        }
      })
      .transition(transition)
      .attr("cx", d => x(d.month))
      .attr("cy", d => y(d.value));

    updateSelection();

    svg.attr(
      "aria-label",
      `Monthly U.S. ${metric} in 2024.`
    );
  }

  // ----------------------------------------
  // 10. Dropdown interaction
  // ----------------------------------------

  if (!metricSelect.empty()) {
    metricSelect.on("change", function() {
      updateMetric(this.value);
    });
  }

  // ----------------------------------------
  // 11. Clear selection button
  // ----------------------------------------

  container.append("button")
    .attr("class", "monthly-clear-button")
    .attr("type", "button")
    .text("Clear Month Selection")
    .on("click", clearSelection);

  // ----------------------------------------
  // 12. Reset function
  // ----------------------------------------

  function reset() {
    selectedMonth = null;
    updateMetric("crashes", false);
    updateSelection();
    notifySelection();
  }

  // ----------------------------------------
  // 13. Initialize
  // ----------------------------------------

  const initialMetric = metricSelect.empty()
    ? "crashes"
    : metricSelect.property("value");

  updateMetric(initialMetric, false);

  // ----------------------------------------
  // 14. Public API
  // ----------------------------------------

  return {
    updateMetric,
    clearSelection,
    setSelectedMonth,
    reset,
    getSelectedMonth: () => selectedMonth,
    getMetric: () => metric
  };
}
