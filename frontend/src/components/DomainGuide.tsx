import React from "react";
import {
  BookOpen,
  ShieldAlert,
  Code,
  Layers,
  Clock,
  Compass,
} from "lucide-react";

export const DomainGuide: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          Domain Knowledge & Software Methodology
        </div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900">
          UK Wholesale Power Market & Day-Ahead Decision Framework
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Comprehensive reference guide for commercial traders, quantitative analysts, and technical reviewers.
          Explains Great Britain (GB) power market rules, Elexon BMRS dataset architecture, and mathematical formulas powering GridPulse.
        </p>
      </div>

      {/* Section 1: The Commercial Challenge */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 shrink-0" />
          <span>1. The UK Day-Ahead Trading Timeline & Gate Closure</span>
        </h3>
        <div className="text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed">
          <p>
            In Great Britain, electricity cannot be stored at scale economically, so supply and demand must balance continuously across each of the <strong>48 half-hour settlement periods</strong> of the day.
          </p>
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-sky-800 text-[11px] sm:text-xs uppercase tracking-wider">
              Chronological Workflow for Day D:
            </h4>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700">
              <li>
                <strong className="text-slate-900">Day D-1, 09:30–10:30 UTC:</strong> National Grid ESO (NESO) publishes updated national wind forecasts via Elexon BMRS (<code className="text-sky-700 font-bold bg-sky-100 px-1 py-0.5 rounded">WINDFOR</code>).
              </li>
              <li>
                <strong className="text-slate-900">Day D-1, 11:00 UTC (Gate Closure):</strong> Day-Ahead auction order books close on wholesale power exchanges (EPEX SPOT and Nord Pool). Energy utilities must lock in physical procurement bids to cover consumer load minus forecasted renewables.
              </li>
              <li>
                <strong className="text-slate-900">Day D, 00:00–24:00 UTC (Delivery Day):</strong> Physical power flows. National wind outturn is recorded every 30 minutes in Elexon (<code className="text-emerald-700 font-bold bg-emerald-100 px-1 py-0.5 rounded">FUELHH</code>).
              </li>
              <li>
                <strong className="text-slate-900">Imbalance Settlement:</strong> Any mismatch between a utility's contracted position and actual consumer demand minus actual wind is cash-settled through Elexon's Balancing Mechanism at the System Price.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 2: Imbalance Settlement Risk */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" />
          <span>2. The Asymmetry of Forecast Error (Over- vs Under-Forecasting)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold uppercase">
              Over-Forecast Error (Forecast &gt; Actual)
            </span>
            <h4 className="font-bold text-amber-950 text-xs sm:text-sm">Under-Procurement & Shortfall Cash-Out</h4>
            <p className="text-amber-900 text-xs leading-relaxed">
              When wind generation fails to materialize, the utility is left <em>short</em>. The deficit must be bought from the Balancing Mechanism at the <strong>System Buy Price (SBP)</strong>. In cold winter periods (such as January 2026), SBP frequently spikes to £200–£600/MWh, inflicting severe financial penalties.
            </p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-bold uppercase">
              Under-Forecast Error (Forecast &lt; Actual)
            </span>
            <h4 className="font-bold text-blue-950 text-xs sm:text-sm">Over-Procurement & Spill Inefficiency</h4>
            <p className="text-blue-900 text-xs leading-relaxed">
              When actual wind exceeds the forecast, the utility has bought excess thermal/market power. The surplus energy is spilled into the system at the System Sell Price (SSP), which may be discounted or even negative during wind curtailment hours.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Elexon BMRS Datasets */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 shrink-0" />
          <span>3. Elexon BMRS Data Architecture & Alignment</span>
        </h3>
        <div className="text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed">
          <p>
            In accordance with assignment requirements, all calculations are powered purely by public Elexon BMRS APIs:
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 font-mono text-xs">
            <table className="w-full text-left min-w-[500px]">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-2.5">Dataset</th>
                  <th className="p-2.5">Endpoint</th>
                  <th className="p-2.5">Resolution</th>
                  <th className="p-2.5">Key Fields</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-2.5 font-bold text-sky-700 font-sans">WINDFOR</td>
                  <td className="p-2.5 text-[11px]">/datasets/WINDFOR/stream</td>
                  <td className="p-2.5">Hourly</td>
                  <td className="p-2.5">publishTime, startTime, generation</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-emerald-700 font-sans">FUELHH</td>
                  <td className="p-2.5 text-[11px]">/datasets/FUELHH/stream</td>
                  <td className="p-2.5">Half-Hourly (30m)</td>
                  <td className="p-2.5">startTime, settlementPeriod, fuelType="WIND", generation</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <strong className="text-slate-900 font-bold">Alignment Methodology:</strong>
            <p>
              Because <code className="text-sky-700 font-bold">WINDFOR</code> publishes hourly forecasts while <code className="text-emerald-700 font-bold">FUELHH</code> records 30-minute outturns, GridPulse supports dual alignment:
              <br />
              1. <strong>Hourly Aggregation:</strong> Mathematical average of HH1 and HH2 actuals paired with the hourly forecast.
              <br />
              2. <strong>Settlement Period Mapping:</strong> Hourly forecast mapped across each half-hour settlement period (1 to 48) for direct bidding compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Section 4: Quantitative Error Metrics */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
          <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />
          <span>4. Mathematical Accuracy Metrics Reference</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-sky-700 font-mono">MAE (Mean Absolute Error)</div>
            <div className="font-mono text-slate-800 font-semibold">MAE = (1/N) * Σ |Forecast_i - Actual_i|</div>
            <p className="text-slate-500 text-[11px]">Average magnitude of errors in MW, treating over and under forecasts equally.</p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-indigo-700 font-mono">RMSE (Root Mean Squared Error)</div>
            <div className="font-mono text-slate-800 font-semibold">RMSE = sqrt((1/N) * Σ (Forecast_i - Actual_i)^2)</div>
            <p className="text-slate-500 text-[11px]">Quadratic penalty that emphasizes severe forecasting outliers during storms.</p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-amber-700 font-mono">MBE (Mean Bias Error)</div>
            <div className="font-mono text-slate-800 font-semibold">MBE = (1/N) * Σ (Forecast_i - Actual_i)</div>
            <p className="text-slate-500 text-[11px]">Measures systemic directional bias. Positive indicates systematic over-forecasting.</p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-emerald-700 font-mono">Dynamic Risk Buffer Formula</div>
            <div className="font-mono text-slate-800 font-semibold">Buffer_t = Z_alpha * sigma_t</div>
            <p className="text-slate-500 text-[11px]">Quantified safety margin calculated from empirical error distributions (e.g. Z=1.28 for 90% confidence).</p>
          </div>
        </div>
      </div>

      {/* Section 5: Tech Lead Review & Architecture */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
          <Code className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
          <span>5. Technical Implementation & Architecture Review</span>
        </h3>
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            Key architectural decisions implemented for maintainability, speed, and cloud deployment:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <strong className="text-sky-700 block font-bold">Backend Architecture</strong>
              <p className="text-slate-500">
                FastAPI with Pydantic validation, async HTTPX client for Elexon, NumPy and Pandas for analytical computations, and 100% pytest unit test coverage.
              </p>
            </div>
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <strong className="text-purple-700 block font-bold">Storage & Caching</strong>
              <p className="text-slate-500">
                Self-contained SQLite repository with WAL mode and compound indexes. Ships with pre-seeded January 2026 data for sub-second offline bootup.
              </p>
            </div>
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <strong className="text-emerald-700 block font-bold">Frontend & Docker</strong>
              <p className="text-slate-500">
                React 19, TypeScript, Tailwind CSS, Lucide icons, and Recharts. Multi-stage Dockerfile and docker-compose for one-command execution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
