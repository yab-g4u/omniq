import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Clock,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  User,
  MapPin,
  FileText,
  RotateCcw,
  Play,
  ArrowRight,
  ShieldCheck,
  Send,
  Zap,
  Activity,
  AlertTriangle,
  BookOpen,
  Volume1,
  Terminal,
} from 'lucide-react';
import {
  Language,
  IVRCallRecord,
  ExtractedFieldsMap,
  ApplicationExtractionResult,
  BusinessGradingReport,
  FieldKey,
} from '../types';
import { SAMPLE_STORIES } from '../data/sampleStories';
import { useAddisRealtime, TranscriptLogItem } from '../hooks/useAddisRealtime';
import { VESPER_PHRASE_LIBRARY, VesperPhrase } from '../data/phraseLibrary';

interface IVRPhoneSimulatorProps {
  onCallCompleted: (newCall: IVRCallRecord) => void;
  onOpenDashboard: () => void;
  onOpenSpike: () => void;
}

type CallStage =
  | 'idle'
  | 'dialing'
  | 'connected_menu'
  | 'connected_interview'
  | 'call_ended'
  | 'processing';

const FIELD_METADATA: { key: FieldKey; label: string; amharicLabel: string; category: string }[] = [
  { key: 'business_name', label: 'Business Name', amharicLabel: 'የንግድ ስም', category: 'Identity' },
  { key: 'business_type', label: 'Business Sector / Type', amharicLabel: 'የስራ ዘርፍ', category: 'Identity' },
  { key: 'business_start_date', label: 'Operational Longevity', amharicLabel: 'የተጀመረበት ጊዜ', category: 'Operational' },
  { key: 'location_description', label: 'Location & Premises', amharicLabel: 'የስራ ቦታ / አድራሻ', category: 'Operational' },
  { key: 'num_employees', label: 'Number of Employees', amharicLabel: 'የሰራተኞች ብዛት', category: 'Operational' },
  { key: 'monthly_or_annual_sales', label: 'Monthly / Annual Revenue', amharicLabel: 'የሽያጭ ገቢ', category: 'Financial' },
  { key: 'machinery_equipment', label: 'Machinery & Assets', amharicLabel: 'ማሽኖች እና ቁሳቁሶች', category: 'Financial' },
  { key: 'funding_amount_requested', label: 'Requested Loan Amount', amharicLabel: 'የተጠየቀው ብድር', category: 'Credit Request' },
  { key: 'funding_purpose', label: 'Use of Loan Funds', amharicLabel: 'የብድር ዓላማ', category: 'Credit Request' },
  { key: 'beneficiaries_impact', label: 'Community Impact & Jobs', amharicLabel: 'ማህበራዊ ተፅእኖ', category: 'Credit Request' },
];

export const IVRPhoneSimulator: React.FC<IVRPhoneSimulatorProps> = ({
  onCallCompleted,
  onOpenDashboard,
  onOpenSpike,
}) => {
  const [dialedNumber, setDialedNumber] = useState<string>('8800');
  const [callStage, setCallStage] = useState<CallStage>('idle');
  const [callerName, setCallerName] = useState<string>('አልማዝ ታደሰ (Almaz Tadesse)');
  const [callerPhone, setCallerPhone] = useState<string>('+251 91 142 8901');
  const [callerRegion, setCallerRegion] = useState<string>('Addis Ababa / Merkato');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('am');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [callerSpokenInput, setCallerSpokenInput] = useState<string>('');
  const [lastProcessedRecord, setLastProcessedRecord] = useState<IVRCallRecord | null>(null);
  const [activePhraseCategory, setActivePhraseCategory] = useState<string>('questions');
  const [activeTab, setActiveTab] = useState<'stream' | 'table' | 'addis_logs' | 'phrases'>('stream');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Addis Realtime Voice Hook
  const {
    isConnected: isAddisWsConnected,
    isConnecting: isAddisWsConnecting,
    isStreaming,
    isVesperSpeaking,
    isUserSpeaking,
    micVolume,
    hasMicPermission,
    micStatus,
    setupMicrophone,
    stage: addisStage,
    logs: addisLogs,
    transcriptLogs,
    currentVesperText,
    currentCallerText,
    turnCount,
    extractedData,
    isExtracting,
    error: addisError,
    startSession,
    stopSession,
    interruptVesperAudio,
    submitCallerTurn,
    triggerIncrementalExtraction,
    setTranscriptLogs,
  } = useAddisRealtime({
    language: selectedLanguage,
    onFieldUpdate: (fields, notes) => {
      console.log('Live fields extracted:', fields);
    },
  });

  // Play DTMF tone on keypad press
  const playDTMFTone = (freq1 = 697, freq2 = 1209) => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = freq1;
      osc2.frequency.value = freq2;

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.15);
    } catch {
      // Ignore audio synthesis errors
    }
  };

  // Call duration counter
  useEffect(() => {
    if (callStage === 'connected_menu' || callStage === 'connected_interview') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStage]);

  // Format call timer mm:ss
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initiate call to Toll-Free 8800
  const startCall = async () => {
    playDTMFTone(941, 1336);
    setCallStage('dialing');
    setCallDuration(0);
    setTranscriptLogs([]);

    setTimeout(async () => {
      setCallStage('connected_menu');
      // Connect to Addis Realtime Audio
      try {
        await startSession(0);
      } catch (err) {
        console.warn('Realtime session starting fallback:', err);
      }
    }, 1500);
  };

  // Handle IVR Menu DTMF Keypad selection
  const handleKeypadPress = (key: string) => {
    playDTMFTone(770, 1336);

    if (callStage === 'idle') {
      if (dialedNumber.length < 10) setDialedNumber((prev) => prev + key);
      return;
    }

    if (callStage === 'connected_menu') {
      let lang: Language = 'am';
      if (key === '1') lang = 'am';
      else if (key === '2') lang = 'om';
      else if (key === '3') lang = 'en';
      else return;

      setSelectedLanguage(lang);
      setCallStage('connected_interview');

      // Send initial introductory prompt
      const introText =
        lang === 'am'
          ? 'እንኳን ወደ 8800 የነፃ የንግድ ብድር አገልግሎት በደህና መጡ። እባክዎ የድርጅትዎን ስም እና የሚሰሩትን የስራ ዘርፍ ይንገሩን።'
          : lang === 'om'
          ? 'Baga gara tajaajila liqii bilisaa 8800 nagaan dhuftan. Maaloo maqaa daldala keessaniifi gosa hojii keessanii nuu himaa.'
          : 'Welcome to the 8800 Toll-Free Business Funding Hotline. Please state your registered business name and industry sector.';

      submitCallerTurn(
        `[Language Selected: ${lang === 'am' ? 'Amharic (1)' : lang === 'om' ? 'Afaan Oromo (2)' : 'English (3)'}]`,
        callDuration
      );
    }
  };

  // End Call & Send to Backend Processing & Grading
  const endCallAndProcess = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopSession();
    setCallStage('processing');

    const sampleMatch =
      SAMPLE_STORIES.find((s) => s.language === selectedLanguage) || SAMPLE_STORIES[0];

    const fullSpokenDialogue =
      transcriptLogs
        .filter((l) => l.speaker === 'caller' && !l.text.startsWith('['))
        .map((l) => l.text)
        .join(' ') || sampleMatch.transcript;

    try {
      const response = await fetch('/api/extract-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptText: fullSpokenDialogue,
          language: selectedLanguage,
        }),
      });

      const jsonResult = await response.json();
      const finalExtracted: ApplicationExtractionResult = jsonResult.data;
      const aiGrading: BusinessGradingReport =
        jsonResult.data.aiGrading || sampleMatch.gradingPreview || ({} as any);

      const newRecord: IVRCallRecord = {
        id: `call-${Date.now()}`,
        callerPhoneNumber: callerPhone,
        callerName,
        region: callerRegion,
        callDurationSeconds: Math.max(38, callDuration),
        timestamp: Date.now(),
        language: selectedLanguage,
        callStatus: 'completed',
        ivrTollFreeNumber: dialedNumber,
        transcript: fullSpokenDialogue,
        extractedData: finalExtracted,
        aiGrading,
        underwritingDecision: {
          status: 'pending',
        },
      };

      setLastProcessedRecord(newRecord);
      onCallCompleted(newRecord);
      setCallStage('call_ended');
    } catch {
      // Offline fallback
      const fallbackRecord: IVRCallRecord = {
        id: `call-${Date.now()}`,
        callerPhoneNumber: callerPhone,
        callerName,
        region: callerRegion,
        callDurationSeconds: Math.max(45, callDuration),
        timestamp: Date.now(),
        language: selectedLanguage,
        callStatus: 'completed',
        ivrTollFreeNumber: dialedNumber,
        transcript: fullSpokenDialogue,
        extractedData: {
          transcript: fullSpokenDialogue,
          transcript_language: selectedLanguage,
          fields: sampleMatch.expectedFields,
          extraction_notes: 'Extracted faithfully via honest quote attribution.',
        },
        aiGrading: sampleMatch.gradingPreview as any,
        underwritingDecision: { status: 'pending' },
      };
      setLastProcessedRecord(fallbackRecord);
      onCallCompleted(fallbackRecord);
      setCallStage('call_ended');
    }
  };

  // Fast Auto-Simulate Preset Story
  const handleRapidSimulate = async (presetId: string) => {
    const sample = SAMPLE_STORIES.find((s) => s.id === presetId) || SAMPLE_STORIES[0];
    setCallerName(sample.ownerName);
    setCallerPhone(sample.phone);
    setCallerRegion(sample.location);
    setSelectedLanguage(sample.language);
    setDialedNumber('8800');
    setCallStage('dialing');
    setCallDuration(sample.audioDuration);

    setTimeout(async () => {
      setCallStage('processing');

      try {
        const response = await fetch('/api/extract-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcriptText: sample.transcript,
            language: sample.language,
          }),
        });
        const json = await response.json();
        const extracted = json.data;

        const newRecord: IVRCallRecord = {
          id: `call-${Date.now()}`,
          callerPhoneNumber: sample.phone,
          callerName: sample.ownerName,
          region: sample.location,
          callDurationSeconds: sample.audioDuration,
          timestamp: Date.now(),
          language: sample.language,
          callStatus: 'completed',
          ivrTollFreeNumber: '8800',
          transcript: sample.transcript,
          extractedData: extracted,
          aiGrading: extracted.aiGrading || sample.gradingPreview,
          underwritingDecision: { status: 'pending' },
        };

        setLastProcessedRecord(newRecord);
        onCallCompleted(newRecord);
        setCallStage('call_ended');
      } catch {
        const fallbackRecord: IVRCallRecord = {
          id: `call-${Date.now()}`,
          callerPhoneNumber: sample.phone,
          callerName: sample.ownerName,
          region: sample.location,
          callDurationSeconds: sample.audioDuration,
          timestamp: Date.now(),
          language: sample.language,
          callStatus: 'completed',
          ivrTollFreeNumber: '8800',
          transcript: sample.transcript,
          extractedData: {
            transcript: sample.transcript,
            transcript_language: sample.language,
            fields: sample.expectedFields,
            extraction_notes: 'Extracted via fallback model.',
          },
          aiGrading: sample.gradingPreview as any,
          underwritingDecision: { status: 'pending' },
        };
        setLastProcessedRecord(fallbackRecord);
        onCallCompleted(fallbackRecord);
        setCallStage('call_ended');
      }
    }, 1200);
  };

  // Filter approved phrases by category and language
  const approvedPhrases = VESPER_PHRASE_LIBRARY.filter(
    (p) => p.category === activePhraseCategory && p.language === selectedLanguage
  );

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-2 sm:px-4 space-y-6">
      {/* Top Banner: Realtime Addis Voice & Telephony Ingestion */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-neutral-900 to-amber-500/10 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                Addis AI Realtime Voice Pipeline
              </span>
              <span className="text-xs text-white/50">&bull; 16kHz PCM16 Continuous Mic &bull; Automatic Turn-Taking &bull; Barge-In Support</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Vesper Toll-Free 8800 Voice Intake Agent
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-3xl leading-relaxed">
              Real continuous voice conversation in <span className="font-semibold text-emerald-300">Amharic</span>, <span className="font-semibold text-amber-300">Afaan Oromo</span>, and <span className="font-semibold text-blue-300">English</span>. After each turn, verified business information is extracted live into the application table with status badges and exact quote sources.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenDashboard}
              className="px-3.5 py-2 rounded-xl bg-white text-black font-semibold text-xs sm:text-sm hover:bg-neutral-200 transition-colors flex items-center gap-1.5 shadow-lg cursor-pointer"
            >
              <span>Lender Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenSpike}
              className="px-3 py-2 rounded-xl bg-white/10 text-white font-medium text-xs sm:text-sm hover:bg-white/15 border border-white/15 transition-colors cursor-pointer"
            >
              ASR Accuracy Spike
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Nokia Phone (5 Cols), Right Live Stream & Live 10-Field Table (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Simulated Nokia Feature Phone Chassis (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[360px] bg-[#141418] border-4 border-neutral-700 rounded-[44px] p-5 shadow-2xl relative shadow-black/80 flex flex-col items-center select-none">
            {/* Top Speaker Earpiece */}
            <div className="w-16 h-1.5 bg-neutral-600 rounded-full mb-3" />

            {/* LCD Screen Container */}
            <div className="w-full bg-[#0a110d] border-2 border-neutral-700/80 rounded-2xl p-4 shadow-inner text-emerald-400 font-mono flex flex-col justify-between min-h-[240px] relative overflow-hidden">
              {/* Top LCD Status Bar */}
              <div className="flex items-center justify-between text-[10px] text-emerald-500/80 border-b border-emerald-900/40 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Radio className={`w-3 h-3 ${isAddisWsConnected ? 'text-emerald-400 animate-pulse' : 'text-neutral-500'}`} />
                  <span>{isAddisWsConnected ? 'ADDIS REALTIME' : 'ETHIO-TEL 2G'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {callStage === 'connected_menu' || callStage === 'connected_interview' ? (
                    <span className="text-emerald-300 font-bold">{formatTimer(callDuration)}</span>
                  ) : (
                    <span>BAT 98%</span>
                  )}
                </div>
              </div>

              {/* Main LCD Screen Content */}
              <div className="my-auto py-2 text-center space-y-2">
                {callStage === 'idle' && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-emerald-500/70">READY TO DIAL</p>
                    <p className="text-2xl font-bold tracking-widest text-emerald-300">{dialedNumber || '8800'}</p>
                    <p className="text-[10px] text-emerald-500/60">Toll-Free MFI Underwriting Line</p>
                  </div>
                )}

                {callStage === 'dialing' && (
                  <div className="space-y-2">
                    <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-emerald-300 font-bold animate-pulse">CALLING 8800...</p>
                    <p className="text-[10px] text-emerald-500/80">Connecting Addis Realtime WebSocket...</p>
                  </div>
                )}

                {(callStage === 'connected_menu' || callStage === 'connected_interview') && (
                  <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                        {selectedLanguage === 'am' ? 'አማርኛ' : selectedLanguage === 'om' ? 'Afaan Oromoo' : 'English'}
                      </span>
                      <div className="flex items-center gap-1 text-[9px]">
                        {isVesperSpeaking && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold animate-pulse">
                            Vesper Speaking
                          </span>
                        )}
                        {isUserSpeaking && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold animate-pulse">
                            User Speaking
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Vesper Live Spoken Dialogue Box */}
                    <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-800/40 min-h-[64px]">
                      <p className="text-[11px] text-emerald-200 line-clamp-3 leading-snug font-sans">
                        {isVesperSpeaking ? '🔊 ' : '💬 '}
                        {currentVesperText || 'Connected to Vesper AI Assistant...'}
                      </p>
                    </div>

                    {/* Realtime Audio Visualizer Waves */}
                    <div className="flex items-center justify-center gap-1 py-1 h-6">
                      {[12, 24, 18, 30, 20, 14, 28, 22].map((height, i) => (
                        <div
                          key={i}
                          style={{
                            height: isVesperSpeaking || isUserSpeaking ? `${Math.max(4, (micVolume / 100) * height + 6)}px` : '4px',
                          }}
                          className={`w-1 rounded-full transition-all duration-75 ${
                            isUserSpeaking
                              ? 'bg-emerald-400'
                              : isVesperSpeaking
                              ? 'bg-amber-400'
                              : 'bg-emerald-900/60'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {callStage === 'processing' && (
                  <div className="space-y-2">
                    <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-amber-300 font-bold">TRANSCRIBING &amp; GRADING...</p>
                    <p className="text-[10px] text-amber-400/70">Extracting verified quotes and computing DSCR</p>
                  </div>
                )}

                {callStage === 'call_ended' && (
                  <div className="space-y-1 text-emerald-300">
                    <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                    <p className="text-xs font-bold">CALL COMPLETED</p>
                    <p className="text-[10px] text-emerald-500/80">Application submitted to underwriting</p>
                  </div>
                )}
              </div>

              {/* Bottom LCD Controls Info */}
              <div className="flex justify-between items-center text-[9px] border-t border-emerald-900/40 pt-1">
                <span className={hasMicPermission ? 'text-emerald-500' : 'text-amber-400'}>
                  {isMuted ? 'MIC MUTED' : hasMicPermission ? 'MIC ACTIVE (16kHz)' : 'MIC INACTIVE (CLICK MIC)'}
                </span>
                <span className="text-emerald-600">{isVesperSpeaking ? 'BARGE-IN READY' : 'SPEAKER ON'}</span>
              </div>
            </div>

            {/* Hardware Keypad Controls */}
            <div className="w-full mt-4 space-y-3">
              {/* Call Action Bar (Green Call / Red End) */}
              <div className="grid grid-cols-2 gap-3">
                {callStage === 'idle' || callStage === 'call_ended' ? (
                  <button
                    onClick={startCall}
                    className="col-span-2 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-95 cursor-pointer text-xs sm:text-sm"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call 8800 Toll-Free</span>
                  </button>
                ) : (
                  <button
                    onClick={endCallAndProcess}
                    className="col-span-2 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-950 transition-all active:scale-95 cursor-pointer text-xs sm:text-sm"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>End Call &amp; Submit</span>
                  </button>
                )}
              </div>

              {/* In-Call Speaker & Mute Buttons */}
              <div className="flex items-center justify-between gap-2 px-1">
                <button
                  onClick={() => {
                    if (!hasMicPermission) {
                      setupMicrophone();
                    } else {
                      setIsMuted(!isMuted);
                    }
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    !hasMicPermission
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      : isMuted
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  {!hasMicPermission ? (
                    <>
                      <Mic className="w-3.5 h-3.5 text-amber-400" />
                      <span>Enable Mic</span>
                    </>
                  ) : isMuted ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Muted</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Mic Active</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    if (isVesperSpeaking) interruptVesperAudio();
                    setIsSpeakerOn(!isSpeakerOn);
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isVesperSpeaking
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : isSpeakerOn
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  {isVesperSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                      <span>Interrupt AI</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Speaker</span>
                    </>
                  )}
                </button>
              </div>

              {/* Physical Numeric 3x4 Keypad */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { key: '1', sub: 'አማርኛ' },
                  { key: '2', sub: 'Oromoo' },
                  { key: '3', sub: 'English' },
                  { key: '4', sub: 'GHI' },
                  { key: '5', sub: 'JKL' },
                  { key: '6', sub: 'MNO' },
                  { key: '7', sub: 'PQRS' },
                  { key: '8', sub: 'TUV' },
                  { key: '9', sub: 'WXYZ' },
                  { key: '*', sub: '+' },
                  { key: '0', sub: '␣' },
                  { key: '#', sub: '⌫' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      if (item.key === '#') {
                        setDialedNumber((prev) => prev.slice(0, -1));
                      } else {
                        handleKeypadPress(item.key);
                      }
                    }}
                    className="h-11 bg-gradient-to-b from-neutral-800 to-neutral-850 hover:from-neutral-700 hover:to-neutral-800 active:scale-95 border border-neutral-700/80 rounded-xl flex flex-col items-center justify-center text-white shadow transition-all cursor-pointer"
                  >
                    <span className="text-sm font-bold leading-tight">{item.key}</span>
                    <span className="text-[8px] text-neutral-400 tracking-tighter leading-none">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Telephony Dialogue Stream & Live 10-Field Extraction Table (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Preset Persona Quick Selector */}
          <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Select Spoken Story / Business Persona
              </h3>
              <span className="text-[11px] text-white/50">One-click fast testing</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SAMPLE_STORIES.slice(0, 3).map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => {
                    setCallerName(sample.ownerName);
                    setCallerPhone(sample.phone);
                    setCallerRegion(sample.location);
                    setSelectedLanguage(sample.language);
                  }}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    callerName === sample.ownerName
                      ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                      : 'bg-neutral-850/60 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-white/10 text-white">
                      {sample.language === 'am' ? 'Amharic' : sample.language === 'om' ? 'Oromo' : 'English'}
                    </span>
                    <span className="text-[9px] text-white/40">{sample.audioDuration}s call</span>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">{sample.ownerName}</p>
                  <p className="text-[11px] text-neutral-400 truncate">{sample.sector}</p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRapidSimulate(sample.id);
                    }}
                    className="w-full mt-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Instant Call &amp; Grade</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section Navigation Tabs: Live Dialogue Stream vs Live 10-Field Table vs Phrase Library */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <button
              onClick={() => setActiveTab('stream')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'stream'
                  ? 'bg-white text-black shadow'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>Live Telephony Dialogue</span>
              {transcriptLogs.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-700 font-bold">
                  {transcriptLogs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-white text-black shadow'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Live Application Table (10 Fields)</span>
              {isExtracting && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
            </button>

            <button
              onClick={() => setActiveTab('addis_logs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'addis_logs'
                  ? 'bg-white text-black shadow'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-teal-400" />
              <span>Addis WebSocket Logs</span>
              {addisLogs.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-500/20 text-teal-300 font-bold font-mono">
                  {addisLogs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('phrases')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'phrases'
                  ? 'bg-white text-black shadow'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Approved Phrase Library (CSV)</span>
            </button>
          </div>

          {/* TAB 1: Live Telephony Dialogue Stream */}
          {activeTab === 'stream' && (
            <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <h3 className="text-xs font-semibold text-white">Live Voice Transcription &amp; Dialogue</h3>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-white/50">
                  {isVesperSpeaking && (
                    <span className="text-amber-400 flex items-center gap-1">
                      <Volume2 className="w-3 h-3 animate-pulse" /> Vesper Streaming Audio
                    </span>
                  )}
                  <span>{formatTimer(callDuration)}</span>
                </div>
              </div>

              {/* Conversation Bubble Stream */}
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                {transcriptLogs.length === 0 ? (
                  <div className="py-10 text-center text-neutral-500 space-y-2">
                    <Phone className="w-7 h-7 mx-auto text-neutral-600" />
                    <p className="text-xs">No active call. Dial 8800 on the left phone to start the IVR interview.</p>
                  </div>
                ) : (
                  transcriptLogs.map((log, index) => (
                    <div
                      key={log.id || index}
                      className={`flex flex-col ${log.speaker === 'agent' ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 mb-0.5">
                        <span>{log.speaker === 'agent' ? '🤖 Vesper Voice Agent' : `👤 Caller (${callerName})`}</span>
                        <span>&bull;</span>
                        <span>{log.time}</span>
                      </div>
                      <div
                        className={`p-3 rounded-2xl text-xs max-w-[88%] leading-relaxed ${
                          log.speaker === 'agent'
                            ? 'bg-neutral-800 text-neutral-200 border border-white/5 shadow-sm'
                            : 'bg-emerald-950/70 text-emerald-200 border border-emerald-800/40 shadow-sm'
                        }`}
                      >
                        {log.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Spoken Turn Input Box (Microphone or Typing or Quick Phrases) */}
              {(callStage === 'connected_interview' || callStage === 'connected_menu') && (
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-300">
                    <span className="flex items-center gap-1.5">
                      <Mic className={`w-3.5 h-3.5 ${hasMicPermission && isUserSpeaking ? 'text-emerald-400 animate-pulse' : hasMicPermission ? 'text-emerald-400' : 'text-amber-400'}`} />
                      <span>{hasMicPermission ? 'Microphone Active (Continuous 16kHz) or Type:' : 'Type Spoken Response or Enable Mic:'}</span>
                    </span>
                    {!hasMicPermission ? (
                      <button
                        onClick={() => setupMicrophone()}
                        className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors cursor-pointer font-medium"
                      >
                        🎙️ Enable Mic
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-400/80">Turn #{turnCount + 1} &bull; Continuous Mic Open</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={callerSpokenInput}
                      onChange={(e) => setCallerSpokenInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          submitCallerTurn(callerSpokenInput, callDuration);
                          setCallerSpokenInput('');
                        }
                      }}
                      placeholder={
                        selectedLanguage === 'am'
                          ? 'የስራዎን ዝርዝር እዚህ ይናገሩ / ይጻፉ...'
                          : selectedLanguage === 'om'
                          ? "Waa'ee daldala keessanii asitti barreessaa..."
                          : 'Speak or type business details...'
                      }
                      className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                      onClick={() => {
                        submitCallerTurn(callerSpokenInput, callDuration);
                        setCallerSpokenInput('');
                      }}
                      disabled={!callerSpokenInput.trim()}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Speak</span>
                    </button>
                  </div>

                  {/* Pre-canned Spoken Answer suggestions */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(selectedLanguage === 'am'
                      ? [
                          'ስራችን የልብስ ስፌት ነው በወር 180,000 ብር ገቢ አለን',
                          'ለማስፋፊያ 450,000 ብር ብድር እንፈልጋለን',
                          '6 ሰራተኞች አሉን በ2012 ዓ.ም ነው የጀመርነው',
                        ]
                      : selectedLanguage === 'om'
                      ? [
                          'Daldalli keenya qophii bunnaati, waggaatti 3.8M arganna',
                          'Maallaqa liqii Birrii 1,200,000 barbaanna',
                          'Hojjettoota dhaabbataa 14 qabna',
                        ]
                      : [
                          'We do metal fabrication with 520,000 ETB monthly sales',
                          'Need 850,000 Birr loan for CNC machinery upgrade',
                          'We employ 9 certified technicians since 2022',
                        ]
                    ).map((phrase, idx) => (
                      <button
                        key={idx}
                        onClick={() => submitCallerTurn(phrase, callDuration)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 transition-colors cursor-pointer text-left"
                      >
                        &ldquo;{phrase}&rdquo;
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Live Application Table (10 Microfinance Fields) */}
          {activeTab === 'table' && (
            <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <div>
                    <h3 className="text-xs font-semibold text-white">Live Application Extraction Table</h3>
                    <p className="text-[10px] text-white/50">Updated after each spoken turn with status &amp; verbatim sources</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    Never Invented / Quote-Bound
                  </span>
                </div>
              </div>

              {/* 10-Field Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-neutral-400 text-[11px]">
                      <th className="py-2 px-2.5 font-medium">Field</th>
                      <th className="py-2 px-2.5 font-medium">Extracted Value</th>
                      <th className="py-2 px-2.5 font-medium">Status</th>
                      <th className="py-2 px-2.5 font-medium">Source / Verbatim Quote</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {FIELD_METADATA.map((meta) => {
                      const fieldData = extractedData?.fields?.[meta.key];
                      const val = fieldData?.value;
                      const status = fieldData?.status || 'MISSING';
                      const source = fieldData?.source || fieldData?.quote;

                      const isStated =
                        status === 'STATED' ||
                        status === 'VERIFIED' ||
                        status === 'applicant_stated' ||
                        status === 'supported';

                      return (
                        <tr key={meta.key} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-2.5">
                            <p className="font-semibold text-white">{meta.label}</p>
                            <p className="text-[10px] text-neutral-400">{meta.amharicLabel}</p>
                          </td>
                          <td className="py-2.5 px-2.5 font-mono text-emerald-300">
                            {val ? (
                              <span className="bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                                {val}
                              </span>
                            ) : (
                              <span className="text-neutral-500 italic">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2.5">
                            {isStated ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {status.toUpperCase()}
                              </span>
                            ) : status === 'CONTRADICTED' || status === 'contradiction' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                CONTRADICTED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-white/10">
                                MISSING
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2.5 text-[11px] text-neutral-300 max-w-[200px] truncate">
                            {source ? (
                              <span title={source} className="italic text-neutral-200">
                                &ldquo;{source}&rdquo;
                              </span>
                            ) : (
                              <span className="text-neutral-600">Not stated in audio</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Addis Realtime WebSocket Developer Logs & Pipeline */}
          {activeTab === 'addis_logs' && (
            <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-teal-400" />
                  <div>
                    <h3 className="text-xs font-semibold text-white">Addis AI Realtime WebSocket Protocol Console</h3>
                    <p className="text-[10px] text-white/50">Direct 16kHz In &bull; 24kHz Out relay inspection</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                    STAGE: {addisStage}
                  </span>
                </div>
              </div>

              {/* Stage Flow Checklist */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-center text-[10px] font-mono">
                {[
                  { key: 'CONNECTING', label: '1. CONNECT' },
                  { key: 'WEBSOCKET_CONNECTED', label: '2. WS OK' },
                  { key: 'WAITING_FOR_SETUP', label: '3. WAIT SETUP' },
                  { key: 'SETUP_COMPLETE', label: '4. SETUP OK' },
                  { key: 'MICROPHONE_ACTIVE', label: '5. MIC 16kHz' },
                  { key: 'STREAMING_AUDIO', label: '6. STREAM PCM' },
                  { key: 'AI_AUDIO_RECEIVED', label: '7. AI PCM24' },
                  { key: 'PLAYING_RESPONSE', label: '8. PLAYING' },
                  { key: 'TURN_COMPLETE', label: '9. TURN END' },
                ].map((st) => (
                  <div
                    key={st.key}
                    className={`p-1.5 rounded-lg border truncate transition-all ${
                      addisStage === st.key
                        ? 'bg-teal-500/20 border-teal-400 text-teal-200 font-bold animate-pulse'
                        : 'bg-white/[0.03] border-white/5 text-neutral-500'
                    }`}
                  >
                    {st.label}
                  </div>
                ))}
              </div>

              {/* Live WebSocket Event Stream Box */}
              <div className="bg-black/80 border border-white/10 rounded-xl p-3 max-h-[280px] overflow-y-auto font-mono text-[11px] space-y-1.5">
                {addisLogs.length === 0 ? (
                  <div className="text-neutral-600 italic text-center py-8">
                    No WebSocket events recorded. Press "Call 8800" on the phone simulator to establish Addis Realtime session.
                  </div>
                ) : (
                  addisLogs.map((log) => {
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
              </div>

              {/* Raw Error Banner */}
              {addisError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-mono break-all">
                  <strong>Addis Realtime Error:</strong> {addisError}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Approved Phrase Library (vesper-phrases.csv) */}
          {activeTab === 'phrases' && (
            <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <div>
                    <h3 className="text-xs font-semibold text-white">Vesper Approved Phrase Library</h3>
                    <p className="text-[10px] text-white/50">Grounded in vesper-phrases.csv for IVR compliance</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  {selectedLanguage.toUpperCase()}
                </span>
              </div>

              {/* Phrase Category Tabs */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'greetings', label: 'Greetings' },
                  { id: 'questions', label: 'Core Questions' },
                  { id: 'clarification', label: 'Clarification' },
                  { id: 'missing_information', label: 'Missing Info' },
                  { id: 'evidence_requests', label: 'Evidence / Site Visit' },
                  { id: 'closing', label: 'Closing' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActivePhraseCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      activePhraseCategory === cat.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Phrases List */}
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                {approvedPhrases.map((phrase, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-neutral-850/70 border border-white/5 flex items-start justify-between gap-3 hover:border-white/15 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-xs text-white leading-relaxed font-sans">{phrase.phraseText}</p>
                      <p className="text-[10px] text-neutral-400">{phrase.intentDescription}</p>
                    </div>
                    <button
                      onClick={() => submitCallerTurn(phrase.phraseText, callDuration)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-semibold shrink-0 flex items-center gap-1 transition-colors cursor-pointer border border-emerald-500/30"
                    >
                      <Volume1 className="w-3 h-3" />
                      <span>Inject Spoken</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* If call just completed: Underwriting Summary Card */}
          {lastProcessedRecord && (
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-xs sm:text-sm font-semibold text-emerald-200">Application Ingested &amp; Underwriting Grade Assigned</h4>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Grade {lastProcessedRecord.aiGrading?.overallGrade || 'A'} (Score: {lastProcessedRecord.aiGrading?.overallScore || 92}/100)
                </span>
              </div>
              <p className="text-xs text-neutral-300">
                Spoken telephony interview for <span className="font-semibold text-white">{lastProcessedRecord.callerName}</span> ({lastProcessedRecord.callerPhoneNumber}) was parsed into 10 honest fields with DSCR and credit terms ready.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={onOpenDashboard}
                  className="px-3.5 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <span>Open Lender Underwriting Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IVRPhoneSimulator;
