/**
 * Fatal Roads — Main Story Controller
 * CSE 478 | NHTSA FARS 2024
 *
 * Responsibilities:
 * - Load and validate datasets
 * - Initialize KPI cards
 * - Render existing D3 visualizations
 * - Render the Fatality Signature
 * - Coordinate state selections
 * - Coordinate weekday/hour selections
 * - Handle global reset
 * - Report initialization errors
 * - Support narrative chapter navigation
 */

import {
  loadDashboardData,
  loadGeographicData,
  validateStateSummary
} from "./dataLoader.js";

import { renderStateMap } from "./stateMap.js";
import { renderTemporalHeatmap } from "./temporalHeatmap.js";
import { renderMonthlyTrend } from "./monthlyTrend.js";
import { renderConditionBar } from "./conditionBar.js";
import { renderBubbleScatter } from "./bubbleScatter.js";
import { renderFatalityExplorer } from "./fatalityExplorer.js";
import { renderFatalitySignature } from "./fatalitySignature.js";

// ----------------------------------------
// 1. Project reference totals
// ----------------------------------------

const EXPECTED = {
  crashes: 36297,
  fatalities: 39254,
  jurisdictions: 51
};

const format = d3.format(",");

// ----------------------------------------
// 2. Visualization instances
// ----------------------------------------

let stateMap = null;
let temporalHeatmap = null;
let monthlyTrend = null;
let conditionBar = null;
let bubbleScatter = null;
let fatalityExplorer = null;
let fatalitySignature = null;

// Shared dashboard filter state.
const filters = {
  stateCode: null,
  time: null,
  month: null,
  condition: null
};

// Prevent callback loops during synchronization.
let synchronizing = false;

// Storytelling controls do not modify chart rendering.
let storyObserver = null;

// ----------------------------------------
// 3. KPI initialization
// ----------------------------------------

function initializeKPIs(states) {
  const crashes = d3.sum(
    states,
    d => Number(d.crashes) || 0
  );

  const fatalities = d3.sum(
    states,
    d => Number(d.fatalities) || 0
  );

  const jurisdictions = new Set(
    states.map(d => Number(d.state_code))
  ).size;

  d3.select("#total-crashes")
    .text(format(crashes));

  d3.select("#total-fatalities")
    .text(format(fatalities));

  d3.select("#total-states")
    .text(format(jurisdictions));

  d3.select("#average-fatalities")
    .text(
      crashes > 0
        ? (fatalities / crashes).toFixed(2)
        : "N/A"
    );

  return {
    crashes,
    fatalities,
    jurisdictions
  };
}

// ----------------------------------------
// 4. Aggregate data verification
// ----------------------------------------

function verifyTotals(states) {
  const result = validateStateSummary(states);

  console.log(
    "[Dashboard] State summary validation:",
    result
  );

  if (!result.valid) {
    throw new Error(
      "Invalid state summary: " + result.message
    );
  }

  const checks = {
    crashes:
      result.totalCrashes === EXPECTED.crashes,

    fatalities:
      result.totalFatalities === EXPECTED.fatalities,

    jurisdictions:
      result.jurisdictionCount ===
      EXPECTED.jurisdictions
  };

  console.table({
    crashes: {
      expected: EXPECTED.crashes,
      actual: result.totalCrashes,
      match: checks.crashes
    },

    fatalities: {
      expected: EXPECTED.fatalities,
      actual: result.totalFatalities,
      match: checks.fatalities
    },

    jurisdictions: {
      expected: EXPECTED.jurisdictions,
      actual: result.jurisdictionCount,
      match: checks.jurisdictions
    }
  });

  if (Object.values(checks).some(
    match => !match
  )) {
    console.warn(
      "[Dashboard] Dataset totals differ from " +
      "the project reference values."
    );
  }

  return result;
}

// ----------------------------------------
// 5. State selection synchronization
// ----------------------------------------

function synchronizeState(stateCode) {
  if (synchronizing) return;

  synchronizing = true;

  try {
    filters.stateCode =
      stateCode === null ||
      stateCode === undefined ||
      stateCode === ""
        ? null
        : Number(stateCode);

    // Update state choropleth.
    stateMap?.setSelectedState(
      filters.stateCode
    );

    // Update bubble scatter selection.
    bubbleScatter?.setSelectedState(
      filters.stateCode
    );

    // Update the coordinated explorer.
    fatalityExplorer?.setState(
      filters.stateCode
    );

    // Update the radial Fatality Signature.
    fatalitySignature?.updateState(
      filters.stateCode
    );

    // Synchronize signature dropdown.
    const signatureSelect = d3.select(
      "#signature-state"
    );

    if (!signatureSelect.empty()) {
      signatureSelect.property(
        "value",
        filters.stateCode === null
          ? ""
          : String(filters.stateCode)
      );
    }

    console.log(
      "[Dashboard] State filter:",
      filters.stateCode ?? "All states"
    );

  } finally {
    synchronizing = false;
  }
}

// ----------------------------------------
// 6. Time selection synchronization
// ----------------------------------------

function synchronizeTime(time) {
  if (synchronizing) return;

  synchronizing = true;

  try {
    filters.time = time
      ? {
          weekday: Number(time.weekday),
          hour: Number(time.hour)
        }
      : null;

    if (filters.time) {
      temporalHeatmap?.setSelectedCell(
        filters.time.weekday,
        filters.time.hour
      );

      fatalityExplorer?.setTime(
        filters.time.weekday,
        filters.time.hour
      );
    } else {
      temporalHeatmap?.setSelectedCell(
        null,
        null
      );

      fatalityExplorer?.setTime(
        null,
        null
      );
    }

    console.log(
      "[Dashboard] Time filter:",
      filters.time ?? "All times"
    );

  } finally {
    synchronizing = false;
  }
}

// ----------------------------------------
// 7. Handle explorer interactions
// ----------------------------------------

function handleExplorerFilters(nextFilters) {
  if (synchronizing) return;

  // The explorer manages its own state.
  // Synchronize the other charts.
  synchronizing = true;

  try {
    filters.stateCode =
      nextFilters.stateCode ?? null;

    filters.time = nextFilters.time
      ? { ...nextFilters.time }
      : null;

    stateMap?.setSelectedState(
      filters.stateCode
    );

    bubbleScatter?.setSelectedState(
      filters.stateCode
    );

    fatalitySignature?.updateState(
      filters.stateCode
    );

    temporalHeatmap?.setSelectedCell(
      filters.time?.weekday ?? null,
      filters.time?.hour ?? null
    );

    const signatureSelect = d3.select(
      "#signature-state"
    );

    if (!signatureSelect.empty()) {
      signatureSelect.property(
        "value",
        filters.stateCode === null
          ? ""
          : String(filters.stateCode)
      );
    }

  } finally {
    synchronizing = false;
  }
}

// ----------------------------------------
// 8. Handle month selection
// ----------------------------------------

function handleMonthSelection(month) {
  filters.month = month?.month ?? null;

  console.log(
    "[Dashboard] Selected month:",
    filters.month ?? "All months"
  );

  // Month is tracked as a selection.
  // It is not applied to the other summary charts,
  // because they contain nationwide aggregates.
}

// ----------------------------------------
// 9. Handle condition selection
// ----------------------------------------

function handleConditionSelection(condition) {
  filters.condition = condition
    ? {
        type: condition.type,
        category: condition.category
      }
    : null;

  console.log(
    "[Dashboard] Selected condition:",
    filters.condition ?? "All conditions"
  );

  // Condition is tracked as a selection.
  // Applying it to other views requires
  // record-level filtering and aggregation.
}

// ----------------------------------------
// 10. Global reset
// ----------------------------------------

function resetDashboard() {
  if (synchronizing) return;

  synchronizing = true;

  try {
    filters.stateCode = null;
    filters.time = null;
    filters.month = null;
    filters.condition = null;

    stateMap?.reset();
    temporalHeatmap?.reset();
    monthlyTrend?.reset();
    conditionBar?.reset();

    bubbleScatter?.clearSelection();
    bubbleScatter?.resetZoom();

    fatalityExplorer?.reset();

    // Reset the Fatality Signature to national view.
    fatalitySignature?.updateState(null);

    d3.select("#map-metric")
      .property("value", "crashes");

    d3.select("#monthly-metric")
      .property("value", "crashes");

    d3.select("#condition-type")
      .property("value", "weather");

    d3.select("#signature-state")
      .property("value", "");

    console.log(
      "[Dashboard] All filters reset."
    );

  } finally {
    synchronizing = false;
  }
}

// ----------------------------------------
// 11. Chart error handling
// ----------------------------------------

function showChartError(selector, message) {
  const container = d3.select(selector);

  if (!container.empty()) {
    container.selectAll("*").remove();

    container.append("p")
      .attr("class", "chart-error")
      .text(message);
  }
}

async function initializeChart(
  name,
  selector,
  initializer
) {
  try {
    const instance = await initializer();

    console.log(
      `[Dashboard] ${name} initialized.`
    );

    return instance;

  } catch (error) {
    console.error(
      `[Dashboard] ${name} failed:`,
      error
    );

    showChartError(
      selector,
      `Unable to render ${name}. ` +
      "Check the browser console."
    );

    return null;
  }
}

// ----------------------------------------
// 12. Storytelling navigation
// ----------------------------------------

function initializeStoryNavigation() {
  const links = [
    ...document.querySelectorAll(
      '.main-nav a[href^="#"]'
    )
  ];

  const sections = links
    .map(link =>
      document.getElementById(
        link.getAttribute("href").slice(1)
      )
    )
    .filter(Boolean);

  if (!sections.length) return;

  const markActive = id => {
    links.forEach(link => {
      const active =
        link.getAttribute("href") === `#${id}`;

      link.classList.toggle("active", active);

      if (active) {
        link.setAttribute(
          "aria-current",
          "location"
        );
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  if (!("IntersectionObserver" in window)) {
    markActive("overview");
    return;
  }

  storyObserver?.disconnect();

  storyObserver = new IntersectionObserver(
    entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort(
          (a, b) =>
            b.intersectionRatio -
            a.intersectionRatio
        );

      if (visible.length) {
        markActive(visible[0].target.id);
      }
    },
    {
      rootMargin: "-15% 0px -55% 0px",
      threshold: [0, 0.1, 0.25, 0.5]
    }
  );

  sections.forEach(section =>
    storyObserver.observe(section)
  );

  markActive(
    location.hash.slice(1) || "overview"
  );
}

// ----------------------------------------
// 13. Signature state selector
// ----------------------------------------

function initializeSignatureSelector(states) {
  const selector = d3.select(
    "#signature-state"
  );

  if (selector.empty()) return;

  const normalizedStates = states
    .map(state => ({
      code: Number(state.state_code),
      name:
        state.state ??
        state.state_name ??
        state.statename ??
        state.name ??
        `State ${state.state_code}`
    }))
    .filter(state =>
      Number.isFinite(state.code)
    )
    .sort((a, b) =>
      String(a.name).localeCompare(
        String(b.name)
      )
    );

  selector.selectAll("option").remove();

  selector.append("option")
    .attr("value", "")
    .text("United States");

  selector.selectAll(
    "option.signature-state-option"
  )
    .data(normalizedStates)
    .enter()
    .append("option")
    .attr(
      "class",
      "signature-state-option"
    )
    .attr("value", d => d.code)
    .text(d => d.name);

  selector.on("change", function () {
    synchronizeState(
      this.value === ""
        ? null
        : Number(this.value)
    );
  });
}

// ----------------------------------------
// 14. Dashboard initialization
// ----------------------------------------

async function initializeDashboard() {
  if (
    typeof d3 === "undefined" ||
    typeof topojson === "undefined"
  ) {
    console.error(
      "D3.js or TopoJSON failed to load."
    );

    return;
  }

  console.log(
    "[Dashboard] D3.js version:",
    d3.version
  );

  try {
    // Load summary datasets.
    const data = await loadDashboardData();

    console.log(
      "[Dashboard] Summary datasets loaded."
    );

    // Validate totals and populate KPI cards.
    verifyTotals(data.states);
    initializeKPIs(data.states);

    // Populate the signature selector using
    // the existing state summary data.
    initializeSignatureSelector(data.states);

    // Geographic records support the signature and explorer.
    let geographicData = null;

    try {
      geographicData = await loadGeographicData();
    } catch (error) {
      console.error(
        "[Dashboard] Geographic data failed:",
        error
      );
    }

    // ------------------------------------
    // Initialize state map
    // ------------------------------------

    stateMap = await initializeChart(
      "State Map",
      "#state-map",
      () => renderStateMap(
        data.states,
        {
          onStateSelect: record => {
            synchronizeState(
              record?.state_code ?? null
            );
          }
        }
      )
    );

    // ------------------------------------
    // Initialize temporal heatmap
    // ------------------------------------

    temporalHeatmap = await initializeChart(
      "Temporal Heatmap",
      "#temporal-heatmap",
      () => renderTemporalHeatmap(
        data.heatmap,
        {
          onCellSelect: cell => {
            synchronizeTime(
              cell
                ? {
                    weekday: cell.weekdayCode,
                    hour: cell.hour
                  }
                : null
            );
          }
        }
      )
    );

    // ------------------------------------
    // Initialize monthly trend
    // ------------------------------------

    monthlyTrend = await initializeChart(
      "Monthly Trend",
      "#monthly-trend",
      () => renderMonthlyTrend(
        data.monthly,
        {
          onMonthSelect: handleMonthSelection
        }
      )
    );

    // ------------------------------------
    // Initialize condition bar chart
    // ------------------------------------

    conditionBar = await initializeChart(
      "Condition Bar",
      "#condition-bar",
      () => renderConditionBar(
        {
          weather: data.weather,
          lighting: data.lighting,
          ruralUrban: data.ruralUrban
        },
        {
          onConditionSelect:
            handleConditionSelection
        }
      )
    );

    // ------------------------------------
    // Initialize bubble scatter
    // ------------------------------------

    bubbleScatter = await initializeChart(
      "Bubble Scatter",
      "#bubble-scatter",
      () => renderBubbleScatter(
        data.states,
        {
          onStateSelect: state => {
            synchronizeState(
              state?.state_code ?? null
            );
          }
        }
      )
    );

    // ------------------------------------
    // Initialize Fatality Signature
    // ------------------------------------

    if (geographicData) {
      fatalitySignature = await initializeChart(
        "Fatality Signature",
        "#fatality-signature",
        () => renderFatalitySignature({
          data: geographicData,
          container: "#fatality-signature",
          stateCode: filters.stateCode
        })
      );
    } else {
      showChartError(
        "#fatality-signature",
        "Geographic crash data unavailable."
      );
    }

    // ------------------------------------
    // Initialize coordinated explorer
    // ------------------------------------

    if (geographicData) {
      fatalityExplorer = await initializeChart(
        "Fatality Explorer",
        "#explorer-map",
        () => renderFatalityExplorer(
          geographicData,
          {
            onFilterChange:
              handleExplorerFilters
          }
        )
      );
    } else {
      showChartError(
        "#explorer-map",
        "Geographic crash data unavailable."
      );

      showChartError(
        "#explorer-heatmap",
        "Geographic crash data unavailable."
      );
    }

    // ------------------------------------
    // Connect global reset
    // ------------------------------------

    const resetButton = d3.select(
      "#reset-filters"
    );

    if (!resetButton.empty()) {
      resetButton.on(
        "click",
        resetDashboard
      );
    }

    initializeStoryNavigation();

    console.log(
      "[Dashboard] Initialization complete."
    );

  } catch (error) {
    console.error(
      "[Dashboard] Initialization failed:",
      error
    );

    showChartError(
      "#state-map",
      "Unable to initialize dashboard. " +
      "Check the browser console."
    );
  }
}

// ----------------------------------------
// 15. Start dashboard
// ----------------------------------------

initializeDashboard();
