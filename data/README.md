# Fatal Roads — Data dictionary and validation notes

## Source and scope

- **Source:** National Highway Traffic Safety Administration (NHTSA), Fatality Analysis Reporting System (FARS), **2024 Accident table**. https://www.nhtsa.gov/research-data/fatality-analysis-reporting-system-fars
- **Geography:** 50 U.S. states and the District of Columbia (**51 jurisdictions**).
- **Unit of observation:** **One row = one fatal motor-vehicle traffic crash**, not one person killed. A crash may have multiple fatalities.
- **Interpretation:** Charts show **observed counts of fatal crashes or fatalities**, not the probability or rate of crashing. They are **not exposure-adjusted** (e.g., by population, vehicle miles traveled, traffic volume, or number of trips). Avoid calling a state, hour, or road condition inherently *riskier* based only on higher counts.
- **Data-version caution:** The totals below were cross-checked against the **uploaded cleaned files**, not independently reconciled with a particular official NHTSA release/version. If the source is refreshed, regenerate all derived files together.

## Verified totals and coverage

| Population or subset | Fatal crashes | Fatalities | Interpretation |
| --- | ---: | ---: | --- |
| All 2024 records | **36,297** | **39,254** | All crashes in `crashes_clean_2024` and unfiltered aggregate summaries |
| Known crash hour (0–23) | **36,044** | **38,988** | Used in all hour-based summaries and heatmaps |
| Unknown/invalid crash hour | **253** | **266** | Excluded **only** from hour-based summaries |
| Valid geographic point | **36,127** | **39,073** | Used in `geographic_points.csv` |
| Missing/invalid geographic coordinates | **170** | **181** | Excluded **only** from geographic points |

**Subsets overlap.** In the geographic dataset, **233 point records** have no usable crash hour. They should remain visible in unfiltered geographic views, but cannot be assigned to an hour-specific selection.

Coordinate-screening rule recorded by the processing report: latitude **18–72**, longitude **−180 to −60**; locations outside these bounds were excluded from the points dataset. This is a **screening rule**, not a guarantee that every retained coordinate is on a U.S. road.

## Files and schemas

The base name below identifies a CSV/JSON pair unless a specific extension is shown. Summaries have matching values in the two formats; use whichever format the dashboard JavaScript explicitly loads.

| File | Columns / properties | Rows | Meaning |
| --- | --- | ---: | --- |
| `crashes_clean_2024.csv` / `.json` | Original 80 FARS Accident-table columns (including `STATE`, `STATENAME`, `ST_CASE`, `MONTH`, `DAY`, `DAY_WEEK`, `HOUR`, `LATITUDE`, `LONGITUD`, `WEATHERNAME`, `LGT_CONDNAME`, `RUR_URBNAME`, `MAN_COLLNAME`, `FATALS`) | 36,297 | Crash-level cleaned reference data; the key is `ST_CASE` |
| `state_summary.csv` / `.json` | `state_code`, `state`, `crashes`, `fatalities`, `mean_fatalities_per_crash` | 51 | State/DC totals; `mean_fatalities_per_crash = fatalities / crashes` |
| `state_month_summary.csv` / `.json` | `state_code`, `state`, `month`, `crashes`, `fatalities` | 612 | State-by-month totals (51 × 12) |
| `monthly_summary.csv` / `.json` | `month`, `crashes`, `fatalities` | 12 | Calendar-month totals |
| `weekday_summary.csv` / `.json` | `weekday`, `weekday_name`, `crashes`, `fatalities` | 7 | Day-of-week totals |
| `hourly_summary.csv` / `.json` | `hour`, `crashes`, `fatalities` | 24 | Crash-hour totals (known-hour subset only) |
| `month_hour_heatmap.csv` / `.json` | `month`, `hour`, `crashes`, `fatalities` | 288 | Month × hour counts (12 × 24; known hours only) |
| `weekday_hour_heatmap.csv` / `.json` | `weekday`, `weekday_name`, `hour`, `crashes`, `fatalities` | 168 | Weekday × hour counts (7 × 24; known hours only) |
| `collision_type_summary.csv` / `.json` | `category`, `crashes`, `fatalities` | 11 | FARS `MAN_COLLNAME` groupings; first harmful event may not involve a collision with a moving motor vehicle |
| `lighting_summary.csv` / `.json` | `category`, `crashes`, `fatalities` | 9 | FARS light-condition label (`LGT_CONDNAME`) |
| `weather_summary.csv` / `.json` | `category`, `crashes`, `fatalities` | 13 | FARS weather label (`WEATHERNAME`) |
| `rural_urban_summary.csv` / `.json` | `category`, `crashes`, `fatalities` | 5 | FARS rural/urban classification (`RUR_URBNAME`) |
| `geographic_points.csv` | `st_case`, `state_code`, `state`, `month`, `day`, `weekday`, `weekday_name`, `hour`, `latitude`, `longitude`, `fatalities`, `weather`, `lighting`, `rural_urban` | 36,127 | Crash-level mapped coordinates with context for filtering |
| `geographic_sample_1000.geojson` | GeoJSON `FeatureCollection` of `Point` features; `geometry.coordinates` = `[longitude, latitude]`; properties: `st_case`, `fatalities`, `state` | 1,000 | **Development fixture only**; first 1,000 geographic rows, not a random/nationally representative sample |
| `quality_report.json` | `source`, `crashes`, `fatalities`, `invalid_hours`, `invalid_coordinates`, `valid_geographic_points`, `jurisdictions`, `coordinate_rule`, `note` | 1 object | Processing metadata and inclusion rules |

## Definitions and coding conventions

- **`crashes`:** number of crash records in the group; **`fatalities`:** sum of `FATALS` across those crash records. Never substitute one for the other.
- **Months:** `1` = January through `12` = December.
- **Weekdays (FARS):** `1` = Sunday, `2` = Monday, …, `7` = Saturday. This differs from JavaScript's `Date.getDay()` convention of `0` = Sunday.
- **Hours:** `0` = 12:00–12:59 a.m., …, `23` = 11:00–11:59 p.m.; **local crash-reported clock hour**, not a nationwide shared timezone. Out-of-range/unknown hours are omitted from hour-based aggregations. `hour` is blank for those records in `geographic_points.csv`.
- **State identifiers:** `state_code` is the numeric FARS state code, **not** the two-letter postal abbreviation. `ST_CASE` identifies a crash and must remain unique in the master and geographic files.
- **Geographic coordinates:** `latitude`, `longitude` are decimal degrees; GeoJSON point coordinate order is **longitude first, latitude second**.
- **Categories:** retain explicit `Unknown`, `Reported as Unknown`, `Not Reported`, `Other`, etc. where present; do not silently merge into a known condition.
- **Collision type:** the long category *“The First Harmful Event was Not a Collision with a Motor Vehicle in Transport”* is a legitimate FARS classification. It does **not** mean the crash was nonfatal or that no motor vehicle was involved.

## Geographic sample: important limitation

`geographic_sample_1000.geojson` contains **894 Alabama**, **62 Alaska**, and **44 Arizona** crash points, because it is the **first 1,000 valid geographic rows**, not a cross-country sample. All its point IDs/coordinates match the corresponding source rows, but **do not use it to represent U.S.-wide crash patterns** or to calculate national/state proportions.

If you need a **lightweight nationwide demo**, generate a new *documented, reproducible stratified sample* from `geographic_points.csv`, with coverage for all 51 jurisdictions, and label the display “sample” prominently. If the full spatial dashboard must support exact nationwide counts and filters, use the **full `geographic_points.csv`**, not this sample. The sample GeoJSON itself has **no month, weekday, or hour properties** and cannot independently power linked time filters.

## Integrity checks and dashboard instructions

1. Confirm that `crashes_clean_2024` has **36,297 unique `ST_CASE`** entries and `sum(FATALS) = 39,254`.
2. Check totals of all full-coverage summaries (state, state-month, monthly, weekday, collision, lighting, weather, rural/urban): **36,297 crashes; 39,254 fatalities**.
3. Check totals of hour-based summaries (`hourly_summary`, `month_hour_heatmap`, `weekday_hour_heatmap`): **36,044 crashes; 38,988 fatalities**.
4. Check mapped record count (**36,127**) and mapped fatalities (**39,073**). Do not force these to equal full-coverage totals.
5. Verify any chart filters that combine geography and hour explicitly handle missing `hour`, and make clear when a chart excludes unknown values.
6. Confirm the dashboard's `fetch()`/`d3.csv()`/`d3.json()` paths before removing either side of a CSV/JSON pair.
7. Avoid labeling raw fatal crash **counts** as per-driver, per-mile, per-trip, or exposure-adjusted **risk**.

## Maintenance

- The cleaned files are derivatives of an existing NHTSA FARS Accident table; regenerate summaries if the master source changes. Retain a record of the official source release/version and preprocessing steps if available.
- Do not keep duplicate upload artifacts such as `geographic_points(1).csv` in the repository. That local duplicate was verified byte-for-byte identical to `geographic_points.csv`.
- All row counts and cross-checks in this document refer to the files uploaded for the **November 2026 project review**.
