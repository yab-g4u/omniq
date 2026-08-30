import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Phone,
  ArrowRight,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Play,
  RotateCcw,
  MessageSquare,
  Zap,
} from 'lucide-react';

interface VesperLandingPageProps {
  onTryDemo: () => void;
  onOpenDashboard: () => void;
}

interface DemoStep {
  transcript: { speaker: 'USER' | 'AI'; text: string };
  extractionNote: string;
  fieldKey: string;
  fieldValue: string;
  quote: string;
  completeness: number;
}

const DEMO_STEPS: DemoStep[] = [
  {
    transcript: { speaker: 'USER', text: "Hello, my name is Hana. I run a small bakery called Hana's Bakery in Bole." },
    extractionNote: "Business & Location detected",
    fieldKey: "Business & Location",
    fieldValue: "Hana's Bakery (Bole, Addis Ababa)",
    quote: "I run a small bakery called Hana's Bakery in Bole.",
    completeness: 20,
  },
  {
    transcript: { speaker: 'AI', text: "Nice to meet you, Hana. How long have you been operating the bakery?" },
    extractionNote: "AI asking operating longevity...",
    fieldKey: "Longevity Query",
    fieldValue: "Interview in progress",
    quote: "",
    completeness: 20,
  },
  {
    transcript: { speaker: 'USER', text: "We've been operating for about four years now." },
    extractionNote: "Operating history confirmed",
    fieldKey: "Years Operating",
    fieldValue: "4 Years (Confirmed)",
    quote: "We've been operating for about four years now.",
    completeness: 35,
  },
  {
    transcript: { speaker: 'AI', text: "That's great. And how many people currently work in the business?" },
    extractionNote: "AI querying workforce size...",
    fieldKey: "Workforce Query",
    fieldValue: "Interview in progress",
    quote: "",
    completeness: 35,
  },
  {
    transcript: { speaker: 'USER', text: "We have six employees." },
    extractionNote: "Workforce size detected",
    fieldKey: "Employees",
    fieldValue: "6 Employees",
    quote: "We have six employees.",
    completeness: 55,
  },
  {
    transcript: { speaker: 'USER', text: "We want to buy a larger commercial oven for 250,000 birr." },
    extractionNote: "Funding purpose & requested loan amount detected",
    fieldKey: "Loan Amount & Purpose",
    fieldValue: "250,000 ETB &bull; Commercial Baking Equipment",
    quote: "We want to buy a larger commercial oven for 250,000 birr.",
    completeness: 82,
  },
];

export const VesperLandingPage: React.FC<VesperLandingPageProps> = ({
  onTryDemo,
  onOpenDashboard,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Auto-play demo step animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % DEMO_STEPS.length);
    }, 3200);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const activeStep = DEMO_STEPS[currentStepIndex];

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-white/20 selection:text-white relative overflow-x-hidden">
      {/* Background Radial Scrim & Grain */}
      <div className="fixed inset-0 pointer-events-none opacity-30 bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:4px_4px] z-[100]" />
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(45,45,45,0.45)_0%,rgba(10,10,10,0.9)_60%,#000000_100%)]" />

      {/* Header */}
      <header className="relative z-50 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        {/* Logo */}
        <div
          onClick={onTryDemo}
          className="inline-flex items-center gap-2.5 cursor-pointer text-white font-semibold text-base tracking-tight"
        >
          <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
            <g transform="rotate(-30 12 12)">
              <circle cx="7.3" cy="3.2" r="1.45" />
              <rect x="5.5" y="4.7" width="3.6" height="14.6" rx="1.8" />
              <rect x="14.9" y="4.7" width="3.6" height="14.6" rx="1.8" />
              <circle cx="16.7" cy="20.8" r="1.45" />
            </g>
          </svg>
          <span>Vesper<span className="font-normal text-neutral-400">.ai</span></span>
        </div>

        {/* Center Nav Pills */}
        <nav className="hidden md:flex items-center gap-2">
          {['Benefits', 'How It Works', 'FAQs', 'Pricing'].map((item, idx) => (
            <button
              key={idx}
              onClick={onTryDemo}
              className="h-10 px-4 rounded-lg border border-neutral-600/50 bg-gradient-to-r from-[#050505] via-[#2a2a2a] to-[#4a4a4a] text-neutral-200 text-xs font-medium hover:border-neutral-200 transition-all cursor-pointer shadow-sm hover:shadow-white/10"
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Right CTA Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onTryDemo}
            className="h-10 px-5 rounded-lg bg-gradient-to-b from-white via-neutral-200 to-neutral-300 text-neutral-900 font-bold text-xs hover:from-white hover:to-neutral-100 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <span>Try Demo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-16 text-center flex flex-col items-center justify-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-neutral-600 via-neutral-800 to-neutral-950 text-neutral-200 text-xs font-normal border border-white/10 mb-6 shadow-xl">
          <svg className="w-4 h-4 text-white fill-current shadow-sm" viewBox="0 0 24 24">
            <path d="M12 2.6C12.55 2.6 12.88 3.15 13.08 4.7c.62 4.7 1.52 5.6 6.22 6.22 1.55.2 2.1.53 2.1 1.08s-.55.88-2.1 1.08c-4.7.62-5.6 1.52-6.22 6.22-.2 1.55-.53 2.1-1.08 2.1s-.88-.55-1.08-2.1c-.62-4.7-1.52-5.6-6.22-6.22C3.15 12.88 2.6 12.55 2.6 12s.55-.88 2.1-1.08c4.7-.62 5.6-1.52 6.22-6.22C11.12 3.15 11.45 2.6 12 2.6Z" />
          </svg>
          Operational AI Infrastructure
        </div>

        {/* H1 Headline */}
        <h1 className="text-4xl sm:text-6xl font-medium tracking-tight text-white leading-tight mb-6">
          Train <em className="font-serif italic font-normal text-neutral-400 not-italic">AI agents</em> on your<br />
          workflows in minutes.
        </h1>

        {/* Lede Text */}
        <p className="text-base sm:text-lg text-neutral-400 max-w-xl mx-auto leading-relaxed mb-8">
          Deploy adaptive AI agents that learn, execute, and scale operational tasks across your business.
        </p>

        {/* Hero Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mb-12">
          <button
            onClick={onTryDemo}
            className="w-full sm:w-auto h-11 px-8 rounded-lg bg-gradient-to-b from-white via-neutral-100 to-neutral-300 text-neutral-900 font-bold text-sm hover:from-white hover:to-neutral-100 transition-all shadow-xl shadow-white/10 cursor-pointer flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Try Voice Demo</span>
          </button>

          <button
            onClick={onOpenDashboard}
            className="w-full sm:w-auto h-11 px-6 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-sm border border-white/20 backdrop-blur-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>See Applicant Intelligence</span>
          </button>
        </div>

        {/* AUTOMATED DEMO CONTAINER (BELOW HERO) */}
        <div className="w-full max-w-4xl bg-[#0a0a12]/90 border border-white/15 rounded-2xl p-6 shadow-2xl text-left relative overflow-hidden backdrop-blur-xl">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                  AUTOMATED DEMO &mdash; LIVE APPLICATION CONSTRUCTING ITSELF
                </h3>
                <p className="text-xs text-neutral-400">
                  Real-time voice extraction transforming spoken conversation into structured credit packages
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-neutral-200 border border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isPlaying ? <span className="text-emerald-400">● Live Auto-Play</span> : <span>Paused</span>}
              </button>
              <button
                onClick={onOpenDashboard}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-950 flex items-center gap-1 cursor-pointer"
              >
                <span>RUN FULL DEMO</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Active Demo Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left: Animated Transcript Feed (6 cols) */}
            <div className="md:col-span-6 bg-[#11111a] p-4 rounded-xl border border-white/10 flex flex-col justify-between h-[240px]">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                    SPOKEN TRANSCRIPT STREAM
                  </span>
                  <span className="text-[10px] font-mono text-purple-400">Step {currentStepIndex + 1} of {DEMO_STEPS.length}</span>
                </div>

                <div className="space-y-2">
                  <div
                    key={currentStepIndex}
                    className={`p-3 rounded-lg text-xs leading-relaxed transition-all duration-500 animate-fadeIn ${
                      activeStep.transcript.speaker === 'USER'
                        ? 'bg-[#181427] border border-purple-500/30 text-purple-100'
                        : 'bg-[#0f1914] border border-emerald-500/30 text-emerald-100'
                    }`}
                  >
                    <span className="font-bold text-[10px] uppercase block mb-1 opacity-70">
                      {activeStep.transcript.speaker === 'USER' ? 'APPLICANT' : 'AI ASSISTANT'}
                    </span>
                    &ldquo;{activeStep.transcript.text}&rdquo;
                  </div>

                  {activeStep.extractionNote && (
                    <div className="text-[11px] text-amber-300 font-mono flex items-center gap-1.5 animate-pulse pl-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>{activeStep.extractionNote}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step indicator dots */}
              <div className="flex items-center justify-center gap-1.5 pt-2">
                {DEMO_STEPS.map((_, idx) => (
                  <span
                    key={idx}
                    onClick={() => {
                      setCurrentStepIndex(idx);
                      setIsPlaying(false);
                    }}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === currentStepIndex ? 'w-6 bg-emerald-400' : 'w-1.5 bg-neutral-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Right: Live Application Fields & Progress (6 cols) */}
            <div className="md:col-span-6 bg-[#11111a] p-4 rounded-xl border border-white/10 flex flex-col justify-between h-[240px]">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    APPLICATION COMPLETENESS
                  </span>
                  <span className="text-base font-extrabold text-emerald-400">
                    {activeStep.completeness}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-neutral-800 h-2 rounded-full mb-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-700"
                    style={{ width: `${activeStep.completeness}%` }}
                  />
                </div>

                {/* Detected Cards */}
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-[#181824] border border-emerald-500/30">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">
                      DETECTED FIELD
                    </span>
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>{activeStep.fieldKey}</span>
                      <span className="text-emerald-400 font-semibold">{activeStep.fieldValue}</span>
                    </div>
                  </div>

                  {activeStep.quote && (
                    <div className="text-[10px] text-emerald-300 italic bg-emerald-950/40 p-2 rounded border border-emerald-500/20">
                      SOURCE: &ldquo;{activeStep.quote}&rdquo;
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-[10px] text-neutral-400">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Traceable Provenance
                </span>
                <span>Click RUN FULL DEMO to interact live</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Stats Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 px-6 max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-neutral-300 text-xs font-medium">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span>4.2M+ workflows automated</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-white flex items-center justify-center text-black">
            <CheckCircle2 className="w-3.5 h-3.5 text-black" />
          </div>
          <span>92% reduction in manual operations</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-5 h-5 rounded-full bg-neutral-700 border border-black" />
            <div className="w-5 h-5 rounded-full bg-white border border-black" />
            <div className="w-5 h-5 rounded-full bg-orange-500 border border-black text-[9px] font-bold text-white flex items-center justify-center">e</div>
          </div>
          <span>180+ operational teams onboarded</span>
        </div>
      </footer>
    </div>
  );
};
