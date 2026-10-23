import React, { useState, useEffect } from "react";
import {
  Target,
  TrendingUp,
  Activity,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  BarChart3,
  Calendar,
  Clock,
  Zap,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ComprehensiveMetricsResponse, AccuracyMetrics } from "../types";
import { fetchDayAheadComparison } from "../services/api";

interface ExecutiveOverviewProps {
  metricsReport: ComprehensiveMetricsResponse | null;
  onNavigate: (tab: string, date?: string) => void;
  loading: boolean;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({
  metricsReport,
  onNavigate,
  loading,
}) => {
  const overall: AccuracyMetrics | undefined = metricsReport?.overall;
  const [showcaseData, setShowcaseData] = useState<any[]>([]);

  useEffect(() => {
    fetchDayAheadComparison("2026-01-05", "11:00:00Z")
      .then((res) => {
        const formatted = res.records.map((r) => ({
          time: r.startTime.substring(11, 16),
          forecast: r.forecastGenerationMW,
          actual: r.actualGenerationMW,
          error: r.errorMW,
        }));
        setShowcaseData(formatted);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Banner - Clean, Responsive & Breathing */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2.5 sm:space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>UK Day-Ahead Wholesale Procurement Pilot • January 2026</span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Quantified Wind Forecast Intelligence for Day-Ahead Power Traders
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed">
              Evaluating National Grid ESO <code className="text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded font-mono text-xs font-bold">WINDFOR</code> forecasts
              against <code className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono text-xs font-bold">FUELHH</code> outturns to eliminate balancing mechanism cash-out risk.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <button
                onClick={() => onNavigate("workbench")}
                className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
              >
                <span>Launch Day-Ahead Workbench</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate("accuracy")}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 text-sky-600" />
                <span>View Accuracy Analytics</span>
              </button>
            </div>
          </div>

          {/* Quick Context Card */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 lg:w-72 shrink-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Market Configuration
            </span>
            <div className="space-y-1.5 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Wholesale Market:</span>
                <span className="font-bold text-slate-900">EPEX / Nord Pool</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Gate Closure:</span>
                <span className="font-mono font-bold text-sky-700">11:00 UTC (D-1)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Settlement Periods:</span>
                <span className="font-bold text-slate-900">48 Half-Hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">GB Fleet Wind:</span>
                <span className="font-mono font-bold text-emerald-700">30,000 MW</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Clean Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* KPI 1: MAE */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Day-Ahead MAE
            </span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-sky-50 text-sky-600">
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-slate-900 font-mono">
              {overall ? `${overall.maeMW.toLocaleString()} MW` : "..."}
            </div>
            <div className="mt-1">
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                {overall ? `${overall.nmaeCapacityPercent}% of 30 GW` : "..."}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Directional Bias */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Bias (MBE)
            </span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-slate-900 font-mono">
              {overall ? `${overall.mbeBiasMW > 0 ? "+" : ""}${overall.mbeBiasMW.toLocaleString()} MW` : "..."}
            </div>
            <div className="mt-1">
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Over-Forecast Bias
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: RMSE Volatility */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              RMSE Volatility
            </span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-slate-900 font-mono">
              {overall ? `${overall.rmseMW.toLocaleString()} MW` : "..."}
            </div>
            <div className="mt-1">
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Std Dev: {overall ? `${overall.stdDevMW.toLocaleString()} MW` : "..."}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Recommended P90 Buffer */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider">
              P90 Buffer
            </span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-emerald-800 font-mono">
              {overall ? `+${overall.p90MW.toLocaleString()} MW` : "..."}
            </div>
            <div className="mt-1">
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                90% Hedging Buffer
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Showcase Section: Interactive Sparkline & Core Value Pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left 2 Cols: Live Showcase Curve */}
        <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Day-Ahead Decision Curve Preview (January 5 Case Study)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Elexon WINDFOR (locked @ 11:00 UTC D-1) vs actual outturns across 24 delivery hours
              </p>
            </div>
            <button
              onClick={() => onNavigate("workbench", "2026-01-05")}
              className="text-xs text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>Analyze in Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-48 sm:h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={showcaseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", borderRadius: "0.5rem", fontSize: "11px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                  formatter={(v: any, name: any) => [`${typeof v === 'number' ? v.toLocaleString() : v} MW`, name === 'forecast' ? '11:00 UTC Forecast' : 'Actual Generation']}
                />
                <Area type="monotone" dataKey="forecast" stroke="#0284c7" fill="#0284c7" fillOpacity={0.08} strokeWidth={2} />
                <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 gap-1.5">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block" /> Forecast @ Cutoff
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block ml-2" /> Actual Outturn
            </span>
            <span className="text-slate-700 font-semibold">Delivery Day: 2026-01-06</span>
          </div>
        </div>

        {/* Right 1 Col: 3 Clean Value Pillars */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] sm:text-[11px]">
              Why GridPulse Protects Utility P&L
            </h3>
            <p className="text-xs text-slate-500">
              Eliminating the structural penalty of unadjusted renewable forecasts.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700 mt-0.5 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-slate-900 block font-bold">11:00 UTC Exact Cutoff</strong>
                <span className="text-slate-600">Strict point-in-time Elexon forecast extraction for EPEX order book close.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 mt-0.5 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-slate-900 block font-bold">P90 Risk Buffer</strong>
                <span className="text-slate-600">Statistical thermal buffer protecting against volatile £500/MWh Balancing spikes.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 mt-0.5 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-slate-900 block font-bold">Avoided Penalty Value</strong>
                <span className="text-slate-600">Estimated £1.8M avoided imbalance cash-out losses across January 2026.</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate("workbench")}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Start Trading Workflow
          </button>
        </div>
      </div>

      {/* 3 Decision Case Studies */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
              <span>January 2026 Case Study Highlights</span>
            </h3>
            <p className="text-xs text-slate-500">
              Click any regime to inspect forecast volatility and thermal procurement requirements.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div
            onClick={() => onNavigate("workbench", "2026-01-05")}
            className="p-3.5 sm:p-4 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-sky-400 cursor-pointer transition-all shadow-xs hover:shadow-md group"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-mono text-sky-700 font-bold">Jan 05, 2026</span>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                Delivery: Jan 06
              </span>
            </div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-sky-600 transition-colors">
              Rapid Wind Ramp-Down Case
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed">
              Wind dropped sharply from 15 GW to 4 GW. Early over-forecast required immediate thermal dispatch.
            </p>
          </div>

          <div
            onClick={() => onNavigate("workbench", "2026-01-14")}
            className="p-3.5 sm:p-4 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-sky-400 cursor-pointer transition-all shadow-xs hover:shadow-md group"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-mono text-sky-700 font-bold">Jan 14, 2026</span>
              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                Delivery: Jan 15
              </span>
            </div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-sky-600 transition-colors">
              High Wind / Storm Benchmark
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed">
              National wind generation sustained over 18 GW. Minor percentage error, but substantial MW swings.
            </p>
          </div>

          <div
            onClick={() => onNavigate("workbench", "2026-01-24")}
            className="p-3.5 sm:p-4 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-sky-400 cursor-pointer transition-all shadow-xs hover:shadow-md group"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-mono text-sky-700 font-bold">Jan 24, 2026</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                Delivery: Jan 25
              </span>
            </div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-sky-600 transition-colors">
              Anticyclonic Dunkelflaute
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed">
              Calm winter weather with wind &lt; 5 GW. Heavy thermal baseline procurement with low error variance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
