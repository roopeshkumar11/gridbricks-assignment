import React from "react";
import {
  Target,
  TrendingUp,
  Activity,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { ComprehensiveMetricsResponse, AccuracyMetrics } from "../types";

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

  return (
    <div className="space-y-6">
      {/* Hero Banner / Pitch Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-sky-50/40 to-blue-50/60 border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-sky-200/40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 rounded-full bg-blue-200/30 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 border border-sky-200 text-sky-800 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            UK Day-Ahead Wholesale Procurement Pilot • January 2026
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Quantified Wind Forecast Intelligence for UK Day-Ahead Power Traders
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
            Built for UK energy utilities buying power in the wholesale Day-Ahead auction.
            By combining Elexon BMRS <code className="text-sky-700 bg-sky-100/80 px-1.5 py-0.5 rounded font-mono text-xs">WINDFOR</code> forecasts
            at 11:00 UTC Gate Closure with outturn <code className="text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded font-mono text-xs">FUELHH</code> actuals,
            GridPulse quantifies renewable forecast uncertainty to optimize thermal backup procurement and minimize balancing mechanism penalties.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate("workbench")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-sm shadow-md shadow-sky-600/20 transition-all cursor-pointer"
            >
              <span>Open Day-Ahead Workbench</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate("accuracy")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-sm shadow-xs transition-all cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-sky-600" />
              <span>Explore Forecast Accuracy Metrics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Mean Absolute Error */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xs hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Day-Ahead MAE
            </span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {overall ? `${overall.maeMW.toLocaleString()} MW` : "..."}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="text-sky-700 font-bold bg-sky-50 px-1.5 py-0.5 rounded">
                {overall ? `${overall.nmaeCapacityPercent}%` : "..."}
              </span>
              <span>of GB Wind Fleet Capacity (30 GW)</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Average absolute error magnitude per delivery hour at 11:00 UTC cutoff.
          </div>
        </div>

        {/* KPI 2: Systemic Bias */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xs hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Forecast Bias (MBE)
            </span>
            <div className={`p-2 rounded-lg ${overall && overall.mbeBiasMW > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono flex items-center gap-1.5">
              <span>{overall ? `${overall.mbeBiasMW > 0 ? "+" : ""}${overall.mbeBiasMW.toLocaleString()} MW` : "..."}</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <span className={`font-bold px-1.5 py-0.5 rounded ${overall && overall.mbeBiasMW > 0 ? "text-amber-700 bg-amber-50" : "text-emerald-700 bg-emerald-50"}`}>
                {overall ? (overall.mbeBiasMW > 0 ? "Over-Forecasting Bias" : "Under-Forecasting Bias") : "..."}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            {overall && overall.mbeBiasMW > 0
              ? "System over-predicts wind; utility is exposed to shortfall cash-out penalties."
              : "System under-predicts wind; utility risks buying excess thermal energy."}
          </div>
        </div>

        {/* KPI 3: Root Mean Squared Error (RMSE) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xs hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              RMSE Volatility Penalty
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {overall ? `${overall.rmseMW.toLocaleString()} MW` : "..."}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span>Std Dev: </span>
              <span className="text-indigo-700 font-bold">{overall ? `${overall.stdDevMW.toLocaleString()} MW` : "..."}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Penalizes large forecast spikes during storm fronts and frontal passages.
          </div>
        </div>

        {/* KPI 4: Recommended P90 Risk Buffer */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-200 hover:border-emerald-300 transition-all shadow-xs hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Recommended P90 Buffer
            </span>
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800 font-mono">
              {overall ? `+${overall.p90MW.toLocaleString()} MW` : "..."}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700">
              <span className="font-bold bg-emerald-100/80 px-1.5 py-0.5 rounded">90% Confidence Hedging Buffer</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-100 text-[11px] text-slate-500">
            Thermal backup margin recommended to cover 90% of wind shortfall risk.
          </div>
        </div>
      </div>

      {/* Strategic Insights Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insight 1: Day-Ahead Market Reality */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-sky-700 font-bold text-sm">
            <Layers className="w-4 h-4" />
            <span>1. Gate Closure Decision Window</span>
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Orders Locked at 11:00 UTC (D-1)
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            In Great Britain, power purchase bids on Day-Ahead power exchanges (EPEX / Nord Pool) must be submitted before 11:00 UTC for delivery across all 48 half-hour settlement periods of day D. At this moment, traders must lock in bids based on the 09:30 or 10:30 UTC Elexon forecast run.
          </p>
          <div className="pt-2 text-xs text-sky-600 font-semibold cursor-pointer flex items-center gap-1 hover:underline" onClick={() => onNavigate("workbench")}>
            <span>Test decisions in Workbench</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Insight 2: Imbalance Settlement Risk */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>2. The Price of Forecast Over-Prediction</span>
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Shortfall Forces Balancing Mechanism Cash-Out
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            When actual wind turns out lower than forecast, the utility is under-contracted in real-time. National Grid ESO resolves the shortfall via the Balancing Mechanism at System Buy Price (SBP), which can spike to £150–£500+/MWh during tight winter margins.
          </p>
          <div className="pt-2 text-xs text-amber-600 font-semibold cursor-pointer flex items-center gap-1 hover:underline" onClick={() => onNavigate("accuracy")}>
            <span>View Error Distribution & Tails</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Insight 3: Quantified Solution */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>3. Risk-Adjusted Net Procurement</span>
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Data-Driven Hedging Without Guesswork
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Instead of buying thermal power solely against the unbuffered wind forecast, GridPulse computes a dynamic risk buffer based on empirical error quantiles. The procurement team can dynamically dial their risk tolerance (50% to 99%) according to current market spreads.
          </p>
          <div className="pt-2 text-xs text-emerald-600 font-semibold cursor-pointer flex items-center gap-1 hover:underline" onClick={() => onNavigate("workbench")}>
            <span>Try Risk Buffer Slider</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Featured January 2026 Days Spotlight */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              January 2026 High-Impact Decision Case Studies
            </h2>
            <p className="text-xs text-slate-500">
              Click any featured date below to instantly load the full Day-Ahead analysis in the workbench.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigate("workbench", "2026-01-05")}
            className="p-4 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-sky-400 cursor-pointer transition-all shadow-xs hover:shadow-md group"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-mono text-sky-700 font-bold">Decision: Jan 05, 2026</span>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-semibold">
                Delivery: Jan 06
              </span>
            </div>
            <div className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition-colors">
              Rapid Wind Ramp-Down Case
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Wind dropped sharply from 15 GW to 4 GW. High over-forecast error in early hours required swift thermal ramping.
            </p>
          </div>

          <div
            onClick={() => onNavigate("workbench", "2026-01-14")}
            className="p-4 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-sky-400 cursor-pointer transition-all shadow-xs hover:shadow-md group"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-mono text-sky-700 font-bold">Decision: Jan 14, 2026</span>
              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-semibold">
                Delivery: Jan 15
              </span>
            </div>
            <div className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition-colors">
              High Wind / Storm Benchmark
            </div>
            <p className="text-xs text-slate-500 mt-1">
              National wind generation sustained over 18 GW. Minor relative percentage error, but substantial absolute MW volume swings.
            </p>
          </div>

          <div
            onClick={() => onNavigate("workbench", "2026-01-24")}
            className="p-4 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-sky-400 cursor-pointer transition-all shadow-xs hover:shadow-md group"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-mono text-sky-700 font-bold">Decision: Jan 24, 2026</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                Delivery: Jan 25
              </span>
            </div>
            <div className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition-colors">
              Low Wind Anticyclonic Dunkelflaute
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Calm winter conditions with wind generation &lt; 5 GW. Utility required heavy baseline thermal procurement with low error variance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
