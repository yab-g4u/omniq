import React, { useState } from 'react';
import { Sparkles, Phone, ArrowRight, Activity, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface VesperLandingPageProps {
  onTryDemo: () => void;
  onOpenDashboard: () => void;
}

export const VesperLandingPage: React.FC<VesperLandingPageProps> = ({
  onTryDemo,
  onOpenDashboard,
}) => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

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
      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-24 text-center flex flex-col items-center justify-center min-h-[70vh]">
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
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
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
