import { useState, useRef, useEffect, useCallback } from 'react';
import { Language, ExtractedFieldsMap, ApplicationExtractionResult } from '../types';
import { extractFieldsDeterministically, computeBusinessGrade } from '../lib/deterministicExtractor';
import {
  AddisRealtimeService,
  AddisRealtimeState,
  DiagnosticsState,
  AddisLogEntry,
  AddisErrorCategory,
} from '../lib/addisRealtimeService';
import {
  getGreeting,
  getEligibilityQuestion,
  getEligibilityResponse,
  evaluateRegistrationAnswer,
  evaluateYearsOperatingAnswer,
} from '../lib/library';

export interface LiveUtterance {
  id: string;
  speaker: 'owner' | 'vesper' | 'system';
  speakerLabel: string;
  text: string;
  timestamp: string;
  language: Language;
  confidence?: number;
}

export type EligibilityStep =
  | 'IDLE'
  | 'STEP1_GREETING'
  | 'STEP2_Q1'
  | 'STEP3_Q2'
  | 'STEP4_ELIGIBLE'
  | 'PASSED_ADDIS_AI'
  | 'INELIGIBLE_ENDED';

export interface UseAddisRealtimeOptions {
  language: Language;
  onFieldUpdate?: (fields: ExtractedFieldsMap, notes: string) => void;
  onTurnComplete?: (transcriptText: string, isCaller: boolean) => void;
}

export function useAddisRealtime({
  language,
  onFieldUpdate,
  onTurnComplete,
}: UseAddisRealtimeOptions) {
  const [state, setState] = useState<AddisRealtimeState>('IDLE');
  const [eligibilityStep, setEligibilityStep] = useState<EligibilityStep>('IDLE');
  const eligibilityStepRef = useRef<EligibilityStep>('IDLE');

  const updateEligibilityStep = (step: EligibilityStep) => {
    setEligibilityStep(step);
    eligibilityStepRef.current = step;
  };

  const [logs, setLogs] = useState<AddisLogEntry[]>([]);
  const [transcriptLogs, setTranscriptLogs] = useState<LiveUtterance[]>([]);
  const [extractedData, setExtractedData] = useState<ApplicationExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [errorCategory, setErrorCategory] = useState<AddisErrorCategory | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [diagnostics, setDiagnostics] = useState<DiagnosticsState>({
    hasMicPermission: false,
    inputAudioContextState: 'closed',
    inputSampleRate: 0,
    outputAudioContextState: 'closed',
    outputSampleRate: 0,
    webSocketState: 'CLOSED',
    setupComplete: false,
    isAudioStreaming: false,
    lastAudioChunkSentTime: null,
    lastAudioChunkSentBytes: 0,
    lastServerEvent: null,
    lastAiAudioReceivedTime: null,
    lastAiAudioReceivedBytes: 0,
    playbackState: 'IDLE',
    turnComplete: false,
    webSocketCloseCode: null,
    webSocketCloseReason: null,
    lastServerError: null,
    micLevel: 0,
    errorCategory: null,
  });

  const serviceRef = useRef<AddisRealtimeService | null>(null);
  const fullConversationRef = useRef<{ speaker: string; text: string }[]>([]);

  const formatTimestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  };

  const runExtraction = useCallback(
    (transcriptText: string, lang: Language) => {
      if (!transcriptText.trim()) return;
      setIsExtracting(true);
      try {
        const fields = extractFieldsDeterministically(transcriptText, lang);
        const grading = computeBusinessGrade(fields);

        const result: ApplicationExtractionResult = {
          transcript: transcriptText,
          transcript_language: lang,
          fields,
          extraction_notes: 'Extracted live from Addis AI voice transcript.',
          engine: 'addis-realtime-deterministic',
          processedAt: Date.now(),
          aiGrading: grading,
        };

        setExtractedData(result);
        onFieldUpdate?.(fields, result.extraction_notes);
      } catch (err) {
        console.error('[Extraction Error]:', err);
      } finally {
        setIsExtracting(false);
      }
    },
    [onFieldUpdate]
  );

  // Core eligibility evaluation and turn handling
  const handleUserSpeechText = useCallback(
    async (userText: string, currentLang: Language) => {
      if (!userText.trim()) return;
      const cleanText = userText.trim();

      const userUtterance: LiveUtterance = {
        id: `owner-${Date.now()}`,
        speaker: 'owner',
        speakerLabel: 'OWNER',
        text: cleanText,
        timestamp: formatTimestamp(),
        language: currentLang,
      };

      setTranscriptLogs((prev: LiveUtterance[]) => [...prev, userUtterance]);
      fullConversationRef.current.push({ speaker: 'Owner', text: cleanText });
      onTurnComplete?.(cleanText, true);

      const fullText = fullConversationRef.current.map((t) => `${t.speaker}: ${t.text}`).join('\n');
      runExtraction(fullText, currentLang);

      const currentStep = eligibilityStepRef.current;

      // STEP 2 Evaluation
      if (currentStep === 'STEP2_Q1') {
        const isRegistered = evaluateRegistrationAnswer(cleanText);
        if (isRegistered === false) {
          // Failed Q1 -> Ineligible
          updateEligibilityStep('INELIGIBLE_ENDED');
          const ineligText = getEligibilityResponse(currentLang, false);
          const ineligUtterance: LiveUtterance = {
            id: `inelig-${Date.now()}`,
            speaker: 'vesper',
            speakerLabel: 'VESPER',
            text: ineligText,
            timestamp: formatTimestamp(),
            language: currentLang,
          };
          setTranscriptLogs((prev) => [...prev, ineligUtterance]);
          fullConversationRef.current.push({ speaker: 'Vesper', text: ineligText });

          await serviceRef.current?.speakTTS(ineligText, currentLang);
          serviceRef.current?.stop();
          return;
        }

        // Passed Q1 -> Ask Q2
        updateEligibilityStep('STEP3_Q2');
        const q2Text = getEligibilityQuestion(currentLang, 2);
        const q2Utterance: LiveUtterance = {
          id: `q2-${Date.now()}`,
          speaker: 'vesper',
          speakerLabel: 'VESPER',
          text: q2Text,
          timestamp: formatTimestamp(),
          language: currentLang,
        };
        setTranscriptLogs((prev) => [...prev, q2Utterance]);
        fullConversationRef.current.push({ speaker: 'Vesper', text: q2Text });

        await serviceRef.current?.speakTTS(q2Text, currentLang);
        return;
      }

      // STEP 3 Evaluation
      if (currentStep === 'STEP3_Q2') {
        const is2Years = evaluateYearsOperatingAnswer(cleanText);
        if (is2Years === false) {
          // Failed Q2 -> Ineligible
          updateEligibilityStep('INELIGIBLE_ENDED');
          const ineligText = getEligibilityResponse(currentLang, false);
          const ineligUtterance: LiveUtterance = {
            id: `inelig-${Date.now()}`,
            speaker: 'vesper',
            speakerLabel: 'VESPER',
            text: ineligText,
            timestamp: formatTimestamp(),
            language: currentLang,
          };
          setTranscriptLogs((prev) => [...prev, ineligUtterance]);
          fullConversationRef.current.push({ speaker: 'Vesper', text: ineligText });

          await serviceRef.current?.speakTTS(ineligText, currentLang);
          serviceRef.current?.stop();
          return;
        }

        // Passed BOTH Q1 & Q2 -> ELIGIBLE!
        updateEligibilityStep('STEP4_ELIGIBLE');
        const eligText = getEligibilityResponse(currentLang, true);
        const eligUtterance: LiveUtterance = {
          id: `elig-${Date.now()}`,
          speaker: 'vesper',
          speakerLabel: 'VESPER',
          text: eligText,
          timestamp: formatTimestamp(),
          language: currentLang,
        };
        setTranscriptLogs((prev) => [...prev, eligUtterance]);
        fullConversationRef.current.push({ speaker: 'Vesper', text: eligText });

        await serviceRef.current?.speakTTS(eligText, currentLang);

        // Hand over control to real Addis AI agent with Persona
        updateEligibilityStep('PASSED_ADDIS_AI');
        const personaPrompt = `You are Sequa SME Support, an Ethiopian SME funding assistant. Your job is to have a friendly natural conversation with a small-business owner and understand their business. Do not sound like a questionnaire. Ask one natural follow-up question at a time. Never invent information. Applicant input: "${cleanText}".`;
        serviceRef.current?.sendClientPrompt(personaPrompt);
        return;
      }

      if (currentStep === 'PASSED_ADDIS_AI') {
        // Natural conversation with Addis AI
        serviceRef.current?.sendClientPrompt(cleanText);
      }
    },
    [onTurnComplete, runExtraction]
  );

  const processUserAudioSTT = useCallback(
    async (pcmBlob: Blob, currentLang: Language) => {
      try {
        const arrayBuffer = await pcmBlob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const b64Audio = btoa(binary);

        const res = await fetch('/api/addis/stt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: b64Audio,
            mimeType: 'audio/pcm',
            languageCode: currentLang,
          }),
        });

        if (!res.ok) return;

        const data = await res.json();
        const text = data.text || data.transcription || data.result?.text || '';

        if (text && text.trim()) {
          await handleUserSpeechText(text, currentLang);
        }
      } catch (sttErr) {
        console.warn('Addis STT process warning:', sttErr);
      }
    },
    [handleUserSpeechText]
  );

  useEffect(() => {
    const service = new AddisRealtimeService({
      onStateChange: (newState) => setState(newState),
      onDiagnosticsUpdate: (diag) => setDiagnostics(diag),
      onLog: (newLog) => setLogs((prev: AddisLogEntry[]) => [...prev.slice(-150), newLog]),
      onVesperSpeechText: (text) => {
        if (!text.trim()) return;
        const utterance: LiveUtterance = {
          id: `vesper-${Date.now()}`,
          speaker: 'vesper',
          speakerLabel: 'VESPER',
          text: text.trim(),
          timestamp: formatTimestamp(),
          language,
        };
        setTranscriptLogs((prev: LiveUtterance[]) => [...prev, utterance]);
        fullConversationRef.current.push({ speaker: 'Vesper', text: text.trim() });
        onTurnComplete?.(text.trim(), false);
      },
      onUserSpeechSegment: (blob) => {
        processUserAudioSTT(blob, language);
      },
      onSetupComplete: async () => {
        // STEP 1 — Initial Greeting from library.ts
        updateEligibilityStep('STEP1_GREETING');
        const greetingText = getGreeting(language);

        const greetingUtterance: LiveUtterance = {
          id: `greeting-${Date.now()}`,
          speaker: 'vesper',
          speakerLabel: 'VESPER',
          text: greetingText,
          timestamp: formatTimestamp(),
          language,
        };

        setTranscriptLogs([greetingUtterance]);
        fullConversationRef.current = [{ speaker: 'Vesper', text: greetingText }];

        // Speak greeting out loud via Addis AI Text-to-Speech
        await serviceRef.current?.speakTTS(greetingText, language);

        // STEP 2 — Eligibility Question 1
        updateEligibilityStep('STEP2_Q1');
        const q1Text = getEligibilityQuestion(language, 1);
        const q1Utterance: LiveUtterance = {
          id: `q1-${Date.now()}`,
          speaker: 'vesper',
          speakerLabel: 'VESPER',
          text: q1Text,
          timestamp: formatTimestamp(),
          language,
        };

        setTranscriptLogs((prev) => [...prev, q1Utterance]);
        fullConversationRef.current.push({ speaker: 'Vesper', text: q1Text });

        // Speak Question 1 using Addis AI Text-to-Speech
        await serviceRef.current?.speakTTS(q1Text, language);
      },
      onError: (cat, msg) => {
        setErrorCategory(cat);
        setErrorMessage(msg);
      },
    });

    serviceRef.current = service;

    return () => {
      service.stop();
    };
  }, [language, onTurnComplete, processUserAudioSTT]);

  const startSession = useCallback(
    async (apiKey?: string) => {
      setErrorCategory(null);
      setErrorMessage(null);
      setTranscriptLogs([]);
      fullConversationRef.current = [];
      updateEligibilityStep('IDLE');

      if (!serviceRef.current) return false;
      return await serviceRef.current.startSession(apiKey);
    },
    []
  );

  const stopSession = useCallback(() => {
    updateEligibilityStep('IDLE');
    if (serviceRef.current) {
      serviceRef.current.stop();
    }
  }, []);

  const interruptVesperAudio = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.interruptPlayback();
    }
  }, []);

  const sendClientPrompt = useCallback((text: string) => {
    handleUserSpeechText(text, language);
  }, [handleUserSpeechText, language]);

  return {
    state,
    eligibilityStep,
    diagnostics,
    logs,
    transcriptLogs,
    extractedData,
    isExtracting,
    errorCategory,
    errorMessage,
    startSession,
    stopSession,
    interruptVesperAudio,
    sendClientPrompt,
    setTranscriptLogs,
    runExtraction,
  };
}
