/**
 * Fatal Roads — Fatality Signature Explorer
 * CSE 478 | NHTSA FARS 2024
 *
 * Custom multidimensional radial visualization.
 *
 * Encodings:
 * - Angle: hour of day (00–23)
 * - Ring: weekday (Monday–Sunday)
 * - Cell color: fatal crash count
 * - Blue inner band: share recorded in darkness
 * - Pink dot: elevated fatalities per crash
 *
 * Requires D3 v7 loaded globally.
 */

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const TWO_PI = Math.PI * 2;

const SEVERITY_TOP_FRACTION = 0.10;
const MIN_SEVERITY_SAMPLE = 5;

const COLORS = {
  background: "#0f172a",
  empty: "#263449",
  grid: "#0f172a",
  text: "#f8fafc",
  muted: "#cbd5e1",
  accent: "#fb7185",
  darkness: "#38bdf8",
  border: "#475569"
};

const formatCount = d3.format(",");
const formatPercent = d3.format(".0%");

function normalizeDay(row) {
  const name = String(
    row.weekday_name ?? ""
  ).trim().toLowerCase();

  const index = DAYS.findIndex(
    day => day.toLowerCase() === name
  );

  if (index !== -1) return index;

  // FARS: Sunday=1, Monday=2, ..., Saturday=7.
  const code = Number(row.weekday);

  if (
    Number.isInteger(code) &&
    code >= 1 &&
    code <= 7
  ) {
    return (code + 5) % 7;
  }

  return -1;
}

function validHour(row) {
  if (
    row.hour === null ||
    row.hour === undefined ||
    String(row.hour).trim() === ""
  ) {
    return false;
  }

  const hour = Number(row.hour);

  return Number.isInteger(hour) &&
    hour >= 0 &&
    hour <= 23 &&
    Number.isInteger(row.hourIndex) &&
    row.hourIndex >= 0 &&
    row.hourIndex <= 23;
}

function classifyLighting(lighting) {
  const value = String(
    lighting ?? ""
  ).trim().toLowerCase();

  if (
    !value ||
    value === "reported as unknown" ||
    value === "not reported" ||
    value === "other"
  ) {
    return "unknown";
  }

  if (value.startsWith("dark")) {
    return "dark";
  }

  if (
    value === "daylight" ||
    value === "dawn" ||
    value === "dusk"
  ) {
    return "not-dark";
  }

  return "unknown";
}

function mostCommon(rows, field) {
  const counts = d3.rollup(
    rows.filter(row =>
      String(row[field] ?? "").trim()
    ),
    values => values.length,
    row => String(row[field]).trim()
  );

  if (!counts.size) return "Not recorded";

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])[0][0];
}

function buildCells(rows) {
  const valid = rows
    .map(row => ({
      ...row,
      dayIndex: normalizeDay(row),
      hourIndex: row.hour == null ? null : Number(row.hour),
      fatalitiesValue: Number(row.fatalities)
    }))
    .filter(row =>
      row.dayIndex >= 0 &&
      validHour(row)
    );

  const grouped = d3.group(
    valid,
    row => row.dayIndex,
    row => row.hourIndex
  );

  const cells = d3.range(7).flatMap(
    dayIndex =>
      d3.range(24).map(hourIndex => {
        const observations =
          grouped.get(dayIndex)?.get(hourIndex) ?? [];

        const crashes = observations.length;

        const fatalities = d3.sum(
          observations,
          row =>
            Number.isFinite(row.fatalitiesValue)
              ? row.fatalitiesValue
              : 0
        );

        const darkCrashes = observations.filter(
          row => classifyLighting(row.lighting) === "dark"
        ).length;

        const knownLighting = observations.filter(
          row => classifyLighting(row.lighting) !== "unknown"
        ).length;

        const averageFatalities = crashes
          ? fatalities / crashes
          : 0;

        return {
          dayIndex,
          hourIndex,
          crashes,
          fatalities,
          averageFatalities,
          darkCrashes,
          knownLighting,
          darkShare: knownLighting
            ? darkCrashes / knownLighting
            : 0,
          weather: mostCommon(
            observations,
            "weather"
          ),
          lighting: mostCommon(
            observations,
            "lighting"
          )
        };
      })
  );

  return {
    cells,
    validRows: valid
  };
}

function addLegendItem(parent, color, label, circle = false) {
  const item = parent.append("div")
    .style("display", "flex")
    .style("align-items", "center")
    .style("gap", "8px");

  item.append("span")
    .style("display", "inline-block")
    .style("width", circle ? "11px" : "20px")
    .style("height", circle ? "11px" : "9px")
    .style("border-radius", circle ? "50%" : "3px")
    .style("background", color)
    .style("flex-shrink", "0");

  item.append("span").text(label);

  return item;
}

/**
 * @param {Object} config
 * @param {Array} config.data
 * @param {string} [config.container]
 * @param {string|number|null} [config.stateCode]
 *
 * @returns {{updateState: Function, destroy: Function}}
 */
export function renderFatalitySignature({
  data,
  container = "#fatality-signature",
  stateCode = null
}) {
  const root = d3.select(container);

  if (root.empty()) {
    console.warn(
      `Fatality Signature container missing: ${container}`
    );

    return {
      updateState() {},
      destroy() {}
    };
  }

  if (!Array.isArray(data)) {
    throw new Error(
      "Fatality Signature requires geographic crash data."
    );
  }

  root.selectAll("*").remove();

  const wrapper = root.append("div")
    .attr("class", "signature-visualization")
    .style("width", "100%")
    .style("color", COLORS.text);

  // ----------------------------------------
  // Summary
  // ----------------------------------------

  const summary = wrapper.append("div")
    .attr("class", "signature-summary")
    .style("margin-bottom", "18px")
    .style("line-height", "1.7");

  // ----------------------------------------
  // Radial chart
  // ----------------------------------------

  const svg = wrapper.append("svg")
    .attr("viewBox", "0 0 760 760")
    .attr("role", "img")
    .attr(
      "aria-label",
      "Radial fingerprint showing fatal crashes by weekday and hour, with darkness and severity indicators."
    )
    .style("display", "block")
    .style("width", "100%")
    .style("max-width", "760px")
    .style("height", "auto")
    .style("margin", "0 auto");

  const center = svg.append("g")
    .attr("transform", "translate(380,380)");

  const innerRadius = 105;
  const outerRadius = 294;
  const ringWidth =
    (outerRadius - innerRadius) / 7;

  // Monday is innermost; Sunday outermost.
  const cellArc = d3.arc()
    .innerRadius(d =>
      innerRadius +
      d.dayIndex * ringWidth + 1
    )
    .outerRadius(d =>
      innerRadius +
      (d.dayIndex + 1) * ringWidth - 1
    )
    .startAngle(d =>
      d.hourIndex * TWO_PI / 24
    )
    .endAngle(d =>
      (d.hourIndex + 1) * TWO_PI / 24
    )
    .padAngle(0.004);

  // Narrow blue arc shows the share of crashes
  // recorded in darkness for each weekday-hour.
  const darkArc = d3.arc()
    .innerRadius(d =>
      innerRadius +
      d.dayIndex * ringWidth + 2
    )
    .outerRadius(d =>
      innerRadius +
      d.dayIndex * ringWidth + 2 +
      6 * d.darkShare
    )
    .startAngle(d =>
      d.hourIndex * TWO_PI / 24 + 0.008
    )
    .endAngle(d =>
      (d.hourIndex + 1) * TWO_PI / 24 - 0.008
    );

  const color = d3.scaleSequential(
    d3.interpolateYlOrRd
  );

  // ----------------------------------------
  // Hour labels
  // ----------------------------------------

  center.selectAll(".signature-hour-label")
    .data(d3.range(24))
    .join("text")
    .attr("class", "signature-hour-label")
    .attr("x", hour => {
      const angle =
        (hour + 0.5) * TWO_PI / 24 -
        Math.PI / 2;

      return Math.cos(angle) * 319;
    })
    .attr("y", hour => {
      const angle =
        (hour + 0.5) * TWO_PI / 24 -
        Math.PI / 2;

      return Math.sin(angle) * 319;
    })
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", "12")
    .attr("fill", COLORS.muted)
    .text(hour =>
      String(hour).padStart(2, "0")
    );

  // ----------------------------------------
  // Separate SVG layers
  // ----------------------------------------

  const cellLayer = center.append("g")
    .attr("class", "signature-cells");

  const darkLayer = center.append("g")
    .attr("class", "signature-darkness");

  const severityLayer = center.append("g")
    .attr("class", "signature-severity");

  // Weekday names are displayed in the ring key below.
  // Avoid overlapping text inside the radial visualization.
  const dayLabelLayer = center.append("g")
    .attr("class", "signature-day-labels")
    .style("pointer-events", "none");

  // ----------------------------------------
  // Center summary
  // ----------------------------------------

  const centerLabel = center.append("text")
    .attr("text-anchor", "middle")
    .attr("y", -18)
    .attr("font-size", "17")
    .attr("font-weight", "700")
    .attr("fill", COLORS.text);

  const centerValue = center.append("text")
    .attr("text-anchor", "middle")
    .attr("y", 14)
    .attr("font-size", "27")
    .attr("font-weight", "800")
    .attr("fill", COLORS.accent);

  center.append("text")
    .attr("text-anchor", "middle")
    .attr("y", 35)
    .attr("font-size", "11")
    .attr("fill", COLORS.muted)
    .text("fatal crashes");

  // ----------------------------------------
  // Legend
  // ----------------------------------------

  const legend = wrapper.append("div")
    .style("display", "flex")
    .style("flex-wrap", "wrap")
    .style("justify-content", "center")
    .style("align-items", "center")
    .style("gap", "12px")
    .style("margin", "12px 0 18px")
    .style("font-size", "12px");

  legend.append("span")
    .text("Fewer crashes");

  legend.append("div")
    .style("width", "150px")
    .style("height", "12px")
    .style("border-radius", "4px")
    .style(
      "background",
      "linear-gradient(to right, #ffffcc, #fd8d3c, #800026)"
    );

  legend.append("span")
    .text("More crashes");

  const encodingLegend = wrapper.append("div")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("flex-wrap", "wrap")
    .style("gap", "16px")
    .style("font-size", "12px")
    .style("margin-bottom", "16px");

  addLegendItem(
    encodingLegend,
    COLORS.darkness,
    "Blue band: share recorded in darkness"
  );

  addLegendItem(
    encodingLegend,
    COLORS.accent,
    "Pink dot: national top-10% severity benchmark (≥5 crashes)",
    true
  );

  // ----------------------------------------
  // Weekday ring key
  // ----------------------------------------

  const weekdayKey = wrapper.append("div")
    .style("display", "flex")
    .style("flex-wrap", "wrap")
    .style("justify-content", "center")
    .style("gap", "8px 16px")
    .style("font-size", "12px")
    .style("color", COLORS.muted)
    .style("margin-bottom", "20px");

  weekdayKey.append("strong")
    .style("color", COLORS.text)
    .text("Rings, center outward:");

  DAYS.forEach((day, index) => {
    weekdayKey.append("span")
      .text(`${index + 1}. ${day}`);
  });

  // ----------------------------------------
  // Detail panel (does not cover chart)
  // ----------------------------------------

  const detail = wrapper.append("div")
    .attr("class", "signature-detail-panel")
    .style("background", "#111c2f")
    .style("border", `1px solid ${COLORS.border}`)
    .style("border-radius", "10px")
    .style("padding", "16px")
    .style("min-height", "90px")
    .style("line-height", "1.7");

  const detailHeading = detail.append("div")
    .style("font-weight", "700")
    .style("font-size", "15px")
    .style("margin-bottom", "8px");

  const detailBody = detail.append("div")
    .style("font-size", "13px")
    .style("color", COLORS.muted);

  function showDefaultDetail() {
    detailHeading.text(
      "Explore a weekday and hour"
    );

    detailBody.text(
      "Hover over a radial segment to inspect its crash count, fatalities, darkness share, and recorded weather and lighting."
    );
  }

  function showCellDetail(cell) {
    const start = String(
      cell.hourIndex
    ).padStart(2, "0");

    const end = String(
      (cell.hourIndex + 1) % 24
    ).padStart(2, "0");

    detailHeading.text(
      `${DAYS[cell.dayIndex]} · ${start}:00–${end}:00`
    );

    detailBody.selectAll("*").remove();

    const entries = [
      ["Fatal crashes", formatCount(cell.crashes)],
      ["Fatalities", formatCount(cell.fatalities)],
      [
        "Fatalities per crash",
        cell.crashes
          ? cell.averageFatalities.toFixed(2)
          : "N/A"
      ],
      [
        "Recorded in darkness",
        cell.knownLighting
          ? `${formatPercent(cell.darkShare)} (${cell.darkCrashes} of ${cell.knownLighting} with known lighting)`
          : "No known lighting records"
      ],
      ["Most common weather", cell.weather],
      ["Most common lighting", cell.lighting]
    ];

    const grid = detailBody.append("div")
      .style("display", "grid")
      .style(
        "grid-template-columns",
        "repeat(auto-fit, minmax(180px, 1fr))"
      )
      .style("gap", "10px");

    entries.forEach(([label, value]) => {
      const item = grid.append("div");

      item.append("div")
        .style("font-size", "11px")
        .style("color", "#94a3b8")
        .text(label);

      item.append("div")
        .style("font-size", "14px")
        .style("font-weight", "600")
        .style("color", COLORS.text)
        .text(value);
    });
  }

  showDefaultDetail();

  // ----------------------------------------
  // State updates
  // ----------------------------------------

  // National reference benchmark, calculated once.
  // State selections use the same severity threshold.
  const nationalCells = buildCells(data).cells;

  const nationalSeverityValues = nationalCells
    .filter(cell => cell.crashes >= MIN_SEVERITY_SAMPLE)
    .map(cell => cell.averageFatalities)
    .sort((a, b) => b - a);

  const topCellCount = Math.max(
    1,
    Math.round(
      nationalSeverityValues.length * SEVERITY_TOP_FRACTION
    )
  );

  const severityThreshold = nationalSeverityValues.length
    ? nationalSeverityValues[topCellCount - 1]
    : Infinity;

  let selectedStateCode = stateCode;

  function updateState(nextStateCode = null) {
    selectedStateCode =
      nextStateCode === "" ||
      nextStateCode == null
        ? null
        : Number(nextStateCode);

    const filtered = selectedStateCode == null
      ? data
      : data.filter(
          row =>
            Number(row.state_code) ===
            selectedStateCode
        );

    const { cells, validRows } =
      buildCells(filtered);

    const maximum =
      d3.max(cells, cell => cell.crashes) || 1;

    color.domain([0, maximum]);

    const crashTotal = filtered.length;

    const fatalityTotal = d3.sum(
      filtered,
      row => Number(row.fatalities) || 0
    );

    const stateName =
      selectedStateCode == null
        ? "United States"
        : filtered[0]?.state ??
          `State ${selectedStateCode}`;

    centerLabel.text(
      stateName.length > 17
        ? `${stateName.slice(0, 15)}…`
        : stateName
    );

    centerValue.text(
      formatCount(crashTotal)
    );

    const excluded = filtered.length -
      validRows.length;

    summary.text(
      `${stateName}: ${formatCount(crashTotal)} geocoded ` +
      `fatal crashes and ${formatCount(fatalityTotal)} ` +
      `fatalities. The radial cells show ` +
      `${formatCount(validRows.length)} crashes with valid ` +
      `weekday and hour information.` +
      (excluded
        ? ` ${formatCount(excluded)} records have missing or invalid time information.`
        : "")
    );

    // Base heatmap cells.
    cellLayer.selectAll(".signature-cell")
      .data(
        cells,
        cell =>
          `${cell.dayIndex}-${cell.hourIndex}`
      )
      .join("path")
      .attr("class", "signature-cell")
      .attr("d", cellArc)
      .attr("fill", cell =>
        cell.crashes
          ? color(cell.crashes)
          : COLORS.empty
      )
      .attr("stroke", COLORS.grid)
      .attr("stroke-width", 0.8)
      .style("cursor", "pointer")
      .on("mouseenter", function(event, cell) {
        cellLayer.selectAll(".signature-cell")
          .attr("stroke", COLORS.grid)
          .attr("stroke-width", 0.8);

        d3.select(this)
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 2);

        showCellDetail(cell);
      })
      .on("mouseleave", function() {
        d3.select(this)
          .attr("stroke", COLORS.grid)
          .attr("stroke-width", 0.8);
      })
      .on("click", function(event, cell) {
        showCellDetail(cell);
      });

    // Blue darkness bands.
    darkLayer.selectAll(".signature-dark-band")
      .data(
        cells.filter(cell =>
          cell.knownLighting > 0 &&
          cell.darkShare > 0
        ),
        cell =>
          `${cell.dayIndex}-${cell.hourIndex}`
      )
      .join("path")
      .attr("class", "signature-dark-band")
      .attr("d", darkArc)
      .attr("fill", COLORS.darkness)
      .attr("opacity", 0.9)
      .style("pointer-events", "none");

    // Pink severity markers.
    const severeCells = cells.filter(
      cell =>
        cell.crashes >= MIN_SEVERITY_SAMPLE &&
        cell.averageFatalities >=
          severityThreshold
    );

    severityLayer
      .selectAll(".signature-severity-dot")
      .data(
        severeCells,
        cell =>
          `${cell.dayIndex}-${cell.hourIndex}`
      )
      .join("circle")
      .attr(
        "class",
        "signature-severity-dot"
      )
      .attr("cx", cell => {
        const angle =
          (cell.hourIndex + 0.5) *
          TWO_PI / 24 -
          Math.PI / 2;

        const radius =
          innerRadius +
          (cell.dayIndex + 0.7) *
          ringWidth;

        return Math.cos(angle) * radius;
      })
      .attr("cy", cell => {
        const angle =
          (cell.hourIndex + 0.5) *
          TWO_PI / 24 -
          Math.PI / 2;

        const radius =
          innerRadius +
          (cell.dayIndex + 0.7) *
          ringWidth;

        return Math.sin(angle) * radius;
      })
      .attr("r", 3.3)
      .attr("fill", COLORS.accent)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 0.8)
      .style("pointer-events", "none");

    // Raise labels above all visual marks.
    dayLabelLayer.raise();

    showDefaultDetail();

    if (!filtered.length) {
      summary.text(
        `No geographic crash records found for ${stateName}.`
      );
    }
  }

  updateState(selectedStateCode);

  return {
    updateState,

    destroy() {
      root.selectAll("*").remove();
    }
  };
}
