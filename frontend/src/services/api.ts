import {
  SystemSummary,
  DayAheadComparisonResponse,
  ForecastEvolutionResponse,
  ComprehensiveMetricsResponse,
  ProcurementPlanResponse,
} from "../types";

// Sanitize API_BASE from environment variable, safely stripping any trailing slashes
const rawBase = (import.meta.env.VITE_API_URL || "").trim();
const API_BASE = rawBase ? rawBase.replace(/\/+$/, "") : "";

export async function pingHealth(): Promise<boolean> {
  try {
    const resp = await fetch(`${API_BASE}/api/health`);
    return resp.ok;
  } catch {
    return false;
  }
}

export async function fetchSummary(): Promise<SystemSummary> {
  const resp = await fetch(`${API_BASE}/api/summary`);
  if (!resp.ok) throw new Error("Failed to load system summary");
  return resp.json();
}

export async function fetchDayAheadComparison(
  decisionDate: string,
  cutoffTime: string = "11:00:00Z",
  deliveryDate?: string,
  aggregation: "hourly" | "half-hourly" = "hourly"
): Promise<DayAheadComparisonResponse> {
  const params = new URLSearchParams({
    decision_date: decisionDate,
    cutoff_time: cutoffTime,
    aggregation,
  });
  if (deliveryDate) {
    params.set("delivery_date", deliveryDate);
  }
  const resp = await fetch(`${API_BASE}/api/comparison?${params.toString()}`);
  if (!resp.ok) throw new Error("Failed to fetch day-ahead comparison");
  return resp.json();
}

export async function fetchForecastEvolution(
  targetStartTime: string
): Promise<ForecastEvolutionResponse> {
  const params = new URLSearchParams({ target_start_time: targetStartTime });
  const resp = await fetch(`${API_BASE}/api/forecast/evolution?${params.toString()}`);
  if (!resp.ok) throw new Error("Failed to fetch forecast evolution");
  return resp.json();
}

export async function fetchMetricsReport(
  month: string = "2026-01",
  cutoffTime: string = "11:00:00Z"
): Promise<ComprehensiveMetricsResponse> {
  const params = new URLSearchParams({ month, cutoff_time: cutoffTime });
  const resp = await fetch(`${API_BASE}/api/metrics/report?${params.toString()}`);
  if (!resp.ok) throw new Error("Failed to fetch metrics report");
  return resp.json();
}

export async function fetchProcurementPlan(
  decisionDate: string,
  cutoffTime: string = "11:00:00Z",
  deliveryDate?: string,
  confidenceLevel: number = 0.90,
  demandPreset: string = "winter_typical"
): Promise<ProcurementPlanResponse> {
  const params = new URLSearchParams({
    decision_date: decisionDate,
    cutoff_time: cutoffTime,
    confidence_level: confidenceLevel.toString(),
    demand_preset: demandPreset,
  });
  if (deliveryDate) {
    params.set("delivery_date", deliveryDate);
  }
  const resp = await fetch(`${API_BASE}/api/procurement?${params.toString()}`);
  if (!resp.ok) throw new Error("Failed to fetch procurement plan");
  return resp.json();
}

export async function triggerLiveSync(): Promise<{ message: string }> {
  const resp = await fetch(`${API_BASE}/api/sync`, { method: "POST" });
  if (!resp.ok) throw new Error("Failed to trigger sync");
  return resp.json();
}

export function getExportCsvUrl(
  decisionDate: string,
  cutoffTime: string = "11:00:00Z",
  deliveryDate?: string,
  aggregation: "hourly" | "half-hourly" = "hourly"
): string {
  const params = new URLSearchParams({
    decision_date: decisionDate,
    cutoff_time: cutoffTime,
    aggregation,
  });
  if (deliveryDate) {
    params.set("delivery_date", deliveryDate);
  }
  return `${API_BASE}/api/export/csv?${params.toString()}`;
}
