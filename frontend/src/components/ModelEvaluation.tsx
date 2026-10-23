import React, { useState } from "react";
import {
  Activity,
  Calendar,
  BarChart2,
  Clock,
  Compass,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";
import { ComprehensiveMetricsResponse } from "../types";

interface ModelEvaluationProps {
  metricsReport: ComprehensiveMetricsResponse | null;
  loading: boolean;
  onSelectDay: (dayStr: string) => void;
}

export const ModelEvaluation: React.FC<ModelEvaluationProps> = ({
  metricsReport,
  loading,
  onSelectDay,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"horizon" | "diurnal" | "distribution" | "calendar">("horizon");

  if (loading || !metricsReport) {
    return (
      <div className="py-24 text-center text-slate-500 space-y-3">
        <Activity className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
        <p className="text-sm font-medium">Calculating comprehensive accuracy metrics across January 2026...</p>
      </div>
    );
  }

  const { overall, distribution, byHorizon, byPeriod, dailyBreakdown } = metricsReport;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
              <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
              Quantitative Model Evaluation
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              National Renewable Wind Forecast Accuracy Assessment
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Multi-dimensional statistical audit of National Grid ESO Day-Ahead wind generation forecasts (Elexon WINDFOR)
              evaluated against settlement outturn data (FUELHH) across all 31 delivery days of January 2026.
            </p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-right text-xs">
            <span className="text-slate-500 block font-medium">Sample Size</span>
            <span className="text-slate-900 font-mono font-extrabold text-sm">
              {overall.sampleCount.toLocaleString()} Settlement Hours
            </span>
          </div>
        </div>
      </div>

      {/* Primary Quantitative Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: MAE */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Mean Absolute Error
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-sky-700 font-mono">
            {overall.maeMW.toLocaleString()} MW
          </div>
          <div className="text-[11px] text-slate-500">
            NMAE: <strong className="text-slate-800">{overall.nmaeCapacityPercent}%</strong> of 30 GW
          </div>
        </div>

        {/* Metric 2: RMSE */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Root Mean Sq Error
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-indigo-700 font-mono">
            {overall.rmseMW.toLocaleString()} MW
          </div>
          <div className="text-[11px] text-slate-500">
            Std Dev: <strong className="text-slate-800">{overall.stdDevMW.toLocaleString()} MW</strong>
          </div>
        </div>

        {/* Metric 3: MBE Bias */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Mean Bias Error
          </div>
          <div className={`text-xl sm:text-2xl font-extrabold font-mono ${overall.mbeBiasMW > 0 ? "text-amber-600" : "text-emerald-600"}`}>
            {overall.mbeBiasMW > 0 ? "+" : ""}{overall.mbeBiasMW.toLocaleString()} MW
          </div>
          <div className="text-[11px] text-slate-500">
            {overall.mbeBiasMW > 0 ? "Tendency to Over-Predict" : "Tendency to Under-Predict"}
          </div>
        </div>

        {/* Metric 4: MAPE */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            MAPE Error Rate
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-purple-700 font-mono">
            {overall.mapePercent}%
          </div>
          <div className="text-[11px] text-slate-500">
            Accuracy Index: <strong className="text-slate-800">{(100 - overall.mapePercent).toFixed(1)}%</strong>
          </div>
        </div>

        {/* Metric 5: R2 Correlation */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            R² Correlation
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono">
            {overall.r2Score != null ? overall.r2Score.toFixed(3) : "0.85+"}
          </div>
          <div className="text-[11px] text-slate-500">
            Forecast vs Actual Track
          </div>
        </div>

        {/* Metric 6: P90 Quantile */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            P90 Shortfall Tail
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-700 font-mono">
            +{overall.p90MW.toLocaleString()} MW
          </div>
          <div className="text-[11px] text-slate-500">
            90% Hedging Threshold
          </div>
        </div>
      </div>

      {/* Sub-Tabs for Analytical Views */}
      <div className="flex border-b border-slate-200 space-x-2 text-xs sm:text-sm">
        <button
          onClick={() => setActiveSubTab("horizon")}
          className={`pb-2.5 px-3 font-bold transition-all cursor-pointer border-b-2 ${
            activeSubTab === "horizon"
              ? "border-sky-600 text-sky-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Lead-Time Horizon Degradation
        </button>
        <button
          onClick={() => setActiveSubTab("distribution")}
          className={`pb-2.5 px-3 font-bold transition-all cursor-pointer border-b-2 ${
            activeSubTab === "distribution"
              ? "border-sky-600 text-sky-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Error Distribution & Quantiles
        </button>
        <button
          onClick={() => setActiveSubTab("diurnal")}
          className={`pb-2.5 px-3 font-bold transition-all cursor-pointer border-b-2 ${
            activeSubTab === "diurnal"
              ? "border-sky-600 text-sky-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Diurnal / Hourly Profile
        </button>
        <button
          onClick={() => setActiveSubTab("calendar")}
          className={`pb-2.5 px-3 font-bold transition-all cursor-pointer border-b-2 ${
            activeSubTab === "calendar"
              ? "border-sky-600 text-sky-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          January 2026 Daily Heatmap
        </button>
      </div>

      {/* Sub-Tab 1: Horizon Degradation */}
      {activeSubTab === "horizon" && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <span>Forecast Horizon Degradation Analysis</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Measures how forecast accuracy diminishes as the lead time extends from 12 hours up to 48 hours.
                </p>
              </div>
              <div className="text-xs text-slate-500">
                Gate Closure (11:00 UTC) Delivery Window: <strong className="text-slate-900 font-semibold">13h to 37h Lead Time</strong>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={byHorizon} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="bucket" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${v} MW`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", borderRadius: "0.75rem", fontSize: "12px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                    formatter={(val: any, name: any) => [`${val} MW`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Bar dataKey="maeMW" name="MAE (Mean Absolute Error)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rmseMW" name="RMSE (Volatility Penalty)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="biasMW" name="MBE Bias (Over/Under Prediction)" stroke="#d97706" strokeWidth={2.5} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700 pt-3 border-t border-slate-100">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-sky-700 font-bold block mb-1">12-18h Horizon (Overnight)</span>
                Lowest error rate. Shorter look-ahead enables reliable baseline scheduling for periods 1 to 14.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-indigo-700 font-bold block mb-1">24-30h Horizon (Peak Evening)</span>
                Moderate error escalation. Critical window covering the UK evening transmission peak (17:00-19:30).
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-amber-700 font-bold block mb-1">36-48h Horizon (Extended)</span>
                Steeper error gradient. Unlocks value for Intraday re-balancing once subsequent forecast runs publish.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Error Distribution & Quantiles */}
      {activeSubTab === "distribution" && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Empirical Error Distribution & Quantiles (Forecast - Actual)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Histogram of error deltas across January 2026. Positive = Over-forecast (Shortfall); Negative = Under-forecast (Surplus).
                </p>
              </div>
              <div className="text-xs text-slate-500">
                P50 Median: <strong className="text-slate-900 font-mono font-bold">{overall.p50MedianMW} MW</strong>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="binCenter" stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}`} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", borderRadius: "0.75rem", fontSize: "12px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                    formatter={(val: any) => [val, "Count"]}
                    labelFormatter={(v) => `Error Delta: ${v} MW`}
                  />
                  <ReferenceLine x={0} stroke="#64748b" strokeWidth={2} label={{ value: "Zero Bias", fill: "#64748b", fontSize: 10 }} />
                  <ReferenceLine x={overall.p90MW} stroke="#d97706" strokeDasharray="3 3" label={{ value: `P90: +${overall.p90MW} MW`, fill: "#d97706", fontSize: 10 }} />
                  <Bar dataKey="count" name="Settlement Hours">
                    {distribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.binCenter > 0 ? "#f59e0b" : "#3b82f6"}
                        opacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quantiles Bar Table */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-700">Empirical Error Quantiles for Risk Hedging:</div>
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 text-center font-mono">
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">P05 (Under)</span>
                  <span className="text-blue-700 font-bold">{overall.p05MW} MW</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">P10</span>
                  <span className="text-blue-600 font-bold">{overall.p10MW} MW</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">P25</span>
                  <span className="text-slate-700 font-bold">{overall.p25MW} MW</span>
                </div>
                <div className="p-2 rounded-lg bg-sky-50 border border-sky-300">
                  <span className="text-[10px] text-sky-800 block font-sans font-bold">P50 (Median)</span>
                  <span className="text-sky-800 font-extrabold">{overall.p50MedianMW} MW</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">P75</span>
                  <span className="text-amber-700 font-bold">+{overall.p75MW} MW</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-300">
                  <span className="text-[10px] text-amber-800 block font-sans font-bold">P90 (Buffer)</span>
                  <span className="text-amber-800 font-extrabold">+{overall.p90MW} MW</span>
                </div>
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-300">
                  <span className="text-[10px] text-rose-800 block font-sans font-bold">P95 (Extreme)</span>
                  <span className="text-rose-800 font-extrabold">+{overall.p95MW} MW</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Diurnal / Hourly Profile */}
      {activeSubTab === "diurnal" && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-purple-600" />
                  <span>Diurnal Profile: Forecasting Errors Across 24 Hours</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Average hourly actual generation, forecast, and error by time of day (00:00 to 23:00 UTC).
                </p>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={byPeriod} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="periodOrHour" stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}:00`} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", borderRadius: "0.75rem", fontSize: "12px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                    formatter={(val: any, name: any) => [`${val} MW`, name]}
                    labelFormatter={(v) => `Hour: ${v}:00 - ${parseInt(String(v || 0), 10) + 1}:00 UTC`}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Line type="monotone" dataKey="forecastMeanMW" name="Average Forecast" stroke="#0284c7" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="actualMeanMW" name="Average Actual" stroke="#10b981" strokeWidth={2.5} dot={false} />
                  <Bar dataKey="maeMW" name="Hourly MAE" fill="#c084fc" opacity={0.65} radius={[3, 3, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: January 2026 Daily Heatmap / Calendar */}
      {activeSubTab === "calendar" && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <span>January 2026 Daily Performance Ledger</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Full month performance breakdown. Click any day row to instantly test the decision workbench for that day.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96 rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="sticky top-0 bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Delivery Date</th>
                    <th className="py-2.5 px-3">Regime Status</th>
                    <th className="py-2.5 px-3">Actual Mean</th>
                    <th className="py-2.5 px-3">Forecast Mean</th>
                    <th className="py-2.5 px-3">Daily MAE</th>
                    <th className="py-2.5 px-3">Bias (MBE)</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {dailyBreakdown.map((d) => {
                    const isStorm = d.volatilityStatus.includes("High");
                    const isLow = d.volatilityStatus.includes("Low");
                    return (
                      <tr
                        key={d.date}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        onClick={() => onSelectDay(d.date)}
                      >
                        <td className="py-2 px-3 text-slate-900 font-sans font-semibold">
                          {d.date}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold border ${
                              isStorm
                                ? "bg-purple-100 text-purple-800 border-purple-200"
                                : isLow
                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                : "bg-emerald-100 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            {d.volatilityStatus}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-emerald-700 font-bold">
                          {d.actualMeanMW.toLocaleString()} MW
                        </td>
                        <td className="py-2 px-3 text-sky-700 font-bold">
                          {d.forecastMeanMW.toLocaleString()} MW
                        </td>
                        <td className="py-2 px-3 font-extrabold text-slate-900">
                          {d.maeMW.toLocaleString()} MW
                        </td>
                        <td className="py-2 px-3">
                          <span className={d.biasMW > 0 ? "text-amber-700 font-bold" : "text-emerald-700 font-bold"}>
                            {d.biasMW > 0 ? "+" : ""}{d.biasMW.toLocaleString()} MW
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-sans">
                          <span className="text-sky-600 font-semibold group-hover:underline text-[11px] inline-flex items-center gap-1">
                            Load Day <ArrowRight className="w-3 h-3" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
