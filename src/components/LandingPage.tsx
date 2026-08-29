import React, { useState, useEffect } from 'react';
import { Language } from '../types';

interface LandingPageProps {
  onStartVoiceApp: () => void;
  onOpenSpike: () => void;
  onSelectLanguage: (lang: Language) => void;
  currentLanguage: Language;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartVoiceApp,
  onOpenSpike,
  onSelectLanguage,
  currentLanguage,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Animation fallback listener
    const appearEls = document.querySelectorAll('.appear');
    appearEls.forEach((el) => {
      el.addEventListener(
        'animationend',
        () => {
          el.classList.add('is-in');
        },
        { once: true }
      );
    });

    const timer = setTimeout(() => {
      appearEls.forEach((el) => {
        el.classList.add('is-in');
      });
    }, 2200);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-black text-white overflow-hidden flex flex-col justify-between selection:bg-white/25 selection:text-white">
      {/* Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-80 scale-105 filter brightness-90"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260818_072341_50851634-bbc3-4c33-9acc-7647d4db44aa.mp4"
            type="video/mp4"
          />
        </video>
        {/* Subtle scrim overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 pointer-events-none" />
      </div>

      {/* Mobile Menu Backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-2xl transition-all duration-300 md:hidden flex flex-col items-center justify-center p-6"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="flex flex-col items-center gap-4 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onStartVoiceApp();
              }}
              className="w-full py-4 text-center text-lg font-medium liquid-pill text-white"
            >
              Start Voice Intake
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onOpenSpike();
              }}
              className="w-full py-4 text-center text-lg font-medium liquid-pill text-white"
            >
              Language Spike (Amharic / Oromo)
            </button>
            <a
              href="#how-it-works"
              onClick={() => setIsMenuOpen(false)}
              className="w-full py-4 text-center text-lg font-medium liquid-pill text-white"
            >
              Honest Extraction Principles
            </a>
            <div className="flex gap-2 mt-4 pt-4 border-t border-white/10 w-full justify-center">
              {(['am', 'om', 'en'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    onSelectLanguage(l);
                    setIsMenuOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded text-xs uppercase font-mono ${
                    currentLanguage === l
                      ? 'bg-white text-black font-bold'
                      : 'bg-white/10 text-white/70'
                  }`}
                >
                  {l === 'am' ? 'አማርኛ' : l === 'om' ? 'Oromo' : 'EN'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header
        className="relative z-30 w-full px-6 sm:px-10 lg:px-12 pt-6 pb-2 flex items-center justify-between"
        style={{ padding: 'var(--header-y) var(--header-x) 10px' }}
      >
        {/* Left - Logo */}
        <div className="flex items-center gap-3">
          <a
            href="#top"
            aria-label="Vesper.ai"
            className="appear appear--scale inline-flex items-center gap-2.5 text-[15.5px] font-semibold tracking-tight text-white hover:opacity-90 transition-opacity"
            style={{ ['--d' as any]: '0.08s' }}
          >
            {/* Mark SVG 22x22 */}
            <svg
              className="w-[22px] h-[22px] text-white flex-shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <g transform="rotate(-30 12 12)">
                <circle cx="7.3" cy="3.2" r="1.45" />
                <rect x="5.5" y="4.7" width="3.6" height="14.6" rx="1.8" />
                <rect x="14.9" y="4.7" width="3.6" height="14.6" rx="1.8" />
                <circle cx="16.7" cy="20.8" r="1.45" />
              </g>
            </svg>
            <span>
              Vesper<span className="font-normal text-white/70">.ai</span>
            </span>
          </a>

          {/* Language selector chip */}
          <div className="hidden lg:flex items-center gap-1 ml-4 pl-3 border-l border-white/20">
            {(['am', 'om', 'en'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => onSelectLanguage(l)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  currentLanguage === l
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {l === 'am' ? 'አማርኛ' : l === 'om' ? 'Afaan Oromoo' : 'EN'}
              </button>
            ))}
          </div>
        </div>

        {/* Center - Nav Links (Desktop) */}
        <nav id="site-nav" aria-label="Primary" className="hidden md:flex items-center gap-2">
          <button
            onClick={onStartVoiceApp}
            className="appear appear--scale liquid-pill text-[13.5px] cursor-pointer"
            style={{ ['--d' as any]: '0.16s' }}
          >
            Voice Intake Agent
          </button>
          <button
            onClick={onOpenSpike}
            className="appear appear--soft liquid-pill text-[13.5px] cursor-pointer"
            style={{ ['--d' as any]: '0.28s' }}
          >
            Amharic &amp; Oromo Spike
          </button>
          <a
            href="#honest-rules"
            onClick={(e) => {
              e.preventDefault();
              onStartVoiceApp();
            }}
            className="appear appear--scale liquid-pill text-[13.5px]"
            style={{ ['--d' as any]: '0.40s' }}
          >
            Honest Principles
          </a>
          <a
            href="#pricing"
            onClick={(e) => {
              e.preventDefault();
              onStartVoiceApp();
            }}
            className="appear appear--soft liquid-pill text-[13.5px]"
            style={{ ['--d' as any]: '0.52s' }}
          >
            Phase 1 Pipeline
          </a>
        </nav>

        {/* Right - Header CTA & Burger */}
        <div className="flex items-center gap-3">
          <button
            onClick={onStartVoiceApp}
            className="appear appear--scale vesper-btn vesper-btn-solid text-[13.5px] font-semibold"
            style={{ ['--d' as any]: '0.34s' }}
          >
            Start Voice Intake
          </button>

          {/* Burger on Mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-md border border-white/20 bg-black/60 text-white gap-1.5 p-2 focus:outline-none"
            aria-label="Toggle menu"
          >
            <span
              className={`w-4 h-[1.5px] bg-white rounded-sm transition-transform duration-200 ${
                isMenuOpen ? 'translate-y-[7.5px] rotate-45' : ''
              }`}
            />
            <span
              className={`w-4 h-[1.5px] bg-white rounded-sm transition-opacity duration-200 ${
                isMenuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`w-4 h-[1.5px] bg-white rounded-sm transition-transform duration-200 ${
                isMenuOpen ? '-translate-y-[7.5px] -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </header>

      {/* Main Hero (Bottom-centered) */}
      <main
        id="top"
        className="relative z-20 flex-1 flex flex-col justify-end items-center text-center px-4 sm:px-6 max-w-[960px] mx-auto w-full pb-16 md:pb-24 pt-12"
      >
        <div className="flex flex-col items-center w-full">
          {/* Badge */}
          <div
            className="appear appear--pop vesper-badge cursor-default"
            style={{ ['--d' as any]: '0.22s' }}
          >
            <svg
              className="badge-star w-[18px] h-[20px] text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.45))' }}
            >
              <path d="M12 2.6C12.55 2.6 12.88 3.15 13.08 4.7c.62 4.7 1.52 5.6 6.22 6.22 1.55.2 2.1.53 2.1 1.08s-.55.88-2.1 1.08c-4.7.62-5.6 1.52-6.22 6.22-.2 1.55-.53 2.1-1.08 2.1s-.88-.55-1.08-2.1c-.62-4.7-1.52-5.6-6.22-6.22C3.15 12.88 2.6 12.55 2.6 12s.55-.88 2.1-1.08c4.7-.62 5.6-1.52 6.22-6.22C11.12 3.15 11.45 2.6 12 2.6Z" />
            </svg>
            <span className="text-[12.5px] text-white/90 font-medium">
              Operational AI Infrastructure &bull; Honest Voice Intake
            </span>
          </div>

          {/* H1 Two Masked Lines */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-medium tracking-tight text-white leading-[1.12] mb-3">
            <span
              className="headline-line appear appear--mask"
              style={{ ['--d' as any]: '0.42s' }}
            >
              Train <em className="h1-em">AI agents</em> on your
            </span>
            <span
              className="headline-line appear appear--mask"
              style={{ ['--d' as any]: '0.62s' }}
            >
              workflows in minutes.
            </span>
          </h1>

          {/* Lede */}
          <p
            className="appear appear--soft text-[15px] sm:text-[16.5px] text-[#9a9a9a] leading-[1.55] max-w-[520px] mx-auto mt-2 mb-7 font-normal"
            style={{ ['--d' as any]: '0.82s' }}
          >
            Business owners speak in Amharic, Oromo, or English. Our honest extraction agent translates their spoken story into a verified funding application without guessing.
          </p>

          {/* Hero Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
            <button
              onClick={onStartVoiceApp}
              className="appear appear--btn vesper-btn vesper-btn-solid h-[44px] px-6 text-[14px] font-semibold w-full sm:w-auto shadow-lg"
              style={{ ['--d' as any]: '0.96s' }}
            >
              Start Voice Intake Agent
            </button>
            <button
              onClick={onOpenSpike}
              className="appear appear--side vesper-btn vesper-btn-ghost h-[44px] px-5 text-[14px] font-medium w-full sm:w-auto"
              style={{ ['--d' as any]: '1.10s' }}
            >
              Amharic / Oromo Accuracy Spike
            </button>
          </div>
        </div>
      </main>

      {/* Stats Footer */}
      <footer
        className="relative z-20 w-full flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/10 bg-black/40 backdrop-blur-md"
        style={{ padding: '20px var(--stats-x) var(--stats-y)' }}
      >
        {/* Stat 1 */}
        <div
          className="appear appear--stat flex items-center gap-3.5 text-[#d8d8d8] text-[13.5px] tracking-tight"
          style={{ ['--d' as any]: '1.12s' }}
        >
          <svg className="w-5 h-5 text-white/90 flex-shrink-0" viewBox="0 0 24 24">
            <defs>
              <linearGradient id="pillGrad1" x1="3" y1="2" x2="14" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3a3a3a" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="pillGrad2" x1="3" y1="2" x2="14" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#3a3a3a" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <rect x="3.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#pillGrad1)" />
            <rect x="13.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#pillGrad2)" />
            <rect x="9.2" y="10.9" width="5.6" height="2.2" rx="1.1" fill="#4a4a4a" />
          </svg>
          <span>4.2M+ workflows automated</span>
        </div>

        {/* Stat 2 */}
        <div
          className="appear appear--stat flex items-center gap-3.5 text-[#d8d8d8] text-[13.5px] tracking-tight"
          style={{ ['--d' as any]: '1.28s' }}
        >
          <svg className="w-5 h-5 text-white flex-shrink-0" viewBox="0 0 24 24">
            <rect x="2.4" y="2.4" width="19.2" height="19.2" rx="6.2" fill="#ffffff" />
            <path
              d="M12 7.1v7.4M8.15 12.35L12 16.2l3.85-3.85"
              stroke="#111111"
              strokeWidth="1.85"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>92% reduction in manual operations</span>
        </div>

        {/* Stat 3 */}
        <div
          className="appear appear--stat flex items-center gap-3.5 text-[#d8d8d8] text-[13.5px] tracking-tight"
          style={{ ['--d' as any]: '1.44s' }}
        >
          <svg className="w-9 h-5 flex-shrink-0" viewBox="0 0 40 22">
            {/* Avatar 1 */}
            <circle cx="10.2" cy="11" r="9.2" fill="#2b2b2b" />
            <ellipse cx="10.2" cy="12.1" rx="4.15" ry="3.7" fill="#f4f4f4" />
            <circle cx="9.2" cy="11.2" r="0.7" fill="#1a1a1a" />
            <circle cx="11.2" cy="11.2" r="0.7" fill="#1a1a1a" />
            {/* Avatar 2 */}
            <circle cx="20.2" cy="11" r="9.2" fill="#ffffff" />
            <circle cx="18.5" cy="10" r="1.5" fill="#111111" />
            <circle cx="21.9" cy="10" r="1.5" fill="#111111" />
            <path d="M18.8 13.5c.8.8 2 .8 2.8 0" stroke="#111111" strokeWidth="1.2" fill="none" />
            {/* Avatar 3 */}
            <circle cx="30.2" cy="11" r="9.2" fill="#f26b1d" />
            <text
              x="30.2"
              y="15.1"
              fontSize="12.5"
              fontWeight="700"
              fill="#ffffff"
              textAnchor="middle"
              fontFamily="Inter, sans-serif"
            >
              e
            </text>
          </svg>
          <span>180+ operational teams onboarded</span>
        </div>
      </footer>
    </div>
  );
};
