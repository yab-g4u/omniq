import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Clock,
  CheckCircle2,
  Sparkles,
  User,
  ShieldCheck,
  Send,
  Zap,
  Activity,
  AlertTriangle,
  BookOpen,
  Volume1,
  Terminal,
  AlertCircle,
  ActivityIcon,
  Globe,
  ChevronDown,
  Shield,
} from 'lucide-react';
import {
  Language,
  IVRCallRecord,
  ExtractedFieldsMap,
  ApplicationExtractionResult,
  BusinessGradingReport,
  FieldKey,
} from '../types';
import { useAddisRealtime, LiveUtterance } from '../hooks/useAddisRealtime';

interface IVRPhoneSimulatorProps {
  onCallCompleted: (newCall: IVRCallRecord) => void;
  onOpenDashboard: () => void;
  onOpenSpike: () => void;
}

const FIELD_METADATA: { key: FieldKey; label: string; amharicLabel: string; category: string }[] = [
  { key: 'owner_name', label: 'Business Owner Name', amharicLabel: 'የባለቤቱ ስም', category: 'Identity' },
  { key: 'business_name', label: 'Business Trade Name', amharicLabel: 'የንግድ ስም', category: 'Identity' },
  { key: 'business_type', label: 'Sector / Activity', amharicLabel: 'የስራ ዘርፍ', category: 'Identity' },
  { key: 'years_operating', label: 'Operational Longevity', amharicLabel: 'የተጀመረበት ጊዜ', category: 'Operational' },
  { key: 'location', label: 'Location Premises', amharicLabel: 'የስራ ቦታ / አድራሻ', category: 'Operational' },
  { key: 'employees', label: 'Employee Count', amharicLabel: 'የሰራተኞች ብዛት', category: 'Operational' },
  { key: 'monthly_revenue', label: 'Monthly Revenue', amharicLabel: 'የወር ሽያጭ ገቢ', category: 'Financial' },
  { key: 'funding_requested', label: 'Requested Loan Amount', amharicLabel: 'የተጠየቀው ብድር', category: 'Credit Request' },
  { key: 'funding_purpose', label: 'Use of Loan Funds', amharicLabel: 'የብድር ዓላማ', category: 'Credit Request' },
  { key: 'business_license', label: 'License / Equipment', amharicLabel: 'የንግድ ፈቃድ / ማሽኖች', category: 'Verification' },
];

export const IVRPhoneSimulator: React.FC<IVRPhoneSimulatorProps> = ({
  onCallCompleted,
  onOpenDashboard,
  onOpenSpike,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('am');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [typedInput, setTypedInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'transcription' | 'table' | 'diagnostics'>('transcription');
  const [lastProcessedRecord, setLastProcessedRecord] = useState<IVRCallRecord | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Addis AI Realtime WebSocket Hook
  const {
    state: addisState,
    diagnostics,
    logs: addisLogs,
    transcriptLogs,
    extractedData,
    isExtracting,
    errorCategory,
    errorMessage,
    startSession,
    stopSession,
    interruptVesperAudio,
    sendClientPrompt,
    setTranscriptLogs,
    runExtraction,
  } = useAddisRealtime({
    language: selectedLanguage,
    onFieldUpdate: (fields, notes) => {
      console.log('[Realtime Field Extracted]:', fields);
    },
  });

  const isSessionActive =
    addisState === 'READY' || addisState === 'LISTENING' || addisState === 'VESPER_SPEAKING';

  // Call timer counter
  useEffect(() => {
    if (isSessionActive) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (addisState === 'IDLE') {
        setCallDuration(0);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isSessionActive, addisState]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptLogs]);

  // Handle SPEAK NOW Click -> Connect WebSocket & Addis AI starts speaking
  const handleSpeakNowClick = async () => {
    if (isSessionActive) {
      handleEndSession();
    } else {
      setCallDuration(0);
      await startSession();
    }
  };

  // End call session
  const handleEndSession = async () => {
    stopSession();

    const fullTranscript = transcriptLogs.map((l) => `${l.speakerLabel}: ${l.text}`).join('\n');

    if (fullTranscript.trim()) {
      try {
        const response = await fetch('/api/extract-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcriptText: fullTranscript,
            language: selectedLanguage,
          }),
        });

        const jsonResult = await response.json();
        const finalExtracted: ApplicationExtractionResult = jsonResult.data;
        const aiGrading: BusinessGradingReport = jsonResult.data?.aiGrading || ({} as any);

        const newRecord: IVRCallRecord = {
          id: `call-${Date.now()}`,
          callerPhoneNumber: '+251 91 142 8901',
          callerName: 'Almaz Tadesse',
          region: 'Addis Ababa / Merkato',
          callDurationSeconds: Math.max(15, callDuration),
          timestamp: Date.now(),
          language: selectedLanguage,
          callStatus: 'completed',
          ivrTollFreeNumber: '8800',
          transcript: fullTranscript,
          extractedData: finalExtracted,
          aiGrading,
          underwritingDecision: { status: 'pending' },
        };

        setLastProcessedRecord(newRecord);
        onCallCompleted(newRecord);
      } catch (err) {
        console.warn('Extraction end call fallback:', err);
      }
    }
  };

  // Format timestamp for transcript
  const formatTimeAMPM = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
  };

  // Handle User Input Submit
  const handleSendPrompt = (text: string) => {
    if (!text.trim()) return;

    const userUtterance: LiveUtterance = {
      id: `you-${Date.now()}`,
      speaker: 'owner',
      speakerLabel: 'YOU',
      text: text.trim(),
      timestamp: formatTimeAMPM(),
      language: selectedLanguage,
    };

    setTranscriptLogs((prev: LiveUtterance[]) => [...prev, userUtterance]);
    sendClientPrompt(text.trim());
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-white flex flex-col justify-between selection:bg-purple-500/30">
      {/* Top Header Bar */}
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0b0b10]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onOpenDashboard()}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-purple-900/40">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              SEQUA<span className="text-emerald-400 font-normal"> | Applicant Intelligence</span>
            </span>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-900 text-neutral-300 border border-white/10">
            Toll-Free 8800 Voice Intake
          </span>
        </div>

        {/* Right Language Selector */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as Language)}
              className="appearance-none px-4 py-2 pr-8 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs font-semibold focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
            >
              <option value="am">🌐 Amharic</option>
              <option value="om">🌐 Afaan Oromo</option>
              <option value="en">🌐 English</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          <button
            onClick={onOpenDashboard}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 transition-colors"
          >
            Lender Portal
          </button>
        </div>
      </header>

      {/* Main Agent Interface Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Conversational AI Voice Controller & Orb (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-6 text-center py-4">
          {/* Audio Waveform Bar Animation */}
          <div className="flex items-center justify-center gap-1.5 h-8">
            {[40, 75, 55, 95, 65, 80, 50, 90, 60, 45].map((h, idx) => (
              <div
                key={idx}
                style={{
                  height: isSessionActive ? `${Math.max(8, (diagnostics.micLevel / 100) * h + 10)}px` : '8px',
                }}
                className={`w-1 rounded-full transition-all duration-75 ${
                  addisState === 'VESPER_SPEAKING'
                    ? 'bg-purple-400 shadow-sm shadow-purple-500'
                    : addisState === 'LISTENING'
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-500'
                    : 'bg-neutral-700'
                }`}
              />
            ))}
          </div>

          {/* Central Glowing Mic Orb Button */}
          <div className="relative group flex items-center justify-center">
            {/* Background Soundwave Circles */}
            <div
              className={`absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-purple-500/20 transition-all duration-700 ${
                isSessionActive ? 'scale-110 animate-ping opacity-20' : 'scale-100 opacity-10'
              }`}
            />
            <div
              className={`absolute w-60 h-60 sm:w-80 sm:h-80 rounded-full bg-gradient-to-r from-purple-600/30 to-indigo-600/30 blur-2xl transition-opacity duration-500 ${
                isSessionActive ? 'opacity-70' : 'opacity-20'
              }`}
            />

            {/* Main Interactive Button */}
            <button
              onClick={handleSpeakNowClick}
              className={`relative w-48 h-48 sm:w-64 sm:h-64 rounded-full border-4 flex flex-col items-center justify-center gap-3 transition-all duration-300 transform active:scale-95 shadow-2xl cursor-pointer overflow-hidden ${
                addisState === 'VESPER_SPEAKING'
                  ? 'border-purple-400 bg-gradient-to-b from-purple-950/80 via-neutral-900 to-black shadow-purple-900/60 ring-8 ring-purple-500/20'
                  : addisState === 'LISTENING'
                  ? 'border-emerald-400 bg-gradient-to-b from-emerald-950/80 via-neutral-900 to-black shadow-emerald-900/60 ring-8 ring-emerald-500/20'
                  : 'border-white/30 hover:border-white/60 bg-gradient-to-b from-neutral-800/90 via-neutral-900 to-black shadow-black/80'
              }`}
            >
              {/* Active Voice Wave Overlay UI */}
              {isSessionActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                  <div className="flex items-center justify-center gap-1 h-20 w-full px-4">
                    {[14, 28, 42, 56, 70, 84, 70, 56, 42, 28, 14].map((barHeight, idx) => (
                      <span
                        key={idx}
                        style={{
                          height: `${Math.max(8, (diagnostics.micLevel / 100) * barHeight + 12)}px`,
                          animationDuration: `${0.3 + (idx % 4) * 0.15}s`,
                        }}
                        className={`w-1.5 rounded-full transition-all duration-75 animate-pulse ${
                          addisState === 'VESPER_SPEAKING'
                            ? 'bg-purple-400 shadow-sm shadow-purple-300'
                            : 'bg-emerald-400 shadow-sm shadow-emerald-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div
                className={`relative z-10 p-4 rounded-full transition-colors ${
                  addisState === 'VESPER_SPEAKING'
                    ? 'bg-purple-500/20 text-purple-300'
                    : addisState === 'LISTENING'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-white/10 text-white'
                }`}
              >
                <Mic className="w-10 h-10 sm:w-14 sm:h-14" />
              </div>

              <span className="relative z-10 text-sm sm:text-base font-bold tracking-widest uppercase text-white">
                {isSessionActive ? 'STOP CALL' : 'SPEAK NOW'}
              </span>
            </button>
          </div>

          {/* Status Indicator Pill */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900/90 border border-white/15 text-xs font-semibold">
              {addisState === 'CONNECTING' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-amber-300">Connecting to Addis AI...</span>
                </>
              )}
              {addisState === 'WAITING_FOR_SETUP' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-amber-300">Waiting for Addis AI Setup...</span>
                </>
              )}
              {addisState === 'VESPER_SPEAKING' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-purple-300">Vesper is Speaking (Addis AI Model)...</span>
                </>
              )}
              {addisState === 'LISTENING' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300">Listening...</span>
                </>
              )}
              {(addisState === 'IDLE' || addisState === 'ENDED') && (
                <>
                  <span className="w-2 h-2 rounded-full bg-neutral-500" />
                  <span className="text-neutral-400">Ready to start conversation</span>
                </>
              )}
              {addisState === 'ERROR' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-rose-300">{errorCategory || 'Connection Error'}</span>
                </>
              )}
            </div>

            <p className="text-xs text-neutral-400 font-medium">
              {isSessionActive ? 'Vesper is listening — speak into your microphone' : 'Tap the button and start speaking'}
            </p>
          </div>
        </div>

        {/* Right Column: LIVE TRANSCRIPTION Card (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Card Container */}
          <div className="bg-[#0b0b10]/90 border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col h-[540px]">
            {/* Card Header & View Tabs */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                LIVE TRANSCRIPTION
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('transcription')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'transcription' ? 'bg-white/15 text-white' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  Conversation
                </button>
                <button
                  onClick={() => setActiveTab('table')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'table' ? 'bg-white/15 text-white' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  Application Data
                </button>
                <button
                  onClick={() => setActiveTab('diagnostics')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'diagnostics' ? 'bg-purple-500/20 text-purple-300' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  Diagnostics
                </button>
              </div>
            </div>

            {/* TAB 1: Live Utterances Stream (Matches Design Screenshot) */}
            {activeTab === 'transcription' && (
              <div className="flex-1 overflow-y-auto space-y-3.5 py-4 pr-1 custom-scrollbar">
                {transcriptLogs.length === 0 ? (
                  <div className="py-20 text-center text-neutral-600 space-y-2">
                    <Mic className="w-8 h-8 mx-auto text-neutral-700" />
                    <p className="text-xs">Click SPEAK NOW to start your conversation with Vesper.</p>
                  </div>
                ) : (
                  transcriptLogs.map((log, idx) => {
                    const isUser = log.speaker === 'owner';
                    return (
                      <div
                        key={log.id || idx}
                        className={`p-4 rounded-2xl border transition-all ${
                          isUser
                            ? 'bg-[#12101b] border-purple-500/20 text-purple-100'
                            : 'bg-[#0a1410] border-emerald-500/20 text-emerald-100'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                                isUser ? 'bg-purple-600' : 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                              }`}
                            >
                              {isUser ? <User className="w-3.5 h-3.5" /> : <ActivityIcon className="w-3.5 h-3.5 text-emerald-400" />}
                            </div>
                            <span className={isUser ? 'text-purple-300 font-bold' : 'text-emerald-400 font-bold'}>
                              {isUser ? 'YOU' : 'VESPER'}
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono">{log.timestamp}</span>
                        </div>
                        <p className="text-xs sm:text-sm font-sans leading-relaxed pl-8">{log.text}</p>
                      </div>
                    );
                  })
                )}
                <div ref={transcriptEndRef} />
              </div>
            )}

            {/* TAB 2: Live Extracted Application Data */}
            {activeTab === 'table' && (
              <div className="flex-1 overflow-y-auto py-3 space-y-3 custom-scrollbar">
                <div className="text-xs text-neutral-400 flex items-center justify-between">
                  <span>Extracted Microfinance Fields</span>
                  <span className="text-emerald-400 font-mono text-[10px]">Deterministic Quotes</span>
                </div>
                <div className="space-y-2">
                  {FIELD_METADATA.map((meta) => {
                    const fieldData = extractedData?.fields?.[meta.key];
                    const val = fieldData?.value;
                    const status = fieldData?.status || 'MISSING';
                    const isStated = status === 'STATED' || status === 'VERIFIED' || status === 'applicant_stated';

                    return (
                      <div key={meta.key} className="p-2.5 rounded-xl bg-neutral-900/60 border border-white/5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-white">{meta.label}</p>
                          <p className="text-[10px] text-neutral-400">{meta.amharicLabel}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-emerald-300">{val || '—'}</p>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${isStated ? 'bg-emerald-500/20 text-emerald-300' : 'bg-neutral-800 text-neutral-500'}`}>
                            {status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: Developer Diagnostics */}
            {activeTab === 'diagnostics' && (
              <div className="flex-1 overflow-y-auto py-3 space-y-2 font-mono text-[11px] custom-scrollbar">
                <div className="p-2 rounded bg-black/60 border border-white/10 flex justify-between">
                  <span className="text-neutral-400">WebSocket State:</span>
                  <span className="text-emerald-400 font-bold">{diagnostics.webSocketState}</span>
                </div>
                <div className="p-2 rounded bg-black/60 border border-white/10 flex justify-between">
                  <span className="text-neutral-400">setupComplete:</span>
                  <span className="text-emerald-400 font-bold">{diagnostics.setupComplete ? 'TRUE' : 'FALSE'}</span>
                </div>
                <div className="p-2 rounded bg-black/60 border border-white/10 flex justify-between">
                  <span className="text-neutral-400">Input Mic Sample Rate:</span>
                  <span className="text-emerald-300">{diagnostics.inputSampleRate} Hz</span>
                </div>
                <div className="p-2 rounded bg-black/60 border border-white/10 flex justify-between">
                  <span className="text-neutral-400">Output Audio Sample Rate:</span>
                  <span className="text-teal-300">{diagnostics.outputSampleRate} Hz</span>
                </div>
                <div className="p-2 rounded bg-black/60 border border-white/10 flex justify-between">
                  <span className="text-neutral-400">Last AI PCM Chunk Recv:</span>
                  <span className="text-teal-300">{diagnostics.lastAiAudioReceivedTime || 'None'}</span>
                </div>
              </div>
            )}

            {/* Bottom Status Bar inside Card */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`} />
                <span className="text-[11px]">
                  {addisState === 'VESPER_SPEAKING'
                    ? 'Vesper is speaking...'
                    : addisState === 'LISTENING'
                    ? 'Vesper is listening...'
                    : 'Click SPEAK NOW to connect'}
                </span>
              </div>

              {/* Text Input Prompt */}
              {isSessionActive && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={typedInput}
                    onChange={(e) => setTypedInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSendPrompt(typedInput);
                        setTypedInput('');
                      }
                    }}
                    placeholder="Send prompt over WebSocket..."
                    className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={() => {
                      handleSendPrompt(typedInput);
                      setTypedInput('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Security Note (Matches Design Screenshot) */}
      <footer className="px-6 py-4 border-t border-white/10 bg-[#040406] text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-neutral-400" />
          <span>Your conversation is secure and used only to help build your funding application.</span>
        </div>
        <div className="font-mono text-[10px] text-neutral-600">
          Vesper.ai &bull; Addis AI Realtime Voice Model (16kHz PCM In / 24kHz PCM Out)
        </div>
      </footer>
    </div>
  );
};

export default IVRPhoneSimulator;
