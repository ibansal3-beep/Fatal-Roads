# Fatal-Roads

**Exploring Patterns in U.S. Traffic Fatalities**  
CSE 478 — Data Visualization | Fall 2026

## Project overview
Fatal-Roads is an interactive D3.js data story examining where, when, and under what conditions fatal motor vehicle crashes occurred in the United States in 2024. The project uses the National Highway Traffic Safety Administration (NHTSA) Fatality Analysis Reporting System (FARS) accident-level dataset. The visualizations describe patterns and associations, not causal relationships or exposure-adjusted risk.

## Research question
How do geographic location, time, environmental conditions, and roadway characteristics relate to the distribution of fatal traffic crashes across the United States in 2024?

## Dataset
- **Source:** [NHTSA Fatality Analysis Reporting System](https://static.nhtsa.gov/nhtsa/downloads/FARS/2024/National/FARS2024NationalCSV.zip)
- **Records:** 36,297 fatal crashes
- **Attributes:** 80
- **Fatalities recorded:** 39,254
- **Geographic points with valid coordinates after cleaning:** 36,127

The dataset includes crash-level identifiers, locations, dates/times, fatality counts, weather, lighting, and roadway classifications. Missing and unknown values are handled separately for each analysis. Counts are not normalized by population or vehicle miles traveled.

## Planned visualizations
1. **U.S. choropleth map:** compare state-level fatal crash counts.
2. **Weekday-hour heatmap:** examine temporal patterns.
3. **Monthly line chart:** examine trends through 2024.
4. **Condition bar chart:** compare weather, lighting, and rural/urban categories.
5. **Bubble scatterplot:** compare state crash counts, fatalities, and average fatalities per crash.

### Innovative view: Fatality Risk Explorer
A coordinated geographic crash-point map and weekday-hour heatmap. Selecting a time interval filters the map, and selecting a state updates temporal summaries. Despite its name, the explorer displays observed fatal crash counts, not exposure-adjusted risk.

### Team Responsibilities

# Ishita Bansal 
- Dataset acquisition, cleaning, preprocessing, and validation.
- Data abstraction and preparation of CSV/JSON files for D3.js.
- Implementation of the U.S. choropleth map (Visualization 1).
- Development of the innovative Fatality Risk Explorer (Visualization 6).
- Implementation of shared state management and cross-visualization coordination.
- Data integration, debugging, and performance optimization.

# Keenan Tait 
- Design Sheet 2: Weekday-Hour Heatmap.
- Design Sheet 3: Monthly Trend Line Chart.
- Design Sheet 4: Environmental and Roadway Conditions Bar Chart.
- **D3.js implementation of the weekday-hour heatmap (Visualization 2)**, including color scales, axes, tooltips, and interactive cell selection.
- **D3.js implementation of the monthly trend line chart (Visualization 3)**, including scales, axes, data binding, and interactive tooltips.
- **Development of interactive filtering controls** for temporal data exploration, including weekday, hour, and month selections.
- Testing and debugging of assigned visualization modules.

# Arshia Agarwal 
- Design Sheet 1: U.S. Choropleth Map.
- Design Sheet 5: State Comparison Bubble Scatterplot.
- D3.js implementation of the environmental and roadway conditions bar chart (Visualization 4).
- D3.js implementation of the state comparison bubble scatterplot (Visualization 5).
- Dashboard interface design, CSS styling, and responsive layout.
- UI testing, usability improvements, and component integration.

## Shared Responsibilities
- Project planning and visualization design discussions.
- GitHub collaboration and version control.
- Integration testing, debugging, and quality assurance.
- Project documentation, final report, and presentation preparation.

### Run locally
1. Clone or download this repository.
2. Open the folder in Visual Studio Code.
3. Install the **Live Server** extension if needed.
4. Right-click `index.html` and choose **Open with Live Server**.
5. The dashboard will open in a browser. No npm installation is required.

### Folder guide
- `index.html`: dashboard entry point.
- `css/style.css`: visual styles.
- `js/main.js`: application entry point and shared state.
- `js/dataLoader.js`: load and validate datasets.
- `js/stateMap.js`: choropleth map.
- `js/temporalHeatmap.js`: weekday-hour heatmap.
- `js/monthlyTrend.js`: monthly line chart.
- `js/conditionBar.js`: categorical bar chart.
- `js/bubbleScatter.js`: state comparison scatterplot.
- `js/fatalityExplorer.js`: innovative coordinated view.
- `data/`: processed CSV and JSON datasets.
- `assets/`: optional static assets.
- `screenshots/`: development screenshots for reports.

### Development workflow
Use feature branches (for example, `feature/state-map`) and pull requests to merge into `main`. Review each other's changes and verify that Live Server works after merging.

## Attribution
Data: National Highway Traffic Safety Administration, Fatality Analysis Reporting System (FARS), 2024 Accident table. The dashboard is an educational CSE 478 project and is not an official NHTSA product.
