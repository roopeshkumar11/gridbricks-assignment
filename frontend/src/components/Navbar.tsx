import React, { useState } from "react";
import {
  LayoutDashboard,
  SlidersHorizontal,
  LineChart,
  BookOpen,
  RefreshCw,
  Zap,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { triggerLiveSync } from "../services/api";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  actualsCount: number;
  forecastsCount: number;
  onSyncComplete?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  actualsCount,
  forecastsCount,
  onSyncComplete,
}) => {
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncMessage("Syncing with Elexon...");
      await triggerLiveSync();
      setSyncMessage("Sync initiated!");
      setTimeout(() => {
        setSyncMessage(null);
        if (onSyncComplete) onSyncComplete();
      }, 3000);
    } catch (e) {
      setSyncMessage("Sync error");
      setTimeout(() => setSyncMessage(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "workbench", label: "Day-Ahead Workbench", icon: SlidersHorizontal },
    { id: "accuracy", label: "Forecast Accuracy", icon: LineChart },
    { id: "guide", label: "Market & Methodology", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0f172a]/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                  GridPulse UK
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                  Day-Ahead BMRS
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Renewable Wind Forecasting & Procurement Engine
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Status Badges & Sync Action */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">Jan 2026 Target</span>
              <span className="text-slate-500">|</span>
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300 font-mono">11:00 UTC Cutoff</span>
            </div>

            <button
              onClick={handleSync}
              disabled={syncing}
              title="Sync dataset directly with Elexon BMRS API"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-cyan-400" : ""}`} />
              <span className="hidden sm:inline">{syncMessage || "Sync BMRS"}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
