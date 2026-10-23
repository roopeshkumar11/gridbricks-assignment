export interface StorageCounts {
  actualsCount: number;
  actualsMinTime: string | null;
  actualsMaxTime: string | null;
  forecastsCount: number;
  forecastsMinPublish: string | null;
  forecastsMaxPublish: string | null;
}

export interface SystemSummary {
  status: string;
  counts: StorageCounts;
  supportedDecisionMonth: string;
  defaultGateClosure: string;
}

export interface AlignedWindRecord {
  startTime: string;
  targetDate: string;
  hour: number;
  settlementPeriod?: number;
  forecastGenerationMW: number;
  actualGenerationMW?: number | null;
  forecastPublishTime: string;
  leadTimeHours: number;
  errorMW?: number | null;
  absErrorMW?: number | null;
  percentageError?: number | null;
}

export interface AccuracyMetrics {
  sampleCount: number;
  maeMW: number;
  rmseMW: number;
  mapePercent: number;
  mbeBiasMW: number;
  nmaeCapacityPercent: number;
  nmaeMeanPercent: number;
  stdDevMW: number;
  maxOverforecastMW: number;
  maxUnderforecastMW: number;
  r2Score?: number | null;
  p05MW: number;
  p10MW: number;
  p25MW: number;
  p50MedianMW: number;
  p75MW: number;
  p90MW: number;
  p95MW: number;
}

export interface DayAheadComparisonResponse {
  decisionDate: string;
  cutoffTime: string;
  deliveryDate: string;
  aggregation: "hourly" | "half-hourly";
  records: AlignedWindRecord[];
  metrics?: AccuracyMetrics | null;
}

export interface ForecastRevisionPoint {
  publishTime: string;
  targetStartTime: string;
  forecastMW: number;
  leadTimeHours: number;
}

export interface ForecastEvolutionResponse {
  targetStartTime: string;
  deliveryDate: string;
  actualMW?: number | null;
  revisions: ForecastRevisionPoint[];
}

export interface HistogramBin {
  binStart: number;
  binEnd: number;
  binCenter: number;
  count: number;
  frequency: number;
}

export interface HorizonAccuracyItem {
  bucket: string;
  minLeadTimeHours: number;
  maxLeadTimeHours: number;
  sampleCount: number;
  maeMW: number;
  rmseMW: number;
  mapePercent: number;
  biasMW: number;
}

export interface PeriodAccuracyItem {
  periodOrHour: number;
  timeLabel: string;
  sampleCount: number;
  actualMeanMW: number;
  forecastMeanMW: number;
  maeMW: number;
  rmseMW: number;
  biasMW: number;
}

export interface DailyAccuracyItem {
  date: string;
  sampleCount: number;
  actualMeanMW: number;
  forecastMeanMW: number;
  maeMW: number;
  rmseMW: number;
  mapePercent: number;
  biasMW: number;
  volatilityStatus: string;
}

export interface ComprehensiveMetricsResponse {
  overall: AccuracyMetrics;
  distribution: HistogramBin[];
  byHorizon: HorizonAccuracyItem[];
  byPeriod: PeriodAccuracyItem[];
  dailyBreakdown: DailyAccuracyItem[];
}

export interface ProcurementPeriodItem {
  period: number;
  startTime: string;
  timeLabel: string;
  consumerDemandMW: number;
  expectedWindMW: number;
  riskBufferMW: number;
  netDemandUnbufferedMW: number;
  netDemandRiskAdjustedMW: number;
  actualWindMW?: number | null;
  actualProcurementShortfallMW?: number | null;
}

export interface ProcurementPlanResponse {
  decisionDate: string;
  deliveryDate: string;
  confidenceLevel: number;
  bufferMethod: string;
  totalDemandMWh: number;
  totalExpectedWindMWh: number;
  totalUnbufferedProcurementMWh: number;
  totalRiskAdjustedProcurementMWh: number;
  totalRiskBufferMWh: number;
  periods: ProcurementPeriodItem[];
}
