import React, { useState } from 'react';
import { 
  TaskJob, 
  QueueType, 
  JobStatus 
} from '../types';
import { 
  Clock, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Zap, 
  Sparkles,
  RefreshCw,
  LayoutGrid,
  List,
  Flame,
  ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QueuePipelineProps {
  jobs: TaskJob[];
  onSelectJob: (job: TaskJob) => void;
  onRetryJob: (jobId: string) => void;
  onRetryAllDLQ: () => void;
  onPurgeQueue: (queueType: QueueType) => void;
  onDeleteJob: (jobId: string) => void;
  onOpenNewJob: () => void;
  searchQuery: string;
}

export const QueuePipeline: React.FC<QueuePipelineProps> = ({
  jobs,
  onSelectJob,
  onRetryJob,
  onRetryAllDLQ,
  onPurgeQueue,
  onDeleteJob,
  onOpenNewJob,
  searchQuery,
}) => {
  const [selectedQueue, setSelectedQueue] = useState<QueueType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sortBy, setSortBy] = useState<'createdAt' | 'priority' | 'progress'>('createdAt');

  // Filter jobs
  const filteredJobs = jobs
    .filter((job) => {
      const matchQueue = selectedQueue === 'all' || job.queue === selectedQueue;
      const matchStatus = statusFilter === 'all' || job.status === statusFilter;
      const matchSearch =
        searchQuery.trim() === '' ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.workerId && job.workerId.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchQueue && matchStatus && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') return a.priority - b.priority;
      if (sortBy === 'progress') return b.progress - a.progress;
      return b.createdAt - a.createdAt;
    });

  // Counters
  const countAll = jobs.length;
  const countHighPriority = jobs.filter((j) => j.queue === 'high_priority').length;
  const countDefault = jobs.filter((j) => j.queue === 'default').length;
  const countBulk = jobs.filter((j) => j.queue === 'bulk_batch').length;
  const countDLQ = jobs.filter((j) => j.queue === 'dlq').length;

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <RefreshCw className="w-3 h-3 animate-spin" /> In-Flight
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" /> Failed
          </span>
        );
      case 'retrying':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <RotateCcw className="w-3 h-3 animate-spin" /> Retrying
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  const getQueueBadge = (queue: QueueType) => {
    switch (queue) {
      case 'high_priority':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <Flame className="w-3 h-3" /> High Lane
          </span>
        );
      case 'bulk_batch':
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
            Bulk Batch
          </span>
        );
      case 'dlq':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
            DLQ Lane
          </span>
        );
      case 'default':
      default:
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
            Default
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Queue Selection Bar & Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* All Queues */}
        <button
          id="tab-queue-all"
          onClick={() => setSelectedQueue('all')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedQueue === 'all'
              ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Enqueued</span>
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{countAll}</div>
          <div className="text-[11px] text-slate-400 mt-1">All registered pipelines</div>
        </button>

        {/* High Priority */}
        <button
          id="tab-queue-high"
          onClick={() => setSelectedQueue('high_priority')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedQueue === 'high_priority'
              ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-300 font-medium">
            <span>High Priority</span>
            <Flame className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{countHighPriority}</div>
          <div className="text-[11px] text-rose-400/80 mt-1">Fast-track lane (p1-p2)</div>
        </button>

        {/* Default Queue */}
        <button
          id="tab-queue-default"
          onClick={() => setSelectedQueue('default')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedQueue === 'default'
              ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-blue-300 font-medium">
            <span>Default Queue</span>
            <Zap className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{countDefault}</div>
          <div className="text-[11px] text-blue-400/80 mt-1">Standard workloads</div>
        </button>

        {/* Bulk Batch */}
        <button
          id="tab-queue-bulk"
          onClick={() => setSelectedQueue('bulk_batch')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedQueue === 'bulk_batch'
              ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-purple-300 font-medium">
            <span>Bulk Batch</span>
            <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{countBulk}</div>
          <div className="text-[11px] text-purple-400/80 mt-1">Background ETL & exports</div>
        </button>

        {/* DLQ */}
        <button
          id="tab-queue-dlq"
          onClick={() => setSelectedQueue('dlq')}
          className={`col-span-2 sm:col-span-1 p-3.5 rounded-xl border text-left transition-all ${
            selectedQueue === 'dlq'
              ? 'bg-red-950/50 border-red-500 shadow-md shadow-red-500/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-red-300 font-medium">
            <span>Dead Letter (DLQ)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-1">{countDLQ}</div>
          <div className="text-[11px] text-red-400/80 mt-1">Failed retry exhaustions</div>
        </button>
      </div>

      {/* Control / Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
        
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'processing', 'pending', 'completed', 'failed'] as const).map((st) => (
            <button
              key={st}
              id={`filter-status-${st}`}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                statusFilter === st
                  ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Actions & Sorting */}
        <div className="flex items-center gap-2">
          {/* DLQ Retry All button */}
          {countDLQ > 0 && (
            <button
              id="btn-retry-dlq-all"
              onClick={onRetryAllDLQ}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-semibold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry All DLQ ({countDLQ})</span>
            </button>
          )}

          {/* Purge current queue button */}
          {selectedQueue !== 'all' && (
            <button
              id="btn-purge-queue"
              onClick={() => onPurgeQueue(selectedQueue)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-900/30 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 rounded-lg text-xs font-medium transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Lane</span>
            </button>
          )}

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              id="sort-jobs-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="createdAt" className="bg-slate-900">Newest</option>
              <option value="priority" className="bg-slate-900">Priority</option>
              <option value="progress" className="bg-slate-900">Progress</option>
            </select>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              id="btn-view-cards"
              onClick={() => setViewMode('cards')}
              className={`p-1 rounded ${viewMode === 'cards' ? 'bg-slate-800 text-blue-400' : 'text-slate-500'}`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              id="btn-view-table"
              onClick={() => setViewMode('table')}
              className={`p-1 rounded ${viewMode === 'table' ? 'bg-slate-800 text-blue-400' : 'text-slate-500'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Jobs Container */}
      {filteredJobs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No jobs match active filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Try adjusting your search query, status selector, or enqueue a new job into the cluster.
          </p>
          <button
            onClick={onOpenNewJob}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all"
          >
            Enqueue New Task
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredJobs.map((job) => (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={() => onSelectJob(job)}
                className="group relative bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg hover:shadow-black/40 flex flex-col justify-between"
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-slate-400">#{job.id}</span>
                      {getQueueBadge(job.queue)}
                    </div>
                    {getStatusBadge(job.status)}
                  </div>

                  <h4 className="text-sm font-semibold text-slate-100 line-clamp-2 group-hover:text-blue-300 transition-colors">
                    {job.title}
                  </h4>

                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[11px] font-mono text-slate-300">
                      {job.category}
                    </span>
                    <span>•</span>
                    <span>Pri: {job.priority}</span>
                    {job.workerId && (
                      <>
                        <span>•</span>
                        <span className="text-slate-400 font-mono truncate max-w-[110px]">
                          {job.workerId.replace('worker-', '')}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress & Error */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  {job.error ? (
                    <p className="text-xs text-rose-400 font-mono line-clamp-1 mb-2 bg-rose-950/40 p-1.5 rounded border border-rose-900/40">
                      {job.error}
                    </p>
                  ) : null}

                  {/* Progress bar */}
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Progress</span>
                    <span className="font-mono font-medium text-slate-300">{job.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        job.status === 'completed'
                          ? 'bg-emerald-500'
                          : job.status === 'failed'
                          ? 'bg-rose-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>

                  {/* Card Actions footer */}
                  <div className="flex items-center justify-between mt-3 pt-2 text-xs text-slate-400">
                    <span className="text-[11px]">
                      {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      {job.status === 'failed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRetryJob(job.id);
                          }}
                          className="p-1 hover:bg-slate-800 rounded text-blue-400 hover:text-blue-300"
                          title="Retry Job"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteJob(job.id);
                        }}
                        className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-rose-400"
                        title="Delete Job"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Job ID</th>
                  <th className="px-4 py-3">Title & Category</th>
                  <th className="px-4 py-3">Queue Lane</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Worker</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredJobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => onSelectJob(job)}
                    className="hover:bg-slate-850/80 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-400">
                      #{job.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-100 max-w-xs sm:max-w-md truncate">
                        {job.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {job.category}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getQueueBadge(job.queue)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-400">{job.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                      {job.workerId ? job.workerId.replace('worker-', '') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {job.status === 'failed' && (
                          <button
                            onClick={() => onRetryJob(job.id)}
                            className="p-1 hover:bg-slate-800 rounded text-blue-400"
                            title="Retry"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteJob(job.id)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
