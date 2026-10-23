import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { ExecutiveOverview } from "./components/ExecutiveOverview";
import { DecisionWorkbench } from "./components/DecisionWorkbench";
import { ModelEvaluation } from "./components/ModelEvaluation";
import { DomainGuide } from "./components/DomainGuide";
import { SystemSummary, ComprehensiveMetricsResponse } from "./types";
import { fetchSummary, fetchMetricsReport, pingHealth } from "./services/api";

export function App() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [selectedDecisionDate, setSelectedDecisionDate] = useState<string>("2026-01-05");
  const [summary, setSummary] = useState<SystemSummary | null>(null);
  const [metricsReport, setMetricsReport] = useState<ComprehensiveMetricsResponse | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);
  const [isWakingUp, setIsWakingUp] = useState<boolean>(false);

  useEffect(() => {
    loadInitialData();

    // Keep-alive: automatically ping backend every 8 minutes while user has dashboard open
    const keepAliveTimer = setInterval(() => {
      pingHealth();
    }, 8 * 60 * 1000);

    return () => clearInterval(keepAliveTimer);
  }, []);

  const loadInitialData = async () => {
    // If backend doesn't respond in 3.5 seconds, server is likely waking up from Render sleep
    const wakeTimer = setTimeout(() => {
      setIsWakingUp(true);
    }, 3500);

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
      clearTimeout(wakeTimer);
      setIsWakingUp(false);
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        actualsCount={summary?.counts.actualsCount || 0}
        forecastsCount={summary?.counts.forecastsCount || 0}
        onSyncComplete={loadInitialData}
      />

      {/* Render Server Sleep / Wake-up Banner */}
      {isWakingUp && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-xs sm:text-sm text-amber-900 flex items-center justify-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span className="font-medium">
            Waking up server from sleep (Render free tier cold start ~30s)... Analytics will appear automatically!
          </span>
        </div>
      )}

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
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[10px]">
              GP
            </div>
            <span>
              <strong className="text-slate-800">GridPulse UK</strong> • Day-Ahead Renewable Procurement Decision Platform
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
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
