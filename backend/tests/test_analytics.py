import pytest
import numpy as np
from backend.app.services.analytics import AnalyticsService
from backend.app.models.schemas import AccuracyMetrics

def test_calculate_metrics_basic():
    service = AnalyticsService()
    # Forecast: [1000, 2000, 3000]
    # Actual:   [900,  2200, 2900]
    # Errors:   [+100, -200, +100]
    errors = [100.0, -200.0, 100.0]
    actuals = [900.0, 2200.0, 2900.0]
    forecasts = [1000.0, 2000.0, 3000.0]

    metrics = service.calculate_metrics(errors, actuals, forecasts)

    # MAE = (|100| + |-200| + |100|) / 3 = 400 / 3 = 133.33
    assert pytest.approx(metrics.maeMW, 0.05) == 133.33
    # Bias = (100 - 200 + 100) / 3 = 0.0
    assert pytest.approx(metrics.mbeBiasMW, 0.05) == 0.0
    # RMSE = sqrt((100^2 + 200^2 + 100^2) / 3) = sqrt(60000 / 3) = sqrt(20000) = 141.42
    assert pytest.approx(metrics.rmseMW, 0.05) == 141.42
    assert metrics.sampleCount == 3
    assert metrics.maxOverforecastMW == 100.0
    assert metrics.maxUnderforecastMW == -200.0

def test_calculate_metrics_empty():
    service = AnalyticsService()
    metrics = service.calculate_metrics([], [], [])
    assert metrics.sampleCount == 0
    assert metrics.maeMW == 0.0
    assert metrics.rmseMW == 0.0

def test_day_ahead_comparison():
    service = AnalyticsService()
    # Test for decision date 2026-01-05
    res = service.get_day_ahead_comparison(
        decision_date="2026-01-05",
        cutoff_time="11:00:00Z",
        delivery_date="2026-01-06",
        aggregation="hourly",
    )
    assert res.deliveryDate == "2026-01-06"
    assert len(res.records) == 24
    assert res.metrics is not None
    assert res.metrics.sampleCount == 24
    assert res.metrics.maeMW > 0.0

def test_procurement_plan():
    service = AnalyticsService()
    plan = service.calculate_procurement_plan(
        decision_date="2026-01-05",
        cutoff_time="11:00:00Z",
        delivery_date="2026-01-06",
        confidence_level=0.90,
    )
    assert len(plan.periods) == 24
    assert plan.totalDemandMWh > 0
    assert plan.totalRiskAdjustedProcurementMWh >= plan.totalUnbufferedProcurementMWh
    assert plan.totalRiskBufferMWh > 0

def test_comprehensive_metrics_report():
    service = AnalyticsService()
    rep = service.get_comprehensive_metrics_report(month_prefix="2026-01")
    assert rep.overall.sampleCount > 0
    assert rep.overall.maeMW > 0
    assert len(rep.distribution) > 0
    assert len(rep.byHorizon) > 0
    assert len(rep.byPeriod) == 24
    assert len(rep.dailyBreakdown) > 20
