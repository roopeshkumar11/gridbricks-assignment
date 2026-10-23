import math
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple

from backend.app.services.storage import StorageRepository
from backend.app.models.schemas import (
    AlignedWindRecord,
    AccuracyMetrics,
    HorizonAccuracyItem,
    PeriodAccuracyItem,
    DailyAccuracyItem,
    HistogramBin,
    DayAheadComparisonResponse,
    ComprehensiveMetricsResponse,
    ProcurementPeriodItem,
    ProcurementPlanResponse,
    ForecastRevisionPoint,
    ForecastEvolutionResponse,
)
from backend.app.config import UK_NOMINAL_WIND_CAPACITY_MW

class AnalyticsService:
    def __init__(self, storage: Optional[StorageRepository] = None):
        self.storage = storage or StorageRepository()

    def calculate_metrics(self, errors: List[float], actuals: List[float], forecasts: List[float]) -> AccuracyMetrics:
        """
        Calculate standard quantitative forecast error metrics.
        errors = forecast - actual (positive = over-forecast, negative = under-forecast)
        """
        if not errors:
            return AccuracyMetrics(
                sampleCount=0, maeMW=0.0, rmseMW=0.0, mapePercent=0.0, mbeBiasMW=0.0,
                nmaeCapacityPercent=0.0, nmaeMeanPercent=0.0, stdDevMW=0.0,
                maxOverforecastMW=0.0, maxUnderforecastMW=0.0, r2Score=0.0,
                p05MW=0.0, p10MW=0.0, p25MW=0.0, p50MedianMW=0.0, p75MW=0.0, p90MW=0.0, p95MW=0.0
            )

        err_arr = np.array(errors, dtype=float)
        act_arr = np.array(actuals, dtype=float)
        fc_arr = np.array(forecasts, dtype=float)

        mae = float(np.mean(np.abs(err_arr)))
        rmse = float(np.sqrt(np.mean(err_arr ** 2)))
        bias = float(np.mean(err_arr))
        std_dev = float(np.std(err_arr))

        # MAPE: avoid divide-by-zero for near-zero wind generation (use max(actual, 100 MW))
        safe_actuals = np.maximum(act_arr, 100.0)
        mape = float(np.mean(np.abs(err_arr) / safe_actuals) * 100.0)

        # Capacity-normalized and Mean-normalized MAE
        nmae_cap = (mae / UK_NOMINAL_WIND_CAPACITY_MW) * 100.0
        mean_actual = float(np.mean(act_arr)) if len(act_arr) > 0 and np.mean(act_arr) > 0 else 1.0
        nmae_mean = (mae / mean_actual) * 100.0

        max_over = float(np.max(err_arr)) if len(err_arr) > 0 else 0.0
        max_under = float(np.min(err_arr)) if len(err_arr) > 0 else 0.0

        # R² Correlation
        r2 = None
        if len(act_arr) > 1 and np.var(act_arr) > 0:
            ss_res = np.sum((act_arr - fc_arr) ** 2)
            ss_tot = np.sum((act_arr - np.mean(act_arr)) ** 2)
            r2 = float(1.0 - (ss_res / ss_tot)) if ss_tot > 0 else None

        # Percentiles
        p05 = float(np.percentile(err_arr, 5))
        p10 = float(np.percentile(err_arr, 10))
        p25 = float(np.percentile(err_arr, 25))
        p50 = float(np.percentile(err_arr, 50))
        p75 = float(np.percentile(err_arr, 75))
        p90 = float(np.percentile(err_arr, 90))
        p95 = float(np.percentile(err_arr, 95))

        return AccuracyMetrics(
            sampleCount=len(err_arr),
            maeMW=round(mae, 2),
            rmseMW=round(rmse, 2),
            mapePercent=round(mape, 2),
            mbeBiasMW=round(bias, 2),
            nmaeCapacityPercent=round(nmae_cap, 2),
            nmaeMeanPercent=round(nmae_mean, 2),
            stdDevMW=round(std_dev, 2),
            maxOverforecastMW=round(max_over, 2),
            maxUnderforecastMW=round(max_under, 2),
            r2Score=round(r2, 4) if r2 is not None else None,
            p05MW=round(p05, 2),
            p10MW=round(p10, 2),
            p25MW=round(p25, 2),
            p50MedianMW=round(p50, 2),
            p75MW=round(p75, 2),
            p90MW=round(p90, 2),
            p95MW=round(p95, 2),
        )

    def get_day_ahead_comparison(
        self,
        decision_date: str,
        cutoff_time: str = "11:00:00Z",
        delivery_date: Optional[str] = None,
        aggregation: str = "hourly",
    ) -> DayAheadComparisonResponse:
        """
        Compare the latest forecast available at gate closure on decision_date
        with the actual generation on delivery_date.
        """
        if not delivery_date:
            # Next calendar day
            dec_dt = datetime.strptime(decision_date, "%Y-%m-%d")
            delivery_date = (dec_dt + timedelta(days=1)).strftime("%Y-%m-%d")

        cutoff_iso = f"{decision_date}T{cutoff_time}"
        forecasts = self.storage.get_latest_forecasts_before_cutoff(
            cutoff_iso=cutoff_iso,
            target_start_prefix=delivery_date,
        )
        actuals = self.storage.get_actuals_for_date(delivery_date)

        # Index actuals by start_time
        actual_by_start = {a["start_time"]: a for a in actuals}
        
        # Also group actuals by hour
        actuals_by_hour: Dict[str, List[float]] = {}
        for a in actuals:
            hour_key = a["start_time"][:13] + ":00:00Z"
            actuals_by_hour.setdefault(hour_key, []).append(float(a["generation"]))

        records: List[AlignedWindRecord] = []
        errors: List[float] = []
        act_vals: List[float] = []
        fc_vals: List[float] = []

        if aggregation == "hourly":
            for f in forecasts:
                st = f["start_time"]
                pt = f["publish_time"]
                fc_gen = float(f["generation"])
                hour = int(st[11:13]) if len(st) >= 13 else 0

                # Compute lead time in hours
                try:
                    dt_start = datetime.fromisoformat(st.replace("Z", "+00:00"))
                    dt_pub = datetime.fromisoformat(pt.replace("Z", "+00:00"))
                    lead_time = (dt_start - dt_pub).total_seconds() / 3600.0
                except Exception:
                    lead_time = 0.0

                act_list = actuals_by_hour.get(st, [])
                act_gen = float(np.mean(act_list)) if act_list else None

                err = None
                abs_err = None
                pct_err = None

                if act_gen is not None:
                    err = fc_gen - act_gen
                    abs_err = abs(err)
                    safe_act = max(act_gen, 100.0)
                    pct_err = (abs_err / safe_act) * 100.0

                    errors.append(err)
                    act_vals.append(act_gen)
                    fc_vals.append(fc_gen)

                records.append(
                    AlignedWindRecord(
                        startTime=st,
                        targetDate=delivery_date,
                        hour=hour,
                        settlementPeriod=hour * 2 + 1,
                        forecastGenerationMW=round(fc_gen, 1),
                        actualGenerationMW=round(act_gen, 1) if act_gen is not None else None,
                        forecastPublishTime=pt,
                        leadTimeHours=round(lead_time, 1),
                        errorMW=round(err, 1) if err is not None else None,
                        absErrorMW=round(abs_err, 1) if abs_err is not None else None,
                        percentageError=round(pct_err, 1) if pct_err is not None else None,
                    )
                )
        else:
            # Half-hourly: map hourly forecast to periods 1 & 2
            fc_by_hour = {f["start_time"][:13] + ":00:00Z": f for f in forecasts}
            for a in actuals:
                st = a["start_time"]
                hour_key = st[:13] + ":00:00Z"
                hour = int(st[11:13]) if len(st) >= 13 else 0
                sp = int(a.get("settlement_period", hour * 2 + 1))
                act_gen = float(a["generation"])

                f = fc_by_hour.get(hour_key)
                if f:
                    fc_gen = float(f["generation"])
                    pt = f["publish_time"]
                    try:
                        dt_start = datetime.fromisoformat(st.replace("Z", "+00:00"))
                        dt_pub = datetime.fromisoformat(pt.replace("Z", "+00:00"))
                        lead_time = (dt_start - dt_pub).total_seconds() / 3600.0
                    except Exception:
                        lead_time = 0.0

                    err = fc_gen - act_gen
                    abs_err = abs(err)
                    pct_err = (abs_err / max(act_gen, 100.0)) * 100.0

                    errors.append(err)
                    act_vals.append(act_gen)
                    fc_vals.append(fc_gen)

                    records.append(
                        AlignedWindRecord(
                            startTime=st,
                            targetDate=delivery_date,
                            hour=hour,
                            settlementPeriod=sp,
                            forecastGenerationMW=round(fc_gen, 1),
                            actualGenerationMW=round(act_gen, 1),
                            forecastPublishTime=pt,
                            leadTimeHours=round(lead_time, 1),
                            errorMW=round(err, 1),
                            absErrorMW=round(abs_err, 1),
                            percentageError=round(pct_err, 1),
                        )
                    )

        metrics = self.calculate_metrics(errors, act_vals, fc_vals) if errors else None

        return DayAheadComparisonResponse(
            decisionDate=decision_date,
            cutoffTime=cutoff_time,
            deliveryDate=delivery_date,
            aggregation=aggregation,
            records=records,
            metrics=metrics,
        )

    def get_forecast_evolution(self, target_start_time: str) -> ForecastEvolutionResponse:
        """
        Track how the wind forecast for a specific target start_time evolved across
        successive publication updates.
        """
        revisions_raw = self.storage.get_forecast_revisions(target_start_time)
        actuals = self.storage.get_actuals_for_range(target_start_time, target_start_time)
        act_mw = float(actuals[0]["generation"]) if actuals else None

        dt_target = datetime.fromisoformat(target_start_time.replace("Z", "+00:00"))
        delivery_date = target_start_time[:10]

        revisions: List[ForecastRevisionPoint] = []
        for r in revisions_raw:
            pt = r["publish_time"]
            dt_pub = datetime.fromisoformat(pt.replace("Z", "+00:00"))
            lead_time = max(0.0, (dt_target - dt_pub).total_seconds() / 3600.0)
            revisions.append(
                ForecastRevisionPoint(
                    publishTime=pt,
                    targetStartTime=target_start_time,
                    forecastMW=round(float(r["generation"]), 1),
                    leadTimeHours=round(lead_time, 1),
                )
            )

        return ForecastEvolutionResponse(
            targetStartTime=target_start_time,
            deliveryDate=delivery_date,
            actualMW=round(act_mw, 1) if act_mw is not None else None,
            revisions=revisions,
        )

    def get_comprehensive_metrics_report(
        self,
        month_prefix: str = "2026-01",
        cutoff_time: str = "11:00:00Z",
    ) -> ComprehensiveMetricsResponse:
        """
        Evaluate all day-ahead purchasing decisions across the entire month of January 2026.
        Generates global metrics, lead-time horizon curves, diurnal period profiles,
        error histograms, and daily calendar performance.
        """
        # Collect all aligned pairs for each delivery day in the month
        all_aligned_rows: List[Dict[str, Any]] = []

        # Days 1 to 31
        start_day = datetime.strptime(f"{month_prefix}-01", "%Y-%m-%d")
        for day_offset in range(31):
            deliv_dt = start_day + timedelta(days=day_offset)
            deliv_str = deliv_dt.strftime("%Y-%m-%d")
            dec_str = (deliv_dt - timedelta(days=1)).strftime("%Y-%m-%d")

            cutoff_iso = f"{dec_str}T{cutoff_time}"
            forecasts = self.storage.get_latest_forecasts_before_cutoff(cutoff_iso, deliv_str)
            actuals = self.storage.get_actuals_for_date(deliv_str)

            if not forecasts or not actuals:
                continue

            # Hourly actual average
            act_by_hour: Dict[str, List[float]] = {}
            for a in actuals:
                h_key = a["start_time"][:13] + ":00:00Z"
                act_by_hour.setdefault(h_key, []).append(float(a["generation"]))

            for f in forecasts:
                st = f["start_time"]
                pt = f["publish_time"]
                fc_val = float(f["generation"])
                act_list = act_by_hour.get(st, [])
                if not act_list:
                    continue
                act_val = float(np.mean(act_list))

                try:
                    dt_st = datetime.fromisoformat(st.replace("Z", "+00:00"))
                    dt_pt = datetime.fromisoformat(pt.replace("Z", "+00:00"))
                    lead_hours = (dt_st - dt_pt).total_seconds() / 3600.0
                except Exception:
                    lead_hours = 24.0

                err = fc_val - act_val
                abs_err = abs(err)
                hour = int(st[11:13])

                all_aligned_rows.append({
                    "targetDate": deliv_str,
                    "startTime": st,
                    "hour": hour,
                    "publishTime": pt,
                    "leadTimeHours": lead_hours,
                    "actualMW": act_val,
                    "forecastMW": fc_val,
                    "errorMW": err,
                    "absErrorMW": abs_err,
                })

        df = pd.DataFrame(all_aligned_rows)
        if df.empty:
            empty_metrics = self.calculate_metrics([], [], [])
            return ComprehensiveMetricsResponse(
                overall=empty_metrics,
                distribution=[],
                byHorizon=[],
                byPeriod=[],
                dailyBreakdown=[],
            )

        # 1. Overall Metrics
        overall = self.calculate_metrics(
            df["errorMW"].tolist(),
            df["actualMW"].tolist(),
            df["forecastMW"].tolist(),
        )

        # 2. Histogram / Distribution
        errors_series = df["errorMW"]
        min_err = float(errors_series.min())
        max_err = float(errors_series.max())
        bin_count = 20
        hist_counts, bin_edges = np.histogram(errors_series, bins=bin_count)
        total_pts = len(errors_series)

        distribution: List[HistogramBin] = []
        for i in range(len(hist_counts)):
            b_start = float(bin_edges[i])
            b_end = float(bin_edges[i + 1])
            b_center = (b_start + b_end) / 2.0
            cnt = int(hist_counts[i])
            distribution.append(
                HistogramBin(
                    binStart=round(b_start, 1),
                    binEnd=round(b_end, 1),
                    binCenter=round(b_center, 1),
                    count=cnt,
                    frequency=round(cnt / total_pts, 4) if total_pts > 0 else 0.0,
                )
            )

        # 3. Horizon / Lead Time degradation
        # Bins: 12-18h, 18-24h, 24-30h, 30-36h, >36h
        horizon_defs = [
            ("12-18h", 12.0, 18.0),
            ("18-24h", 18.0, 24.0),
            ("24-30h", 24.0, 30.0),
            ("30-36h", 30.0, 36.0),
            ("36-48h", 36.0, 48.0),
        ]
        by_horizon: List[HorizonAccuracyItem] = []
        for label, h_min, h_max in horizon_defs:
            sub = df[(df["leadTimeHours"] >= h_min) & (df["leadTimeHours"] < h_max)]
            if not sub.empty:
                sub_metrics = self.calculate_metrics(
                    sub["errorMW"].tolist(),
                    sub["actualMW"].tolist(),
                    sub["forecastMW"].tolist(),
                )
                by_horizon.append(
                    HorizonAccuracyItem(
                        bucket=label,
                        minLeadTimeHours=h_min,
                        maxLeadTimeHours=h_max,
                        sampleCount=sub_metrics.sampleCount,
                        maeMW=sub_metrics.maeMW,
                        rmseMW=sub_metrics.rmseMW,
                        mapePercent=sub_metrics.mapePercent,
                        biasMW=sub_metrics.mbeBiasMW,
                    )
                )

        # 4. Diurnal / Settlement Period Profile (0 to 23 hours)
        by_period: List[PeriodAccuracyItem] = []
        for h in range(24):
            sub = df[df["hour"] == h]
            if not sub.empty:
                sub_metrics = self.calculate_metrics(
                    sub["errorMW"].tolist(),
                    sub["actualMW"].tolist(),
                    sub["forecastMW"].tolist(),
                )
                time_lbl = f"{h:02d}:00 - {h+1:02d}:00"
                by_period.append(
                    PeriodAccuracyItem(
                        periodOrHour=h,
                        timeLabel=time_lbl,
                        sampleCount=sub_metrics.sampleCount,
                        actualMeanMW=round(float(sub["actualMW"].mean()), 1),
                        forecastMeanMW=round(float(sub["forecastMW"].mean()), 1),
                        maeMW=sub_metrics.maeMW,
                        rmseMW=sub_metrics.rmseMW,
                        biasMW=sub_metrics.mbeBiasMW,
                    )
                )

        # 5. Daily Performance Breakdown
        daily_breakdown: List[DailyAccuracyItem] = []
        for date_str, sub in df.groupby("targetDate"):
            sub_metrics = self.calculate_metrics(
                sub["errorMW"].tolist(),
                sub["actualMW"].tolist(),
                sub["forecastMW"].tolist(),
            )
            act_mean = float(sub["actualMW"].mean())
            fc_mean = float(sub["forecastMW"].mean())

            # Classify day
            if act_mean > 16000:
                status = "Storm / High Wind (>16 GW)"
            elif act_mean < 6000:
                status = "Low Wind Dunkelflaute (<6 GW)"
            else:
                status = "Normal Wind"

            daily_breakdown.append(
                DailyAccuracyItem(
                    date=str(date_str),
                    sampleCount=sub_metrics.sampleCount,
                    actualMeanMW=round(act_mean, 1),
                    forecastMeanMW=round(fc_mean, 1),
                    maeMW=sub_metrics.maeMW,
                    rmseMW=sub_metrics.rmseMW,
                    mapePercent=sub_metrics.mapePercent,
                    biasMW=sub_metrics.mbeBiasMW,
                    volatilityStatus=status,
                )
            )

        daily_breakdown.sort(key=lambda x: x.date)

        return ComprehensiveMetricsResponse(
            overall=overall,
            distribution=distribution,
            byHorizon=by_horizon,
            byPeriod=by_period,
            dailyBreakdown=daily_breakdown,
        )

    def calculate_procurement_plan(
        self,
        decision_date: str,
        cutoff_time: str = "11:00:00Z",
        delivery_date: Optional[str] = None,
        confidence_level: float = 0.90,
        demand_profile_preset: str = "winter_typical",
    ) -> ProcurementPlanResponse:
        """
        Generate Day-Ahead thermal procurement recommendation for the UK utility.
        Evaluates demand - wind forecast, plus quantified risk buffer to prevent imbalance exposure.
        """
        if not delivery_date:
            dec_dt = datetime.strptime(decision_date, "%Y-%m-%d")
            delivery_date = (dec_dt + timedelta(days=1)).strftime("%Y-%m-%d")

        comparison = self.get_day_ahead_comparison(
            decision_date=decision_date,
            cutoff_time=cutoff_time,
            delivery_date=delivery_date,
            aggregation="hourly",
        )

        # Representative GB Winter Hourly Demand Profile (in MW)
        # 24 hours: overnight trough ~26 GW, morning peak ~39 GW, afternoon ~36 GW, evening peak ~43 GW
        demand_base_winter = [
            27500, 26000, 25200, 24800, 25500, 28000, 32500, 37800,
            39500, 38200, 37000, 36500, 36200, 35800, 36000, 38500,
            42000, 44200, 43500, 40500, 37000, 34000, 31000, 28800
        ]

        if demand_profile_preset == "winter_high":
            demand_curve = [d * 1.10 for d in demand_base_winter]
        elif demand_profile_preset == "winter_low":
            demand_curve = [d * 0.90 for d in demand_base_winter]
        else:
            demand_curve = demand_base_winter

        # Risk Buffer calculation:
        # Standard normal Z-score for confidence level (e.g. 90% -> 1.282, 95% -> 1.645)
        # Using empirical historical error std_dev (~1500-2000 MW in GB wind)
        z_score = {
            0.50: 0.0,
            0.75: 0.674,
            0.80: 0.842,
            0.85: 1.036,
            0.90: 1.282,
            0.95: 1.645,
            0.99: 2.326,
        }.get(confidence_level, 1.282)

        # Dynamic buffer scaled by wind generation magnitude (higher wind has higher absolute volatility)
        # Base standard deviation is approx 12-14% of forecasted wind, minimum 400 MW
        periods: List[ProcurementPeriodItem] = []
        tot_demand_mwh = 0.0
        tot_wind_mwh = 0.0
        tot_unbuf_mwh = 0.0
        tot_risk_mwh = 0.0
        tot_buf_mwh = 0.0

        for r in comparison.records:
            h = r.hour
            d_mw = demand_curve[h] if h < len(demand_curve) else 35000.0
            fc_mw = r.forecastGenerationMW
            act_mw = r.actualGenerationMW

            # Scaled uncertainty buffer: z * max(400, fc_mw * 0.12)
            sigma_t = max(400.0, fc_mw * 0.12)
            buffer_mw = z_score * sigma_t

            # Net Demand calculations
            unbuffered_procure = max(0.0, d_mw - fc_mw)
            risk_adj_wind = max(0.0, fc_mw - buffer_mw)
            risk_adj_procure = max(0.0, d_mw - risk_adj_wind)

            # Actual shortfall if unbuffered
            actual_shortfall = None
            if act_mw is not None:
                # If actual wind was less than forecast: shortfall = forecast - actual
                shortfall = fc_mw - act_mw
                actual_shortfall = max(0.0, shortfall)

            periods.append(
                ProcurementPeriodItem(
                    period=h + 1,
                    startTime=r.startTime,
                    timeLabel=f"{h:02d}:00",
                    consumerDemandMW=round(d_mw, 1),
                    expectedWindMW=round(fc_mw, 1),
                    riskBufferMW=round(buffer_mw, 1),
                    netDemandUnbufferedMW=round(unbuffered_procure, 1),
                    netDemandRiskAdjustedMW=round(risk_adj_procure, 1),
                    actualWindMW=round(act_mw, 1) if act_mw is not None else None,
                    actualProcurementShortfallMW=round(actual_shortfall, 1) if actual_shortfall is not None else None,
                )
            )

            tot_demand_mwh += d_mw
            tot_wind_mwh += fc_mw
            tot_unbuf_mwh += unbuffered_procure
            tot_risk_mwh += risk_adj_procure
            tot_buf_mwh += buffer_mw

        return ProcurementPlanResponse(
            decisionDate=decision_date,
            deliveryDate=delivery_date,
            confidenceLevel=confidence_level,
            bufferMethod=f"Quantified Volatility Buffer ({confidence_level * 100:.0f}% Confidence, Z={z_score})",
            totalDemandMWh=round(tot_demand_mwh, 1),
            totalExpectedWindMWh=round(tot_wind_mwh, 1),
            totalUnbufferedProcurementMWh=round(tot_unbuf_mwh, 1),
            totalRiskAdjustedProcurementMWh=round(tot_risk_mwh, 1),
            totalRiskBufferMWh=round(tot_buf_mwh, 1),
            periods=periods,
        )
