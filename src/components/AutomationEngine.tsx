import React, { useState } from 'react';
import { AutomationRule, JobCategory, QueueType } from '../types';
import { INITIAL_AUTOMATION_RULES } from '../data/initialData';
import { 
  Workflow, 
  Plus, 
  Clock, 
  Zap, 
  CheckCircle2, 
  Play, 
  AlertTriangle, 
  Settings, 
  Sliders,
  ShieldCheck
} from 'lucide-react';

interface AutomationEngineProps {
  onTriggerJob: (
    title: string,
    category: JobCategory,
    queue: QueueType,
    priority: number,
    payload: Record<string, unknown>
  ) => void;
}

export const AutomationEngine: React.FC<AutomationEngineProps> = ({ onTriggerJob }) => {
  const [rules, setRules] = useState<AutomationRule[]>(INITIAL_AUTOMATION_RULES);
  const [showNewRuleModal, setShowNewRuleModal] = useState<boolean>(false);
  const [newRuleName, setNewRuleName] = useState<string>('');
  const [newRuleCron, setNewRuleCron] = useState<string>('*/15 * * * *');
  const [newRuleQueue, setNewRuleQueue] = useState<QueueType>('high_priority');
  const [newRuleCategory, setNewRuleCategory] = useState<JobCategory>('query_embedding');

  const toggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleTestTrigger = (rule: AutomationRule) => {
    onTriggerJob(
      `[Triggered] ${rule.name}`,
      rule.actionJobType,
      rule.targetQueue,
      1,
      rule.payloadPreset
    );
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const newRule: AutomationRule = {
      id: `rule-${Date.now().toString().slice(-4)}`,
      name: newRuleName,
      description: `Automated trigger enqueuing into ${newRuleQueue}`,
      triggerType: 'cron',
      cronExpression: newRuleCron,
      targetQueue: newRuleQueue,
      actionJobType: newRuleCategory,
      enabled: true,
      totalExecutions: 0,
      payloadPreset: {
        automated: true,
        source: 'cron_scheduler',
        timestamp: Date.now(),
      },
    };

    setRules((prev) => [newRule, ...prev]);
    setShowNewRuleModal(false);
    setNewRuleName('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Policy Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Workflow className="w-5 h-5 text-blue-400" />
            <span>Autonomous Orchestration & Triggers</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Configure automated cron schedules, event hooks, and self-healing threshold policies that dispatch jobs directly to the worker fleet.
          </p>
        </div>

        <button
          onClick={() => setShowNewRuleModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-md shadow-blue-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Trigger Rule</span>
        </button>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
              rule.enabled
                ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                : 'bg-slate-950/40 border-slate-800/60 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-300 uppercase">
                    {rule.triggerType}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                    {rule.targetQueue}
                  </span>
                </div>

                {/* Enable toggle */}
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    rule.enabled ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      rule.enabled ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <h4 className="text-sm font-bold text-white mb-1.5 leading-snug">{rule.name}</h4>
              <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                {rule.description}
              </p>

              {/* Timing / Condition badge */}
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-[11px] text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">
                  {rule.cronExpression || rule.condition || 'Event Stream: on_publish'}
                </span>
              </div>
            </div>

            {/* Rule Footer Actions */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="text-[11px]">
                Executions: <span className="text-slate-200 font-mono font-bold">{rule.totalExecutions}</span>
              </div>

              <button
                onClick={() => handleTestTrigger(rule)}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs px-2.5 py-1 rounded transition-colors"
                title="Trigger execution immediately"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Test Trigger</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cluster Policies & Rate Limiting Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Dead-Letter Policy (DLQ)</h4>
          </div>
          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span>Max Retry Attempts:</span>
              <span className="font-mono text-slate-200 font-bold">5 attempts</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span>Backoff Multiplier:</span>
              <span className="font-mono text-slate-200 font-bold">2.0x Exponential</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span>Auto-Purge DLQ TTL:</span>
              <span className="font-mono text-slate-200 font-bold">7 days</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Sliders className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-bold text-white">Global Rate Limiter</h4>
          </div>
          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span>Burst Concurrency:</span>
              <span className="font-mono text-slate-200 font-bold">250 jobs/sec</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span>Token Bucket Capacity:</span>
              <span className="font-mono text-slate-200 font-bold">1,000 tokens</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span>Fair Scheduling:</span>
              <span className="font-mono text-emerald-400 font-bold">Weighted Deficit (DRR)</span>
            </div>
          </div>
        </div>
      </div>

      {/* New Rule Modal */}
      {showNewRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Create New Automation Trigger</h3>
            
            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Rule Title</label>
                <input
                  type="text"
                  required
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="e.g., Hourly Embedding Re-sync"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Cron Schedule</label>
                <input
                  type="text"
                  required
                  value={newRuleCron}
                  onChange={(e) => setNewRuleCron(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                />
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                  <button type="button" onClick={() => setNewRuleCron('*/5 * * * *')} className="hover:text-blue-400 underline">Every 5m</button>
                  <button type="button" onClick={() => setNewRuleCron('0 * * * *')} className="hover:text-blue-400 underline">Hourly</button>
                  <button type="button" onClick={() => setNewRuleCron('0 0 * * *')} className="hover:text-blue-400 underline">Daily</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Target Queue</label>
                  <select
                    value={newRuleQueue}
                    onChange={(e) => setNewRuleQueue(e.target.value as QueueType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="high_priority">High Priority</option>
                    <option value="default">Default</option>
                    <option value="bulk_batch">Bulk Batch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Action Task Type</label>
                  <select
                    value={newRuleCategory}
                    onChange={(e) => setNewRuleCategory(e.target.value as JobCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="query_embedding">Embedding Chunks</option>
                    <option value="vector_similarity">Vector KNN</option>
                    <option value="etl_sync">ETL Sync</option>
                    <option value="webhook_delivery">Webhook Delivery</option>
                    <option value="cache_invalidation">Cache Invalidation</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewRuleModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
