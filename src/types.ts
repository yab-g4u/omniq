export type Language = 'am' | 'om' | 'en';

export type FieldStatus =
  | 'STATED'
  | 'VERIFIED'
  | 'MISSING'
  | 'CONTRADICTED'
  | 'applicant_stated'
  | 'missing'
  | 'supported'
  | 'contradiction';

export interface ExtractedField {
  value: string | null;
  status: FieldStatus;
  source?: string | null;
  quote: string | null;
  confidence?: number;
  isEdited?: boolean;
  editedAt?: number;
}

export type FieldKey =
  | 'owner_name'
  | 'business_name'
  | 'business_type'
  | 'location'
  | 'years_operating'
  | 'employees'
  | 'monthly_revenue'
  | 'funding_requested'
  | 'funding_purpose'
  | 'business_license'
  | 'business_start_date'
  | 'location_description'
  | 'num_employees'
  | 'monthly_or_annual_sales'
  | 'machinery_equipment'
  | 'funding_amount_requested'
  | 'beneficiaries_impact';

export interface ExtractedFieldsMap {
  owner_name?: ExtractedField;
  business_name: ExtractedField;
  business_type: ExtractedField;
  location?: ExtractedField;
  years_operating?: ExtractedField;
  employees?: ExtractedField;
  monthly_revenue?: ExtractedField;
  funding_requested?: ExtractedField;
  funding_purpose: ExtractedField;
  business_license?: ExtractedField;
  // Aliases for compatibility
  business_start_date?: ExtractedField;
  location_description?: ExtractedField;
  num_employees?: ExtractedField;
  monthly_or_annual_sales?: ExtractedField;
  machinery_equipment?: ExtractedField;
  funding_amount_requested?: ExtractedField;
  beneficiaries_impact?: ExtractedField;
}

export interface ApplicationExtractionResult {
  transcript: string;
  transcript_language: 'am' | 'om' | 'en' | 'mixed';
  fields: ExtractedFieldsMap;
  extraction_notes: string;
  engine?: string;
  processedAt?: number;
  audioDurationSeconds?: number;
  aiGrading?: BusinessGradingReport;
}

export type GradeLetter = 'A' | 'B' | 'C' | 'D';

export interface RiskFlag {
  level: 'low' | 'medium' | 'high';
  message: string;
  category: 'financial' | 'operational' | 'verification' | 'market';
}

export interface RecommendedTerms {
  maxLoanAmount: string;
  recommendedTenor: string;
  interestRate: string;
  gracePeriod: string;
}

export interface BusinessGradingReport {
  overallGrade: GradeLetter;
  overallScore: number; // 0 - 100
  gradeLabel: string;
  creditScore: number; // 300 - 850
  financialHealthScore: number; // 0 - 100
  operationalStabilityScore: number; // 0 - 100
  truthAndVerificationScore: number; // 0 - 100
  estimatedMonthlyCashflow: string;
  requestedAmount: string;
  loanToMonthlyRevenueRatio: number;
  estimatedDSCR: number; // Debt Service Coverage Ratio
  estimatedMonthlyRepayment: string;
  jobCreationImpact: string;
  executiveSummary: string;
  keyStrengths: string[];
  riskFlags: RiskFlag[];
  recommendedTerms: RecommendedTerms;
  preDisbursalRequirements: string[];
  recommendedDecision: 'approve' | 'counter_offer' | 'field_visit' | 'reject';
}

export interface UnderwritingDecision {
  status: 'pending' | 'approved' | 'field_visit_requested' | 'counter_offered' | 'rejected';
  decidedAt?: number;
  decidedBy?: string;
  approvedAmount?: string;
  approvedTenorMonths?: number;
  approvedInterestRate?: string;
  conditions?: string[];
  notes?: string;
  smsSentToCaller?: boolean;
}

export interface IVRCallRecord {
  id: string;
  callerPhoneNumber: string;
  callerName: string;
  region: string;
  callDurationSeconds: number;
  timestamp: number;
  language: Language;
  callStatus: 'completed' | 'in_progress' | 'transcribing' | 'graded';
  ivrTollFreeNumber: string;
  audioUrl?: string;
  audioDuration?: number;
  transcript: string;
  extractedData: ApplicationExtractionResult;
  aiGrading: BusinessGradingReport;
  underwritingDecision: UnderwritingDecision;
}

export interface AudioRecording {
  blob: Blob;
  url: string;
  mimeType: string;
  duration: number;
  sizeBytes: number;
  recordedAt: number;
  base64?: string;
  fileName?: string;
}

export interface SampleStory {
  id: string;
  title: string;
  ownerName: string;
  location: string;
  language: Language;
  sector: string;
  audioDuration: number;
  description: string;
  transcript: string;
  expectedFields: ExtractedFieldsMap;
  notes: string;
  phone: string;
  gradingPreview?: BusinessGradingReport;
}

export interface SpikeBenchmarkLanguage {
  code: Language;
  name: string;
  nativeName: string;
  samplesCount: number;
  averageAccuracy: string;
  characterErrorRate: string;
  geminiScore: string;
  decisionGate: string;
  phoneticNotes: string;
  samplePhrases: string[];
}

export interface IVRStepPrompt {
  id: number;
  stepName: string;
  fieldTarget: FieldKey;
  promptText: {
    am: string;
    om: string;
    en: string;
  };
  audioPlaceholderText?: string;
}

