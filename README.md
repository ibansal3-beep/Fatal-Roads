# Fatal Roads

**Exploring Patterns in U.S. Fatal Traffic Crashes**  
**CSE 478 — Data Visualization | Fall 2026**

Fatal Roads is an interactive, narrative-driven [D3.js](https://d3js.org/) dashboard examining **where, when, and under what recorded conditions fatal motor vehicle crashes occurred in the United States in 2024**. It combines a guided data story with interactive views for geographic, temporal, categorical, and multivariate exploration.

> **Interpretation:** The dashboard reports observed fatal crash and fatality counts. It does **not** estimate individual driving risk, adjust for exposure, or establish causation.

## Research Question

> How do geographic location, time, environmental conditions, and roadway characteristics relate to the distribution of fatal traffic crashes across the United States in 2024?

## Data Source and Scope

The data comes from the National Highway Traffic Safety Administration (NHTSA) [Fatality Analysis Reporting System (FARS), 2024 National Accident Data](https://static.nhtsa.gov/nhtsa/downloads/FARS/2024/National/FARS2024NationalCSV.zip). Each crash-level record represents **one fatal crash**, which may involve more than one fatality.

| Measure | Value |
| --- | ---: |
| Fatal crash records | **36,297** |
| Fatalities recorded | **39,254** |
| Geographic coverage | **50 states and Washington, D.C.** |
| Records with valid geographic coordinates | **36,127** |
| Records with valid weekday–hour information nationwide | **36,044** |
| Geocoded records with valid weekday–hour information | **35,894** |

The data contains crash identifiers, state information, location coordinates, date and time fields, fatality counts, weather, lighting, and rural/urban classifications. The original FARS accident table contains 80 attributes; the project uses a selected and transformed subset.

### Data Preparation and Validation

The source accident data was processed into crash-level and aggregated CSV/JSON datasets. Preparation involved:

- Selecting relevant variables and converting numeric and categorical fields.
- Preserving missing or unknown values instead of inventing replacements.
- Validating geographic coordinates for crash-point maps.
- Aggregating counts and fatality totals by state, month, weekday/hour, and recorded conditions.
- Deriving average fatalities per fatal crash where appropriate.
- Cross-checking summary totals against the cleaned crash-level records.

**Different views use different subsets:**

- **National crash-level and monthly/state/condition summaries:** 36,297 crashes.
- **National weekday–hour heatmap:** 36,044 crashes; 253 records lack usable time information.
- **Geographic point explorer:** 36,127 crashes with valid coordinates; 170 are excluded due to invalid coordinates.
- **Fatality Signature time cells:** 35,894 records that have both valid geographic coordinates and usable weekday/hour values. Of the geocoded records, 233 lack usable weekday/hour information.

See [`data/README.md`](data/README.md) for dataset descriptions and [`data/quality_report.json`](data/quality_report.json) for quality checks.

## Visualizations

The dashboard contains **seven D3 visualization components** presented as a guided story and an optional exploration mode.

| # | Visualization | What it shows | Key interaction |
| --- | --- | --- | --- |
| 1 | **U.S. Choropleth Map** | Fatal crashes or fatalities by state | Switch the measure and inspect/select states |
| 2 | **Monthly Trend** | Monthly fatal crash or fatality totals in 2024 | Switch measure and inspect monthly values |
| 3 | **Weekday × Hour Heatmap** | A 7 × 24 view of fatal crash counts by day and hour | Inspect/select time cells |
| 4 | **Recorded Conditions Bar Chart** | Counts by weather, lighting, or rural/urban category | Switch categories and inspect bars |
| 5 | **State Comparison Bubble Scatterplot** | State fatal crashes versus fatalities, with bubble size representing average fatalities per crash | Inspect and compare states |
| 6 | **Fatality Signature Explorer** | A radial profile combining weekday, hour, crash count, darkness share, and fatalities-per-crash markers | Select a state and inspect individual cells |
| 7 | **Space-Time Crash Explorer** | A crash-location map coordinated with a weekday–hour heatmap | Filter by state/time and reset selections |

### Fatality Signature: Custom Multivariate View

The **Fatality Signature Explorer** is a custom radial visualization designed to bring several crash attributes into one view. Its seven weekday rings and 24 hourly segments encode crash counts by color intensity. A blue band represents the share of crashes recorded in darkness, while pink markers flag cells meeting a national top-10% average-fatalities-per-crash benchmark, subject to a minimum sample size of five crashes. The color scale is recalculated for the selected state, so **color intensity should be compared within a selected profile, not directly between different state profiles**.

### Space-Time Crash Explorer: Linked Views

The optional **Space-Time Crash Explorer** links plotted crash locations to a weekday–hour heatmap. A state selection changes the geographic subset; a heatmap selection highlights matching crash locations. Combined selections and a reset control support exploratory analysis. These are recorded events, not estimates of the probability or risk of a crash.

## Interactive Features

- Story navigation across geography, time, conditions, comparisons, synthesis, and exploration.
- Chart-specific tooltips, selections, and metric/category controls.
- Shared state or coordinated selections where supported; **not every filter changes every chart**.
- State selection in the Fatality Signature and Space-Time Crash Explorer.
- Reset functionality for dashboard filters.
- Responsive layout and descriptive text explaining the interpretation and limitations of each view.

## Technology Stack

| Technology | Use |
| --- | --- |
| HTML5 and CSS3 | Page structure, story layout, responsive styling |
| JavaScript (ES modules) | Initialization, loading, interaction, and shared state |
| [D3.js v7](https://d3js.org/) | Charts, geographic projections, scales, and interactive rendering |
| [TopoJSON Client](https://github.com/topojson/topojson-client) and [us-atlas](https://github.com/topojson/us-atlas) | U.S. state boundary geometry |
| CSV and JSON | Cleaned crash records and aggregated summaries |
| Git and GitHub | Version control and repository hosting |

D3, TopoJSON Client, and U.S. atlas boundaries are requested from external CDNs, so the dashboard needs network access to these resources unless they are hosted locally.

## Repository Structure

```text
Fatal-Roads/
├── index.html                # Main dashboard and data story
├── css/
│   └── style.css            # Dashboard styles and responsive layout
├── js/
│   ├── main.js              # Application initialization and filter coordination
│   ├── dataLoader.js        # CSV loading and data conversion
│   ├── stateMap.js          # State choropleth
│   ├── monthlyTrend.js      # Monthly trend chart
│   ├── temporalHeatmap.js   # Weekday-hour heatmap
│   ├── conditionBar.js      # Conditions bar chart
│   ├── bubbleScatter.js     # State comparison scatterplot
│   ├── fatalitySignature.js # Custom radial Fatality Signature
│   └── fatalityExplorer.js  # Linked geographic and temporal explorer
├── data/
│   ├── README.md            # Data dictionary and processing notes
│   ├── quality_report.json  # Data quality summary
│   └── ...                  # Processed CSV/JSON data files
├── assets/                  # Static assets (if used)
├── screenshots/             # Project screenshots
└── README.md                # This file
```

*This tree shows the main project files. Temporary backups or unused development samples should be removed only after final testing.*

## Running Locally

**Option A — Visual Studio Code Live Server**

1. Clone the repository:

   ```bash
   git clone https://github.com/ibansal3-beep/Fatal-Roads.git
   cd Fatal-Roads
   ```

2. Open the folder in Visual Studio Code.
3. Install the **Live Server** extension, if necessary.
4. Right-click `index.html` and select **Open with Live Server**.
5. Explore the dashboard in your browser.

**Option B — Python local server**

From the repository directory, run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

No Node.js package installation or backend service is required. **Do not open the page directly with a `file://` URL**; use an HTTP server so the browser can load CSV files and JavaScript modules correctly.

## Testing and Validation

**Static/Data Checks:** The crash and fatality totals, data-quality counts, and relevant summary datasets were checked against the prepared data. The active JavaScript modules passed syntax checks, and the HTML was checked for expected visualization containers, duplicate IDs, and in-page navigation targets.

**Project Verification:** The project has been verified as working and correct including such aspects: end-to-end chart rendering, selector and filter behavior, linked interactions, reset controls, browser console errors, CDN availability, and mobile/tablet layout behavior.

## Team Contributions

The following is the agreed project contribution allocation. Review and testing contributions should be described as completed only after the assigned evaluation work has been performed.

### Arshia Agarwal — 30%

- **Design Sketch (5%):** Created pages 1–2 of the design sheets.
- **Project Writeup (10%):** Prepared the final project writeup.
- **Work-in-Progress Report (10%):** Prepared assigned sections of the work-in-progress report.
- **System Review and Testing (5%):** Review and test the complete Fatal Roads system.

### Ishita Bansal — 40%

- **Complete System Development (30%):** Developed the complete Fatal Roads system.
- **Project Storyline Development (5%):** Storyline design and refinement. 
- **GitHub Deployment (5%):** Creation and handling of project GitHub repository.

### Keenan Tait — 30%

- **Design Sketch (5%):** Created pages 3–5 of the design sheets.
- **Project Poster (5%):** Prepared the project poster.
- **Project Proposal (10%):** Prepared the project proposal.
- **Work-in-Progress Report (5%):** Prepared assigned sections of the work-in-progress report.
- **System Review and Testing (5%):** Review and test the complete Fatal Roads system.

## Limitations

- **Fatal crashes only:** The dataset does not contain all crashes, including nonfatal crashes.
- **Single year:** 2024 records cannot establish multi-year trends.
- **Missing and invalid data:** Some records are excluded from geographic and time-based views, as detailed above.
- **Counts are not risks:** State and condition totals are not normalized by population, traffic volume, vehicle miles traveled, or other exposure measures.
- **No causal inference:** Weather, lighting, location, and time describe observed circumstances and associations, not the causes of crashes.
- **Cross-state comparison:** State averages and totals can vary with sample size and traffic exposure.

Possible future work includes multi-year comparisons, carefully documented exposure-adjusted measures, additional attributes, and exportable views.

## References and Attribution

- **Data:** [NHTSA Fatality Analysis Reporting System (FARS)](https://www.nhtsa.gov/research-data/fatality-analysis-reporting-system-fars), [2024 National CSV](https://static.nhtsa.gov/nhtsa/downloads/FARS/2024/National/FARS2024NationalCSV.zip).
- **Visualization library:** [D3.js](https://d3js.org/).
- **Map utilities:** [TopoJSON Client](https://github.com/topojson/topojson-client) and [us-atlas](https://github.com/topojson/us-atlas).
- **Course:** CSE 478 — Data Visualization, Fall 2026.

Fatal Roads is an educational project and is **not an official NHTSA product**.
