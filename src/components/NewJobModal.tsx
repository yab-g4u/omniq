import React, { useState } from 'react';
import { JobCategory, QueueType } from '../types';
import { X, Plus, Sparkles, Code2, Layers, Flame, Zap } from 'lucide-react';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnqueue: (
    title: string,
    category: JobCategory,
    queue: QueueType,
    priority: number,
    payload: Record<string, unknown>,
    maxRetries: number
  ) => void;
}

export const NewJobModal: React.FC<NewJobModalProps> = ({
  isOpen,
  onClose,
  onEnqueue,
}) => {
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<JobCategory>('query_embedding');
  const [queue, setQueue] = useState<QueueType>('default');
  const [priority, setPriority] = useState<number>(3);
  const [maxRetries, setMaxRetries] = useState<number>(3);
  const [payloadText, setPayloadText] = useState<string>(
    JSON.stringify(
      {
        corpusId: 'docs-knowledge-v4',
        model: 'text-embedding-004',
        chunkSize: 512,
        batchSize: 64,
      },
      null,
      2
    )
  );
  const [errorJson, setErrorJson] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let parsedPayload: Record<string, unknown> = {};
    try {
      parsedPayload = JSON.parse(payloadText);
    } catch {
      setErrorJson('Invalid JSON format in payload');
      return;
    }

    onEnqueue(title, category, queue, priority, parsedPayload, maxRetries);
    onClose();
    // Reset
    setTitle('');
    setErrorJson(null);
  };

  const handleApplyPreset = (presetType: string) => {
    if (presetType === 'vector') {
      setTitle('Re-index Knowledge Base Vector Embeddings');
      setCategory('vector_similarity');
      setQueue('high_priority');
      setPriority(1);
      setPayloadText(
        JSON.stringify(
          {
            index: 'omniq-core-index',
            dimensions: 1536,
            metric: 'cosine',
            threshold: 0.82,
          },
          null,
          2
        )
      );
    } else if (presetType === 'etl') {
      setTitle('Sync Daily Transactional Warehouse Partitions');
      setCategory('etl_sync');
      setQueue('bulk_batch');
      setPriority(5);
      setPayloadText(
        JSON.stringify(
          {
            sourceDb: 'orders_oltp_primary',
            targetWarehouse: 'clickhouse_analytics',
            partition: '2026-08-29',
          },
          null,
          2
        )
      );
    } else if (presetType === 'webhook') {
      setTitle('Broadcast Customer Security Notification Webhook');
      setCategory('webhook_delivery');
      setQueue('high_priority');
      setPriority(2);
      setPayloadText(
        JSON.stringify(
          {
            eventType: 'auth.mfa_enforced',
            recipientsCount: 4200,
            webhookUrl: 'https://api.gateway.internal/events',
          },
          null,
          2
        )
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Enqueue New Task Job</h3>
              <p className="text-xs text-slate-400">Dispatch an asynchronous task to the OmniQ worker fleet</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets row */}
        <div className="p-3 bg-slate-950/30 border-b border-slate-800 flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Presets:
          </span>
          <button
            type="button"
            onClick={() => handleApplyPreset('vector')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Vector KNN
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('etl')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            ETL Sync
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('webhook')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Webhook
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          <div>
            <label className="block text-slate-300 mb-1 font-semibold">Job Title / Descriptor</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Generate Embeddings for Corpus 102"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Category Type</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as JobCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
              >
                <option value="query_embedding">Query Embedding</option>
                <option value="vector_similarity">Vector Similarity KNN</option>
                <option value="etl_sync">ETL Sync Pipeline</option>
                <option value="webhook_delivery">Webhook Delivery</option>
                <option value="model_inference">Model Inference</option>
                <option value="report_generation">Report Generation</option>
                <option value="cache_invalidation">Cache Invalidation</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Queue Lane</label>
              <select
                value={queue}
                onChange={(e) => setQueue(e.target.value as QueueType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
              >
                <option value="high_priority">High Priority Lane</option>
                <option value="default">Default Lane</option>
                <option value="bulk_batch">Bulk Batch Lane</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Priority Weight: <span className="text-blue-400 font-mono font-bold">{priority}</span> (1 is highest)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Max Retries</label>
              <select
                value={maxRetries}
                onChange={(e) => setMaxRetries(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
              >
                <option value={1}>1 retry</option>
                <option value={3}>3 retries (standard)</option>
                <option value={5}>5 retries (high resilience)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5 text-blue-400" /> JSON Payload Schema
              </label>
              {errorJson && <span className="text-rose-400 text-[11px] font-mono">{errorJson}</span>}
            </div>
            <textarea
              rows={5}
              value={payloadText}
              onChange={(e) => {
                setPayloadText(e.target.value);
                setErrorJson(null);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md shadow-blue-600/20"
            >
              Enqueue Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
