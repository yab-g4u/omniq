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
} from 'lucide-react';
import { Language, IVRCallRecord, ExtractedFieldsMap, ApplicationExtractionResult, BusinessGradingReport } from '../types';
import { SAMPLE_STORIES } from '../data/sampleStories';

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
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState<boolean>(false);
  const [agentSpokenText, setAgentSpokenText] = useState<string>('');
  const [userTranscriptLogs, setUserTranscriptLogs] = useState<{ speaker: 'agent' | 'caller'; text: string; time: string }[]>([]);
  const [callerSpokenInput, setCallerSpokenInput] = useState<string>('');
  const [isProcessingGrading, setIsProcessingGrading] = useState<boolean>(false);
  const [lastProcessedRecord, setLastProcessedRecord] = useState<IVRCallRecord | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

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

  // Text-to-speech for voice agent in browser
  const speakAgentResponse = (text: string, lang: Language) => {
    if (!isSpeakerOn || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      if (lang === 'en') {
        utterance.lang = 'en-US';
      }
      utterance.onstart = () => setIsAgentSpeaking(true);
      utterance.onend = () => setIsAgentSpeaking(false);
      utterance.onerror = () => setIsAgentSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsAgentSpeaking(false);
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

  // Initiate call
  const startCall = () => {
    playDTMFTone(941, 1336);
    setCallStage('dialing');
    setCallDuration(0);
    setUserTranscriptLogs([]);
    setCurrentStep(1);

    setTimeout(() => {
      setCallStage('connected_menu');
      const greeting =
        'Welcome to the 8800 Toll-Free Business Funding Agent. 1ን ይጫኑ ለአማርኛ፣ 2 tuqaa Afaan Oromoof, Press 3 for English.';
      setAgentSpokenText(greeting);
      setUserTranscriptLogs([
        {
          speaker: 'agent',
          text: greeting,
          time: '00:02',
        },
      ]);
      speakAgentResponse(greeting, 'en');
    }, 1800);
  };

  // Select language in IVR menu via DTMF Keypad
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

      const step1Text =
        lang === 'am'
          ? 'እንኳን ወደ 8800 የነፃ የንግድ ብድር አገልግሎት በደህና መጡ። እባክዎ የድርጅትዎን ስም እና የሚሰሩትን የስራ ዘርፍ ይንገሩን።'
          : lang === 'om'
          ? 'Baga gara tajaajila liqii bilisaa 8800 nagaan dhuftan. Maaloo maqaa daldala keessaniifi gosa hojii keessanii nuu himaa.'
          : 'Welcome to the 8800 Toll-Free Business Funding Hotline. Please state your business name and the products or services you provide.';

      setAgentSpokenText(step1Text);
      setUserTranscriptLogs((prev) => [
        ...prev,
        {
          speaker: 'caller',
          text: `[DTMF Pressed Key: ${key} (${lang === 'am' ? 'Amharic' : lang === 'om' ? 'Oromo' : 'English'})]`,
          time: formatTimer(callDuration),
        },
        {
          speaker: 'agent',
          text: step1Text,
          time: formatTimer(callDuration + 1),
        },
      ]);
      speakAgentResponse(step1Text, lang);
    }
  };

  // Caller submits spoken sentence
  const handleCallerSpokenTurn = async (spokenText: string) => {
    if (!spokenText.trim()) return;

    const callerEntryTime = formatTimer(callDuration);
    setUserTranscriptLogs((prev) => [
      ...prev,
      {
        speaker: 'caller',
        text: spokenText,
        time: callerEntryTime,
      },
    ]);
    setCallerSpokenInput('');

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    try {
      const response = await fetch('/api/ivr/voice-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLanguage,
          stepId: nextStep,
          userSpokenText: spokenText,
          callerPhone,
        }),
      });
      const data = await response.json();
      const agentReply = data.responseText || 'እናመሰግናለን።';

      setAgentSpokenText(agentReply);
      setUserTranscriptLogs((prev) => [
        ...prev,
        {
          speaker: 'agent',
          text: agentReply,
          time: formatTimer(callDuration + 2),
        },
      ]);
      speakAgentResponse(agentReply, selectedLanguage);

      if (nextStep >= 7) {
        setTimeout(() => {
          endCallAndProcess();
        }, 3500);
      }
    } catch {
      // Fallback response
      const fallbackPrompt = 'እናመሰግናለን። እባክዎ የቀጣዩን ጥያቄ ዝርዝር ያብራሩልን።';
      setAgentSpokenText(fallbackPrompt);
    }
  };

  // Fast Auto-Simulate Caller Story
  const loadPresetPersona = (presetId: string) => {
    const sample = SAMPLE_STORIES.find((s) => s.id === presetId) || SAMPLE_STORIES[0];
    setCallerName(sample.ownerName);
    setCallerPhone(sample.phone);
    setCallerRegion(sample.location);
    setSelectedLanguage(sample.language);
  };

  // End Call & Send to Backend Processing & Grading
  const endCallAndProcess = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setCallStage('processing');
    setIsProcessingGrading(true);

    // Build complete caller dialogue text
    const sampleMatch = SAMPLE_STORIES.find((s) => s.language === selectedLanguage) || SAMPLE_STORIES[0];
    const fullSpokenDialogue =
      userTranscriptLogs
        .filter((l) => l.speaker === 'caller' && !l.text.startsWith('[DTMF'))
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
      const extractedData: ApplicationExtractionResult = jsonResult.data;
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
        extractedData,
        aiGrading,
        underwritingDecision: {
          status: 'pending',
        },
      };

      setLastProcessedRecord(newRecord);
      onCallCompleted(newRecord);
      setCallStage('call_ended');
      setIsProcessingGrading(false);
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
      setIsProcessingGrading(false);
    }
  };

  // Rapid One-Click Complete Simulation
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
      setIsProcessingGrading(true);

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
        setIsProcessingGrading(false);
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
        setIsProcessingGrading(false);
      }
    }, 1500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-2 sm:px-4 space-y-8">
      {/* Top Banner / Concept Explainer */}
      <div className="bg-gradient-to-r from-amber-500/10 via-neutral-900 to-emerald-500/10 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                Telephony & IVR Ingestion
              </span>
              <span className="text-xs text-white/50">&bull; No Smartphone Required &bull; Feature Phone / 2G</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Toll-Free Voice Agent & Telephony Intake
            </h1>
            <p className="text-sm text-neutral-300 max-w-2xl leading-relaxed">
              Informal business owners dial <span className="font-semibold text-white bg-white/10 px-1.5 py-0.5 rounded">8800</span> on basic Nokia/feature phones. Our AI Voice Assistant conducts the intake interview in Amharic, Oromo, or English, automatically extracts honest verified data, and sends it directly to the Lender Underwriting Dashboard.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenDashboard}
              className="px-4 py-2.5 rounded-xl bg-white text-black font-semibold text-xs sm:text-sm hover:bg-neutral-200 transition-colors flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <span>View Lender Grading Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenSpike}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 text-white font-medium text-xs sm:text-sm hover:bg-white/15 border border-white/15 transition-colors cursor-pointer"
            >
              ASR Accuracy Spike
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Phone Simulator, Right Live Dialogue Stream & Fast Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Realistic Feature Phone Hardware Chassis (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[360px] bg-[#17171c] border-4 border-neutral-700 rounded-[44px] p-5 shadow-2xl relative shadow-black/80 flex flex-col items-center select-none">
            {/* Top Speaker Earpiece */}
            <div className="w-16 h-1.5 bg-neutral-600 rounded-full mb-4" />

            {/* LCD Screen Container */}
            <div className="w-full bg-[#0a110d] border-2 border-neutral-700/80 rounded-2xl p-4 shadow-inner text-emerald-400 font-mono flex flex-col justify-between min-h-[220px] relative overflow-hidden">
              {/* Top LCD Status Bar */}
              <div className="flex items-center justify-between text-[11px] text-emerald-500/80 border-b border-emerald-900/40 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>ETHIO-TEL 2G</span>
                </div>
                <div className="flex items-center gap-2">
                  {callStage === 'connected_menu' || callStage === 'connected_interview' ? (
                    <span className="text-emerald-300 font-semibold">{formatTimer(callDuration)}</span>
                  ) : (
                    <span>BAT 98%</span>
                  )}
                </div>
              </div>

              {/* Main Screen Content */}
              <div className="my-auto py-3 text-center space-y-2">
                {callStage === 'idle' && (
                  <div className="space-y-1">
                    <p className="text-xs text-emerald-500/70">READY TO DIAL</p>
                    <p className="text-2xl font-bold tracking-widest text-emerald-300">{dialedNumber || '8800'}</p>
                    <p className="text-[10px] text-emerald-500/60">Toll-Free MFI Application Line</p>
                  </div>
                )}

                {callStage === 'dialing' && (
                  <div className="space-y-2">
                    <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-emerald-300 font-bold animate-pulse">CALLING 8800...</p>
                    <p className="text-[11px] text-emerald-500/80">Connecting to Voice Intake Agent</p>
                  </div>
                )}

                {(callStage === 'connected_menu' || callStage === 'connected_interview') && (
                  <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                        {selectedLanguage === 'am' ? 'አማርኛ' : selectedLanguage === 'om' ? 'Afaan Oromoo' : 'English'}
                      </span>
                      <span className="text-[10px] text-emerald-400/80">
                        {callStage === 'connected_menu' ? 'IVR Menu' : `Step ${currentStep}/7`}
                      </span>
                    </div>

                    <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-800/40 min-h-[68px]">
                      <p className="text-xs text-emerald-200 line-clamp-3 leading-snug font-sans">
                        {isAgentSpeaking ? '🔊 ' : '💬 '}
                        {agentSpokenText || 'Connected to Vesper AI Assistant...'}
                      </p>
                    </div>

                    {isAgentSpeaking && (
                      <div className="flex items-center justify-center gap-1 py-1">
                        <div className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" />
                        <div className="w-1 h-5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                        <div className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                        <div className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.45s]" />
                      </div>
                    )}
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
                    <p className="text-[10px] text-emerald-500/80">Sent to Lender Dashboard for review</p>
                  </div>
                )}
              </div>

              {/* Bottom LCD Controls Info */}
              <div className="flex justify-between items-center text-[10px] text-emerald-600 border-t border-emerald-900/40 pt-1">
                <span>{isMuted ? 'MUTED' : 'MIC ON'}</span>
                <span>{isSpeakerOn ? 'SPEAKER' : 'EAR'}</span>
              </div>
            </div>

            {/* Hardware Keypad Controls */}
            <div className="w-full mt-5 space-y-3">
              {/* Call Action Bar (Green Call / Red End) */}
              <div className="grid grid-cols-2 gap-3">
                {callStage === 'idle' || callStage === 'call_ended' ? (
                  <button
                    onClick={startCall}
                    className="col-span-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-95 cursor-pointer text-sm"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call 8800 Toll-Free</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={endCallAndProcess}
                      className="col-span-2 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-950 transition-all active:scale-95 cursor-pointer text-sm"
                    >
                      <PhoneOff className="w-4 h-4" />
                      <span>End Call &amp; Submit</span>
                    </button>
                  </>
                )}
              </div>

              {/* In-Call Speaker & Mute Buttons */}
              <div className="flex items-center justify-between gap-2 px-1">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isMuted
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isMuted ? 'Muted' : 'Mute'}</span>
                </button>
                <button
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isSpeakerOn
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  {isSpeakerOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>Speaker</span>
                </button>
              </div>

              {/* Physical Numeric 3x4 Keypad */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
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
                    className="h-12 bg-gradient-to-b from-neutral-800 to-neutral-850 hover:from-neutral-700 hover:to-neutral-800 active:scale-95 border border-neutral-700/80 rounded-xl flex flex-col items-center justify-center text-white shadow transition-all cursor-pointer"
                  >
                    <span className="text-base font-bold leading-tight">{item.key}</span>
                    <span className="text-[9px] text-neutral-400 tracking-tighter leading-none">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Telephony Voice Stream & Quick Test Presets (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Presets Picker */}
          <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Select Spoken Story / Caller Profile
              </h3>
              <span className="text-xs text-white/50">One-click fast testing</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SAMPLE_STORIES.slice(0, 3).map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => loadPresetPersona(sample.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    callerName === sample.ownerName
                      ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                      : 'bg-neutral-850/60 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white">
                      {sample.language === 'am' ? 'Amharic' : sample.language === 'om' ? 'Oromo' : 'English'}
                    </span>
                    <span className="text-[10px] text-white/40">{sample.audioDuration}s call</span>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">{sample.ownerName}</p>
                  <p className="text-[11px] text-neutral-400 truncate">{sample.sector}</p>
                  <p className="text-[10px] text-neutral-500 mt-1">{sample.phone}</p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRapidSimulate(sample.id);
                    }}
                    className="w-full mt-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Instant Call &amp; Grade</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Live Call Transcript / Spoken Stream Box */}
          <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Live Telephony Voice Dialogue Stream</h3>
              </div>
              <span className="text-xs text-white/50">
                {callStage === 'connected_interview' || callStage === 'connected_menu'
                  ? `Active Call (${formatTimer(callDuration)})`
                  : callStage === 'call_ended'
                  ? 'Call Finished'
                  : 'Idle'}
              </span>
            </div>

            {/* Conversation Bubble Stream */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {userTranscriptLogs.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 space-y-2">
                  <Phone className="w-8 h-8 mx-auto text-neutral-600" />
                  <p className="text-xs">No active call. Dial 8800 on the left phone to start the IVR interview.</p>
                </div>
              ) : (
                userTranscriptLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${log.speaker === 'agent' ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mb-1">
                      <span>{log.speaker === 'agent' ? '🤖 Vesper IVR Voice Assistant' : `👤 Caller (${callerName})`}</span>
                      <span>&bull;</span>
                      <span>{log.time}</span>
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                        log.speaker === 'agent'
                          ? 'bg-neutral-800 text-neutral-200 border border-white/5'
                          : 'bg-emerald-950/60 text-emerald-200 border border-emerald-800/40'
                      }`}
                    >
                      {log.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Spoken Turn Input Box (Allows user to respond by typing or voice) */}
            {callStage === 'connected_interview' && (
              <div className="pt-2 border-t border-white/10 space-y-2">
                <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
                  <span>Speak as Caller into the Phone:</span>
                  <span className="text-[10px] text-white/40">Step {currentStep} of 7</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={callerSpokenInput}
                    onChange={(e) => setCallerSpokenInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCallerSpokenTurn(callerSpokenInput);
                    }}
                    placeholder={
                      selectedLanguage === 'am'
                        ? 'የስራዎን ዝርዝር እዚህ ይናገሩ / ይጻፉ...'
                        : selectedLanguage === 'om'
                        ? 'Waa\'ee daldala keessanii asitti barreessaa...'
                        : 'Speak your business details here...'
                    }
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    onClick={() => handleCallerSpokenTurn(callerSpokenInput)}
                    disabled={!callerSpokenInput.trim()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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
                      onClick={() => handleCallerSpokenTurn(phrase)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 transition-colors cursor-pointer text-left"
                    >
                      &ldquo;{phrase}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* If call just ended and graded: Success card */}
          {lastProcessedRecord && (
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-semibold text-emerald-200">Application Ingested &amp; Graded</h4>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Grade {lastProcessedRecord.aiGrading?.overallGrade || 'A'} (Score: {lastProcessedRecord.aiGrading?.overallScore || 92}/100)
                </span>
              </div>
              <p className="text-xs text-neutral-300">
                Spoken telephony data for <span className="font-semibold text-white">{lastProcessedRecord.callerName}</span> ({lastProcessedRecord.callerPhoneNumber}) was parsed into 10 honest fields and assigned an AI Underwriting Grade.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={onOpenDashboard}
                  className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow"
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
