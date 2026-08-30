/**
 * AG-UI TypeScript Definitions for Vesper.ai
 * Official protocol types & JSON Patch semantics
 */

export type AGUIEventType =
  | 'RUN_STARTED'
  | 'RUN_FINISHED'
  | 'TEXT_MESSAGE_START'
  | 'TEXT_MESSAGE_CONTENT'
  | 'TEXT_MESSAGE_END'
  | 'STATE_SNAPSHOT'
  | 'STATE_DELTA'
  | 'CUSTOM';

export interface AGUIEvent {
  type: AGUIEventType;
  runId: string;
  timestamp: number;
  messageId?: string;
  speaker?: 'user' | 'assistant' | 'system';
  content?: string;
  patches?: { op: 'add' | 'replace' | 'remove'; path: string; value: any }[];
  snapshot?: Record<string, any>;
  customType?: string;
  payload?: any;
}

export type ClaimStatus = 'reported' | 'verified' | 'missing';

export interface Evidence {
  text: string;
  messageId?: string;
}

export interface Claim {
  value: string;
  status: ClaimStatus;
  evidence?: Evidence;
  confidence?: number;
  timestamp: number;
  supersededValue?: string;
}

export interface ReviewItem {
  id: string;
  type: 'satisfied' | 'warning' | 'info';
  message: string;
}

export interface ApplicantIntelligenceState {
  runId: string;
  businessName?: Claim;
  sector?: Claim;
  location?: Claim;
  yearsOperating?: Claim;
  employees?: Claim;
  revenue?: Claim;
  fundingPurpose?: Claim;
  amountRequested?: Claim;
  jobsCreated?: Claim;
  eligibility: {
    registeredInEthiopia?: boolean;
    yearsRequirementPassed?: boolean;
    eligible?: boolean;
  };
  completeness: number;
  reviewItems: ReviewItem[];
  nextBestQuestion?: string;
  activeStatus: 'IDLE' | 'LISTENING' | 'TRANSCRIBING' | 'UNDERSTANDING' | 'EXTRACTING' | 'REVIEW_READY';
}

export const INITIAL_AGUI_INTELLIGENCE: ApplicantIntelligenceState = {
  runId: '',
  eligibility: {
    registeredInEthiopia: undefined,
    yearsRequirementPassed: undefined,
    eligible: undefined,
  },
  completeness: 0,
  reviewItems: [],
  activeStatus: 'IDLE',
};
