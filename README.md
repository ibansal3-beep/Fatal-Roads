# Fatal-Roads

**Exploring Patterns in U.S. Traffic Fatalities**  
**CSE 478 — Data Visualization | Fall 2026**

## Project Overview

Fatal-Roads is an interactive [D3.js](https://d3js.org/) dashboard exploring **where, when, and under what conditions fatal motor vehicle crashes occurred across the United States in 2024**.

Using the National Highway Traffic Safety Administration (NHTSA) Fatality Analysis Reporting System (FARS), the dashboard presents five primary visualizations and an innovative sixth linked view. Together, they support exploration of geographic distributions, temporal patterns, environmental and roadway conditions, and crash severity.

**Interpretation note:** These visualizations show observed fatal crash counts and associations—not causes or exposure-adjusted crash risk.

## Research Question

> How do geographic location, time, environmental conditions, and roadway characteristics relate to the distribution of fatal traffic crashes across the United States in 2024?

## Dataset

| Measure | Value |
| --- | ---: |
| Source | [NHTSA FARS 2024 National CSV](https://static.nhtsa.gov/nhtsa/downloads/FARS/2024/National/FARS2024NationalCSV.zip) |
| Fatal crash records | 36,297 |
| Recorded fatalities | 39,254 |
| Original attributes | 80 |
| Records with valid geographic coordinates | 36,127 |
| Geographic coverage | 50 states and Washington, D.C. |

The accident-level dataset includes crash identifiers, coordinates, dates and times, fatality counts, weather, lighting, and roadway classifications. **Each accident-level record represents a fatal crash, not an individual fatality.**

### Data Preprocessing

The original FARS data was cleaned, validated, and transformed into visualization-ready CSV and JSON files. Processing included:

- Selecting relevant crash-level attributes.
- Cleaning numeric and categorical fields and handling missing or unknown values.
- Standardizing geographic and temporal attributes.
- Aggregating crash and fatality counts by state, month, weekday, hour, and recorded conditions.
- Validating latitude and longitude for geographic visualizations.
- Computing derived metrics, including average fatalities per crash.
- Preparing processed datasets for efficient loading with D3.js.

Of the **36,127 records with valid geographic coordinates**, **233 have missing hour values**. These were preserved as missing rather than assigned an artificial time. Analyses requiring a known hour exclude those records as appropriate; geographic analyses can still include them.

**Important:** Crash counts are not normalized by population, traffic volume, or vehicle miles traveled.

## Implemented Visualizations

### 1. U.S. Choropleth Map

A state-level map showing the distribution of fatal crashes and fatalities through a sequential color scale. Users can switch metrics, inspect tooltips, and select states for geographic exploration.

### 2. Weekday-Hour Heatmap

A **7 × 24 heatmap** displaying fatal crash counts by weekday and hour. Cell tooltips and selection support examination of temporal patterns and time-based filtering.

### 3. Monthly Trend Line Chart

A line chart showing how fatal crash and fatality counts change across the twelve months of 2024. Includes a metric selector, interactive tooltips, and month selection.

### 4. Environmental and Roadway Conditions Bar Chart

An interactive categorical bar chart comparing recorded crashes across weather, lighting, and rural/urban classifications. Users can change the displayed condition category and select bars to explore subsets.

### 5. State Comparison Bubble Scatterplot

A scatterplot comparing states by **fatal crash count (x-axis)** and **fatalities (y-axis)**, with bubble size encoding **average fatalities per crash**. Tooltips and state selection support comparisons.

### 6. Fatality Risk Explorer — Innovative Visualization

The Fatality Risk Explorer combines a geographic **crash-point map** with a coordinated **weekday-hour heatmap**:

- Selecting a weekday-hour interval filters the crash locations shown on the map.
- Selecting a state updates the temporal summaries for that geographic subset.
- Linked selections allow users to explore how spatial and temporal patterns relate.
- Reset controls return the explorer to its broader view.

**What makes it innovative:** Instead of displaying geography and time as independent charts, the explorer connects them through coordinated, bidirectional interactions.

Despite its name, the explorer displays **observed fatal crash patterns**, not exposure-adjusted risk or the probability of a crash for an individual driver.

## Interactive Features

- State, month, weekday-hour, and condition selection and filtering.
- Hover tooltips with relevant counts and context.
- Metric switching where supported.
- Linked geographic and temporal exploration.
- Shared application state and filter reset controls.
- Responsive dashboard layout.

Filter behavior depends on the visualization and selected view; not every control necessarily filters every chart.

## Technologies Used

| Technology | Purpose |
| --- | --- |
| HTML5 | Dashboard structure |
| CSS3 | Styling and responsive layout |
| JavaScript | Application logic and interactions |
| D3.js v7 | Data-driven charts, maps, scales, and interactions |
| CSV and JSON | Processed visualization data |
| Git and GitHub | Version control and collaboration |
| Visual Studio Code + Live Server | Local development and testing |

## Repository Structure

```text
Fatal-Roads/
├── index.html                 # Dashboard entry point
├── css/
│   └── style.css             # Dashboard styling
├── js/
│   ├── main.js               # Application initialization and shared state
│   ├── dataLoader.js         # Dataset loading and validation
│   ├── stateMap.js           # U.S. choropleth map
│   ├── temporalHeatmap.js    # Weekday-hour heatmap
│   ├── monthlyTrend.js       # Monthly line chart
│   ├── conditionBar.js       # Conditions bar chart
│   ├── bubbleScatter.js      # State comparison scatterplot
│   └── fatalityExplorer.js   # Coordinated geographic-temporal explorer
├── data/                      # Processed CSV/JSON datasets
├── assets/                    # Static assets
├── screenshots/               # Dashboard screenshots
└── README.md                  # Project documentation
```

## Run Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/ibansal3-beep/Fatal-Roads.git
   cd Fatal-Roads
   ```

2. Open the folder in **Visual Studio Code**.
3. Install the **Live Server** extension if it is not already installed.
4. Right-click `index.html` and select **Open with Live Server**.
5. Explore the dashboard in the browser window that opens.

**No npm installation or backend application is required.** Use a local web server rather than opening `index.html` directly through a `file://` URL, since browser security restrictions can prevent data files from loading correctly.

## Testing and Validation

As reported by the project team, final testing covered:

- Loading and initialization of all six visualizations.
- Dataset totals, record counts, and missing-value handling.
- Numeric validation and geographic coordinate handling.
- JavaScript errors during initialization and user interactions.
- Scales, axes, legends, tooltips, and visual consistency.
- Geographic, temporal, and categorical selections.
- Linked-view behavior and filter resets.
- Responsive layouts on desktop, tablet, and mobile viewports.

The team reports that all six visualizations were functionally reviewed during final testing.

## Team Responsibilities

### Ishita Bansal — 34%

- Dataset acquisition, cleaning, preprocessing, and validation.
- Data abstraction and preparation of CSV/JSON files for D3.js.
- Implementation of the U.S. choropleth map (Visualization 1).
- Development of the innovative Fatality Risk Explorer (Visualization 6).
- Implementation of shared state management and cross-visualization coordination.
- Data integration, debugging, and performance optimization.

### Keenan Tait — 33%

- Design Sheets 2, 3, and 4: weekday-hour heatmap, monthly trend line chart, and environmental/roadway conditions bar chart.
- D3.js implementation of the weekday-hour heatmap (Visualization 2), including scales, axes, tooltips, and cell selection.
- D3.js implementation of the monthly trend line chart (Visualization 3), including scales, data binding, and tooltips.
- Development of temporal filtering controls, including weekday, hour, and month selections.
- Testing and debugging of assigned visualization modules.

### Arshia Agarwal — 33%

- Design Sheets 1 and 5: U.S. choropleth map and state comparison bubble scatterplot.
- D3.js implementation of the environmental and roadway conditions bar chart (Visualization 4).
- D3.js implementation of the state comparison bubble scatterplot (Visualization 5).
- Dashboard interface design, CSS styling, and responsive layout.
- UI testing, usability improvements, and component integration.

### Shared Responsibilities

- Project planning and visualization design discussions.
- GitHub collaboration and version control.
- Integration testing, debugging, and quality assurance.
- Project documentation, final report, and presentation preparation.

## Limitations and Future Improvements

The FARS dataset includes **fatal crashes only**, so the dashboard does not describe all motor vehicle crashes. The analysis covers **2024 only** and cannot establish long-term trends. Missing or unknown fields can affect particular visualizations. Counts are not adjusted for traffic exposure or population; states or time periods with more recorded crashes are not necessarily more dangerous on a per-trip or per-mile basis. The visualizations show associations, not causal relationships.

Potential extensions include multi-year comparisons, exposure-adjusted rates using documented denominators, additional demographic and roadway attributes, and data export features.

## Attribution

**Data source:** National Highway Traffic Safety Administration (NHTSA), [Fatality Analysis Reporting System (FARS), 2024 National Accident Data](https://static.nhtsa.gov/nhtsa/downloads/FARS/2024/National/FARS2024NationalCSV.zip).

**Visualization library:** [D3.js](https://d3js.org/).

**Course:** CSE 478 — Data Visualization, Fall 2026.

Fatal-Roads is an educational project and is **not an official NHTSA product**.
