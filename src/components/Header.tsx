import React from 'react';
import { 
  Layers, 
  Search, 
  Plus, 
  Play, 
  Pause, 
  Zap, 
  Database, 
  Cpu, 
  Workflow, 
  BarChart3,
  Activity
} from 'lucide-react';
import { ClusterMetrics } from '../types';

export type ActiveTab = 'queues' | 'query_studio' | 'workers' | 'automation' | 'telemetry';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  metrics: ClusterMetrics;
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;
  onOpenNewJob: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  metrics,
  isSimulating,
  setIsSimulating,
  simulationSpeed,
  setSimulationSpeed,
  onOpenNewJob,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white">OmniQ</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  v2.4 Core
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{metrics.activeWorkersCount} Nodes Online</span>
                <span>•</span>
                <span className="text-slate-300 font-mono">{metrics.throughputPerSec} ops/s</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              id="nav-tab-queues"
              onClick={() => setActiveTab('queues')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'queues'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Queues & Tasks</span>
              {metrics.pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs bg-blue-400/20 text-blue-200">
                  {metrics.pendingCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-query-studio"
              onClick={() => setActiveTab('query_studio')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'query_studio'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Query Studio</span>
            </button>

            <button
              id="nav-tab-workers"
              onClick={() => setActiveTab('workers')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'workers'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Cluster Nodes</span>
            </button>

            <button
              id="nav-tab-automation"
              onClick={() => setActiveTab('automation')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'automation'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Workflow className="w-4 h-4" />
              <span>Automation</span>
            </button>

            <button
              id="nav-tab-telemetry"
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'telemetry'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Telemetry</span>
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden lg:block w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="global-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs, IDs..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Simulation speed controls */}
            <div className="flex items-center bg-slate-950/70 rounded-lg p-1 border border-slate-800">
              <button
                id="btn-toggle-sim"
                onClick={() => setIsSimulating(!isSimulating)}
                title={isSimulating ? "Pause Simulator" : "Resume Simulator"}
                className={`p-1.5 rounded transition-colors ${
                  isSimulating
                    ? 'text-emerald-400 hover:bg-emerald-500/10'
                    : 'text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1"></div>

              {[1, 2, 5].map((spd) => (
                <button
                  key={spd}
                  id={`btn-speed-${spd}x`}
                  onClick={() => setSimulationSpeed(spd)}
                  className={`px-1.5 py-0.5 rounded text-xs font-mono transition-colors ${
                    simulationSpeed === spd
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Enqueue Action Button */}
            <button
              id="btn-quick-enqueue"
              onClick={onOpenNewJob}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-lg transition-all shadow-md shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Job</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('queues')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium ${
              activeTab === 'queues' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Queues</span>
          </button>
          <button
            onClick={() => setActiveTab('query_studio')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium ${
              activeTab === 'query_studio' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Query</span>
          </button>
          <button
            onClick={() => setActiveTab('workers')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium ${
              activeTab === 'workers' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Nodes</span>
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium ${
              activeTab === 'automation' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Rules</span>
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium ${
              activeTab === 'telemetry' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Stats</span>
          </button>
        </div>

      </div>
    </header>
  );
};
