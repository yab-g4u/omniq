import React, { useState, useRef } from 'react';
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
  Edit3,
  Download,
  Send,
  Sparkles,
  Search,
  Filter,
  Play,
  Pause,
  Check,
  X,
  Printer,
  ChevronRight,
  Radio,
  ExternalLink,
  Info,
  ArrowRight,
  MessageSquare,
  Shield,
  Layers,
  Activity,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { IVRCallRecord, ExtractedField, FieldKey, GradeLetter } from '../types';

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
  const [selectedCallId, setSelectedCallId] = useState<string>(calls[0]?.id || '');
  const [highlightedTranscriptQuote, setHighlightedTranscriptQuote] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState<boolean>(false);
  const [decisionType, setDecisionType] = useState<'approved' | 'field_visit_requested' | 'counter_offered' | 'rejected'>('approved');
  const [decisionNotes, setDecisionNotes] = useState<string>('');
  const [smsToast, setSmsToast] = useState<{ show: boolean; message: string } | null>(null);

  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);

  // Default demo record if no call recorded yet
  const defaultDemoCall: IVRCallRecord = {
    id: 'demo-hana-bakery',
    callerPhoneNumber: '+251 91 102 3344',
    callerName: "Hana Tadesse",
    region: 'Addis Ababa / Bole',
    callDurationSeconds: 64,
    timestamp: Date.now(),
    language: 'am',
    callStatus: 'completed',
    ivrTollFreeNumber: '8800',
    transcript: `Vesper: ንግድዎ በኢትዮጵያ በሕጋዊ መንገድ የተመዘገበ ነው?
Owner: አዎ፣ በሕጋዊ መንገድ የተመዘገበ የዳቦ እና ኬክ ቤት አለን።
Vesper: ንግድዎ ቢያንስ ለሁለት ዓመታት ሲሰራ ቆይቷል?
Owner: አዎ፣ የጀመርነው ከ4 ዓመት በፊት ነው። 6 ሰራተኞች አሉን።
Vesper: በወር ምን ያህል ገቢ ያስገባሉ?
Owner: በወር በአማካይ ወደ 800,000 ብር ገቢ አለን።
Vesper: ምን ያህል የብድር ገንዘብ ይፈልጋሉ?
Owner: አዲስ የንግድ ዳቦ መጋገሪያ ማሽን ለመግዛት 250,000 ብር እንፈልጋለን።`,
    extractedData: {
      transcript: '',
      transcript_language: 'am',
      fields: {
        business_name: {
          value: "Hana's Bakery",
          status: 'applicant_stated',
          quote: "በሕጋዊ መንገድ የተመዘገበ የዳቦ እና ኬክ ቤት አለን",
        },
        business_type: {
          value: 'Food & Bakery Manufacturing',
          status: 'applicant_stated',
          quote: "የዳቦ እና ኬክ ቤት",
        },
        years_operating: {
          value: '4 Years',
          status: 'applicant_stated',
          quote: "የጀመርነው ከ4 ዓመት በፊት ነው",
        },
        location: {
          value: 'Addis Ababa / Bole',
          status: 'applicant_stated',
          quote: "አዲስ አበባ ቦሌ አካባቢ",
        },
        employees: {
          value: '6 Employees',
          status: 'applicant_stated',
          quote: "6 ሰራተኞች አሉን",
        },
        monthly_revenue: {
          value: '800,000 ETB / month',
          status: 'applicant_stated',
          quote: "በወር በአማካይ ወደ 800,000 ብር ገቢ አለን",
        },
        funding_requested: {
          value: '250,000 ETB',
          status: 'applicant_stated',
          quote: "250,000 ብር እንፈልጋለን",
        },
        funding_purpose: {
          value: 'New Commercial Oven Equipment Expansion',
          status: 'applicant_stated',
          quote: "አዲስ የንግድ ዳቦ መጋገሪያ ማሽን ለመግዛት",
        },
        business_license: {
          value: 'Trade License Verified',
          status: 'applicant_stated',
          quote: "በሕጋዊ መንገድ የተመዘገበ",
        },
      },
      extraction_notes: 'Full 10-field extraction complete with quote evidence.',
    },
    aiGrading: {
      overallGrade: 'A',
      overallScore: 92,
      gradeLabel: 'Prime SME Credit Application',
      creditScore: 765,
      financialHealthScore: 90,
      operationalStabilityScore: 94,
      truthAndVerificationScore: 95,
      estimatedMonthlyCashflow: '800,000 ETB',
      requestedAmount: '250,000 ETB',
      loanToMonthlyRevenueRatio: 0.31,
      estimatedDSCR: 4.8,
      estimatedMonthlyRepayment: '18,500 ETB / month',
      jobCreationImpact: 'Supports 6 current employees; new commercial oven increases baking throughput by 2.5x.',
      executiveSummary: 'Established commercial bakery with 4 years operating history in Bole. Strong cashflow comfortably covers debt service (DSCR 4.8x). Loan purpose is clear equipment upgrade.',
      keyStrengths: [
        '4 years operational track record in high-density Bole district',
        'Strong cashflow coverage (800k monthly revenue vs 250k requested)',
        'Clear capital investment in high-margin baking machinery'
      ],
      riskFlags: [
        {
          level: 'low',
          category: 'verification',
          message: 'Revenue figure stated verbally; formal MFI bank statement verification recommended.'
        }
      ],
      recommendedTerms: {
        maxLoanAmount: '250,000 ETB',
        recommendedTenor: '12 Months',
        interestRate: '13.0% Flat Rate',
        gracePeriod: '1 Month'
      },
      preDisbursalRequirements: [
        'Physical site verification of Bole bakery premises',
        'Supplier proforma for commercial oven unit'
      ],
      recommendedDecision: 'approve'
    },
    underwritingDecision: { status: 'pending' },
  };

  const allDisplayCalls = calls.length > 0 ? calls : [defaultDemoCall];
  const activeCall = allDisplayCalls.find((c) => c.id === selectedCallId) || allDisplayCalls[0];

  // Jump to transcript line when evidence clicked
  const handleJumpToEvidence = (quote: string | null) => {
    if (!quote) return;
    setHighlightedTranscriptQuote(quote);
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Confirm Decision
  const handleConfirmDecision = () => {
    onUpdateCallDecision(activeCall.id, {
      status: decisionType,
      decidedAt: Date.now(),
      decidedBy: 'Credit Officer #104',
      approvedAmount: activeCall.extractedData?.fields?.funding_requested?.value || '250,000 ETB',
      notes: decisionNotes,
      smsSentToCaller: true,
    });

    setIsDecisionModalOpen(false);
    if (decisionType === 'approved') {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }

    setSmsToast({
      show: true,
      message: `SMS Notification dispatched to ${activeCall.callerPhoneNumber}: "Dear Applicant, your funding application for ${activeCall.extractedData?.fields?.business_name?.value} has been updated to ${decisionType.toUpperCase()}."`,
    });

    setTimeout(() => setSmsToast(null), 6000);
  };

  const fields = activeCall.extractedData?.fields || {};

  return (
    <div className="min-h-screen bg-[#07070a] text-white p-4 sm:p-6 lg:p-8">
      {/* Toast Alert */}
      {smsToast?.show && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-950 border border-emerald-500/40 text-emerald-100 p-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-md animate-bounce">
          <Send className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-medium">{smsToast.message}</p>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0d0d13] p-5 rounded-2xl border border-white/10 shadow-xl">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                SEQUA <span className="text-emerald-400 font-normal">| Applicant Intelligence</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Human-in-the-Loop Mode
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              AI extracts fields, traces verbatim quote evidence, and highlights verification gaps &mdash; human officer makes final decision.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenIVRSimulator}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Simulate Voice Call (8800)</span>
            </button>

            <button
              onClick={onOpenSpike}
              className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>ASR Evaluation</span>
            </button>
          </div>
        </div>

        {/* Selected Applicant Profile Card Header */}
        <div className="bg-[#0e0e16] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 rounded-md text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  LIVE APPLICATION
                </span>
                <span className="text-xs font-mono text-neutral-400 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  PROCESSING &bull; SME-0248
                </span>
              </div>

              <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
                {fields.business_name?.value || "Hana's Bakery"}
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  🟢 Eligible
                </span>
              </h2>

              <p className="text-xs text-neutral-400 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                  {fields.location?.value || activeCall.region || "Addis Ababa / Bole"}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                  {fields.business_type?.value || "Food & Bakery"}
                </span>
              </p>
            </div>

            {/* Top 3 Verified Metric Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#13131d] p-3.5 rounded-xl border border-emerald-500/30 text-center">
                <div className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  REGISTERED
                </div>
                <div className="text-xs font-bold text-white mt-1">Verified Legal</div>
              </div>

              <div className="bg-[#13131d] p-3.5 rounded-xl border border-emerald-500/30 text-center">
                <div className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {fields.years_operating?.value || "4 YEARS"}
                </div>
                <div className="text-xs font-bold text-white mt-1">Operating History</div>
              </div>

              <div className="bg-[#13131d] p-3.5 rounded-xl border border-purple-500/30 text-center">
                <div className="text-[10px] font-bold text-purple-300 tracking-wider uppercase flex items-center justify-center gap-1">
                  <Users className="w-3 h-3 text-purple-400" />
                  {fields.employees?.value || "6 EMPLOYEES"}
                </div>
                <div className="text-xs font-bold text-white mt-1">Stated Count</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 LAYERS OF INTELLIGENCE MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 7 COLS: Layer 1 (Extract) & Layer 2 (Traceable Evidence) */}
          <div className="lg:col-span-7 space-y-6">
            {/* LAYER 1: EXTRACTED BUSINESS PROFILE & LIVE INSIGHTS */}
            <div className="bg-[#0b0b11] border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <h3 className="text-sm font-bold tracking-wide uppercase text-neutral-300">
                    LAYER 1 &mdash; EXTRACTED DATA &amp; LIVE INSIGHTS
                  </h3>
                </div>
                <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  AI Honest Extraction
                </span>
              </div>

              {/* Progress bars & Insights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#111119] p-4 rounded-xl border border-white/10">
                  <span className="text-[11px] font-medium text-neutral-400 uppercase">Monthly Revenue</span>
                  <div className="text-base font-bold text-emerald-400 mt-1">
                    {fields.monthly_revenue?.value || "800,000 ETB"}
                  </div>
                  <div className="w-full bg-neutral-800 h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[80%]" />
                  </div>
                </div>

                <div className="bg-[#111119] p-4 rounded-xl border border-white/10">
                  <span className="text-[11px] font-medium text-neutral-400 uppercase">Funding Requested</span>
                  <div className="text-base font-bold text-purple-300 mt-1">
                    {fields.funding_requested?.value || "250,000 ETB"}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-2">Equipment expansion</div>
                </div>

                <div className="bg-[#111119] p-4 rounded-xl border border-white/10">
                  <span className="text-[11px] font-medium text-neutral-400 uppercase">Funding Purpose</span>
                  <div className="text-xs font-bold text-white mt-1 line-clamp-2">
                    {fields.funding_purpose?.value || "New Commercial Oven"}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold block mt-1">✓ Capital Upgrade</span>
                </div>
              </div>

              {/* LAYER 2: EVIDENCE PROVENANCE TABLE (Traceable to Conversation) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    LAYER 2 &mdash; TRACEABLE EVIDENCE PROVENANCE
                  </h4>
                  <span className="text-[11px] text-neutral-400">Click quote to jump to transcript</span>
                </div>

                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                  {[
                    { label: 'Business Name', field: fields.business_name },
                    { label: 'Sector / Activity', field: fields.business_type },
                    { label: 'Operating Longevity', field: fields.years_operating },
                    { label: 'Location', field: fields.location },
                    { label: 'Employees', field: fields.employees },
                    { label: 'Monthly Revenue', field: fields.monthly_revenue },
                    { label: 'Loan Amount Requested', field: fields.funding_requested },
                    { label: 'Use of Loan Funds', field: fields.funding_purpose },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleJumpToEvidence(item.field?.quote || null)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        item.field?.quote
                          ? 'bg-[#12121c] border-white/10 hover:border-emerald-500/40'
                          : 'bg-[#121015] border-amber-500/20'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-neutral-300">{item.label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.field?.quote
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}>
                          {item.field?.quote ? '✓ Stated with Evidence' : '⚠ Missing / Unstated'}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-white mb-1">
                        {item.field?.value || 'Unstated / Not Provided'}
                      </div>

                      {item.field?.quote ? (
                        <div className="text-[11px] italic text-emerald-300/90 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/20 flex items-start gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>&ldquo;{item.field.quote}&rdquo;</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-400/90 italic">
                          Applicant did not mention this indicator in spoken audio.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* LIVE CONVERSATION & TRANSCRIPT FEED */}
            <div ref={transcriptContainerRef} className="bg-[#0b0b11] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold tracking-wide uppercase text-neutral-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  CONVERSATION TRANSCRIPT
                </h3>
                <span className="text-xs text-neutral-400">Verbatim Spoken Audio</span>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {activeCall.transcript.split('\n').map((line, idx) => {
                  const isHighlighted = highlightedTranscriptQuote && line.toLowerCase().includes(highlightedTranscriptQuote.toLowerCase());
                  const isVesper = line.startsWith('Vesper:') || line.startsWith('AI:');
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs leading-relaxed transition-all ${
                        isHighlighted
                          ? 'bg-amber-950/60 border-amber-400 text-amber-100 ring-2 ring-amber-400/50 scale-[1.01]'
                          : isVesper
                          ? 'bg-[#0f1512] border-emerald-500/20 text-emerald-200'
                          : 'bg-[#14101e] border-purple-500/20 text-purple-200'
                      }`}
                    >
                      <span className="font-bold mr-2 uppercase text-[10px] opacity-80 block mb-0.5">
                        {isVesper ? 'AI ASSISTANT' : 'APPLICANT'}
                      </span>
                      {line}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: Layer 3 (Review Intelligence) & Application Brief */}
          <div className="lg:col-span-5 space-y-6">
            {/* LAYER 3: REVIEW INTELLIGENCE CARD */}
            <div className="bg-[#0b0b11] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <h3 className="text-sm font-bold tracking-wide uppercase text-neutral-300">
                    LAYER 3 &mdash; REVIEW INTELLIGENCE
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Eligibility requirements satisfied</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Business operating history confirmed (4 Years)</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 p-2.5 rounded-xl border border-amber-500/30 font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Revenue needs bank statement verification</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Funding purpose is clearly stated (Commercial Oven)</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 p-2.5 rounded-xl border border-amber-500/30 font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Applicant has not yet quantified expected output increase</span>
                </div>
              </div>

              {/* NEXT BEST QUESTION RECOMMENDATION */}
              <div className="bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/40 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  NEXT BEST QUESTION FOR OFFICER
                </div>
                <p className="text-xs font-semibold text-white italic">
                  &ldquo;How will the new commercial oven affect your daily baking capacity and revenue?&rdquo;
                </p>
                <p className="text-[11px] text-neutral-400">
                  Asking this follow-up clarifies the cash flow impact before committee approval.
                </p>
              </div>
            </div>

            {/* APPLICATION READY FOR REVIEW (AI UNDERWRITING BRIEF) */}
            <div className="bg-[#0b0b11] border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold tracking-wide uppercase text-neutral-300">
                  APPLICATION READY FOR REVIEW
                </h3>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 block uppercase">Completeness</span>
                  <span className="text-base font-extrabold text-emerald-400">82%</span>
                </div>
              </div>

              {/* Summary bullets */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#14141e]">
                  <span className="text-neutral-400">Eligibility Status</span>
                  <span className="font-bold text-emerald-400">🟢 Passed</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#14141e]">
                  <span className="text-neutral-400">Business Profile</span>
                  <span className="font-semibold text-white">Food / Bakery &bull; 4 yrs &bull; 6 employees</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#14141e]">
                  <span className="text-neutral-400">Funding Request</span>
                  <span className="font-bold text-purple-300">250,000 ETB</span>
                </div>
              </div>

              {/* AI Assessment Brief */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  AI-Generated Assessment
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed bg-[#111119] p-3.5 rounded-xl border border-white/10">
                  {activeCall.aiGrading?.executiveSummary ||
                    "Strong application completeness. The applicant clearly described an established bakery operating for four years with six employees. The requested funding has a specific business purpose."}
                </p>
              </div>

              {/* FUNDER ACTION (Human-in-the-Loop Decision Buttons) */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center justify-between">
                  <span>FUNDER ACTION</span>
                  <span className="text-[10px] text-emerald-400 font-mono">AI Prepares File &rarr; Human Decides</span>
                </h4>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => {
                      setDecisionType('approved');
                      setIsDecisionModalOpen(true);
                    }}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Application (250,000 ETB)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setDecisionType('field_visit_requested');
                        setIsDecisionModalOpen(true);
                      }}
                      className="py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold border border-white/15 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>Request Verification</span>
                    </button>

                    <button
                      onClick={() => {
                        setDecisionType('counter_offered');
                        setIsDecisionModalOpen(true);
                      }}
                      className="py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold border border-white/15 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                      <span>Ask Follow-up</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Modal */}
      {isDecisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f0f18] border border-white/15 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Record Underwriting Decision
              </h3>
              <button
                onClick={() => setIsDecisionModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-300">
              Confirm underwriting decision for <strong className="text-white">{fields.business_name?.value || "Hana's Bakery"}</strong> ({activeCall.callerPhoneNumber}).
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-neutral-400 block mb-1">Decision Type</label>
                <select
                  value={decisionType}
                  onChange={(e) => setDecisionType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="approved">🟢 Approve Application</option>
                  <option value="field_visit_requested">🟡 Request Field Verification Visit</option>
                  <option value="counter_offered">🟣 Ask Follow-up &amp; Counter-Offer</option>
                  <option value="rejected">🔴 Reject Application</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-400 block mb-1">Officer Review Notes</label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Enter credit committee notes..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setIsDecisionModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDecision}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm &amp; Send SMS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
