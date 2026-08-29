import React from 'react';
import {
  Phone,
  Radio,
  Cpu,
  ShieldCheck,
  FileCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Server,
  Database,
  Send,
  Zap,
  Globe,
  Terminal,
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-2 sm:px-4 space-y-8">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            System Architecture Blueprint
          </span>
          <span className="text-xs text-neutral-400">&bull; End-to-End Telephony Pipeline</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          How Vesper.ai Bridges Feature Phones to AI Underwriting
        </h1>
        <p className="text-sm text-neutral-300 max-w-3xl leading-relaxed">
          Over 75% of informal micro-entrepreneurs in emerging markets lack smartphones and digital literacy. Vesper eliminates all digital barriers: applicants dial a toll-free number (8800) from any 2G phone, speak naturally in their local dialect, and the platform delivers verified, graded underwriting packages to financial institutions.
        </p>
      </div>

      {/* 5-Stage Architecture Flow Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Stage 1 */}
        <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-5 space-y-3 relative flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Stage 01</span>
            <h3 className="text-sm font-bold text-white">2G / PSTN Caller</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Applicant calls toll-free 8800 via Ethio Telecom or Safaricom from a basic feature phone.
            </p>
          </div>
          <div className="pt-3 border-t border-white/5 text-[11px] text-amber-400 flex items-center gap-1 font-mono">
            <span>DTMF / Audio Link</span>
          </div>
        </div>

        {/* Stage 2 */}
        <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-5 space-y-3 relative flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center font-bold">
              <Radio className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Stage 02</span>
            <h3 className="text-sm font-bold text-white">IVR Gateway</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Telephony SIP trunk routes audio stream &amp; prompts language choice (Amharic, Oromo, English).
            </p>
          </div>
          <div className="pt-3 border-t border-white/5 text-[11px] text-blue-400 flex items-center gap-1 font-mono">
            <span>WebRTC / Opus 8kHz</span>
          </div>
        </div>

        {/* Stage 3 */}
        <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-5 space-y-3 relative flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Stage 03</span>
            <h3 className="text-sm font-bold text-white">Gemini 3.7 Engine</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Processes raw audio or transcript natively. Understands East African accents and regional idioms.
            </p>
          </div>
          <div className="pt-3 border-t border-white/5 text-[11px] text-purple-400 flex items-center gap-1 font-mono">
            <span>Multimodal Audio ASR</span>
          </div>
        </div>

        {/* Stage 4 */}
        <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-5 space-y-3 relative flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Stage 04</span>
            <h3 className="text-sm font-bold text-white">Honest Quote Binding</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Extracts 10 core fields. Each field is strictly bound to verbatim spoken quotes. No AI guessing.
            </p>
          </div>
          <div className="pt-3 border-t border-white/5 text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
            <span>100% Audit Trail</span>
          </div>
        </div>

        {/* Stage 5 */}
        <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-5 space-y-3 relative flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Stage 05</span>
            <h3 className="text-sm font-bold text-white">Lender Portal &amp; SMS</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Credit committee reviews AI grade &amp; DSCR coverage. Approvals dispatch immediate SMS to caller.
            </p>
          </div>
          <div className="pt-3 border-t border-white/5 text-[11px] text-teal-400 flex items-center gap-1 font-mono">
            <span>Instant SMS Feedback</span>
          </div>
        </div>
      </div>

      {/* Deep Dives: Technical Ingestion & Webhook Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Core Ingestion Schema */}
        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Live Telephony Ingestion Webhook</h3>
          </div>
          <p className="text-xs text-neutral-400">
            Microfinance institutions integrate their existing Twilio, Africa&apos;s Talking, or Asterisk PBX lines by pointing call recordings to Vesper&apos;s intake endpoint:
          </p>

          <div className="bg-black/60 p-4 rounded-xl border border-white/10 font-mono text-[11px] text-emerald-300 overflow-x-auto space-y-2">
            <p className="text-neutral-500"># Ingest Call Stream Webhook</p>
            <p>
              curl -X POST https://vesper-mfi.internal/api/extract-story \
            </p>
            <p className="pl-4 text-neutral-300">-H &quot;Content-Type: application/json&quot; \</p>
            <p className="pl-4 text-neutral-300">-d &apos;&#123;</p>
            <p className="pl-8 text-neutral-400">&quot;callerPhone&quot;: &quot;+251911428901&quot;,</p>
            <p className="pl-8 text-neutral-400">&quot;language&quot;: &quot;am&quot;,</p>
            <p className="pl-8 text-neutral-400">&quot;audioUrl&quot;: &quot;https://pbx.ethio/calls/rec-8800-491.wav&quot;</p>
            <p className="pl-4 text-neutral-300">&#125;&apos;</p>
          </div>
        </div>

        {/* Right Card: Honest Extraction Guarantee */}
        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">The Honest Extraction Protocol</h3>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Standard AI agents tend to guess or hallucinate missing details when filling loan applications. Vesper enforces strict field attribution:
          </p>

          <ul className="space-y-2.5 text-xs text-neutral-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Verbatim Quote Binding:</strong> If a field is populated, the exact spoken quote citation is stored alongside the value.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Honest Missing Status:</strong> If an applicant fails to mention an item (e.g. machinery), the field is left null with status <code className="text-amber-300 font-mono">missing</code> rather than guessing.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Audit Trail for Regulators:</strong> Bank compliance officers can click any field to listen to the exact audio segment or view the original dialect transcript.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
