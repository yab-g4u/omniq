import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Play,
  Square,
  Volume2,
  AlertCircle,
  CheckCircle2,
  Terminal,
  Activity,
  Trash2,
  Copy,
  Check,
  Globe,
} from 'lucide-react';
import {
  AddisRealtimeService,
  AddisRealtimeState,
  AddisLogEntry,
  DiagnosticsState,
} from '../lib/addisRealtimeService';

interface AddisRealtimeTestProps {
  onClose?: () => void;
}

export const AddisRealtimeTest: React.FC<AddisRealtimeTestProps> = ({ onClose }) => {
  const [state, setState] = useState<AddisRealtimeState>('IDLE');
  const [logs, setLogs] = useState<AddisLogEntry[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsState>({
    hasMicPermission: false,
    inputAudioContextState: 'closed',
    inputSampleRate: 0,
    outputAudioContextState: 'closed',
    outputSampleRate: 0,
    webSocketState: 'CLOSED',
    setupComplete: false,
    isAudioStreaming: false,
    lastAudioChunkSentTime: null,
    lastAudioChunkSentBytes: 0,
    lastServerEvent: null,
    lastAiAudioReceivedTime: null,
    lastAiAudioReceivedBytes: 0,
    playbackState: 'IDLE',
    turnComplete: false,
    webSocketCloseCode: null,
    webSocketCloseReason: null,
    lastServerError: null,
    micLevel: 0,
    errorCategory: null,
  });
  const [lastError, setLastError] = useState<string | null>(null);
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [copiedLog, setCopiedLog] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<{ speaker: string; text: string; time: string }[]>([]);

  const serviceRef = useRef<AddisRealtimeService | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize service
  useEffect(() => {
    const service = new AddisRealtimeService({
      onStateChange: (newState) => setState(newState),
      onDiagnosticsUpdate: (diag) => setDiagnostics(diag),
      onLog: (newLog) => setLogs((prev) => [...prev.slice(-200), newLog]),
      onVesperSpeechText: (text) => {
        const timeStr = new Date().toTimeString().slice(0, 8);
        setLiveTranscript((prev) => [...prev, { speaker: 'Vesper AI', text, time: timeStr }]);
      },
      onError: (cat, msg) => setLastError(`[${cat}] ${msg}`),
    });

    serviceRef.current = service;

    return () => {
      service.stop();
    };
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleStartTest = async () => {
    setLastError(null);
    if (!serviceRef.current) return;
    await serviceRef.current.startSession(customApiKey.trim() || undefined);
  };

  const handleStopTest = () => {
    if (serviceRef.current) {
      serviceRef.current.stop();
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    setLiveTranscript([]);
    setLastError(null);
  };

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.state}] ${l.type.toUpperCase()}: ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  const STAGES_LIST: { key: AddisRealtimeState; label: string }[] = [
    { key: 'CONNECTING', label: '1. CONNECTING' },
    { key: 'WAITING_FOR_SETUP', label: '2. WAIT SETUP' },
    { key: 'READY', label: '3. READY' },
    { key: 'LISTENING', label: '4. LISTENING' },
    { key: 'VESPER_SPEAKING', label: '5. VESPER SPEAKING' },
    { key: 'ERROR', label: '6. ERROR' },
    { key: 'ENDING', label: '7. ENDING' },
  ];

  return (
    <div className="bg-[#0e0e13] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 max-w-5xl mx-auto text-white font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
              Addis AI Realtime WebSocket Protocol Test
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                16kHz In &bull; 24kHz Out
              </span>
            </h2>
            <p className="text-xs text-neutral-400 font-mono">
              Direct WebSocket relay at <code className="text-emerald-300">wss://relay.addisassistant.com/ws</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {state === 'IDLE' || state === 'ENDED' || state === 'ERROR' ? (
            <button
              onClick={handleStartTest}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              Start Realtime Session
            </button>
          ) : (
            <button
              onClick={handleStopTest}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition-all cursor-pointer"
            >
              <Square className="w-4 h-4 fill-white" />
              Stop Session
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-sm transition-all"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Stage Visual Flow */}
      <div className="space-y-2 font-mono">
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
          <span>Realtime Protocol State</span>
          <span className="text-emerald-400">Current State: {state}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
          {STAGES_LIST.map(({ key, label }) => (
            <div
              key={key}
              className={`p-2 rounded-lg border transition-all ${
                state === key
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold animate-pulse'
                  : 'bg-white/[0.02] border-white/5 text-neutral-600'
              }`}
            >
              <div className="text-[10px] uppercase truncate">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
              <Mic className="w-3.5 h-3.5" />
              Input Mic (16000 Hz)
            </span>
            <span className="text-xs font-bold text-emerald-300">{diagnostics.micLevel}%</span>
          </div>
          <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-75"
              style={{ width: `${Math.min(100, diagnostics.micLevel)}%` }}
            />
          </div>
          <p className="text-[11px] text-neutral-500">Float32 &rarr; Int16 PCM16 &rarr; Base64 JSON</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1.5 font-medium text-teal-400">
              <Volume2 className="w-3.5 h-3.5" />
              Output Audio (24000 Hz)
            </span>
            <span className="text-xs font-bold text-teal-300">{diagnostics.playbackState}</span>
          </div>
          <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
            {diagnostics.playbackState === 'PLAYING' ? (
              <div className="w-full h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full animate-pulse" />
            ) : (
              <div className="w-0 h-full bg-neutral-800" />
            )}
          </div>
          <p className="text-[11px] text-neutral-500">Base64 &rarr; Int16 &rarr; Float32 &rarr; 24kHz Queue</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-medium flex items-center gap-1.5 text-amber-400">
              <Globe className="w-3.5 h-3.5" />
              Spoken Prompts
            </span>
          </div>
          <div className="text-xs text-neutral-300 space-y-1">
            <div>&bull; &ldquo;ሰላም እንዴት ነህ? የንግድ ብድር እፈልጋለሁ።&rdquo;</div>
            <div>&bull; &ldquo;Baga nagaan dhuftan. Liqii barbaada.&rdquo;</div>
            <div>&bull; &ldquo;Hello, I operate a textile workshop in Merkato.&rdquo;</div>
          </div>
        </div>
      </div>

      {lastError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-xs font-mono">
          <AlertCircle className="w-4 h-4 text-red-400 inline mr-2" />
          {lastError}
        </div>
      )}

      {/* Logs & Transcript */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-black/60 border border-white/10 rounded-xl p-4 flex flex-col h-[300px]">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs text-neutral-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              Event Stream ({logs.length})
            </span>
            <div className="flex items-center gap-2">
              <button onClick={handleCopyLogs} className="hover:text-white text-[11px] flex items-center gap-1">
                {copiedLog ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                Copy
              </button>
              <button onClick={handleClearLogs} className="hover:text-red-400 text-[11px] flex items-center gap-1">
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1.5 pt-2 select-text">
            {logs.map((log) => (
              <div key={log.id} className="leading-tight flex items-start gap-2">
                <span className="text-neutral-600 shrink-0">[{log.timestamp}]</span>
                <span className="text-emerald-400 font-bold shrink-0">[{log.state}]</span>
                <span className="text-neutral-300 break-all">{log.message}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>

        <div className="bg-black/60 border border-white/10 rounded-xl p-4 flex flex-col h-[300px]">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs text-neutral-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              Spoken Utterances ({liveTranscript.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto text-xs space-y-3 pt-3">
            {liveTranscript.map((t, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-200">
                <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1 font-mono">
                  <span className="font-bold">{t.speaker}</span>
                  <span>{t.time}</span>
                </div>
                <div className="text-sm font-medium">{t.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
