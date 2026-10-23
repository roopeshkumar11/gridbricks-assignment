import React, { useState } from "react";
import {
  LayoutDashboard,
  SlidersHorizontal,
  LineChart,
  BookOpen,
  RefreshCw,
  Zap,
  Clock,
  CheckCircle2,
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
      setSyncMessage("Syncing...");
      await triggerLiveSync();
      setSyncMessage("Synced!");
      setTimeout(() => {
        setSyncMessage(null);
        if (onSyncComplete) onSyncComplete();
      }, 2500);
    } catch (e) {
      setSyncMessage("Sync error");
      setTimeout(() => setSyncMessage(null), 2500);
    } finally {
      setSyncing(false);
    }
  };

  const navItems = [
    { id: "overview", label: "Executive Overview", icon: LayoutDashboard },
    { id: "workbench", label: "Day-Ahead Workbench", icon: SlidersHorizontal },
    { id: "accuracy", label: "Forecast Accuracy", icon: LineChart },
    { id: "guide", label: "Market & Methodology", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-md shadow-sky-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  GridPulse <span className="text-sky-600">UK</span>
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  Day-Ahead BMRS
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-sky-600" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Status Badges & Sync Action */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-700 font-medium">Jan 2026 Target</span>
              <span className="text-slate-300">|</span>
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-slate-700 font-mono font-semibold">11:00 UTC Gate Closure</span>
            </div>

            <button
              onClick={handleSync}
              disabled={syncing}
              title="Sync dataset directly with Elexon BMRS API"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-sky-600" : "text-slate-500"}`} />
              <span className="hidden sm:inline">{syncMessage || "Sync BMRS"}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
