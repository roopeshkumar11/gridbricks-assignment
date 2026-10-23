from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Raw Elexon Models
class WindActualRecord(BaseModel):
    dataset: str = "FUELHH"
    publishTime: str
    startTime: str
    settlementDate: str
    settlementPeriod: int
    fuelType: str = "WIND"
    generation: float

class WindForecastRecord(BaseModel):
    dataset: str = "WINDFOR"
    publishTime: str
    startTime: str
    generation: float

# Aligned Record for Comparison
class AlignedWindRecord(BaseModel):
    startTime: str
    targetDate: str
    hour: int
    settlementPeriod: Optional[int] = None
    forecastGenerationMW: float
    actualGenerationMW: Optional[float] = None
    forecastPublishTime: str
    leadTimeHours: float
    errorMW: Optional[float] = None          # Forecast - Actual (positive = over-forecast)
    absErrorMW: Optional[float] = None       # |Forecast - Actual|
    percentageError: Optional[float] = None  # (|Forecast - Actual| / Actual) * 100

# Metric summary
class AccuracyMetrics(BaseModel):
    sampleCount: int
    maeMW: float
    rmseMW: float
    mapePercent: float
    mbeBiasMW: float
    nmaeCapacityPercent: float
    nmaeMeanPercent: float
    stdDevMW: float
    maxOverforecastMW: float
    maxUnderforecastMW: float
    r2Score: Optional[float] = None
    p05MW: float
    p10MW: float
    p25MW: float
    p50MedianMW: float
    p75MW: float
    p90MW: float
    p95MW: float

# Horizon analysis
class HorizonAccuracyItem(BaseModel):
    bucket: str
    minLeadTimeHours: float
    maxLeadTimeHours: float
    sampleCount: int
    maeMW: float
    rmseMW: float
    mapePercent: float
    biasMW: float

# Diurnal / Settlement Period analysis
class PeriodAccuracyItem(BaseModel):
    periodOrHour: int
    timeLabel: str
    sampleCount: int
    actualMeanMW: float
    forecastMeanMW: float
    maeMW: float
    rmseMW: float
    biasMW: float

# Daily performance
class DailyAccuracyItem(BaseModel):
    date: str
    sampleCount: int
    actualMeanMW: float
    forecastMeanMW: float
    maeMW: float
    rmseMW: float
    mapePercent: float
    biasMW: float
    volatilityStatus: str  # "Normal", "High Wind / Storm", "Low Wind"

# Error distribution histogram bin
class HistogramBin(BaseModel):
    binStart: float
    binEnd: float
    binCenter: float
    count: int
    frequency: float

# Day-Ahead Comparison Response
class DayAheadComparisonResponse(BaseModel):
    decisionDate: str
    cutoffTime: str
    deliveryDate: str
    aggregation: str  # "hourly" or "half-hourly"
    records: List[AlignedWindRecord]
    metrics: Optional[AccuracyMetrics] = None

# Forecast Evolution Response
class ForecastRevisionPoint(BaseModel):
    publishTime: str
    targetStartTime: str
    forecastMW: float
    leadTimeHours: float

class ForecastEvolutionResponse(BaseModel):
    targetStartTime: str
    deliveryDate: str
    actualMW: Optional[float] = None
    revisions: List[ForecastRevisionPoint]

# Net Demand & Procurement Plan
class ProcurementPeriodItem(BaseModel):
    period: int
    startTime: str
    timeLabel: str
    consumerDemandMW: float
    expectedWindMW: float
    riskBufferMW: float
    netDemandUnbufferedMW: float
    netDemandRiskAdjustedMW: float
    actualWindMW: Optional[float] = None
    actualProcurementShortfallMW: Optional[float] = None

class ProcurementPlanResponse(BaseModel):
    decisionDate: str
    deliveryDate: str
    confidenceLevel: float  # e.g., 0.90 for 90%
    bufferMethod: str
    totalDemandMWh: float
    totalExpectedWindMWh: float
    totalUnbufferedProcurementMWh: float
    totalRiskAdjustedProcurementMWh: float
    totalRiskBufferMWh: float
    periods: List[ProcurementPeriodItem]

# Comprehensive Metrics Report Response
class ComprehensiveMetricsResponse(BaseModel):
    overall: AccuracyMetrics
    distribution: List[HistogramBin]
    byHorizon: List[HorizonAccuracyItem]
    byPeriod: List[PeriodAccuracyItem]
    dailyBreakdown: List[DailyAccuracyItem]
