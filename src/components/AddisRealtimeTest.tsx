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
  RotateCcw,
  Sparkles,
  Zap,
  Globe,
} from 'lucide-react';
import {
  AddisRealtimeService,
  AddisConnectionStage,
  AddisLogEntry,
} from '../lib/addisRealtimeService';

interface AddisRealtimeTestProps {
  onClose?: () => void;
}

export const AddisRealtimeTest: React.FC<AddisRealtimeTestProps> = ({ onClose }) => {
  const [stage, setStage] = useState<AddisConnectionStage>('IDLE');
  const [logs, setLogs] = useState<AddisLogEntry[]>([]);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [isVesperSpeaking, setIsVesperSpeaking] = useState<boolean>(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [closeInfo, setCloseInfo] = useState<{ code: number; reason: string } | null>(null);
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [copiedLog, setCopiedLog] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'am' | 'om' | 'en'>('am');
  const [liveTranscript, setLiveTranscript] = useState<{ speaker: string; text: string; time: string }[]>([]);

  const serviceRef = useRef<AddisRealtimeService | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize service on mount
  useEffect(() => {
    const service = new AddisRealtimeService({
      onStageChange: (newStage) => setStage(newStage),
      onLog: (newLog) => {
        setLogs((prev) => [...prev.slice(-200), newLog]);
      },
      onMicVolumeChange: (vol) => setMicVolume(vol),
      onVesperSpeakingChange: (speaking) => setIsVesperSpeaking(speaking),
      onUserSpeakingChange: (speaking) => setIsUserSpeaking(speaking),
      onError: (err) => setLastError(err),
      onClose: (code, reason) => setCloseInfo({ code, reason }),
      onTranscriptReceived: (text, speaker) => {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        setLiveTranscript((prev) => [
          ...prev,
          { speaker: speaker === 'vesper' ? 'Vesper AI' : 'You (Caller)', text, time: timeStr },
        ]);
      },
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
    setCloseInfo(null);
    if (!serviceRef.current) return;

    // 1. Connect WebSocket
    const connected = await serviceRef.current.connect(customApiKey.trim() || undefined);
    if (!connected) return;

    // 2. Start Microphone
    await serviceRef.current.startMicrophone();
  };

  const handleStopTest = () => {
    if (serviceRef.current) {
      serviceRef.current.stop();
    }
    setStage('IDLE');
  };

  const handleClearLogs = () => {
    setLogs([]);
    setLiveTranscript([]);
    setLastError(null);
    setCloseInfo(null);
  };

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.time}] [${l.stage}] ${l.type.toUpperCase()}: ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  // Stage visual indicators
  const STAGES_LIST: { key: AddisConnectionStage; label: string }[] = [
    { key: 'CONNECTING', label: '1. CONNECTING' },
    { key: 'WEBSOCKET_CONNECTED', label: '2. WEBSOCKET CONNECTED' },
    { key: 'WAITING_FOR_SETUP', label: '3. WAITING FOR SETUP' },
    { key: 'SETUP_COMPLETE', label: '4. SETUP COMPLETE' },
    { key: 'MICROPHONE_ACTIVE', label: '5. MICROPHONE ACTIVE' },
    { key: 'STREAMING_AUDIO', label: '6. STREAMING AUDIO' },
    { key: 'AI_AUDIO_RECEIVED', label: '7. AI AUDIO RECEIVED' },
    { key: 'PLAYING_RESPONSE', label: '8. PLAYING RESPONSE' },
    { key: 'TURN_COMPLETE', label: '9. TURN COMPLETE' },
  ];

  const getStageStatus = (stageKey: AddisConnectionStage) => {
    const stageOrder: AddisConnectionStage[] = [
      'CONNECTING',
      'WEBSOCKET_CONNECTED',
      'WAITING_FOR_SETUP',
      'SETUP_COMPLETE',
      'MICROPHONE_ACTIVE',
      'STREAMING_AUDIO',
      'AI_AUDIO_RECEIVED',
      'PLAYING_RESPONSE',
      'TURN_COMPLETE',
    ];

    const currentIndex = stageOrder.indexOf(stage);
    const targetIndex = stageOrder.indexOf(stageKey);

    if (stage === stageKey) return 'active';
    if (currentIndex >= targetIndex && currentIndex !== -1) return 'passed';
    return 'pending';
  };

  return (
    <div className="bg-[#0e0e13] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 max-w-5xl mx-auto text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
              Addis AI Realtime WebSocket Minimal Test
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                16kHz In &bull; 24kHz Out
              </span>
            </h2>
            <p className="text-xs text-neutral-400">
              Direct WebSocket pipeline at{' '}
              <code className="text-emerald-300 font-mono">wss://relay.addisassistant.com/ws</code>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {stage === 'IDLE' || stage === 'CLOSED' || stage === 'ERROR' ? (
            <button
              onClick={handleStartTest}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              Start Realtime Test
            </button>
          ) : (
            <button
              onClick={handleStopTest}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition-all cursor-pointer"
            >
              <Square className="w-4 h-4 fill-white" />
              Stop Test
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

      {/* Stage Flow Checklist */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
          <span>Realtime Pipeline Stages</span>
          <span className="font-mono text-emerald-400">Current: {stage}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-9 gap-2">
          {STAGES_LIST.map(({ key, label }) => {
            const status = getStageStatus(key);
            return (
              <div
                key={key}
                className={`p-2 rounded-lg border text-center transition-all ${
                  status === 'active'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/20 font-bold animate-pulse'
                    : status === 'passed'
                    ? 'bg-white/5 border-emerald-500/40 text-emerald-400/80 font-medium'
                    : 'bg-white/[0.02] border-white/5 text-neutral-600'
                }`}
              >
                <div className="text-[10px] uppercase truncate">{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Audio Activity Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Microphone VU Meter */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              Microphone (16,000 Hz)
            </span>
            <span className={`font-mono text-xs ${isUserSpeaking ? 'text-emerald-400 font-bold' : 'text-neutral-500'}`}>
              {isUserSpeaking ? 'SPEAKING' : `${micVolume}%`}
            </span>
          </div>
          {/* Audio bar meter */}
          <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                micVolume > 60
                  ? 'bg-red-500'
                  : micVolume > 25
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${Math.min(100, micVolume)}%` }}
            />
          </div>
          <p className="text-[11px] text-neutral-500">
            Float32 &rarr; Int16 signed PCM &rarr; Base64 JSON (only after setupComplete)
          </p>
        </div>

        {/* AI Vesper Output Activity */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Volume2 className="w-3.5 h-3.5 text-teal-400" />
              Vesper Audio (24,000 Hz)
            </span>
            <span className={`font-mono text-xs ${isVesperSpeaking ? 'text-teal-300 font-bold animate-pulse' : 'text-neutral-500'}`}>
              {isVesperSpeaking ? 'PLAYING AI PCM16' : 'IDLE'}
            </span>
          </div>
          <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5 flex items-center">
            {isVesperSpeaking ? (
              <div className="w-full h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full animate-pulse" />
            ) : (
              <div className="w-0 h-full bg-neutral-800 rounded-full" />
            )}
          </div>
          <p className="text-[11px] text-neutral-500">
            Base64 &rarr; Int16 &rarr; Float32 &rarr; 24kHz seamless AudioBuffer queue
          </p>
        </div>

        {/* Spoken Test Prompts */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-medium flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              Try Speaking into Mic:
            </span>
            <span className="text-[10px] text-amber-400/80">Amharic / Oromo / Eng</span>
          </div>
          <div className="text-xs text-neutral-300 font-mono bg-black/40 p-2 rounded-lg border border-white/5 space-y-1">
            <div>&bull; "ሰላም እንዴት ነህ? የንግድ ብድር እፈልጋለሁ።"</div>
            <div>&bull; "Baga nagaan dhuftan. Liqii barbaada."</div>
            <div>&bull; "Hello, I operate a textile workshop in Merkato."</div>
          </div>
        </div>
      </div>

      {/* Error & Close Status Banners */}
      {lastError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 flex items-start gap-3 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <div className="font-semibold text-red-200">Addis AI Realtime Error:</div>
            <div className="font-mono break-all">{lastError}</div>
          </div>
        </div>
      )}

      {closeInfo && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between text-amber-300 text-xs font-mono">
          <span>WebSocket Close Code: {closeInfo.code}</span>
          <span>Reason: {closeInfo.reason || 'Normal close'}</span>
        </div>
      )}

      {/* Developer Log Console & Live Transcript */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Realtime Event Logs */}
        <div className="bg-black/60 border border-white/10 rounded-xl p-4 flex flex-col h-[320px]">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs text-neutral-400">
            <span className="font-mono flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              Developer Event Stream ({logs.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLogs}
                className="hover:text-white transition-colors text-[11px] flex items-center gap-1"
                title="Copy logs"
              >
                {copiedLog ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                Copy
              </button>
              <button
                onClick={handleClearLogs}
                className="hover:text-red-400 transition-colors text-[11px] flex items-center gap-1"
                title="Clear logs"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1.5 pt-2 pr-1 select-text">
            {logs.length === 0 ? (
              <div className="text-neutral-600 italic py-8 text-center">
                No events logged yet. Click "Start Realtime Test" to initiate WebSocket.
              </div>
            ) : (
              logs.map((log) => {
                let badgeClass = 'text-neutral-400';
                if (log.type === 'success') badgeClass = 'text-emerald-400';
                if (log.type === 'audio') badgeClass = 'text-teal-300';
                if (log.type === 'server') badgeClass = 'text-sky-300';
                if (log.type === 'warning') badgeClass = 'text-amber-400';
                if (log.type === 'error') badgeClass = 'text-red-400 font-bold';

                return (
                  <div key={log.id} className="leading-tight flex items-start gap-2">
                    <span className="text-neutral-600 shrink-0 select-none">[{log.time}]</span>
                    <span className={`shrink-0 font-bold ${badgeClass}`}>[{log.stage}]</span>
                    <span className="text-neutral-300 break-all">{log.message}</span>
                  </div>
                );
              })
            )}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* Live Conversation Transcript */}
        <div className="bg-black/60 border border-white/10 rounded-xl p-4 flex flex-col h-[320px]">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs text-neutral-400">
            <span className="font-mono flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              Live Spoken Utterances ({liveTranscript.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto text-xs space-y-3 pt-3 pr-1">
            {liveTranscript.length === 0 ? (
              <div className="text-neutral-600 italic py-8 text-center text-xs">
                Spoken turns from you and Addis AI Vesper will display here in real time.
              </div>
            ) : (
              liveTranscript.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border ${
                    t.speaker.includes('Vesper')
                      ? 'bg-teal-500/10 border-teal-500/20 text-teal-200 ml-4'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200 mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1 font-mono">
                    <span className="font-bold">{t.speaker}</span>
                    <span>{t.time}</span>
                  </div>
                  <div className="text-sm font-medium">{t.text}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
