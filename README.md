# Fatal-Roads

**Exploring Patterns in U.S. Traffic Fatalities**  
CSE 478 — Data Visualization | Fall 2026

## Project overview
Fatal-Roads is an interactive D3.js data story examining where, when, and under what conditions fatal motor vehicle crashes occurred in the United States in 2024. The project uses the National Highway Traffic Safety Administration (NHTSA) Fatality Analysis Reporting System (FARS) accident-level dataset. The visualizations describe patterns and associations, not causal relationships or exposure-adjusted risk.

## Research question
How do geographic location, time, environmental conditions, and roadway characteristics relate to the distribution of fatal traffic crashes across the United States in 2024?

## Dataset
- **Source:** [NHTSA Fatality Analysis Reporting System](https://www.nhtsa.gov/research-data/fatality-analysis-reporting-system-fars)
- **Table:** 2024 FARS Accident
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

## Team and responsibilities
| Member | Email | Focus |
|---|---|---|
| Ishita Bansal | ibansal3@asu.edu | Dataset acquisition, cleaning and preparation (data folder), data abstraction, validation, choropleth map (Visualization 1), innovative Fatality Risk Explorer (Visualization 6), data integration|
| Keenan Tait | ktait1@asu.edu | Heatmap, line chart, categorical bar chart, Temporal heatmap (Visualization 2), monthly line chart (Visualization 3), categorical bar chart (Visualization 4), interactive controls and filtering|
| Arshia Agarwal | asagarw4@asu.edu | Scatterplot, innovative view, interface design, Bubble scatterplot (Visualization 5), dashboard interface design, responsive layout, component integration and UI testing|

All team members collaborate on integration, testing, documentation, GitHub maintenance, and final reporting.

## Run locally
1. Clone or download this repository.
2. Open the folder in Visual Studio Code.
3. Install the **Live Server** extension if needed.
4. Right-click `index.html` and choose **Open with Live Server**.
5. The dashboard will open in a browser. No npm installation is required.

## Folder guide
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

## Development workflow
Use feature branches (for example, `feature/state-map`) and pull requests to merge into `main`. Review each other's changes and verify that Live Server works after merging.

## Attribution
Data: National Highway Traffic Safety Administration, Fatality Analysis Reporting System (FARS), 2024 Accident table. The dashboard is an educational CSE 478 project and is not an official NHTSA product.
