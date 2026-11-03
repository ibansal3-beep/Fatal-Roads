
# Fatal-Roads

**Exploring Patterns in U.S. Traffic Fatalities**  
CSE 478 — Data Visualization | Fall 2026

## Project Overview

Fatal-Roads is an interactive D3.js dashboard exploring where, when, and under what conditions fatal motor vehicle crashes occurred across the United States in 2024.

Using data from the National Highway Traffic Safety Administration (NHTSA) Fatality Analysis Reporting System (FARS), the project presents six interactive visualizations highlighting geographic distributions, temporal patterns, environmental conditions, and crash severity.

The visualizations describe observed patterns and associations rather than causal relationships or exposure-adjusted risk.

## Research Question

How do geographic location, time, environmental conditions, and roadway characteristics relate to the distribution of fatal traffic crashes across the United States in 2024?

## Dataset

- **Source:** [NHTSA FARS 2024](https://static.nhtsa.gov/nhtsa/downloads/FARS/2024/National/FARS2024NationalCSV.zip)
- **Fatal crashes:** 36,297
- **Fatalities recorded:** 39,254
- **Original attributes:** 80
- **Valid geographic records:** 36,127
- **Geographic coverage:** 50 states and Washington, D.C.

The dataset includes crash identifiers, geographic coordinates, dates and times, fatality counts, weather, lighting, and roadway classifications.

### Data Preprocessing

The original FARS accident-level data was cleaned, validated, and transformed into visualization-ready CSV and JSON files.

Processing included:
- Selecting relevant crash-level attributes.
- Cleaning and validating numeric and categorical fields.
- Standardizing geographic and temporal attributes.
- Aggregating crashes and fatalities by state, month, weekday, hour, and roadway conditions.
- Validating geographic coordinates for map-based visualizations.
- Computing derived metrics such as fatalities per crash.
- Preparing processed datasets for D3.js.

Missing and unknown values were handled according to each visualization's requirements. Of the 36,127 geographic records, 233 have missing hour values, which were preserved rather than assigned an incorrect time.

Crash counts are not normalized by population or vehicle miles traveled.

## Implemented Visualizations

### 1. U.S. Choropleth Map
Displays state-level fatal crash and fatality distributions using a sequential color scale. Supports metric switching, interactive tooltips, state selection, and geographic filtering.

### 2. Weekday-Hour Heatmap
Visualizes fatal crash patterns across seven weekdays and 24 hours. Supports interactive cell selection, tooltips, and temporal filtering.

### 3. Monthly Trend Line Chart
Shows monthly changes in fatal crashes and fatalities throughout 2024. Includes metric selection, interactive tooltips, and month filtering.

### 4. Environmental and Roadway Conditions Bar Chart
Compares crash distributions across weather, lighting, and rural/urban roadway categories using interactive bars and categorical filtering.

### 5. State Comparison Bubble Scatterplot
Compares states using fatal crash counts, fatalities, and average fatalities per crash. Includes interactive bubbles, tooltips, and coordinated state selection.

### 6. Fatality Risk Explorer — Innovative Visualization
Combines a geographic crash-point map with a coordinated weekday-hour heatmap to support interactive spatial-temporal exploration.

Selecting a time interval filters geographic crash locations, while selecting a state updates temporal summaries.

**Innovation:** Unlike independent charts, the explorer integrates linked geographic and temporal views with bidirectional filtering, allowing users to investigate multidimensional crash patterns through coordinated interactions.

Despite its name, the explorer represents observed fatal crash patterns, not exposure-adjusted risk.

## Interactive Features

- State, month, weekday-hour, and condition filtering.
- Interactive tooltips and metric switching.
- Coordinated cross-visualization interactions.
- Shared application state and global filter reset.
- Responsive dashboard layout.

## Technologies Used

- **HTML5 and CSS3:** Dashboard structure and responsive styling.
- **JavaScript:** Application logic and interaction handling.
- **D3.js v7:** Interactive maps, charts, and data binding.
- **CSV/JSON:** Processed visualization datasets.
- **GitHub:** Version control and collaboration.
- **VS Code Live Server:** Local development and testing.

## Run Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/ibansal3-beep/Fatal-Roads.git
   ```

2. Open the project folder in Visual Studio Code.
3. Install the **Live Server** extension if needed.
4. Right-click `index.html` and select **Open with Live Server**.
5. Explore the dashboard in your browser.

No npm installation or backend server is required. Use Live Server instead of opening `index.html` directly through a `file://` URL.

## Testing and Validation

The completed dashboard was tested for:

- Successful loading and initialization of all six visualizations.
- Correct CSV record counts and dataset totals.
- Missing values and invalid numeric data.
- JavaScript errors during initialization and interactions.
- Scales, axes, legends, tooltips, and visual consistency.
- State, temporal, and categorical filtering.
- Global filter reset functionality.
- Responsive behavior across desktop, tablet, and mobile viewports.

All six visualizations were functionally reviewed and approved during final testing.

## Team Responsibilities

### Ishita Bansal — 34%

- Dataset acquisition, cleaning, preprocessing, and validation.
- Data abstraction and preparation of CSV/JSON files for D3.js.
- Implementation of the U.S. choropleth map (Visualization 1).
- Development of the innovative Fatality Risk Explorer (Visualization 6).
- Implementation of shared state management and cross-visualization coordination.
- Data integration, debugging, and performance optimization.

### Keenan Tait — 33%

- Design Sheets 2, 3, and 4: Weekday-Hour Heatmap, Monthly Trend Line Chart, and Environmental and Roadway Conditions Bar Chart.
- D3.js implementation of the weekday-hour heatmap (Visualization 2), including color scales, axes, tooltips, and interactive cell selection.
- D3.js implementation of the monthly trend line chart (Visualization 3), including scales, axes, data binding, and interactive tooltips.
- Development of interactive filtering controls for temporal data exploration, including weekday, hour, and month selections.
- Testing and debugging of assigned visualization modules.

### Arshia Agarwal — 33%

- Design Sheets 1 and 5: U.S. Choropleth Map and State Comparison Bubble Scatterplot.
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

The dataset contains only fatal crashes and covers a single year. Crash counts are not adjusted for population or traffic exposure, and observed patterns should not be interpreted as causal relationships.

Future improvements could include multi-year comparisons, exposure-adjusted crash rates, additional demographic and roadway attributes, and data export functionality.

## Attribution

**Data:** National Highway Traffic Safety Administration (NHTSA), Fatality Analysis Reporting System (FARS), 2024 Accident table.

**Course:** CSE 478 — Data Visualization, Fall 2026.

Fatal-Roads is an educational project and is not an official NHTSA product.
