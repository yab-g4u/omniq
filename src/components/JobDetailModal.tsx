import React, { useState } from 'react';
import { TaskJob } from '../types';
import { 
  X, 
  Terminal, 
  Code2, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Trash2, 
  Copy, 
  Check, 
  Clock, 
  Cpu, 
  ShieldAlert,
  Flame,
  FileJson
} from 'lucide-react';

interface JobDetailModalProps {
  job: TaskJob | null;
  onClose: () => void;
  onRetry: (jobId: string) => void;
  onDelete: (jobId: string) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  onClose,
  onRetry,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'payload' | 'output' | 'policy'>('logs');
  const [copied, setCopied] = useState<boolean>(false);

  if (!job) return null;

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(job.payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl shadow-black overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/60">
                #{job.id}
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-300">
                Queue: {job.queue}
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-300">
                Pri: {job.priority}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-semibold capitalize ${
                  job.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : job.status === 'failed'
                    ? 'bg-rose-500/20 text-rose-300'
                    : job.status === 'processing'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {job.status}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white leading-snug">{job.title}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-slate-950/30 border-b border-slate-800/80 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="text-slate-500 flex items-center gap-1 mb-1">
              <Clock className="w-3.5 h-3.5" /> Created At
            </div>
            <div className="font-mono text-slate-200">
              {new Date(job.createdAt).toLocaleTimeString()}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="text-slate-500 flex items-center gap-1 mb-1">
              <Cpu className="w-3.5 h-3.5" /> Worker Node
            </div>
            <div className="font-mono text-slate-200 truncate">
              {job.workerId || 'Pending Claim'}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="text-slate-500 flex items-center gap-1 mb-1">
              <RotateCcw className="w-3.5 h-3.5" /> Attempts
            </div>
            <div className="font-mono text-slate-200">
              {job.attempts} / {job.maxRetries} max
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="text-slate-500 flex items-center gap-1 mb-1">
              <Flame className="w-3.5 h-3.5" /> Duration
            </div>
            <div className="font-mono text-slate-200">
              {job.durationMs ? `${job.durationMs} ms` : job.status === 'processing' ? 'Running...' : '—'}
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-800 bg-slate-900">
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-semibold transition-colors ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Execution Logs ({job.logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payload')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-semibold transition-colors ${
              activeTab === 'payload'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Input Payload</span>
          </button>

          <button
            onClick={() => setActiveTab('output')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-semibold transition-colors ${
              activeTab === 'output'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Output Artifacts</span>
          </button>

          <button
            onClick={() => setActiveTab('policy')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-semibold transition-colors ${
              activeTab === 'policy'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Fault & Policy</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-4 overflow-y-auto max-h-[420px] bg-slate-950/40">
          {activeTab === 'logs' && (
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
              <div className="text-[11px] text-slate-500 pb-2 border-b border-slate-800 flex items-center justify-between">
                <span>TERMINAL LOG STREAM (JOB-{job.id})</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live
                </span>
              </div>
              {job.logs.map((log, index) => (
                <div key={index} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-600 select-none">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span
                    className={`font-semibold uppercase text-[10px] px-1 py-0.2 rounded ${
                      log.level === 'error'
                        ? 'bg-rose-500/20 text-rose-400'
                        : log.level === 'warn'
                        ? 'bg-amber-500/20 text-amber-400'
                        : log.level === 'success'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className={log.level === 'error' ? 'text-rose-300' : 'text-slate-200'}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'payload' && (
            <div className="relative">
              <div className="absolute right-3 top-3 z-10">
                <button
                  onClick={handleCopyPayload}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-blue-300 overflow-x-auto">
                {JSON.stringify(job.payload, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'output' && (
            <div>
              {job.output ? (
                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto">
                  {typeof job.output === 'object' ? JSON.stringify(job.output, null, 2) : job.output}
                </pre>
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No output artifacts generated yet. Output will appear when job finishes successfully.
                </div>
              )}
            </div>
          )}

          {activeTab === 'policy' && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <h4 className="font-semibold text-slate-200 mb-2">Backoff & Retry Strategy</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-400">
                  <div>Max Allowed Retries: <span className="text-slate-200 font-mono">{job.maxRetries}</span></div>
                  <div>Current Attempts: <span className="text-slate-200 font-mono">{job.attempts}</span></div>
                  <div>Backoff Multiplier: <span className="text-slate-200 font-mono">2.0 (Exponential)</span></div>
                  <div>DLQ Routing Policy: <span className="text-rose-400 font-mono">Auto-Route on Exhaustion</span></div>
                </div>
              </div>

              {job.error && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60">
                  <h4 className="font-semibold text-rose-300 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" /> Root Failure Reason
                  </h4>
                  <p className="text-rose-200 font-mono text-xs mt-1 leading-relaxed">
                    {job.error}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={() => {
              onDelete(job.id);
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 px-3 py-2 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Purge Task</span>
          </button>

          <div className="flex items-center gap-2">
            {(job.status === 'failed' || job.queue === 'dlq') && (
              <button
                onClick={() => {
                  onRetry(job.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-md shadow-blue-600/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Execution Now</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
