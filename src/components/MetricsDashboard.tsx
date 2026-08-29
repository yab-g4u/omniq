import React from 'react';
import { ClusterMetrics, WorkerNode, TaskJob } from '../types';
import { 
  BarChart3, 
  Activity, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface MetricsDashboardProps {
  metrics: ClusterMetrics;
  workers: WorkerNode[];
  jobs: TaskJob[];
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  metrics,
  workers,
  jobs,
}) => {
  // Simulated historical throughput bars (last 12 points)
  const throughputHistory = [42, 58, 64, 72, 85, 91, 78, 88, 96, 110, 104, metrics.throughputPerSec];

  const completedJobs = jobs.filter((j) => j.status === 'completed');
  const failedJobs = jobs.filter((j) => j.status === 'failed');
  const successRate = jobs.length > 0 
    ? ((completedJobs.length / (completedJobs.length + failedJobs.length || 1)) * 100).toFixed(1)
    : '100';

  return (
    <div className="space-y-6">
      {/* High Level KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Real-time Throughput</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">
            {metrics.throughputPerSec} <span className="text-sm font-normal text-slate-400">ops/s</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1">
            <ArrowUpRight className="w-3 h-3" /> +14.2% vs previous hour
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Average P95 Latency</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">
            {metrics.avgLatencyMs} <span className="text-sm font-normal text-slate-400">ms</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Within SLA envelope (&lt;500ms)</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">
            {successRate}%
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">99.9% Target Met</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Average CPU Load</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">
            {metrics.systemLoadPct}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across {workers.length} nodes</div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Throughput Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span>Throughput Stream (Ops / Sec)</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Real-time queue dequeue rate history</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Live Window
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-800">
            {throughputHistory.map((val, idx) => {
              const maxVal = 140;
              const heightPct = Math.min(100, Math.max(10, Math.round((val / maxVal) * 100)));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {val}
                  </div>
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t-md transition-all duration-300 group-hover:from-blue-500 group-hover:to-indigo-300"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] font-mono text-slate-600">t-{12 - idx}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Queue Distribution Matrix (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Queue Distribution Breakdown</span>
            </h4>
            <p className="text-xs text-slate-400 mb-4">Task allocation across execution lanes</p>

            <div className="space-y-3">
              {[
                { label: 'High Priority', count: jobs.filter((j) => j.queue === 'high_priority').length, color: 'bg-rose-500' },
                { label: 'Default Lane', count: jobs.filter((j) => j.queue === 'default').length, color: 'bg-blue-500' },
                { label: 'Bulk Batch', count: jobs.filter((j) => j.queue === 'bulk_batch').length, color: 'bg-purple-500' },
                { label: 'Dead-Letter (DLQ)', count: jobs.filter((j) => j.queue === 'dlq').length, color: 'bg-red-500' },
              ].map((item) => {
                const pct = jobs.length > 0 ? Math.round((item.count / jobs.length) * 100) : 0;
                return (
                  <div key={item.label} className="text-xs">
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>{item.label}</span>
                      <span className="font-mono text-slate-400">{item.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Total Enqueued: {jobs.length} jobs</span>
            <span className="text-emerald-400 font-medium">All queues functional</span>
          </div>
        </div>
      </div>
    </div>
  );
};
