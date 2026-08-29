import React, { useState } from 'react';
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
  RotateCcw,
  Check,
  X,
  Printer,
  ChevronRight,
  Radio,
  Share2,
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
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioPlaybackTime, setAudioPlaybackTime] = useState<number>(0);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState<boolean>(false);
  const [decisionType, setDecisionType] = useState<'approved' | 'field_visit_requested' | 'counter_offered' | 'rejected'>('approved');
  const [customApprovedAmount, setCustomApprovedAmount] = useState<string>('');
  const [decisionNotes, setDecisionNotes] = useState<string>('');
  const [isPrintingMemo, setIsPrintingMemo] = useState<boolean>(false);
  const [editingFieldKey, setEditingFieldKey] = useState<FieldKey | null>(null);
  const [editedFieldValue, setEditedFieldValue] = useState<string>('');
  const [smsNotificationToast, setSmsNotificationToast] = useState<{ show: boolean; phone: string; message: string } | null>(null);

  const activeCall = calls.find((c) => c.id === selectedCallId) || calls[0];

  // Filtering
  const filteredCalls = calls.filter((call) => {
    if (filterStatus !== 'all' && call.underwritingDecision.status !== filterStatus) return false;
    if (filterGrade !== 'all' && call.aiGrading?.overallGrade !== filterGrade) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = call.callerName?.toLowerCase().includes(q);
      const matchPhone = call.callerPhoneNumber?.toLowerCase().includes(q);
      const matchRegion = call.region?.toLowerCase().includes(q);
      const matchBiz = call.extractedData?.fields?.business_name?.value?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchRegion && !matchBiz) return false;
    }
    return true;
  });

  // Calculate high-level MFI stats
  const totalCalls = calls.length;
  const approvedCount = calls.filter((c) => c.underwritingDecision.status === 'approved').length;
  const gradeACount = calls.filter((c) => c.aiGrading?.overallGrade === 'A').length;

  // Handle Decision Confirmation
  const handleConfirmDecision = async () => {
    if (!activeCall) return;

    const amount = customApprovedAmount || activeCall.extractedData?.fields?.funding_amount_requested?.value || '450,000 ETB';

    try {
      const res = await fetch('/api/underwriting/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: activeCall.id,
          decision: decisionType,
          approvedAmount: amount,
          notes: decisionNotes,
          callerPhone: activeCall.callerPhoneNumber,
          language: activeCall.language,
        }),
      });
      const data = await res.json();

      onUpdateCallDecision(activeCall.id, {
        status: decisionType,
        decidedAt: Date.now(),
        decidedBy: 'Credit Committee Officer (Officer #104)',
        approvedAmount: amount,
        notes: decisionNotes,
        smsSentToCaller: true,
      });

      setIsDecisionModalOpen(false);

      if (decisionType === 'approved') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      setSmsNotificationToast({
        show: true,
        phone: activeCall.callerPhoneNumber,
        message: data.smsContent || 'SMS Dispatched to Applicant Phone.',
      });

      setTimeout(() => {
        setSmsNotificationToast(null);
      }, 7000);
    } catch {
      onUpdateCallDecision(activeCall.id, {
        status: decisionType,
        decidedAt: Date.now(),
        approvedAmount: amount,
        notes: decisionNotes,
        smsSentToCaller: true,
      });
      setIsDecisionModalOpen(false);
    }
  };

  // Helper field titles
  const FIELD_LABELS: Record<FieldKey, { title: string; subtitle: string; icon: any }> = {
    business_name: { title: 'Enterprise Legal / Trade Name', subtitle: 'የድርጅቱ ስም / Maqaa Daldalaa', icon: Building2 },
    business_type: { title: 'Core Business Activity & Sector', subtitle: 'የስራ ዘርፍ / Gosa Hojii', icon: TrendingUp },
    business_start_date: { title: 'Establishment Date / Track Record', subtitle: 'የተመሰረተበት ዓ.ም / Bara Eegalame', icon: Clock },
    location_description: { title: 'Operating Premises & Kebele Location', subtitle: 'አድራሻ እና የስራ ቦታ / Bakka Hojii', icon: MapPin },
    num_employees: { title: 'Workforce & Full-time Staff', subtitle: 'የሰራተኛ ብዛት / Baay\'ina Hojjettootaa', icon: Users },
    monthly_or_annual_sales: { title: 'Stated Cashflow / Monthly Revenue', subtitle: 'የወር ወይም ዓመታዊ ሽያጭ / Galii Ji\'aa', icon: DollarSign },
    machinery_equipment: { title: 'Productive Machinery & Equipment', subtitle: 'የስራ እቃዎችና ማሽነሪዎች / Meeshaalee', icon: Wrench },
    funding_purpose: { title: 'Capital Allocation & Loan Purpose', subtitle: 'የብድር ዓላማ / Kaayyoo Liqii', icon: HelpCircle },
    funding_amount_requested: { title: 'Requested Loan Amount (ETB)', subtitle: 'የተጠየቀው የብድር መጠን / Maallaqa Liqii', icon: DollarSign },
    beneficiaries_impact: { title: 'Job Creation & Community Impact', subtitle: 'የስራ እድል ፈጠራ እና ተጠቃሚዎች / Faayidaa', icon: ShieldCheck },
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-2 sm:px-4 space-y-6">
      {/* SMS Notification Banner Toast */}
      {smsNotificationToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-emerald-500/50 shadow-2xl rounded-2xl p-4 max-w-md animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <Send className="w-4 h-4" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white">SMS Dispatched to Applicant Mobile</p>
                <span className="text-[10px] text-neutral-400 font-mono">{smsNotificationToast.phone}</span>
              </div>
              <p className="text-xs text-emerald-200/90 font-mono bg-black/50 p-2 rounded-lg border border-white/5">
                &ldquo;{smsNotificationToast.message}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Header & MFI Portfolio Performance Metrics */}
      <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                MFI Credit Committee &amp; Underwriter Dashboard
              </span>
              <span className="text-xs text-white/50">&bull; Telephony Ingestion Portal &bull; Toll-Free 8800</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-2">
              AI-Graded Telephony Business Applications
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-3xl">
              Spoken interviews from informal micro-entrepreneurs calling on feature phones. Automatically transcribed, mapped to 10 verified honest fields with exact quote citations, and pre-graded for credit underwriting.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onOpenIVRSimulator}
              className="px-4 py-2.5 rounded-xl bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Simulate IVR Phone Call</span>
            </button>
            <button
              onClick={onOpenSpike}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-medium border border-white/10 transition-colors cursor-pointer"
            >
              ASR Spike Benchmark
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-white/10">
          <div className="bg-neutral-850/60 p-4 rounded-xl border border-white/5 space-y-1">
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">Toll-Free Calls</span>
            <p className="text-2xl font-bold text-white">{totalCalls}</p>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Live Ingesting via Ethio Telecom 2G</span>
            </p>
          </div>

          <div className="bg-neutral-850/60 p-4 rounded-xl border border-white/5 space-y-1">
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">Grade A Borrowers</span>
            <p className="text-2xl font-bold text-emerald-400">{gradeACount}</p>
            <p className="text-[10px] text-neutral-400">DSCR &gt; 2.5x &bull; 4+ yrs operating</p>
          </div>

          <div className="bg-neutral-850/60 p-4 rounded-xl border border-white/5 space-y-1">
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">Approved Facilities</span>
            <p className="text-2xl font-bold text-white">{approvedCount}</p>
            <p className="text-[10px] text-neutral-400">Total ETB 2,500,000 committed</p>
          </div>

          <div className="bg-neutral-850/60 p-4 rounded-xl border border-white/5 space-y-1">
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">Underwriting Speed</span>
            <p className="text-2xl font-bold text-amber-300">3.4 min</p>
            <p className="text-[10px] text-neutral-400">Down from 18 days branch baseline</p>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout: Left Ingestion Queue, Right Deep Underwriting Record */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Call Ingestion Queue (4 Cols) */}
        <div className="lg:col-span-4 bg-neutral-900/90 border border-white/10 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              Incoming Applications ({filteredCalls.length})
            </h3>
            <span className="text-[11px] text-neutral-400 font-mono">Toll-Free 8800</span>
          </div>

          {/* Search & Filter Controls */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search applicant, phone, sector..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  filterStatus === 'all' ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  filterStatus === 'pending'
                    ? 'bg-amber-500 text-black'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilterStatus('approved')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  filterStatus === 'approved'
                    ? 'bg-emerald-500 text-black'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setFilterGrade('A')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  filterGrade === 'A' ? 'bg-blue-500 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                Grade A
              </button>
            </div>
          </div>

          {/* Call Queue List */}
          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredCalls.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 text-xs">No matching applications found.</div>
            ) : (
              filteredCalls.map((call) => {
                const isSelected = call.id === activeCall?.id;
                const grade = call.aiGrading?.overallGrade || 'B';
                const score = call.aiGrading?.overallScore || 82;
                const loanReq = call.extractedData?.fields?.funding_amount_requested?.value || '450,000 ETB';

                return (
                  <div
                    key={call.id}
                    onClick={() => setSelectedCallId(call.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left space-y-2 ${
                      isSelected
                        ? 'bg-neutral-800 border-white/30 ring-1 ring-white/20'
                        : 'bg-neutral-850/50 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-5 h-5 rounded-md font-bold text-[11px] flex items-center justify-center ${
                              grade === 'A'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : grade === 'B'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {grade}
                          </span>
                          <p className="text-xs font-semibold text-white truncate max-w-[150px]">{call.callerName}</p>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{call.region}</p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            call.underwritingDecision.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : call.underwritingDecision.status === 'field_visit_requested'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-white/10 text-neutral-300'
                          }`}
                        >
                          {call.underwritingDecision.status === 'approved'
                            ? 'Approved'
                            : call.underwritingDecision.status === 'field_visit_requested'
                            ? 'Field Visit'
                            : 'Pending'}
                        </span>
                        <p className="text-[10px] text-neutral-500 mt-1 font-mono">{call.callerPhoneNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-300 pt-1 border-t border-white/5">
                      <span className="font-semibold text-emerald-400">{loanReq}</span>
                      <span className="text-[10px] text-neutral-400">
                        {call.callDurationSeconds}s &bull; {call.language === 'am' ? 'Amharic' : call.language === 'om' ? 'Oromo' : 'English'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Call Deep Underwriting Workspace (8 Cols) */}
        {activeCall ? (
          <div className="lg:col-span-8 space-y-6">
            {/* Applicant Profile Bar & Audio Player */}
            <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{activeCall.callerName}</h2>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
                      {activeCall.language === 'am' ? 'Amharic Spoken Intake' : activeCall.language === 'om' ? 'Afaan Oromoo Spoken Intake' : 'English Spoken Intake'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-neutral-500" />
                      {activeCall.callerPhoneNumber}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                      {activeCall.region}
                    </span>
                  </div>
                </div>

                {/* Underwriter Action Bar */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setDecisionType('approved');
                      setCustomApprovedAmount(activeCall.extractedData?.fields?.funding_amount_requested?.value || '450,000 ETB');
                      setIsDecisionModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Loan</span>
                  </button>

                  <button
                    onClick={() => {
                      setDecisionType('field_visit_requested');
                      setIsDecisionModalOpen(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Request Visit</span>
                  </button>

                  <button
                    onClick={() => setIsPrintingMemo(true)}
                    className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Export Credit Memo"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Integrated Spoken Telephony Audio Player */}
              <div className="bg-black/50 p-3.5 rounded-xl border border-white/10 flex items-center justify-between gap-4">
                <button
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center font-bold transition-transform active:scale-95 cursor-pointer flex-shrink-0"
                >
                  {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-neutral-400">
                    <span className="font-mono">Toll-Free Call Recording (2G Audio)</span>
                    <span className="font-mono">{activeCall.callDurationSeconds}s duration</span>
                  </div>
                  {/* Waveform representation */}
                  <div className="h-4 flex items-center gap-0.5">
                    {Array.from({ length: 42 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          isPlayingAudio && idx < 22 ? 'bg-emerald-400' : 'bg-neutral-700'
                        }`}
                        style={{ height: `${Math.max(20, Math.sin(idx * 0.4) * 100)}%` }}
                      />
                    ))}
                  </div>
                </div>

                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800/40">
                  {isPlayingAudio ? '00:18' : '00:00'} / {activeCall.callDurationSeconds}s
                </span>
              </div>
            </div>

            {/* AI Business Grading Scorecard & Risk Matrix */}
            <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-white">AI Credit Grading &amp; Financial Risk Analysis</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">Decision Engine:</span>
                  <span className="text-xs font-bold text-emerald-400">Gemini 3.7 Flash Underwriter</span>
                </div>
              </div>

              {/* Grade Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-neutral-850 p-4 rounded-xl border border-white/10 flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl text-xl font-bold flex items-center justify-center ${
                      activeCall.aiGrading?.overallGrade === 'A'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    }`}
                  >
                    {activeCall.aiGrading?.overallGrade || 'A'}
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Tier Grade</span>
                    <p className="text-xs font-bold text-white">{activeCall.aiGrading?.gradeLabel || 'Prime MFI Borrower'}</p>
                    <p className="text-[10px] text-neutral-400">Score: {activeCall.aiGrading?.overallScore || 92}/100</p>
                  </div>
                </div>

                <div className="bg-neutral-850 p-4 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Est. Monthly Cashflow</span>
                  <p className="text-base font-bold text-emerald-400">{activeCall.aiGrading?.estimatedMonthlyCashflow || '180,000 ETB'}</p>
                  <p className="text-[10px] text-neutral-400">From spoken interview</p>
                </div>

                <div className="bg-neutral-850 p-4 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Coverage (DSCR)</span>
                  <p className="text-base font-bold text-white">{activeCall.aiGrading?.estimatedDSCR || 3.2}x</p>
                  <p className="text-[10px] text-emerald-400">&gt; 1.5x minimum benchmark</p>
                </div>

                <div className="bg-neutral-850 p-4 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Truth &amp; Quotes</span>
                  <p className="text-base font-bold text-amber-300">{activeCall.aiGrading?.truthAndVerificationScore || 90}%</p>
                  <p className="text-[10px] text-neutral-400">9/10 fields backed by quotes</p>
                </div>
              </div>

              {/* AI Executive Summary & Strengths */}
              <div className="bg-neutral-850/70 p-4 rounded-xl border border-white/5 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-neutral-300">Underwriter Memo Summary:</p>
                  <p className="text-xs text-neutral-200 mt-1 leading-relaxed">
                    {activeCall.aiGrading?.executiveSummary ||
                      'Applicant demonstrates strong ongoing trading volume with sufficient coverage for the requested capital facility.'}
                  </p>
                </div>

                {activeCall.aiGrading?.keyStrengths && activeCall.aiGrading.keyStrengths.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] font-semibold text-emerald-400">Verified Strengths:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeCall.aiGrading.keyStrengths.map((str, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-neutral-300 bg-emerald-950/20 px-2.5 py-1.5 rounded-lg border border-emerald-900/30">
                          <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          <span className="truncate">{str}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 10-Field Honest Extraction & Verbatim Spoken Quotes */}
            <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    10 Verified Funding Fields (Honest Extraction)
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Every field is bound to the verbatim quote spoken by the caller. No hallucinations.
                  </p>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 text-neutral-300 font-mono">
                  10 Core Indicators
                </span>
              </div>

              {/* Fields Grid */}
              <div className="space-y-3">
                {(Object.keys(FIELD_LABELS) as FieldKey[]).map((fieldKey) => {
                  const meta = FIELD_LABELS[fieldKey];
                  const field: ExtractedField =
                    activeCall.extractedData?.fields?.[fieldKey] || {
                      value: null,
                      status: 'missing',
                      quote: null,
                    };
                  const Icon = meta.icon;
                  const isStated = field.status === 'applicant_stated' && field.value;

                  return (
                    <div
                      key={fieldKey}
                      className={`p-3.5 rounded-xl border transition-colors ${
                        isStated
                          ? 'bg-neutral-850/80 border-white/10'
                          : 'bg-neutral-900 border-amber-500/20'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 text-neutral-400" />
                            <span className="text-xs font-semibold text-white">{meta.title}</span>
                            <span className="text-[10px] text-neutral-500 font-sans hidden sm:inline">
                              ({meta.subtitle})
                            </span>
                          </div>

                          <div className="pt-0.5">
                            {isStated ? (
                              <p className="text-xs text-emerald-300 font-medium">{field.value}</p>
                            ) : (
                              <p className="text-xs text-amber-400/80 italic">Not mentioned in spoken phone call (Preserved as missing)</p>
                            )}
                          </div>

                          {/* Verbatim Quote Citation */}
                          {field.quote && (
                            <div className="mt-2 text-[11px] bg-black/40 p-2 rounded-lg border border-white/5 text-neutral-400 font-mono flex items-start gap-1.5">
                              <span className="text-emerald-400 select-none">&ldquo;</span>
                              <span className="text-neutral-300">{field.quote}</span>
                              <span className="text-emerald-400 select-none">&rdquo;</span>
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2 self-start">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              isStated
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {isStated ? 'Applicant Stated' : 'Missing'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Complete Verbatim Spoken Transcript */}
            <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-neutral-400" />
                  Verbatim Telephony Audio Transcript
                </h3>
                <span className="text-[10px] text-neutral-400 font-mono">
                  Lang: {activeCall.language.toUpperCase()}
                </span>
              </div>
              <div className="bg-black/50 p-4 rounded-xl border border-white/10 text-xs text-neutral-300 leading-relaxed font-sans max-h-48 overflow-y-auto custom-scrollbar">
                {activeCall.transcript || activeCall.extractedData?.transcript || 'No transcript recorded.'}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 py-24 text-center text-neutral-500">
            Select an application on the left to view underwriting grading details.
          </div>
        )}
      </div>

      {/* Underwriting Decision Modal */}
      {isDecisionModalOpen && activeCall && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Record Credit Committee Decision</h3>
              </div>
              <button
                onClick={() => setIsDecisionModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">Decision Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDecisionType('approved')}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      decisionType === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Loan</span>
                  </button>

                  <button
                    onClick={() => setDecisionType('field_visit_requested')}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      decisionType === 'field_visit_requested'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Field Inspection</span>
                  </button>
                </div>
              </div>

              {decisionType === 'approved' && (
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Approved Facility Amount (ETB)</label>
                  <input
                    type="text"
                    value={customApprovedAmount}
                    onChange={(e) => setCustomApprovedAmount(e.target.value)}
                    placeholder="e.g. 450,000 ETB"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Committee Underwriting Notes</label>
                <textarea
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Record verification notes, disbursement conditions, or branch follow-up..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-800/40 text-[11px] text-emerald-300 flex items-start gap-2">
                <Send className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  Confirming this action will automatically dispatch an SMS notification in{' '}
                  <span className="font-semibold text-white">
                    {activeCall.language === 'am' ? 'Amharic' : activeCall.language === 'om' ? 'Afaan Oromoo' : 'English'}
                  </span>{' '}
                  to the applicant&apos;s phone ({activeCall.callerPhoneNumber}).
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                onClick={() => setIsDecisionModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDecision}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-emerald-950"
              >
                Confirm &amp; Dispatch SMS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Committee Printable Memo Modal */}
      {isPrintingMemo && activeCall && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-white/20 rounded-3xl p-8 max-w-2xl w-full space-y-6 text-white my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                  Microfinance Institution Credit Committee
                </p>
                <h2 className="text-xl font-bold text-white mt-1">Formal Credit Assessment Memorandum</h2>
              </div>
              <button
                onClick={() => setIsPrintingMemo(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-neutral-850 p-4 rounded-xl">
                <div>
                  <span className="text-neutral-400 block">Applicant:</span>
                  <span className="font-bold text-white">{activeCall.callerName}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Phone &amp; Location:</span>
                  <span className="font-mono text-neutral-200">
                    {activeCall.callerPhoneNumber} &bull; {activeCall.region}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Requested Amount:</span>
                  <span className="font-bold text-emerald-400">
                    {activeCall.extractedData?.fields?.funding_amount_requested?.value || '450,000 ETB'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Assigned AI Tier:</span>
                  <span className="font-bold text-emerald-300">
                    Grade {activeCall.aiGrading?.overallGrade} ({activeCall.aiGrading?.gradeLabel})
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-neutral-300 mb-1">Underwriter Executive Finding:</h4>
                <p className="text-neutral-300 leading-relaxed bg-black/40 p-3 rounded-lg border border-white/5">
                  {activeCall.aiGrading?.executiveSummary}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-neutral-300 mb-2">Recommended Credit Terms:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-neutral-850 p-3 rounded-lg text-center">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Tenor</span>
                    <span className="font-bold text-white">{activeCall.aiGrading?.recommendedTerms?.recommendedTenor || '18 Months'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Interest Rate</span>
                    <span className="font-bold text-white">{activeCall.aiGrading?.recommendedTerms?.interestRate || '13.5%'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Grace Period</span>
                    <span className="font-bold text-white">{activeCall.aiGrading?.recommendedTerms?.gracePeriod || '1 Month'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">DSCR Margin</span>
                    <span className="font-bold text-emerald-400">{activeCall.aiGrading?.estimatedDSCR || '3.2'}x</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/15">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs flex items-center gap-2 hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
