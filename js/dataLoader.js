
/**
 * Fatal Roads — Data Loader
 * CSE 478 | NHTSA FARS 2024
 *
 * Responsibilities:
 * - Load CSV and JSON files
 * - Validate dataset availability
 * - Convert numeric attributes
 * - Load dashboard summary datasets
 * - Load geographic crash-point records
 * - Provide dataset validation utilities
 */

const DATA_PATH = "./data/";

// ----------------------------------------
// 1. Dataset configuration
// ----------------------------------------

const DATASETS = {
  states: "state_summary.csv",
  monthly: "monthly_summary.csv",
  heatmap: "weekday_hour_heatmap.csv",
  weather: "weather_summary.csv",
  lighting: "lighting_summary.csv",
  ruralUrban: "rural_urban_summary.csv",
  geographic: "geographic_points.csv"
};

// Numeric fields used across FARS datasets.
const NUMERIC_FIELDS = new Set([
  "state_code",
  "st_case",
  "month",
  "day",
  "weekday",
  "hour",
  "crashes",
  "fatalities",
  "count",
  "fatal_crashes",
  "total_fatalities",
  "mean_fatalities_per_crash",
  "latitude",
  "longitude"
]);

// ----------------------------------------
// 2. CSV loading
// ----------------------------------------

export async function loadCSV(filename) {
  const url = DATA_PATH + filename;

  try {
    const data = await d3.csv(url, row => {
      const converted = { ...row };

      for (const field of NUMERIC_FIELDS) {
        if (
          Object.prototype.hasOwnProperty.call(
            converted,
            field
          )
        ) {
          const value = converted[field];

          if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
          ) {
            converted[field] = null;
          } else {
            const number = Number(value);

            converted[field] =
              Number.isFinite(number)
                ? number
                : null;
          }
        }
      }

      return converted;
    });

    if (!data.length) {
      throw new Error("Dataset contains no records.");
    }

    console.log(
      `[DataLoader] Loaded ${filename}: ` +
      `${data.length.toLocaleString()} records`
    );

    return data;

  } catch (error) {
    console.error(
      `[DataLoader] Failed to load ${filename}`,
      error
    );

    throw new Error(
      `Unable to load ${filename}: ${error.message}`
    );
  }
}

// ----------------------------------------
// 3. JSON loading
// ----------------------------------------

export async function loadJSON(filename) {
  const url = DATA_PATH + filename;

  try {
    const data = await d3.json(url);

    if (data === null || data === undefined) {
      throw new Error("JSON response is empty.");
    }

    console.log(
      `[DataLoader] Loaded JSON: ${filename}`
    );

    return data;

  } catch (error) {
    console.error(
      `[DataLoader] Failed to load ${filename}`,
      error
    );

    throw new Error(
      `Unable to load ${filename}: ${error.message}`
    );
  }
}

// ----------------------------------------
// 4. Dashboard summary datasets
// ----------------------------------------

export async function loadDashboardData() {
  const [
    states,
    monthly,
    heatmap,
    weather,
    lighting,
    ruralUrban
  ] = await Promise.all([
    loadCSV(DATASETS.states),
    loadCSV(DATASETS.monthly),
    loadCSV(DATASETS.heatmap),
    loadCSV(DATASETS.weather),
    loadCSV(DATASETS.lighting),
    loadCSV(DATASETS.ruralUrban)
  ]);

  const dashboardData = {
    states,
    monthly,
    heatmap,
    weather,
    lighting,
    ruralUrban
  };

  console.log(
    "[DataLoader] Dashboard datasets ready."
  );

  return dashboardData;
}

// ----------------------------------------
// 5. Geographic crash-point dataset
// ----------------------------------------

export async function loadGeographicData() {
  const data = await loadCSV(DATASETS.geographic);

  const requiredFields = [
    "state_code",
    "weekday",
    "hour",
    "latitude",
    "longitude",
    "fatalities"
  ];

  const columns = Object.keys(data[0]);

  const missingFields = requiredFields.filter(
    field => !columns.includes(field)
  );

  if (missingFields.length) {
    throw new Error(
      "Geographic dataset missing columns: " +
      missingFields.join(", ")
    );
  }

  console.log(
    "[DataLoader] Geographic crash records ready."
  );

  return data;
}

// ----------------------------------------
// 6. Dataset validation utilities
// ----------------------------------------

export function validateDataset(
  data,
  requiredFields = []
) {
  if (!Array.isArray(data)) {
    return {
      valid: false,
      rowCount: 0,
      missingFields: requiredFields,
      message: "Dataset is not an array."
    };
  }

  if (data.length === 0) {
    return {
      valid: false,
      rowCount: 0,
      missingFields: requiredFields,
      message: "Dataset is empty."
    };
  }

  const columns = Object.keys(data[0]);

  const missingFields = requiredFields.filter(
    field => !columns.includes(field)
  );

  return {
    valid: missingFields.length === 0,
    rowCount: data.length,
    columns,
    missingFields,
    message: missingFields.length === 0
      ? "Dataset structure is valid."
      : "Missing required columns: " +
        missingFields.join(", ")
  };
}

// ----------------------------------------
// 7. State summary validation
// ----------------------------------------

export function validateStateSummary(states) {
  const validation = validateDataset(
    states,
    [
      "state_code",
      "state",
      "crashes",
      "fatalities",
      "mean_fatalities_per_crash"
    ]
  );

  if (!validation.valid) {
    return validation;
  }

  const totalCrashes = d3.sum(
    states,
    d => Number(d.crashes) || 0
  );

  const totalFatalities = d3.sum(
    states,
    d => Number(d.fatalities) || 0
  );

  const stateCodes = new Set(
    states.map(d => Number(d.state_code))
  );

  return {
    ...validation,
    totalCrashes,
    totalFatalities,
    jurisdictionCount: stateCodes.size,
    duplicateStateCodes:
      states.length - stateCodes.size
  };
}

// ----------------------------------------
// 8. Dataset information
// ----------------------------------------

export function getDatasetFiles() {
  return { ...DATASETS };
}
