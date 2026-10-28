# FARS 2024 D3-ready data

Source: NHTSA Fatality Analysis Reporting System, 2024 Accident table.
https://www.nhtsa.gov/research-data/fatality-analysis-reporting-system-fars

Each crash-level row represents one fatal crash; `fatalities` is the number of people killed.

## File schemas
- `state_summary`: state_code, state, crashes, fatalities, mean_fatalities_per_crash
- `monthly_summary`: month, crashes, fatalities
- `weekday_hour_heatmap`: weekday (FARS 1=Sunday to 7=Saturday), weekday_name, hour, crashes, fatalities
- `weather_summary`, `lighting_summary`, `rural_urban_summary`: category, crashes, fatalities
- `geographic_points`: st_case, state_code, state, month, day, weekday, weekday_name, hour, latitude, longitude, fatalities, weather, lighting, rural_urban

All summaries include fatal crash counts and fatality totals. Invalid hours are omitted from hour-based summaries, and invalid coordinates are omitted only from geographic points. Unknown weather and lighting categories remain explicit.

Copy files from this folder directly into the repository `data/` directory.
