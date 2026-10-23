import io
import csv
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse

from backend.app.services.analytics import AnalyticsService
from backend.app.services.storage import StorageRepository
from backend.app.services.bmrs_client import BMRSClient
from backend.app.models.schemas import (
    DayAheadComparisonResponse,
    ForecastEvolutionResponse,
    ComprehensiveMetricsResponse,
    ProcurementPlanResponse,
)

router = APIRouter(prefix="/api")
storage = StorageRepository()
analytics = AnalyticsService(storage=storage)
bmrs_client = BMRSClient()

@router.get("/health")
def health_check():
    return {"status": "ok", "service": "BMRS Day-Ahead Wind Forecasting & Analytics"}

@router.get("/summary")
def get_system_summary():
    """Return storage status, actuals count, forecasts count, and date coverage."""
    counts = storage.get_counts()
    return {
        "status": "ready",
        "counts": counts,
        "supportedDecisionMonth": "January 2026",
        "defaultGateClosure": "11:00:00Z",
    }

@router.get("/comparison", response_model=DayAheadComparisonResponse)
def get_day_ahead_comparison(
    decision_date: str = Query("2026-01-05", description="Date when day-ahead decision was made (YYYY-MM-DD)"),
    cutoff_time: str = Query("11:00:00Z", description="Decision cutoff time / gate closure (e.g. 11:00:00Z)"),
    delivery_date: Optional[str] = Query(None, description="Delivery date (defaults to decision_date + 1)"),
    aggregation: str = Query("hourly", pattern="^(hourly|half-hourly)$", description="Aggregation mode"),
):
    """
    Get the latest wind forecast available at the decision cutoff time
    compared against actual generation outturns for the delivery day.
    """
    try:
        return analytics.get_day_ahead_comparison(
            decision_date=decision_date,
            cutoff_time=cutoff_time,
            delivery_date=delivery_date,
            aggregation=aggregation,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing comparison: {str(e)}")

@router.get("/forecast/evolution", response_model=ForecastEvolutionResponse)
def get_forecast_evolution(
    target_start_time: str = Query("2026-01-06T12:00:00Z", description="Target ISO start time"),
):
    """
    Get the trajectory of how forecasts for a specific target hour evolved
    across successive publication updates.
    """
    try:
        return analytics.get_forecast_evolution(target_start_time)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting forecast evolution: {str(e)}")

@router.get("/metrics/report", response_model=ComprehensiveMetricsResponse)
def get_metrics_report(
    month: str = Query("2026-01", description="Month prefix (YYYY-MM)"),
    cutoff_time: str = Query("11:00:00Z", description="Gate closure cutoff time"),
):
    """
    Get the comprehensive quantitative forecast accuracy report across all day-ahead
    decisions in January 2026 (MAE, RMSE, MAPE, Bias, Horizon degradation, Diurnal profile, Calendar heatmap).
    """
    try:
        return analytics.get_comprehensive_metrics_report(month_prefix=month, cutoff_time=cutoff_time)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating metrics report: {str(e)}")

@router.get("/procurement", response_model=ProcurementPlanResponse)
def get_procurement_plan(
    decision_date: str = Query("2026-01-05", description="Decision date"),
    cutoff_time: str = Query("11:00:00Z", description="Decision cutoff time"),
    delivery_date: Optional[str] = Query(None, description="Delivery date"),
    confidence_level: float = Query(0.90, ge=0.50, le=0.99, description="Risk confidence level (0.50 to 0.99)"),
    demand_preset: str = Query("winter_typical", description="Demand profile preset"),
):
    """
    Calculate day-ahead thermal power procurement schedule based on consumer demand,
    wind forecast, and quantified forecast shortfall risk buffer.
    """
    try:
        return analytics.calculate_procurement_plan(
            decision_date=decision_date,
            cutoff_time=cutoff_time,
            delivery_date=delivery_date,
            confidence_level=confidence_level,
            demand_profile_preset=demand_preset,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating procurement: {str(e)}")

@router.post("/sync")
async def trigger_sync(background_tasks: BackgroundTasks):
    """
    Trigger background synchronization from live Elexon BMRS API.
    """
    async def run_sync():
        try:
            fuelhh = await bmrs_client.fetch_fuelhh_actuals("2025-12-31T00:00:00Z", "2026-02-02T00:00:00Z", "WIND")
            storage.save_fuelhh_batch(fuelhh)
            windfor = await bmrs_client.fetch_windfor_forecasts("2025-12-31T00:00:00Z", "2026-02-02T00:00:00Z")
            storage.save_windfor_batch(windfor)
        except Exception as e:
            pass

    background_tasks.add_task(run_sync)
    return {"message": "Sync started in background with Elexon BMRS API"}

@router.get("/export/csv")
def export_comparison_csv(
    decision_date: str = Query("2026-01-05"),
    cutoff_time: str = Query("11:00:00Z"),
    delivery_date: Optional[str] = Query(None),
    aggregation: str = Query("hourly"),
):
    """Export aligned comparison data as CSV file."""
    comparison = analytics.get_day_ahead_comparison(
        decision_date=decision_date,
        cutoff_time=cutoff_time,
        delivery_date=delivery_date,
        aggregation=aggregation,
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Start Time", "Target Date", "Hour", "Settlement Period",
        "Forecast Generation (MW)", "Actual Generation (MW)",
        "Forecast Publish Time", "Lead Time (Hours)",
        "Error (MW: Forecast - Actual)", "Abs Error (MW)", "Percentage Error (%)"
    ])

    for r in comparison.records:
        writer.writerow([
            r.startTime, r.targetDate, r.hour, r.settlementPeriod,
            r.forecastGenerationMW, r.actualGenerationMW,
            r.forecastPublishTime, r.leadTimeHours,
            r.errorMW, r.absErrorMW, r.percentageError
        ])

    output.seek(0)
    filename = f"bmrs_day_ahead_{comparison.deliveryDate}_{aggregation}.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
