// ============================================================
// FreightIQ — Data Validation & Quality Engine (Phase 12)
//
// Validates incoming data records, scores quality,
// detects duplicates, and tracks freshness.
// ============================================================

import type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  DataQualityReport,
  DataQualityCategoryScore,
  FreshnessConfig,
  FreshnessLevel,
  DataPlatformConfig,
} from "@/types/data-platform";

// ---- Default Config ----

const DEFAULT_VALIDATION_CONFIG: DataPlatformConfig["validation"] = {
  maxFreightRate: 100,
  minFreightRate: 0.5,
  maxLatitude: 90,
  minLatitude: -90,
  maxLongitude: 180,
  minLongitude: -180,
  maxDraft: 25,
  maxDWT: 400000,
};

const DEFAULT_FRESHNESS_CONFIG: FreshnessConfig = {
  freshThresholdHours: 6,
  agingThresholdHours: 24,
  staleThresholdHours: 72,
};

// ---- Validation ----

export function validateFreightRecord(
  record: { ratePerTonne: number; tcePerDay: number; date: string; originPortId: string; destinationPortId: string },
  config = DEFAULT_VALIDATION_CONFIG,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Rate validation
  if (typeof record.ratePerTonne !== "number" || isNaN(record.ratePerTonne)) {
    errors.push({ field: "ratePerTonne", value: record.ratePerTonne, reason: "Rate must be a number", severity: "error" });
  } else if (record.ratePerTonne < config.minFreightRate) {
    errors.push({ field: "ratePerTonne", value: record.ratePerTonne, reason: `Rate below minimum (${config.minFreightRate})`, severity: "error" });
  } else if (record.ratePerTonne > config.maxFreightRate) {
    warnings.push({ field: "ratePerTonne", value: record.ratePerTonne, reason: `Rate unusually high (>${config.maxFreightRate})` });
  }

  // TCE validation
  if (typeof record.tcePerDay !== "number" || isNaN(record.tcePerDay)) {
    errors.push({ field: "tcePerDay", value: record.tcePerDay, reason: "TCE must be a number", severity: "error" });
  } else if (record.tcePerDay < 0) {
    errors.push({ field: "tcePerDay", value: record.tcePerDay, reason: "TCE cannot be negative", severity: "error" });
  }

  // Date validation
  if (!record.date || isNaN(Date.parse(record.date))) {
    errors.push({ field: "date", value: record.date, reason: "Invalid date format", severity: "error" });
  }

  // Port validation
  if (!record.originPortId) errors.push({ field: "originPortId", value: record.originPortId, reason: "Origin port required", severity: "error" });
  if (!record.destinationPortId) errors.push({ field: "destinationPortId", value: record.destinationPortId, reason: "Destination port required", severity: "error" });

  const score = errors.length === 0 ? (warnings.length === 0 ? 100 : 85) : Math.max(0, 60 - errors.length * 15);

  return { valid: errors.length === 0, errors, warnings, score };
}

export function validateVesselRecord(
  record: { dwt: number; draft: number; loa: number; beam: number; currentLat: number; currentLon: number },
  config = DEFAULT_VALIDATION_CONFIG,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (record.dwt <= 0 || record.dwt > config.maxDWT) errors.push({ field: "dwt", value: record.dwt, reason: `DWT must be 0-${config.maxDWT}`, severity: "error" });
  if (record.draft <= 0 || record.draft > config.maxDraft) errors.push({ field: "draft", value: record.draft, reason: `Draft must be 0-${config.maxDraft}m`, severity: "error" });
  if (record.loa <= 0 || record.loa > 500) errors.push({ field: "loa", value: record.loa, reason: "LOA must be 0-500m", severity: "error" });
  if (record.beam <= 0 || record.beam > 80) errors.push({ field: "beam", value: record.beam, reason: "Beam must be 0-80m", severity: "error" });
  if (record.currentLat < config.minLatitude || record.currentLat > config.maxLatitude) errors.push({ field: "currentLat", value: record.currentLat, reason: "Invalid latitude", severity: "error" });
  if (record.currentLon < config.minLongitude || record.currentLon > config.maxLongitude) errors.push({ field: "currentLon", value: record.currentLon, reason: "Invalid longitude", severity: "error" });

  const score = errors.length === 0 ? 100 : Math.max(0, 80 - errors.length * 20);
  return { valid: errors.length === 0, errors, warnings, score };
}

export function validatePortRecord(
  record: { maxDraft: number; maxLOA: number; maxBeam: number; latitude: number; longitude: number; handlingRate: number },
  config = DEFAULT_VALIDATION_CONFIG,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (record.maxDraft <= 0 || record.maxDraft > config.maxDraft) errors.push({ field: "maxDraft", value: record.maxDraft, reason: `Draft must be 0-${config.maxDraft}m`, severity: "error" });
  if (record.maxLOA <= 0) errors.push({ field: "maxLOA", value: record.maxLOA, reason: "LOA must be positive", severity: "error" });
  if (record.maxBeam <= 0) errors.push({ field: "maxBeam", value: record.maxBeam, reason: "Beam must be positive", severity: "error" });
  if (record.latitude < config.minLatitude || record.latitude > config.maxLatitude) errors.push({ field: "latitude", value: record.latitude, reason: "Invalid latitude", severity: "error" });
  if (record.longitude < config.minLongitude || record.longitude > config.maxLongitude) errors.push({ field: "longitude", value: record.longitude, reason: "Invalid longitude", severity: "error" });
  if (record.handlingRate <= 0) warnings.push({ field: "handlingRate", value: record.handlingRate, reason: "Handling rate should be positive" });

  const score = errors.length === 0 ? (warnings.length === 0 ? 100 : 90) : Math.max(0, 70 - errors.length * 15);
  return { valid: errors.length === 0, errors, warnings, score };
}

// ---- Freshness ----

export function computeFreshness(lastUpdated: string, config: FreshnessConfig = DEFAULT_FRESHNESS_CONFIG): FreshnessLevel {
  const now = new Date();
  const updated = new Date(lastUpdated);
  const hoursDiff = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);

  if (hoursDiff <= config.freshThresholdHours) return "FRESH";
  if (hoursDiff <= config.agingThresholdHours) return "AGING";
  return "STALE";
}

// ---- Deduplication ----

export function deduplicateByKey<T>(records: T[], keyFn: (r: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const record of records) {
    const key = keyFn(record);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(record);
    }
  }
  return result;
}

// ---- Data Quality Scoring ----

export function computeDataQualityReport(
  categories: {
    name: string;
    records: unknown[];
    missingField?: string;
  }[],
): DataQualityReport {
  const categoryScores: DataQualityCategoryScore[] = [];

  for (const cat of categories) {
    const total = cat.records.length;
    let missingCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;

    // Check for missing required fields
    if (cat.missingField) {
      missingCount = cat.records.filter((r: any) => !r[cat.missingField!]).length;
    }

    // Check for duplicates (by JSON.stringify)
    const seen = new Set<string>();
    for (const r of cat.records) {
      const key = JSON.stringify(r);
      if (seen.has(key)) duplicateCount++;
      else seen.add(key);
    }

    // Score: 100 - penalties
    const missingPenalty = total > 0 ? (missingCount / total) * 30 : 0;
    const dupPenalty = total > 0 ? (duplicateCount / total) * 20 : 0;
    const score = Math.round(Math.max(0, 100 - missingPenalty - dupPenalty));

    const level = score >= 90 ? "HIGH" : score >= 70 ? "MEDIUM" : "LOW";

    categoryScores.push({
      category: cat.name,
      score,
      level,
      recordCount: total,
      missingCount,
      duplicateCount,
      invalidCount,
      staleCount: 0,
      explanation: `${cat.name}: ${total} records, quality ${score}/100.`,
    });
  }

  const overallScore = categoryScores.length > 0
    ? Math.round(categoryScores.reduce((s, c) => s + c.score, 0) / categoryScores.length)
    : 0;

  return {
    overallScore,
    overallLevel: overallScore >= 90 ? "HIGH" : overallScore >= 70 ? "MEDIUM" : "LOW",
    categoryScores,
    generatedAt: new Date().toISOString(),
  };
}

// ---- Data Freshness Summary ----

export function computeFreshnessSummary(
  sources: { name: string; lastUpdated: string; dataStatus: string }[],
  config: FreshnessConfig = DEFAULT_FRESHNESS_CONFIG,
): { name: string; freshness: FreshnessLevel; dataStatus: string; lastUpdated: string }[] {
  return sources.map((s) => ({
    name: s.name,
    freshness: s.dataStatus === "SIMULATED" ? "FRESH" as const : computeFreshness(s.lastUpdated, config),
    dataStatus: s.dataStatus,
    lastUpdated: s.lastUpdated,
  }));
}
