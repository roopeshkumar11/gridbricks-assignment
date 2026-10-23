import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { ExecutiveOverview } from "./components/ExecutiveOverview";
import { DecisionWorkbench } from "./components/DecisionWorkbench";
import { ModelEvaluation } from "./components/ModelEvaluation";
import { DomainGuide } from "./components/DomainGuide";
import { SystemSummary, ComprehensiveMetricsResponse } from "./types";
import { fetchSummary, fetchMetricsReport } from "./services/api";

export function App() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [selectedDecisionDate, setSelectedDecisionDate] = useState<string>("2026-01-05");
  const [summary, setSummary] = useState<SystemSummary | null>(null);
  const [metricsReport, setMetricsReport] = useState<ComprehensiveMetricsResponse | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingMetrics(true);
      const [sum, rep] = await Promise.all([
        fetchSummary().catch(() => null),
        fetchMetricsReport("2026-01", "11:00:00Z").catch(() => null),
      ]);
      if (sum) setSummary(sum);
      if (rep) setMetricsReport(rep);
    } catch (e) {
      console.error("Error loading initial data", e);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleNavigateWithDate = (tab: string, date?: string) => {
    if (date) {
      setSelectedDecisionDate(date);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        actualsCount={summary?.counts.actualsCount || 0}
        forecastsCount={summary?.counts.forecastsCount || 0}
        onSyncComplete={loadInitialData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "overview" && (
          <ExecutiveOverview
            metricsReport={metricsReport}
            onNavigate={handleNavigateWithDate}
            loading={loadingMetrics}
          />
        )}

        {activeTab === "workbench" && (
          <DecisionWorkbench initialDate={selectedDecisionDate} />
        )}

        {activeTab === "accuracy" && (
          <ModelEvaluation
            metricsReport={metricsReport}
            loading={loadingMetrics}
            onSelectDay={(dayStr) => handleNavigateWithDate("workbench", dayStr)}
          />
        )}

        {activeTab === "guide" && <DomainGuide />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">
              GP
            </div>
            <span>
              <strong>GridPulse UK</strong> • Day-Ahead Renewable Procurement Decision Platform
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Data: Elexon BMRS (FUELHH & WINDFOR)</span>
            <span>•</span>
            <span>Target Window: January 2026</span>
            <span>•</span>
            <span>Gate Closure: 11:00 UTC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
