import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Download,
  ShieldAlert,
  Flame,
  Wind,
  Layers,
  HelpCircle,
  TrendingDown,
  Info,
  ChevronRight,
  ExternalLink,
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

  // Prepare chart data merging forecast, actuals, error, and procurement
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
      // Procurement metrics
      demandMW: procItem?.consumerDemandMW,
      riskBufferMW: procItem?.riskBufferMW,
      unbufferedProcureMW: procItem?.netDemandUnbufferedMW,
      riskAdjustedProcureMW: procItem?.netDemandRiskAdjustedMW,
      shortfallMW: procItem?.actualProcurementShortfallMW,
    };
  });

  return (
    <div className="space-y-6">
      {/* Control Header & Parameters Panel */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                UK Day-Ahead Decision Engine
              </span>
              <span className="text-xs text-slate-400">
                Target Delivery Day: <strong className="text-white font-mono">{comparison?.deliveryDate || "..."}</strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Procurement & Forecast Workbench
            </h2>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <a
              href={getExportCsvUrl(decisionDate, cutoffTime, undefined, aggregation)}
              download
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Input Parameters Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-800 text-xs">
          {/* 1. Decision Date */}
          <div className="space-y-1">
            <label className="text-slate-400 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Decision Date (D-1)</span>
            </label>
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={decisionDate}
              onChange={(e) => setDecisionDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* 2. Cutoff Time / Gate Closure */}
          <div className="space-y-1">
            <label className="text-slate-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Decision Cutoff (Gate Closure)</span>
            </label>
            <select
              value={cutoffTime}
              onChange={(e) => setCutoffTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
            >
              <option value="09:00:00Z">09:00 UTC (Pre-Auction Prep)</option>
              <option value="11:00:00Z">11:00 UTC (Day-Ahead Gate Closure)</option>
              <option value="12:00:00Z">12:00 UTC (Post-Auction Clearance)</option>
              <option value="14:00:00Z">14:00 UTC (Intraday Gate 1)</option>
              <option value="17:00:00Z">17:00 UTC (Intraday Gate 2)</option>
            </select>
          </div>

          {/* 3. Aggregation Mode */}
          <div className="space-y-1">
            <label className="text-slate-400 font-medium flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Time Resolution</span>
            </label>
            <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-700">
              <button
                onClick={() => setAggregation("hourly")}
                className={`flex-1 py-1 rounded text-center font-medium transition-all ${
                  aggregation === "hourly"
                    ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Hourly (24)
              </button>
              <button
                onClick={() => setAggregation("half-hourly")}
                className={`flex-1 py-1 rounded text-center font-medium transition-all ${
                  aggregation === "half-hourly"
                    ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                HH (48 SP)
              </button>
            </div>
          </div>

          {/* 4. Demand Preset */}
          <div className="space-y-1">
            <label className="text-slate-400 font-medium flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Consumer Demand Scenario</span>
            </label>
            <select
              value={demandPreset}
              onChange={(e) => setDemandPreset(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="winter_typical">GB Winter Typical (~38 GW Peak)</option>
              <option value="winter_high">GB Winter Cold Snap (+10% Load)</option>
              <option value="winter_low">GB Winter Mild (-10% Load)</option>
            </select>
          </div>

          {/* 5. Confidence Level */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-400 font-medium flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                <span>Risk Buffer Confidence</span>
              </label>
              <span className="text-emerald-400 font-bold font-mono">
                {(confidenceLevel * 100).toFixed(0)}%
              </span>
            </div>
            <select
              value={confidenceLevel}
              onChange={(e) => setConfidenceLevel(parseFloat(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-emerald-400 font-bold focus:border-cyan-500 focus:outline-none"
            >
              <option value={0.50}>50% (P50 - Zero Margin)</option>
              <option value={0.80}>80% (Moderate Hedging)</option>
              <option value={0.90}>90% (P90 - Standard Utility Buffer)</option>
              <option value={0.95}>95% (P95 - High Security)</option>
              <option value={0.99}>99% (Maximum Reliability)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Daily Performance Strip */}
      {comparison?.metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase font-medium">Daily MAE</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">
              {comparison.metrics.maeMW.toLocaleString()} MW
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase font-medium">Daily Bias (MBE)</div>
            <div className={`text-xl font-bold font-mono mt-0.5 ${comparison.metrics.mbeBiasMW > 0 ? "text-amber-400" : "text-emerald-400"}`}>
              {comparison.metrics.mbeBiasMW > 0 ? "+" : ""}{comparison.metrics.mbeBiasMW.toLocaleString()} MW
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase font-medium">RMSE Penalty</div>
            <div className="text-xl font-bold text-blue-400 font-mono mt-0.5">
              {comparison.metrics.rmseMW.toLocaleString()} MW
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase font-medium">Max Over-Forecast</div>
            <div className="text-xl font-bold text-red-400 font-mono mt-0.5">
              +{comparison.metrics.maxOverforecastMW.toLocaleString()} MW
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase font-medium">Total Wind Forecast</div>
            <div className="text-xl font-bold text-cyan-400 font-mono mt-0.5">
              {procurement ? `${(procurement.totalExpectedWindMWh / 1000).toFixed(1)} GWh` : "..."}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase font-medium">Thermal Needed</div>
            <div className="text-xl font-bold text-amber-300 font-mono mt-0.5">
              {procurement ? `${(procurement.totalRiskAdjustedProcurementMWh / 1000).toFixed(1)} GWh` : "..."}
            </div>
          </div>
        </div>
      )}

      {/* Main Visualizations: 2 Tabs/Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Wind Forecast at Gate Closure vs Outturn Actuals */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wind className="w-4 h-4 text-cyan-400" />
                <span>1. Renewable Wind: Gate Closure Forecast vs Actuals</span>
              </h3>
              <p className="text-xs text-slate-400">
                Elexon WINDFOR (locked @ {cutoffTime.substring(0, 5)} UTC) vs FUELHH outturn
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono">MW</div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "12px" }}
                  formatter={(value: any, name: any) => {
                    const formatted = typeof value === "number" ? `${value.toLocaleString()} MW` : value;
                    if (name === "forecastMW") return [formatted, "Forecast @ Gate Closure"];
                    if (name === "actualMW") return [formatted, "Actual Generation (FUELHH)"];
                    if (name === "errorMW") return [formatted, "Error (Forecast - Actual)"];
                    return [formatted, name];
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  formatter={(value) => {
                    if (value === "forecastMW") return "Latest Forecast @ Cutoff";
                    if (value === "actualMW") return "Actual Outturn (FUELHH)";
                    if (value === "errorMW") return "Error Delta (F - A)";
                    return value;
                  }}
                />
                <ReferenceLine y={0} stroke="#334155" />
                <Line
                  type="monotone"
                  dataKey="forecastMW"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#38bdf8" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="actualMW"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#10b981" }}
                  activeDot={{ r: 5 }}
                />
                <Bar dataKey="errorMW" fill="#f59e0b" opacity={0.6} barSize={8} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span>Click any hour below to inspect forecast publication revisions</span>
            <span className="text-cyan-400 font-medium">Cyan = Forecast • Green = Actuals • Amber = Error</span>
          </div>
        </div>

        {/* Chart 2: Net Demand & Thermal Procurement Decision Curve */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>2. Day-Ahead Additional Procurement Plan (Net Demand)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Consumer demand minus wind, with {(confidenceLevel * 100).toFixed(0)}% confidence risk buffer
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono">MW</div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "12px" }}
                  formatter={(value: any, name: any) => {
                    const formatted = typeof value === "number" ? `${value.toLocaleString()} MW` : value;
                    if (name === "demandMW") return [formatted, "Consumer Load Demand"];
                    if (name === "riskAdjustedProcureMW") return [formatted, "Risk-Adjusted Procurement (Recommended)"];
                    if (name === "unbufferedProcureMW") return [formatted, "Unbuffered Procurement"];
                    if (name === "riskBufferMW") return [formatted, "Quantified Risk Buffer"];
                    return [formatted, name];
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  formatter={(value) => {
                    if (value === "demandMW") return "Consumer Demand Profile";
                    if (value === "riskAdjustedProcureMW") return "Risk-Adjusted Purchase (Thermal)";
                    if (value === "unbufferedProcureMW") return "Unbuffered Baseline";
                    if (value === "riskBufferMW") return "Quantified Buffer";
                    return value;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="demandMW"
                  stroke="#c084fc"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="riskAdjustedProcureMW"
                  fill="#f59e0b"
                  fillOpacity={0.15}
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="unbufferedProcureMW"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span>Buffer protects utility against {comparison?.metrics?.maxOverforecastMW.toLocaleString() || "..."} MW max shortfall spike</span>
            <span className="text-amber-400 font-medium">Orange Area = Final Procurement Order</span>
          </div>
        </div>
      </div>

      {/* Forecast Evolution Modal / Panel */}
      {selectedHourForEvolution && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Clock className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Forecast Evolution History for Target: <span className="font-mono text-cyan-300">{selectedHourForEvolution}</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Tracing how National Grid ESO revised forecasts across publication runs leading to gate closure.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedHourForEvolution(null)}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-md bg-slate-800"
            >
              Close
            </button>
          </div>

          {loadingEvolution ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading evolution history...</div>
          ) : evolutionData && evolutionData.revisions.length > 0 ? (
            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={evolutionData.revisions} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="publishTime" stroke="#64748b" fontSize={10} tickFormatter={(v) => v.substring(5, 16)} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${v} MW`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.5rem", fontSize: "11px" }}
                    formatter={(v: any) => [`${v} MW`, "Forecast Run"]}
                    labelFormatter={(l: any) => `Published: ${l}`}
                  />
                  {evolutionData.actualMW !== null && (
                    <ReferenceLine
                      y={evolutionData.actualMW}
                      stroke="#10b981"
                      strokeDasharray="3 3"
                      label={{ value: `Actual: ${evolutionData.actualMW} MW`, fill: "#10b981", fontSize: 10 }}
                    />
                  )}
                  <Line
                    type="stepAfter"
                    dataKey="forecastMW"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#38bdf8" }}
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
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Settlement Period Procurement Ledger</span>
            </h3>
            <p className="text-xs text-slate-400">
              Detailed breakdown for {comparison?.deliveryDate} • Click "View Revisions" on any row to see forecast trajectory
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Showing <strong className="text-white font-mono">{comparison?.records.length || 0}</strong> settlement periods
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Period / Time</th>
                <th className="py-2.5 px-3">Forecast @ Cutoff</th>
                <th className="py-2.5 px-3">Actual Outturn</th>
                <th className="py-2.5 px-3">Forecast Error</th>
                <th className="py-2.5 px-3">Consumer Demand</th>
                <th className="py-2.5 px-3">Quantified Buffer</th>
                <th className="py-2.5 px-3">Recommended Purchase</th>
                <th className="py-2.5 px-3 text-right">Evolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {(comparison?.records || []).map((r, i) => {
                const proc = procurement?.periods[i];
                const isOverforecast = (r.errorMW || 0) > 0;
                return (
                  <tr key={r.startTime} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 text-white font-sans font-medium">
                      <span>SP {r.settlementPeriod || i + 1}</span>
                      <span className="text-slate-400 text-[11px] block">{r.startTime.substring(11, 16)} UTC</span>
                    </td>
                    <td className="py-2 px-3 text-cyan-300 font-semibold">
                      {r.forecastGenerationMW.toLocaleString()} MW
                    </td>
                    <td className="py-2 px-3 text-emerald-400 font-semibold">
                      {r.actualGenerationMW != null ? `${r.actualGenerationMW.toLocaleString()} MW` : "..."}
                    </td>
                    <td className="py-2 px-3">
                      {r.errorMW != null ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            isOverforecast
                              ? "bg-amber-950/70 text-amber-300 border border-amber-800/60"
                              : "bg-blue-950/70 text-blue-300 border border-blue-800/60"
                          }`}
                        >
                          {(r.errorMW ?? 0) > 0 ? "+" : ""}{(r.errorMW ?? 0).toLocaleString()} MW
                        </span>
                      ) : (
                        "..."
                      )}
                    </td>
                    <td className="py-2 px-3 text-purple-300">
                      {proc?.consumerDemandMW.toLocaleString()} MW
                    </td>
                    <td className="py-2 px-3 text-emerald-400">
                      +{proc?.riskBufferMW.toLocaleString()} MW
                    </td>
                    <td className="py-2 px-3 text-amber-400 font-bold">
                      {proc?.netDemandRiskAdjustedMW.toLocaleString()} MW
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => handleShowEvolution(r.startTime)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-sans transition-colors cursor-pointer"
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
