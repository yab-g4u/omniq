import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  MapPin,
  Building2,
  TrendingUp,
  DollarSign,
  Users,
  Wrench,
  HelpCircle,
  FileCheck,
  FileText,
  Play,
  RotateCcw,
  Sparkles,
  Check,
  X,
  ExternalLink,
  MessageSquare,
  Activity,
  Layers,
  ArrowRight,
  Eye,
  Shield,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { IVRCallRecord } from '../types';
import {
  aguiLayer,
  AGUIEvent,
  ApplicantIntelligenceState,
  Claim,
  ReviewItem,
} from '../lib/aguiEventLayer';

interface LenderPortalProps {
  calls: IVRCallRecord[];
  onOpenIVRSimulator: () => void;
  onOpenSpike: () => void;
  onUpdateCallDecision: (callId: string, decision: any) => void;
}

export const LenderPortal: React.FC<LenderPortalProps> = ({
  calls,
  onOpenIVRSimulator,
  onOpenSpike,
  onUpdateCallDecision,
}) => {
  const [aguiState, setAguiState] = useState<ApplicantIntelligenceState>(aguiLayer.getState());
  const [transcriptMessages, setTranscriptMessages] = useState<
    { id: string; speaker: 'USER' | 'AI'; text: string; isFinal?: boolean }[]
  >([]);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [funderActionToast, setFunderActionToast] = useState<string | null>(null);
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [lastEventName, setLastEventName] = useState<string>('RUN_STARTED');

  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const demoTimerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Subscribe to AG-UI Event Protocol Layer
  useEffect(() => {
    const unsubscribe = aguiLayer.subscribe((event: AGUIEvent, updatedState: ApplicantIntelligenceState) => {
      setAguiState({ ...updatedState });
      setLastEventName(event.type);

      if (event.type === 'TEXT_MESSAGE_START' && event.messageId) {
        setTranscriptMessages((prev) => [
          ...prev.filter((m) => m.id !== event.messageId),
          {
            id: event.messageId!,
            speaker: event.speaker === 'user' ? 'USER' : 'AI',
            text: '...',
            isFinal: false,
          },
        ]);
      } else if (event.type === 'TEXT_MESSAGE_CONTENT' && event.messageId && event.content) {
        setTranscriptMessages((prev) =>
          prev.map((m) => (m.id === event.messageId ? { ...m, text: event.content!, isFinal: false } : m))
        );
      } else if (event.type === 'TEXT_MESSAGE_END' && event.messageId && event.content) {
        setTranscriptMessages((prev) =>
          prev.map((m) => (m.id === event.messageId ? { ...m, text: event.content!, isFinal: true } : m))
        );
      }
    });

    return () => unsubscribe();
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptMessages, aguiState.activeStatus]);

  // Clean timers on unmount
  useEffect(() => {
    return () => {
      demoTimerRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  // Handle Deterministic Demo Mode Execution emitting AG-UI Events
  const runDemoSequence = () => {
    demoTimerRef.current.forEach((t) => clearTimeout(t));
    demoTimerRef.current = [];

    setTranscriptMessages([]);
    aguiLayer.reset();
    setIsDemoRunning(true);
    aguiLayer.startRun(`demo-${Date.now()}`);

    const addTimer = (fn: () => void, delayMs: number) => {
      const t = setTimeout(fn, delayMs);
      demoTimerRef.current.push(t);
    };

    // Step 1: User greets and states name, business, location
    addTimer(() => {
      aguiLayer.emitTextMessageStart('demo-1', 'user');
      aguiLayer.emitTextMessageContent('demo-1', 'user', "My name is Hana.");
    }, 600);

    addTimer(() => {
      aguiLayer.emitTextMessageContent('demo-1', 'user', "My name is Hana. I run Hana's Bakery in Bole.");
    }, 1400);

    addTimer(() => {
      aguiLayer.emitTextMessageEnd('demo-1', 'user', "My name is Hana. I run Hana's Bakery in Bole.");
    }, 2200);

    // Step 2: AI asks years operating
    addTimer(() => {
      aguiLayer.emitTextMessageStart('demo-2', 'assistant');
      aguiLayer.emitTextMessageContent('demo-2', 'assistant', "How long have you been operating the bakery?");
      aguiLayer.emitTextMessageEnd('demo-2', 'assistant', "How long have you been operating the bakery?");
    }, 3600);

    // Step 3: User states 7 years operating
    addTimer(() => {
      aguiLayer.emitTextMessageStart('demo-3', 'user');
      aguiLayer.emitTextMessageContent('demo-3', 'user', "We've been operating...");
    }, 5000);

    addTimer(() => {
      aguiLayer.emitTextMessageContent('demo-3', 'user', "We've been operating for seven years.");
      aguiLayer.emitTextMessageEnd('demo-3', 'user', "We've been operating for seven years.");
    }, 6400);

    // Step 4: AI asks workforce count
    addTimer(() => {
      aguiLayer.emitTextMessageStart('demo-4', 'assistant');
      aguiLayer.emitTextMessageContent('demo-4', 'assistant', "And how many people currently work in the business?");
      aguiLayer.emitTextMessageEnd('demo-4', 'assistant', "And how many people currently work in the business?");
    }, 7800);

    // Step 5: User states 6 employees (and later correction to 8 employees)
    addTimer(() => {
      aguiLayer.emitTextMessageStart('demo-5', 'user');
      aguiLayer.emitTextMessageContent('demo-5', 'user', "We currently have six employees.");
      aguiLayer.emitTextMessageEnd('demo-5', 'user', "We currently have six employees.");
    }, 9400);

    // Step 6: User corrects employee count to 8 employees
    addTimer(() => {
      aguiLayer.emitTextMessageStart('demo-6', 'user');
      aguiLayer.emitTextMessageContent('demo-6', 'user', "Actually, sorry, we have eight employees now.");
      aguiLayer.emitTextMessageEnd('demo-6', 'user', "Actually, sorry, we have eight employees now.");
    }, 11200);

    // Step 7: AI asks funding purpose & amount
    addTimer(() => {
      aguiLayer.emitTextMessageStart('demo-7', 'assistant');
      aguiLayer.emitTextMessageContent('demo-7', 'assistant', "What are you hoping to use the funding for?");
      aguiLayer.emitTextMessageEnd('demo-7', 'assistant', "What are you hoping to use the funding for?");
    }, 12800);

    // Step 8: User states 250,000 birr for commercial baking equipment
    addTimer(() => {
      aguiLayer.emitTextMessageStart('demo-8', 'user');
      aguiLayer.emitTextMessageContent('demo-8', 'user', "We want 250,000 birr to buy a larger commercial oven.");
      aguiLayer.emitTextMessageEnd('demo-8', 'user', "We want 250,000 birr to buy a larger commercial oven.");
    }, 14500);

    // Step 9: AI asks job creation
    addTimer(() => {
      aguiLayer.emitTextMessageStart('demo-9', 'assistant');
      aguiLayer.emitTextMessageContent('demo-9', 'assistant', "How many additional jobs do you expect the expansion to create?");
      aguiLayer.emitTextMessageEnd('demo-9', 'assistant', "How many additional jobs do you expect the expansion to create?");
    }, 16200);

    // Step 10: User states 3 jobs created & Run Finishes
    addTimer(() => {
      aguiLayer.emitTextMessageStart('demo-10', 'user');
      aguiLayer.emitTextMessageContent('demo-10', 'user', "We expect to create three more jobs.");
      aguiLayer.emitTextMessageEnd('demo-10', 'user', "We expect to create three more jobs.");
    }, 18000);

    addTimer(() => {
      setIsDemoRunning(false);
      aguiLayer.endRun();
      confetti({ particleCount: 65, spread: 60, origin: { y: 0.6 } });
    }, 19500);
  };

  // Reset state
  const resetDemoState = () => {
    demoTimerRef.current.forEach((t) => clearTimeout(t));
    demoTimerRef.current = [];
    setTranscriptMessages([]);
    setHighlightedMsgId(null);
    setIsDemoRunning(false);
    aguiLayer.reset();
  };

  const handleFunderAction = (actionText: string) => {
    setFunderActionToast(actionText);
    setTimeout(() => setFunderActionToast(null), 4000);
  };

  // Jump/Highlight transcript line when evidence clicked
  const handleJumpToEvidence = (msgId?: string) => {
    if (!msgId) return;
    setHighlightedMsgId(msgId);
    const elem = document.getElementById(`msg-${msgId}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-white p-4 sm:p-6 lg:p-8">
      {/* Toast Alert */}
      {funderActionToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-950 border border-emerald-500/40 text-emerald-100 p-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-md animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold">{funderActionToast}</p>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Control Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0c0c12] p-5 rounded-2xl border border-white/10 shadow-xl">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                VESPER APPLICANT INTELLIGENCE
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono">
                AG-UI Event Layer Active
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Event-driven protocol streaming live transcript events &rarr; state claims &rarr; evidence-backed funder interface.
            </p>
          </div>

          {/* DEMO CONTROLS */}
          <div className="flex items-center gap-3">
            <button
              onClick={runDemoSequence}
              disabled={isDemoRunning}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                isDemoRunning
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950 ring-2 ring-emerald-400/40'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isDemoRunning ? 'RUNNING DEMO...' : 'RUN DEMO'}</span>
            </button>

            <button
              onClick={resetDemoState}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold border border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET DEMO</span>
            </button>
          </div>
        </div>

        {/* AG-UI EVENT PROTOCOL LIVE STATUS STRIP */}
        <div className="bg-[#0b0b10] border border-white/10 p-3.5 rounded-2xl flex items-center justify-between overflow-x-auto gap-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-neutral-300 font-mono">AG-UI STATUS:</span>
            <span className="text-emerald-400 font-extrabold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              {aguiState.activeStatus}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] text-purple-300">
            <span>LAST AG-UI EVENT:</span>
            <span className="bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30 font-bold">
              {lastEventName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-400">LISTENING</span>
            <span>&rarr;</span>
            <span className="text-neutral-400">TRANSCRIBING</span>
            <span>&rarr;</span>
            <span className="text-neutral-400">CLAIM DETECTED</span>
            <span>&rarr;</span>
            <span className="text-emerald-400">STRUCTURED EVIDENCE</span>
          </div>
        </div>

        {/* APPLICATION READINESS & ELIGIBILITY */}
        <div className="bg-[#0e0e16] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 block mb-1">
                APPLICATION READINESS
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-white tracking-tight">
                  {aguiState.completeness}%
                </span>
                <span className="text-xs text-neutral-400">Information Completeness Score</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full sm:w-80 bg-neutral-900 h-2.5 rounded-full mt-3 overflow-hidden border border-white/10">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-700 ease-out"
                  style={{ width: `${aguiState.completeness}%` }}
                />
              </div>
            </div>

            {/* AUTOMATED ELIGIBILITY CHECK */}
            <div className="bg-[#12121c] p-4 rounded-xl border border-white/10 space-y-2 min-w-[280px]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">
                ELIGIBILITY CHECK (DETERMINISTIC)
              </span>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  {aguiState.eligibility.registeredInEthiopia ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-neutral-600 flex items-center justify-center text-[10px] text-neutral-500">&bull;</span>
                  )}
                  <span className={aguiState.eligibility.registeredInEthiopia ? 'text-emerald-300 font-semibold' : 'text-neutral-500'}>
                    Business registered in Ethiopia
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {aguiState.eligibility.yearsRequirementPassed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-neutral-600 flex items-center justify-center text-[10px] text-neutral-500">&bull;</span>
                  )}
                  <span className={aguiState.eligibility.yearsRequirementPassed ? 'text-emerald-300 font-semibold' : 'text-neutral-500'}>
                    Operating for 2+ years
                  </span>
                </div>
              </div>

              {aguiState.eligibility.eligible ? (
                <div className="mt-2 text-center text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 py-1 rounded-md border border-emerald-500/30">
                  ✓ ELIGIBLE
                </div>
              ) : (
                <div className="mt-2 text-center text-[11px] font-semibold text-neutral-500 py-1">
                  Awaiting eligibility confirmation...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MAIN DISPLAY GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 7 COLS: Live Conversation Transcript & Structured Claims */}
          <div className="lg:col-span-7 space-y-6">
            {/* LIVE CONVERSATION TRANSCRIPT STREAM */}
            <div className="bg-[#0c0c12] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold tracking-wide uppercase text-neutral-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  LIVE CONVERSATION (AG-UI STREAM)
                </h3>
                <span className="text-xs text-neutral-400 font-mono">
                  {aguiState.activeStatus}
                </span>
              </div>

              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                {transcriptMessages.length === 0 ? (
                  <div className="py-12 text-center text-neutral-600 text-xs italic">
                    Click RUN DEMO or speak into your microphone to view live AG-UI streaming transcription.
                  </div>
                ) : (
                  transcriptMessages.map((msg) => {
                    const isUser = msg.speaker === 'USER';
                    const isHighlighted = highlightedMsgId === msg.id;
                    return (
                      <div
                        key={msg.id}
                        id={`msg-${msg.id}`}
                        className={`p-3.5 rounded-xl border text-xs leading-relaxed transition-all ${
                          isHighlighted
                            ? 'bg-amber-950/80 border-amber-400 text-amber-100 ring-2 ring-amber-400/60 scale-[1.01]'
                            : isUser
                            ? 'bg-[#151222] border-purple-500/30 text-purple-100'
                            : 'bg-[#0f1713] border-emerald-500/30 text-emerald-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[10px] uppercase opacity-70">
                            {isUser ? 'APPLICANT' : 'VESPER AI'}
                          </span>
                          {!msg.isFinal && (
                            <span className="text-[9px] font-bold text-amber-400 animate-pulse">
                              ● TRANSCRIBING...
                            </span>
                          )}
                        </div>
                        {msg.text}
                      </div>
                    );
                  })
                )}
                <div ref={transcriptEndRef} />
              </div>
            </div>

            {/* STRUCTURED CLAIMS & TRACEABLE EVIDENCE */}
            <div className="bg-[#0c0c12] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold tracking-wide uppercase text-neutral-300">
                  STRUCTURED CLAIMS &amp; EVIDENCE PROVENANCE
                </h3>
              </div>

              {/* Field Rows */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: 'BUSINESS', claim: aguiState.businessName },
                  { label: 'SECTOR', claim: aguiState.sector },
                  { label: 'LOCATION', claim: aguiState.location },
                  { label: 'YEARS OPERATING', claim: aguiState.yearsOperating },
                  { label: 'EMPLOYEES', claim: aguiState.employees },
                  { label: 'REVENUE', claim: aguiState.revenue },
                  { label: 'FUNDING PURPOSE', claim: aguiState.fundingPurpose },
                  { label: 'AMOUNT REQUESTED', claim: aguiState.amountRequested },
                  { label: 'EXPECTED JOBS CREATED', claim: aguiState.jobsCreated },
                ].map((item, idx) => {
                  const claim = item.claim;
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition-all duration-500 ${
                        claim?.value
                          ? 'bg-[#12121d] border-emerald-500/30 shadow-lg shadow-emerald-950/20'
                          : 'bg-[#0f0f15] border-white/5 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          {item.label}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          claim?.status === 'verified'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : claim?.value
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-neutral-800 text-neutral-500'
                        }`}>
                          {claim?.status === 'verified'
                            ? 'VERIFIED'
                            : claim?.value
                            ? 'REPORTED BY BUSINESS OWNER'
                            : 'MISSING / UNKNOWN'}
                        </span>
                      </div>

                      {claim?.value ? (
                        <div className="space-y-1.5">
                          <div className="text-xs font-extrabold text-white flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              {claim.value}
                            </span>
                            {claim.supersededValue && (
                              <span className="text-[9px] text-amber-400 line-through opacity-70">
                                prev: {claim.supersededValue}
                              </span>
                            )}
                          </div>

                          {claim.evidence?.text && (
                            <button
                              onClick={() => handleJumpToEvidence(claim.evidence?.messageId)}
                              className="text-[11px] text-emerald-300/90 italic bg-emerald-950/50 p-2 rounded-lg border border-emerald-500/20 w-full text-left flex items-start gap-1.5 hover:border-emerald-400 transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                              <span>SOURCE: &ldquo;{claim.evidence.text}&rdquo;</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs font-mono text-neutral-600 italic">
                          &mdash; (Missing / Unstated)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: Review Intelligence, Next Best Question, & Post-Call Review */}
          <div className="lg:col-span-5 space-y-6">
            {/* REVIEW INTELLIGENCE & WARN FLAGS */}
            <div className="bg-[#0c0c12] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold tracking-wide uppercase text-neutral-300">
                  REVIEW INTELLIGENCE
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                {aguiState.reviewItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border font-semibold ${
                      item.type === 'satisfied'
                        ? 'text-emerald-300 bg-emerald-950/40 border-emerald-500/30'
                        : 'text-amber-300 bg-amber-950/40 border-amber-500/30'
                    }`}
                  >
                    {item.type === 'satisfied' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span>{item.message}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* NEXT BEST QUESTION RECOMMENDATION */}
            <div className="bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/40 p-4 rounded-2xl space-y-2 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" />
                NEXT BEST QUESTION
              </div>

              <p className="text-xs font-semibold text-white italic">
                &ldquo;{aguiState.nextBestQuestion || 'Approximately how much revenue does the business generate in a typical year?'}&rdquo;
              </p>
              <p className="text-[11px] text-neutral-400">
                Recommended follow-up query based on current claim coverage.
              </p>
            </div>

            {/* APPLICATION READY FOR REVIEW & HUMAN DECISION */}
            <div className="bg-[#0c0c12] border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-wide uppercase text-neutral-300">
                  APPLICATION READY FOR REVIEW
                </h3>
                {aguiState.activeStatus === 'REVIEW_READY' && (
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                    COMPLETE
                  </span>
                )}
              </div>

              {/* Profile Brief Bullets */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded-lg bg-[#14141f]">
                  <span className="text-neutral-400">Applicant</span>
                  <span className="font-bold text-white">Hana Bekele</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-[#14141f]">
                  <span className="text-neutral-400">Business</span>
                  <span className="font-bold text-white">{aguiState.businessName?.value || "Hana's Bakery"}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-[#14141f]">
                  <span className="text-neutral-400">Profile</span>
                  <span className="font-semibold text-neutral-200">
                    {aguiState.sector?.value || 'Food & Manufacturing'} &bull; {aguiState.location?.value || 'Bole'} &bull; {aguiState.yearsOperating?.value || '7 yrs'} &bull; {aguiState.employees?.value || '8 employees'}
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-[#14141f]">
                  <span className="text-neutral-400">Funding Request</span>
                  <span className="font-extrabold text-purple-300">{aguiState.amountRequested?.value || '250,000 ETB'}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-[#14141f]">
                  <span className="text-neutral-400">Purpose</span>
                  <span className="font-semibold text-white">{aguiState.fundingPurpose?.value || 'Commercial baking equipment and expansion'}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-[#14141f]">
                  <span className="text-neutral-400">Expected Impact</span>
                  <span className="font-bold text-emerald-400">{aguiState.jobsCreated?.value || '3 additional jobs'}</span>
                </div>
              </div>

              {/* AI Summary Text */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                  AI Summary
                </span>
                <p className="text-xs text-neutral-300 leading-relaxed bg-[#12121a] p-3.5 rounded-xl border border-white/10">
                  {aguiState.businessName?.value
                    ? `${aguiState.businessName.value} is an established bakery in ${aguiState.location?.value || 'Bole'} that has operated for ${aguiState.yearsOperating?.value || '7 years'} and currently employs ${aguiState.employees?.value || '8'} people. The applicant is requesting ${aguiState.amountRequested?.value || '250,000 ETB'} for ${aguiState.fundingPurpose?.value || 'commercial baking equipment and expansion'} and expects the expansion to create ${aguiState.jobsCreated?.value || '3 additional jobs'}.`
                    : 'Awaiting completion of applicant conversation...'}
                </p>
              </div>

              {/* HUMAN DECISION BANNER (NO AUTOMATIC APPROVE/REJECT) */}
              <div className="pt-3 border-t border-white/10 space-y-3">
                <div className="bg-[#12121d] p-3 rounded-xl border border-emerald-500/30 text-center space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                    VESPER PREPARED THE EVIDENCE
                  </span>
                  <span className="text-[11px] font-bold text-white block">
                    THE FUNDER MAKES THE DECISION
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => handleFunderAction('Verification Request Dispatched to Field Team')}
                    className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold border border-white/15 cursor-pointer"
                  >
                    [ Request Verification ]
                  </button>

                  <button
                    onClick={() => handleFunderAction('Follow-up Question Sent to Business Owner')}
                    className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold border border-white/15 cursor-pointer"
                  >
                    [ Ask Follow-up ]
                  </button>

                  <button
                    onClick={() => handleFunderAction('Proceeded to Committee Credit Review Memorandum')}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 cursor-pointer"
                  >
                    [ Continue Review ]
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
