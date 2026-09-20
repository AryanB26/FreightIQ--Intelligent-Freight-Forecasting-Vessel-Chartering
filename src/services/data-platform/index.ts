// ============================================================
// FreightIQ — Data Platform Service (Phase 12)
// ============================================================

export { DataPlatform, getDataPlatform } from "./platform";
export {
  DemoFreightProvider,
  DemoVesselProvider,
  DemoPortProvider,
  DemoCommodityProvider,
  DemoFuelProvider,
  DemoEconomicProvider,
  DemoDisruptionProvider,
} from "./providers";
export {
  validateFreightRecord,
  validateVesselRecord,
  validatePortRecord,
  computeFreshness,
  deduplicateByKey,
  computeDataQualityReport,
  computeFreshnessSummary,
} from "./validation";
export type {
  DataPlatformConfig,
  DataProviderMode,
  DataQualityReport,
  DataQualityCategoryScore,
  FreshnessLevel,
  IngestionJob,
  DataSourceMetadata,
  FreightDataRecord,
  VesselDataRecord,
  PortDataRecord,
  CommodityDataRecord,
  FuelDataRecord,
  EconomicDataRecord,
  DisruptionDataRecord,
  ValidationResult,
  CurrencyRate,
} from "@/types/data-platform";
