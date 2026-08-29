import React, { useState } from 'react';
import { WorkerNode, TaskJob } from '../types';
import { 
  Cpu, 
  Server, 
  Plus, 
  Activity, 
  PowerOff, 
  RefreshCw, 
  HardDrive, 
  Globe, 
  Trash2, 
  CheckCircle,
  Zap
} from 'lucide-react';

interface WorkerClusterViewProps {
  workers: WorkerNode[];
  jobs: TaskJob[];
  onToggleDrain: (workerId: string) => void;
  onAddWorker: (region: string) => void;
  onRemoveWorker: (workerId: string) => void;
  onSelectJob: (job: TaskJob) => void;
}

export const WorkerClusterView: React.FC<WorkerClusterViewProps> = ({
  workers,
  jobs,
  onToggleDrain,
  onAddWorker,
  onRemoveWorker,
  onSelectJob,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('us-east (N. Virginia)');

  const totalConcurrency = workers.reduce((acc, w) => acc + (w.status !== 'drained' ? w.concurrency : 0), 0);
  const totalActiveSlots = workers.reduce((acc, w) => acc + w.activeJobs.length, 0);
  const clusterUtilization = totalConcurrency > 0 ? Math.round((totalActiveSlots / totalConcurrency) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Cluster Capacity Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Online Workers</span>
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {workers.filter((w) => w.status !== 'drained').length} / {workers.length}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">Cluster status healthy</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Slot Utilization</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{clusterUtilization}%</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalActiveSlots} of {totalConcurrency} slots assigned
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Tasks Processed</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {workers.reduce((acc, w) => acc + w.processedCount, 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Lifetime executions</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Scale Worker Cluster</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none flex-1"
            >
              <option value="us-east (N. Virginia)">us-east (Virginia)</option>
              <option value="us-west (Oregon)">us-west (Oregon)</option>
              <option value="eu-west (Frankfurt)">eu-west (Frankfurt)</option>
              <option value="ap-northeast (Tokyo)">ap-northeast (Tokyo)</option>
            </select>
            <button
              onClick={() => onAddWorker(selectedRegion)}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Worker Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workers.map((worker) => {
          const activeTaskObjects = jobs.filter((j) => worker.activeJobs.includes(j.id));
          const memPct = Math.round((worker.memoryUsage / worker.maxMemory) * 100);

          return (
            <div
              key={worker.id}
              className={`bg-slate-900/80 rounded-xl border p-5 transition-all flex flex-col justify-between ${
                worker.status === 'drained'
                  ? 'border-amber-900/40 bg-slate-950/40 opacity-75'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Node Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{worker.name}</h4>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          worker.status === 'busy'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : worker.status === 'drained'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : worker.status === 'active'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {worker.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <Globe className="w-3.5 h-3.5 text-slate-500" />
                      <span>{worker.region}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-500">ID: {worker.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onToggleDrain(worker.id)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                        worker.status === 'drained'
                          ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/50 hover:bg-emerald-900/50'
                          : 'bg-amber-900/30 text-amber-300 border border-amber-700/50 hover:bg-amber-900/50'
                      }`}
                      title={worker.status === 'drained' ? 'Resume Worker' : 'Drain Worker (No new jobs)'}
                    >
                      <PowerOff className="w-3 h-3" />
                      <span>{worker.status === 'drained' ? 'Resume' : 'Drain'}</span>
                    </button>

                    {workers.length > 1 && (
                      <button
                        onClick={() => onRemoveWorker(worker.id)}
                        className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Decommission Node"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Resource Gauges */}
                <div className="grid grid-cols-2 gap-3 my-4">
                  {/* CPU Usage */}
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5 text-blue-400" /> CPU Load
                      </span>
                      <span className="font-mono font-bold text-slate-200">{worker.cpuUsage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          worker.cpuUsage > 85 ? 'bg-rose-500' : worker.cpuUsage > 60 ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${worker.cpuUsage}%` }}
                      />
                    </div>
                  </div>

                  {/* Memory Usage */}
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400 flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5 text-indigo-400" /> Memory
                      </span>
                      <span className="font-mono font-bold text-slate-200">{memPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${memPct}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1 text-right">
                      {worker.memoryUsage} MB / {worker.maxMemory} MB
                    </div>
                  </div>
                </div>

                {/* Active Assigned Tasks */}
                <div className="mt-3">
                  <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
                    <span>Active In-Flight Slots ({activeTaskObjects.length}/{worker.concurrency})</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Processed: {worker.processedCount.toLocaleString()}
                    </span>
                  </div>

                  {activeTaskObjects.length === 0 ? (
                    <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/60 text-center text-xs text-slate-500">
                      Idle — awaiting pending tasks
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {activeTaskObjects.map((job) => (
                        <div
                          key={job.id}
                          onClick={() => onSelectJob(job)}
                          className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer text-xs group"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="font-mono text-[11px] font-bold text-blue-400">
                              #{job.id}
                            </span>
                            <span className="text-slate-200 truncate group-hover:text-blue-300">
                              {job.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-slate-400">
                            <span>{job.progress}%</span>
                            <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Node Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Uptime: {(worker.uptimeSeconds / 3600).toFixed(1)} hrs</span>
                <span>Err Rate: {((worker.failedCount / (worker.processedCount || 1)) * 100).toFixed(2)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
