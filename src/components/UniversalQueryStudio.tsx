import React, { useState } from 'react';
import { 
  QueryModality, 
  QueryHistoryItem 
} from '../types';
import { INITIAL_QUERIES } from '../data/initialData';
import { 
  Database, 
  Sparkles, 
  Search, 
  Play, 
  Clock, 
  Check, 
  Copy, 
  FileCode2, 
  Table, 
  Layers, 
  Wand2, 
  Code,
  CheckCircle2,
  Terminal
} from 'lucide-react';

export const UniversalQueryStudio: React.FC = () => {
  const [modality, setModality] = useState<QueryModality>('natural_language');
  const [queryInput, setQueryInput] = useState<string>(
    'Find top 5 highest latency jobs executed in the last 24 hours grouped by worker region'
  );
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [history, setHistory] = useState<QueryHistoryItem[]>(INITIAL_QUERIES);
  const [activeResult, setActiveResult] = useState<QueryHistoryItem | null>(INITIAL_QUERIES[0]);
  const [resultView, setResultView] = useState<'table' | 'json'>('table');
  const [copied, setCopied] = useState<boolean>(false);

  // Preset query samples
  const PRESETS: Array<{ label: string; modality: QueryModality; query: string }> = [
    {
      label: '⚡ NL: High Latency Jobs by Region',
      modality: 'natural_language',
      query: 'Find top 5 highest latency jobs executed in the last 24 hours grouped by worker region',
    },
    {
      label: '🔍 Vector: Dead Letter Retry Docs',
      modality: 'vector',
      query: 'vector_search(collection="cluster_manuals", query="exponential backoff DLQ drain rules", top_k=4)',
    },
    {
      label: '📊 SQL: Worker Node Throughput Stats',
      modality: 'sql',
      query: 'SELECT worker_id, COUNT(*) AS completed_jobs, AVG(duration_ms) AS avg_duration_ms, SUM(CASE WHEN attempts > 1 THEN 1 ELSE 0 END) AS retried_jobs FROM task_jobs WHERE status = "completed" GROUP BY worker_id ORDER BY completed_jobs DESC;',
    },
    {
      label: '🗂️ JSON Filter: Enqueued Payload Schema',
      modality: 'json_filter',
      query: 'jobs[?status == `processing` && priority <= `2`].{id: id, category: category, progress: progress}',
    },
  ];

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setModality(preset.modality);
    setQueryInput(preset.query);
  };

  const handleExecuteQuery = () => {
    if (!queryInput.trim()) return;
    setIsExecuting(true);

    setTimeout(() => {
      let simulatedResponse: any;
      let translated: string | undefined = undefined;
      let confidence = 0.96;
      let latency = Math.floor(Math.random() * 25 + 8);
      let matchedCount = 5;

      if (modality === 'natural_language') {
        translated = `SELECT j.id, j.title, j.duration_ms, w.region FROM task_jobs j JOIN cluster_workers w ON j.worker_id = w.id WHERE j.created_at >= NOW() - INTERVAL 24 HOUR ORDER BY j.duration_ms DESC LIMIT 5;`;
        simulatedResponse = [
          { job_id: 'job-101', title: 'Generate Embedding Chunks', duration_ms: 14500, region: 'us-east (N. Virginia)', status: 'completed' },
          { job_id: 'job-104', title: 'OmniQ Vector Semantic KNN', duration_ms: 11200, region: 'us-east (N. Virginia)', status: 'completed' },
          { job_id: 'job-106', title: 'Deep Transformer Inference', duration_ms: 8400, region: 'eu-west (Frankfurt)', status: 'completed' },
          { job_id: 'job-102', title: 'PostgreSQL Real-time ETL', duration_ms: 4200, region: 'us-west (Oregon)', status: 'completed' },
          { job_id: 'job-107', title: 'Global Redis Invalidation', duration_ms: 2150, region: 'us-west (Oregon)', status: 'completed' },
        ];
        matchedCount = 5;
      } else if (modality === 'vector') {
        translated = `KNN_SEARCH(corpus="cluster_manuals", embedding(q), metric="cosine", threshold=0.72)`;
        simulatedResponse = [
          { title: 'Dead Letter Queue (DLQ) Auto-Drain Protocol', similarity: 0.94, collection: 'cluster_manuals', snippet: 'Configure exponential backoff with jitter. Set maxRetries to 3-5 before DLQ isolation.' },
          { title: 'Worker Heartbeat & Node Re-allocation', similarity: 0.88, collection: 'cluster_manuals', snippet: 'If worker fails to report heartbeat in 30s, active in-flight jobs are recovered to pending status.' },
          { title: 'Vector Index Sharding and Partitioning', similarity: 0.82, collection: 'cluster_manuals', snippet: 'Use HNSW index partitions distributed across regional workers for sub-10ms similarity queries.' },
        ];
        matchedCount = 3;
      } else if (modality === 'sql') {
        simulatedResponse = [
          { worker_id: 'worker-us-east-01', completed_jobs: 14820, avg_duration_ms: 342.5, retried_jobs: 14 },
          { worker_id: 'worker-us-west-02', completed_jobs: 11940, avg_duration_ms: 412.1, retried_jobs: 8 },
          { worker_id: 'worker-eu-west-03', completed_jobs: 8430, avg_duration_ms: 520.8, retried_jobs: 21 },
          { worker_id: 'worker-ap-east-04', completed_jobs: 6510, avg_duration_ms: 310.2, retried_jobs: 3 },
        ];
        matchedCount = 4;
      } else {
        simulatedResponse = [
          { id: 'job-101', category: 'query_embedding', progress: 68 },
          { id: 'job-104', category: 'vector_similarity', progress: 89 },
          { id: 'job-106', category: 'model_inference', progress: 35 },
        ];
        matchedCount = 3;
      }

      const newHistoryItem: QueryHistoryItem = {
        id: `q-${Date.now().toString().slice(-4)}`,
        modality,
        rawQuery: queryInput,
        translatedQuery: translated,
        response: simulatedResponse,
        matchedRecordsCount: matchedCount,
        executionTimeMs: latency,
        confidenceScore: confidence,
        timestamp: Date.now(),
        tags: [modality, 'omniq-engine'],
        costTokens: Math.floor(Math.random() * 80 + 30),
      };

      setHistory((prev) => [newHistoryItem, ...prev]);
      setActiveResult(newHistoryItem);
      setIsExecuting(false);
    }, 600);
  };

  const handleCopyResult = () => {
    if (!activeResult) return;
    navigator.clipboard.writeText(JSON.stringify(activeResult.response, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left / Top Query Console (7 Cols) */}
      <div className="lg:col-span-7 space-y-5">
        
        {/* Modality Selector Bar */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          {[
            { id: 'natural_language', label: 'AI Natural Language', icon: Sparkles },
            { id: 'vector', label: 'Vector Semantic KNN', icon: Layers },
            { id: 'sql', label: 'Direct SQL Query', icon: Database },
            { id: 'json_filter', label: 'JSON Filter / DSL', icon: Code },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setModality(item.id as QueryModality)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  modality === item.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Query Presets Chips */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Quick Query Templates:
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyPreset(preset)}
                className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-blue-300 px-2.5 py-1 rounded-lg border border-slate-800 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Query Input Editor */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg shadow-black/20">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-950/70 border-b border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono uppercase font-semibold text-[11px] text-slate-300">
                OMNIQ CONSOLE ({modality.replace('_', ' ')})
              </span>
            </div>
            <button
              onClick={() => setQueryInput('')}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear Editor
            </button>
          </div>

          <textarea
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            rows={4}
            placeholder={
              modality === 'natural_language'
                ? 'Ask anything in natural English (e.g., "Find all failed webhook deliveries in the last hour")'
                : modality === 'sql'
                ? 'SELECT * FROM task_jobs WHERE status = "processing"...'
                : 'vector_search(collection="...", query="...", top_k=5)'
            }
            className="w-full p-4 bg-slate-950/50 text-slate-100 font-mono text-xs focus:outline-none focus:bg-slate-950 resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between p-3 bg-slate-950/80 border-t border-slate-800">
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>Press Execute or Ctrl+Enter</span>
            </div>

            <button
              onClick={handleExecuteQuery}
              disabled={isExecuting || !queryInput.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-blue-600/20"
            >
              {isExecuting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Query</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Query Result Pane */}
        {activeResult && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg shadow-black/20">
            {/* Result Header */}
            <div className="flex items-center justify-between p-3 bg-slate-950/80 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 200 OK
                </span>
                <span className="text-slate-400 font-mono">
                  {activeResult.executionTimeMs} ms
                </span>
                <span className="text-slate-400">
                  {activeResult.matchedRecordsCount} records
                </span>
                <span className="text-blue-400 font-mono text-[11px]">
                  Conf: {(activeResult.confidenceScore * 100).toFixed(0)}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setResultView('table')}
                    className={`px-2 py-0.5 rounded ${resultView === 'table' ? 'bg-slate-800 text-blue-400' : 'text-slate-500'}`}
                  >
                    Table
                  </button>
                  <button
                    onClick={() => setResultView('json')}
                    className={`px-2 py-0.5 rounded ${resultView === 'json' ? 'bg-slate-800 text-blue-400' : 'text-slate-500'}`}
                  >
                    JSON
                  </button>
                </div>

                <button
                  onClick={handleCopyResult}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                  title="Copy Result"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* If Translated Query (NL to SQL) */}
            {activeResult.translatedQuery && (
              <div className="p-2.5 bg-blue-950/20 border-b border-blue-900/30 text-[11px] font-mono text-blue-300 flex items-start gap-2">
                <Wand2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span className="break-all">{activeResult.translatedQuery}</span>
              </div>
            )}

            {/* Results Renderer */}
            <div className="p-4 max-h-80 overflow-auto bg-slate-950/40">
              {resultView === 'json' || !Array.isArray(activeResult.response) ? (
                <pre className="text-xs font-mono text-slate-200">
                  {JSON.stringify(activeResult.response, null, 2)}
                </pre>
              ) : (
                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-800 bg-slate-950/60">
                    <tr>
                      {Object.keys(activeResult.response[0] || {}).map((colKey) => (
                        <th key={colKey} className="px-3 py-2">{colKey}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {(activeResult.response as Array<Record<string, any>>).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        {Object.values(row).map((val, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 text-slate-300">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right / History & Telemetry (5 Cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Query Execution History</span>
            </h4>
            <span className="text-xs text-slate-400">{history.length} runs</span>
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setActiveResult(item);
                  setQueryInput(item.rawQuery);
                  setModality(item.modality);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  activeResult?.id === item.id
                    ? 'bg-blue-950/40 border-blue-500'
                    : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-mono text-blue-400 uppercase font-semibold">
                    {item.modality}
                  </span>
                  <span className="text-slate-500">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-200 line-clamp-2 font-mono">
                  {item.rawQuery}
                </p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                  <span>{item.executionTimeMs} ms</span>
                  <span>•</span>
                  <span>{item.matchedRecordsCount} records</span>
                  {item.costTokens ? (
                    <>
                      <span>•</span>
                      <span>{item.costTokens} tokens</span>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
