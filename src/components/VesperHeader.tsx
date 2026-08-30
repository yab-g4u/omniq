import React from 'react';
import {
  Phone,
  ShieldCheck,
  Sparkles,
  Layers,
  Radio,
  FileCheck,
} from 'lucide-react';

export type VesperView = 'landing' | 'dashboard' | 'ivr_phone' | 'architecture';

interface VesperHeaderProps {
  currentView: VesperView;
  setCurrentView: (view: VesperView) => void;
  onOpenSpike: () => void;
  totalCallsCount: number;
}

export const VesperHeader: React.FC<VesperHeaderProps> = ({
  currentView,
  setCurrentView,
  onOpenSpike,
  totalCallsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand Identity */}
          <div
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-3 shrink-0 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center shadow-md shadow-emerald-950 text-white font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
                SEQUA <span className="text-emerald-400 font-normal">| Intelligence</span>
              </span>
              <span className="hidden xl:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                Human-in-the-Loop AI
              </span>
            </div>
          </div>

          {/* Clean Single-Line Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1.5 bg-neutral-900/90 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'dashboard'
                  ? 'bg-white text-black shadow'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Intelligence Portal</span>
              {totalCallsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-700 font-bold">
                  {totalCallsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentView('ivr_phone')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'ivr_phone'
                  ? 'bg-white text-black shadow'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Phone className="w-4 h-4 text-amber-500" />
              <span>Voice Intake (8800)</span>
            </button>

            <button
              onClick={() => setCurrentView('architecture')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'architecture'
                  ? 'bg-white text-black shadow'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Architecture</span>
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenSpike}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-medium border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">ASR Spike</span>
            </button>

            <button
              onClick={() => setCurrentView('ivr_phone')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all cursor-pointer whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call 8800</span>
            </button>
          </div>
        </div>

        {/* Mobile Submenu Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-white/10 text-xs">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium ${
              currentView === 'dashboard' ? 'bg-white text-black' : 'text-neutral-400'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Portal</span>
          </button>
          <button
            onClick={() => setCurrentView('ivr_phone')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium ${
              currentView === 'ivr_phone' ? 'bg-white text-black' : 'text-neutral-400'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Voice Intake</span>
          </button>
          <button
            onClick={() => setCurrentView('architecture')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium ${
              currentView === 'architecture' ? 'bg-white text-black' : 'text-neutral-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Arch</span>
          </button>
        </div>
      </div>
    </header>
  );
};
