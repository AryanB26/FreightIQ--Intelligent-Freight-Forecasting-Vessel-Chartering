const requiredEnvVars = [
  "DATABASE_URL",
] as const;

export function validateEnv() {
  const missing = requiredEnvVars.filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    console.warn(
      `[FreightIQ] Missing environment variables: ${missing.join(", ")}. Running in demo mode.`
    );
  }
}

export const env = {
  databaseUrl: process.env.DATABASE_URL || "",
  forecastApiUrl: process.env.FORECAST_API_URL || "http://localhost:8000",
  forecastApiKey: process.env.FORECAST_API_KEY || "",
  appEnv: process.env.NEXT_PUBLIC_APP_ENV || "development",
  // Data platform provider mode
  dataProviderMode: (process.env.DATA_PROVIDER_MODE || "demo") as "demo" | "real",
  freightApiKey: process.env.FREIGHT_API_KEY || "",
  vesselApiKey: process.env.VESSEL_API_KEY || "",
  weatherApiKey: process.env.WEATHER_API_KEY || "",
  portApiKey: process.env.PORT_API_KEY || "",
} as const;
