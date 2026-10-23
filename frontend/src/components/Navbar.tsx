import React, { useState } from "react";
import {
  LayoutDashboard,
  SlidersHorizontal,
  LineChart,
  BookOpen,
  RefreshCw,
  Zap,
  Clock,
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
      setSyncMessage("Error");
      setTimeout(() => setSyncMessage(null), 2500);
    } finally {
      setSyncing(false);
    }
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "workbench", label: "Workbench", icon: SlidersHorizontal },
    { id: "accuracy", label: "Accuracy", icon: LineChart },
    { id: "guide", label: "Methodology", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Left: Brand + Navigation Tabs Grouped Naturally */}
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 min-w-0 flex-1">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-xs shadow-sky-500/20 shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight text-slate-900 leading-none">
                  GridPulse <span className="text-sky-600">UK</span>
                </span>
                <span className="hidden sm:inline text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  BMRS
                </span>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="hidden sm:block h-5 w-px bg-slate-200 shrink-0" />

            {/* Navigation Tabs (Smooth horizontal scrolling on mobile, clean pills on desktop) */}
            <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-1 shrink min-w-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-sky-600" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Market Cutoff Context & Sync Action */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-700 font-medium">Jan 2026</span>
              <span className="text-slate-300">|</span>
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-slate-700 font-mono font-semibold">11:00 UTC</span>
            </div>

            <button
              onClick={handleSync}
              disabled={syncing}
              title="Sync dataset directly with Elexon BMRS API"
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${syncing ? "animate-spin text-sky-600" : "text-slate-500"}`} />
              <span className="hidden sm:inline">{syncMessage || "Sync BMRS"}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
