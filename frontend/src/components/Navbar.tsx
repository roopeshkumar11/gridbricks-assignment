import React, { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  SlidersHorizontal,
  LineChart,
  BookOpen,
  RefreshCw,
  Zap,
  ChevronDown,
  Check,
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    {
      id: "workbench",
      label: "Day-Ahead Workbench",
      badge: "Main Tool",
      description: "11:00 UTC Gate Closure procurement, wind curves & risk buffer",
      icon: SlidersHorizontal,
    },
    {
      id: "accuracy",
      label: "Forecast Accuracy & Evaluation",
      badge: "Analytics",
      description: "MAE, RMSE, MBE Bias, Quantiles & Horizon degradation curves",
      icon: LineChart,
    },
    {
      id: "overview",
      label: "Executive Overview",
      badge: "Summary",
      description: "Commercial KPIs, pilot outcomes & January 2026 case studies",
      icon: LayoutDashboard,
    },
    {
      id: "guide",
      label: "Market & Methodology Guide",
      badge: "Knowledge",
      description: "UK wholesale trading rules, Elexon BMRS specs & formulas",
      icon: BookOpen,
    },
  ];

  const currentItem = navItems.find((item) => item.id === activeTab) || navItems[0];
  const CurrentIcon = currentItem.icon;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          {/* Logo & Brand Info */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-xs shadow-sky-500/20 shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 leading-none">
                GridPulse <span className="text-sky-600">UK</span>
              </span>
              <span className="hidden sm:inline text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 leading-tight">
                BMRS
              </span>
            </div>
          </div>

          {/* Central View Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
            >
              <CurrentIcon className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="font-bold text-slate-900">{currentItem.label}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180 text-sky-600" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu Panel */}
            {dropdownOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Select Portal View
                </div>
                <div className="space-y-1 mt-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isSelected = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-sky-50 border border-sky-200 text-sky-900"
                            : "hover:bg-slate-50 text-slate-700 border border-transparent"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                            isSelected ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs sm:text-sm font-bold truncate">
                              {item.label}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Status & Action */}
          <div className="flex items-center gap-2 shrink-0">
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
