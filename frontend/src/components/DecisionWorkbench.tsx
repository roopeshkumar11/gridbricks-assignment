import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Download,
  ShieldAlert,
  Flame,
  Wind,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  DayAheadComparisonResponse,
  ProcurementPlanResponse,
  ForecastEvolutionResponse,
} from "../types";
import {
  fetchDayAheadComparison,
  fetchProcurementPlan,
  fetchForecastEvolution,
  getExportCsvUrl,
} from "../services/api";

interface DecisionWorkbenchProps {
  initialDate?: string;
}

export const DecisionWorkbench: React.FC<DecisionWorkbenchProps> = ({
  initialDate = "2026-01-05",
}) => {
  const [decisionDate, setDecisionDate] = useState<string>(initialDate);
  const [cutoffTime, setCutoffTime] = useState<string>("11:00:00Z");
  const [aggregation, setAggregation] = useState<"hourly" | "half-hourly">("hourly");
  const [confidenceLevel, setConfidenceLevel] = useState<number>(0.90);
  const [demandPreset, setDemandPreset] = useState<string>("winter_typical");

  const [comparison, setComparison] = useState<DayAheadComparisonResponse | null>(null);
  const [procurement, setProcurement] = useState<ProcurementPlanResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Evolution drawer
  const [selectedHourForEvolution, setSelectedHourForEvolution] = useState<string | null>(null);
  const [evolutionData, setEvolutionData] = useState<ForecastEvolutionResponse | null>(null);
  const [loadingEvolution, setLoadingEvolution] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, [decisionDate, cutoffTime, aggregation, confidenceLevel, demandPreset]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [compRes, procRes] = await Promise.all([
        fetchDayAheadComparison(decisionDate, cutoffTime, undefined, aggregation),
        fetchProcurementPlan(decisionDate, cutoffTime, undefined, confidenceLevel, demandPreset),
      ]);
      setComparison(compRes);
      setProcurement(procRes);
    } catch (err: any) {
      setError(err?.message || "Failed to load decision data");
    } finally {
      setLoading(false);
    }
  };

  const handleShowEvolution = async (startTime: string) => {
    try {
      setSelectedHourForEvolution(startTime);
      setLoadingEvolution(true);
      const evo = await fetchForecastEvolution(startTime);
      setEvolutionData(evo);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEvolution(false);
    }
  };

  const chartData = (comparison?.records || []).map((rec, idx) => {
    const procItem = procurement?.periods[idx];
    return {
      time: rec.startTime.substring(11, 16),
      fullStartTime: rec.startTime,
      forecastMW: rec.forecastGenerationMW,
      actualMW: rec.actualGenerationMW,
      errorMW: rec.errorMW,
      leadHours: rec.leadTimeHours,
      publishTime: rec.forecastPublishTime ? rec.forecastPublishTime.substring(11, 16) : "",
      demandMW: procItem?.consumerDemandMW,
      riskBufferMW: procItem?.riskBufferMW,
      unbufferedProcureMW: procItem?.netDemandUnbufferedMW,
      riskAdjustedProcureMW: procItem?.netDemandRiskAdjustedMW,
      shortfallMW: procItem?.actualProcurementShortfallMW,
    };
  });

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Control Header & Parameters Panel */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                UK Day-Ahead Decision Engine
              </span>
              <span className="text-xs text-slate-500">
                Delivery: <strong className="text-slate-900 font-mono">{comparison?.deliveryDate || "..."}</strong>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 mt-1">
              Procurement & Forecast Workbench
            </h2>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <a
              href={getExportCsvUrl(decisionDate, cutoffTime, undefined, aggregation)}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Input Parameters Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* 1. Decision Date */}
          <div className="space-y-1">
            <label className="text-slate-600 font-semibold flex items-center gap-1 text-[11px] sm:text-xs">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>Decision Date (D-1)</span>
            </label>
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={decisionDate}
              onChange={(e) => setDecisionDate(e.target.value)}
              className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:border-sky-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* 2. Cutoff Time / Gate Closure */}
          <div className="space-y-1">
            <label className="text-slate-600 font-semibold flex items-center gap-1 text-[11px] sm:text-xs">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>Decision Cutoff</span>
            </label>
            <select
              value={cutoffTime}
              onChange={(e) => setCutoffTime(e.target.value)}
              className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 font-mono focus:border-sky-500 focus:bg-white focus:outline-none"
            >
              <option value="09:00:00Z">09:00 UTC (Pre-Auction)</option>
              <option value="11:00:00Z">11:00 UTC (Gate Closure)</option>
              <option value="12:00:00Z">12:00 UTC (Post-Auction)</option>
              <option value="14:00:00Z">14:00 UTC (Intraday 1)</option>
              <option value="17:00:00Z">17:00 UTC (Intraday 2)</option>
            </select>
          </div>

          {/* 3. Aggregation Mode */}
          <div className="space-y-1">
            <label className="text-slate-600 font-semibold flex items-center gap-1 text-[11px] sm:text-xs">
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>Time Resolution</span>
            </label>
            <div className="flex rounded-lg bg-slate-100 p-0.5 sm:p-1 border border-slate-200">
              <button
                onClick={() => setAggregation("hourly")}
                className={`flex-1 py-1 rounded text-center text-xs font-semibold transition-all cursor-pointer ${
                  aggregation === "hourly"
                    ? "bg-white text-sky-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Hourly (24)
              </button>
              <button
                onClick={() => setAggregation("half-hourly")}
                className={`flex-1 py-1 rounded text-center text-xs font-semibold transition-all cursor-pointer ${
                  aggregation === "half-hourly"
                    ? "bg-white text-sky-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                HH (48 SP)
              </button>
            </div>
          </div>

          {/* 4. Demand Preset */}
          <div className="space-y-1">
            <label className="text-slate-600 font-semibold flex items-center gap-1 text-[11px] sm:text-xs">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Demand Scenario</span>
            </label>
            <select
              value={demandPreset}
              onChange={(e) => setDemandPreset(e.target.value)}
              className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
            >
              <option value="winter_typical">Winter Typical (~38 GW)</option>
              <option value="winter_high">Winter Cold Snap (+10%)</option>
              <option value="winter_low">Winter Mild (-10%)</option>
            </select>
          </div>

          {/* 5. Confidence Level */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-600 font-semibold flex items-center gap-1 text-[11px] sm:text-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                <span>Risk Confidence</span>
              </label>
              <span className="text-emerald-700 font-bold font-mono">
                {(confidenceLevel * 100).toFixed(0)}%
              </span>
            </div>
            <select
              value={confidenceLevel}
              onChange={(e) => setConfidenceLevel(parseFloat(e.target.value))}
              className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg bg-slate-50 border border-slate-300 text-emerald-800 font-bold focus:border-sky-500 focus:bg-white focus:outline-none"
            >
              <option value={0.50}>50% (P50 - Zero Margin)</option>
              <option value={0.80}>80% (Moderate Hedging)</option>
              <option value={0.90}>90% (P90 - Recommended)</option>
              <option value={0.95}>95% (P95 - High Security)</option>
              <option value={0.99}>99% (Maximum Reliability)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Daily Performance Strip */}
      {comparison?.metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <div className="p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-bold tracking-wider">Daily MAE</div>
            <div className="text-base sm:text-xl font-extrabold text-slate-900 font-mono mt-0.5">
              {comparison.metrics.maeMW.toLocaleString()} MW
            </div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-bold tracking-wider">Bias (MBE)</div>
            <div className={`text-base sm:text-xl font-extrabold font-mono mt-0.5 ${comparison.metrics.mbeBiasMW > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {comparison.metrics.mbeBiasMW > 0 ? "+" : ""}{comparison.metrics.mbeBiasMW.toLocaleString()} MW
            </div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-bold tracking-wider">RMSE Penalty</div>
            <div className="text-base sm:text-xl font-extrabold text-indigo-600 font-mono mt-0.5">
              {comparison.metrics.rmseMW.toLocaleString()} MW
            </div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-bold tracking-wider">Max Over-Forecast</div>
            <div className="text-base sm:text-xl font-extrabold text-rose-600 font-mono mt-0.5">
              +{comparison.metrics.maxOverforecastMW.toLocaleString()} MW
            </div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-bold tracking-wider">Wind Forecast</div>
            <div className="text-base sm:text-xl font-extrabold text-sky-700 font-mono mt-0.5">
              {procurement ? `${(procurement.totalExpectedWindMWh / 1000).toFixed(1)} GWh` : "..."}
            </div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-bold tracking-wider">Thermal Needed</div>
            <div className="text-base sm:text-xl font-extrabold text-amber-700 font-mono mt-0.5">
              {procurement ? `${(procurement.totalRiskAdjustedProcurementMWh / 1000).toFixed(1)} GWh` : "..."}
            </div>
          </div>
        </div>
      )}

      {/* Main Visualizations: 2 Tabs/Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Chart 1: Wind Forecast at Gate Closure vs Outturn Actuals */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Wind className="w-4 h-4 text-sky-600 shrink-0" />
                <span>1. Renewable Wind: Gate Closure Forecast vs Actuals</span>
              </h3>
              <p className="text-xs text-slate-500">
                Elexon WINDFOR (locked @ {cutoffTime.substring(0, 5)} UTC) vs FUELHH outturn
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono font-semibold">MW</div>
          </div>

          <div className="h-56 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", borderRadius: "0.75rem", fontSize: "11px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                  formatter={(value: any, name: any) => {
                    const formatted = typeof value === "number" ? `${value.toLocaleString()} MW` : value;
                    if (name === "forecastMW") return [formatted, "Forecast @ Gate Closure"];
                    if (name === "actualMW") return [formatted, "Actual Generation (FUELHH)"];
                    if (name === "errorMW") return [formatted, "Error (Forecast - Actual)"];
                    return [formatted, name];
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
                  formatter={(value) => {
                    if (value === "forecastMW") return "Latest Forecast";
                    if (value === "actualMW") return "Actual Outturn";
                    if (value === "errorMW") return "Error Delta";
                    return value;
                  }}
                />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Line
                  type="monotone"
                  dataKey="forecastMW"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: "#0284c7" }}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="actualMW"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: "#10b981" }}
                  activeDot={{ r: 4 }}
                />
                <Bar dataKey="errorMW" fill="#f59e0b" opacity={0.65} barSize={6} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>Click "Revisions" on any period below</span>
            <span className="text-sky-700 font-semibold">Blue = Forecast • Green = Actuals</span>
          </div>
        </div>

        {/* Chart 2: Net Demand & Thermal Procurement Decision Curve */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                <span>2. Day-Ahead Additional Procurement Plan (Net Demand)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Consumer demand minus wind, with {(confidenceLevel * 100).toFixed(0)}% confidence buffer
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono font-semibold">MW</div>
          </div>

          <div className="h-56 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", borderRadius: "0.75rem", fontSize: "11px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                  formatter={(value: any, name: any) => {
                    const formatted = typeof value === "number" ? `${value.toLocaleString()} MW` : value;
                    if (name === "demandMW") return [formatted, "Consumer Load Demand"];
                    if (name === "riskAdjustedProcureMW") return [formatted, "Risk-Adjusted (Recommended)"];
                    if (name === "unbufferedProcureMW") return [formatted, "Unbuffered Baseline"];
                    if (name === "riskBufferMW") return [formatted, "Risk Buffer"];
                    return [formatted, name];
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
                  formatter={(value) => {
                    if (value === "demandMW") return "Demand Profile";
                    if (value === "riskAdjustedProcureMW") return "Risk-Adjusted (Thermal)";
                    if (value === "unbufferedProcureMW") return "Unbuffered";
                    if (value === "riskBufferMW") return "Buffer";
                    return value;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="demandMW"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="riskAdjustedProcureMW"
                  fill="#f59e0b"
                  fillOpacity={0.18}
                  stroke="#d97706"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="unbufferedProcureMW"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>Buffer covers {comparison?.metrics?.maxOverforecastMW.toLocaleString() || "..."} MW max shortfall</span>
            <span className="text-amber-700 font-semibold">Orange = Final Purchase Order</span>
          </div>
        </div>
      </div>

      {/* Forecast Evolution Modal / Panel */}
      {selectedHourForEvolution && (
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-sky-300 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-100 text-sky-700 shrink-0">
                <Clock className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Evolution for Target: <span className="font-mono text-sky-700">{selectedHourForEvolution}</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  National Grid revisions across successive runs leading to cutoff.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedHourForEvolution(null)}
              className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 cursor-pointer font-semibold"
            >
              Close
            </button>
          </div>

          {loadingEvolution ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading evolution history...</div>
          ) : evolutionData && evolutionData.revisions.length > 0 ? (
            <div className="h-44 sm:h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={evolutionData.revisions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="publishTime" stroke="#64748b" fontSize={10} tickFormatter={(v) => v.substring(5, 16)} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${v} MW`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", borderRadius: "0.5rem", fontSize: "11px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                    formatter={(v: any) => [`${v} MW`, "Forecast Run"]}
                    labelFormatter={(l: any) => `Published: ${l}`}
                  />
                  {evolutionData.actualMW !== null && (
                    <ReferenceLine
                      y={evolutionData.actualMW}
                      stroke="#10b981"
                      strokeDasharray="3 3"
                      label={{ value: `Actual: ${evolutionData.actualMW} MW`, fill: "#059669", fontSize: 10 }}
                    />
                  )}
                  <Line
                    type="stepAfter"
                    dataKey="forecastMW"
                    stroke="#0284c7"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: "#0284c7" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-4 text-xs text-slate-400">No revisions recorded for this specific hour.</div>
          )}
        </div>
      )}

      {/* Hourly / Settlement Period Breakdown Table */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Settlement Period Procurement Ledger</span>
            </h3>
            <p className="text-xs text-slate-500">
              Breakdown for {comparison?.deliveryDate} • Swipe horizontally to view all columns on mobile
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Showing <strong className="text-slate-900 font-mono">{comparison?.records.length || 0}</strong> settlement periods
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700 min-w-[680px]">
            <thead className="sticky top-0 bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Period / Time</th>
                <th className="py-2.5 px-3">Forecast</th>
                <th className="py-2.5 px-3">Actual</th>
                <th className="py-2.5 px-3">Error</th>
                <th className="py-2.5 px-3">Consumer Demand</th>
                <th className="py-2.5 px-3">Quantified Buffer</th>
                <th className="py-2.5 px-3">Recommended Purchase</th>
                <th className="py-2.5 px-3 text-right">Evolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {(comparison?.records || []).map((r, i) => {
                const proc = procurement?.periods[i];
                const isOverforecast = (r.errorMW || 0) > 0;
                return (
                  <tr key={r.startTime} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 text-slate-900 font-sans font-semibold">
                      <span>SP {r.settlementPeriod || i + 1}</span>
                      <span className="text-slate-500 text-[10px] sm:text-[11px] block">{r.startTime.substring(11, 16)} UTC</span>
                    </td>
                    <td className="py-2 px-3 text-sky-700 font-bold">
                      {r.forecastGenerationMW.toLocaleString()} MW
                    </td>
                    <td className="py-2 px-3 text-emerald-700 font-bold">
                      {r.actualGenerationMW != null ? `${r.actualGenerationMW.toLocaleString()} MW` : "..."}
                    </td>
                    <td className="py-2 px-3">
                      {r.errorMW != null ? (
                        <span
                          className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold ${
                            isOverforecast
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {(r.errorMW ?? 0) > 0 ? "+" : ""}{(r.errorMW ?? 0).toLocaleString()} MW
                        </span>
                      ) : (
                        "..."
                      )}
                    </td>
                    <td className="py-2 px-3 text-purple-700">
                      {proc?.consumerDemandMW.toLocaleString()} MW
                    </td>
                    <td className="py-2 px-3 text-emerald-700 font-bold">
                      +{proc?.riskBufferMW.toLocaleString()} MW
                    </td>
                    <td className="py-2 px-3 text-amber-800 font-extrabold">
                      {proc?.netDemandRiskAdjustedMW.toLocaleString()} MW
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => handleShowEvolution(r.startTime)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-sans font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Revisions
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
