import { useCallback, useEffect, useRef, useState } from 'react';
import type { Language } from '../types';
import { AddisRealtimeService, AddisRealtimeState, AddisErrorCategory } from '../lib/addisRealtimeService';

export interface LiveUtterance { id: string; speaker: 'owner' | 'vesper' | 'system'; speakerLabel: string; text: string; timestamp: string; language: Language; confidence?: number; }

const greeting = 'ሰላም፣ ወደ Sequa SME Support እንኳን በደህና መጡ።';
const eligibility = 'Before any application questions, complete this exact eligibility gate: greet the applicant first, then ask question 1 exactly: “Is your business legally registered, and has your SME or parent organization been operating for more than 2 years?” Only if they clearly pass, ask question 2 exactly: “Is your business privately owned, rather than state-owned?” If they do not qualify, politely thank them and end the conversation without revealing internal rules or saying they failed. If an answer is ambiguous, ask one brief clarification. Preserve the applicant’s exact answers in the transcript. After both clear passes say exactly: “Thank you. You appear to meet the initial eligibility requirements. Let’s talk about your business.” Then begin a natural SME Support Scheme interview.';
const instruction = (language: Language) => language === 'am' ? `You are Sequa SME Support. Speak only natural Amharic. Be warm and conversational, not a rigid questionnaire. ${eligibility} Begin by saying exactly: ${greeting}, then ask the two eligibility questions in natural Amharic, in order, before any application questions.` : language === 'om' ? `You are Sequa SME Support. Speak natural Afaan Oromoo. Be warm and conversational. ${eligibility} Begin with a short Afaan Oromoo greeting, then ask the two eligibility questions in order before any application questions.` : `You are Sequa SME Support. Speak natural English. Be warm and conversational. ${eligibility} Begin with a short greeting, then ask the two eligibility questions in order before any application questions.`;

export function useAddisRealtime({ language, onFieldUpdate: _onFieldUpdate }: { language: Language; onFieldUpdate?: (fields: unknown, notes: string) => void }) {
  const [state, setState] = useState<AddisRealtimeState>('IDLE');
  const [transcriptLogs, setTranscriptLogs] = useState<LiveUtterance[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const serviceRef = useRef<AddisRealtimeService | null>(null);

  useEffect(() => {
    const service = new AddisRealtimeService({
      onStateChange: setState,
      onVesperSpeechText: (text) => setTranscriptLogs((items) => [...items, { id: crypto.randomUUID(), speaker: 'vesper', speakerLabel: 'SEQUA', text, timestamp: new Date().toISOString(), language }]),
      onUserSpeechSegment: async (audioBlob) => {
        try {
          const bytes = new Uint8Array(await audioBlob.arrayBuffer());
          let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
          const response = await fetch('/api/addis/stt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audioBase64: `data:audio/wav;base64,${btoa(binary)}`, language }) });
          if (!response.ok) throw new Error('Transcription failed');
          const result = await response.json();
          const text = result.text ?? result.data?.transcription;
          if (text) setTranscriptLogs((items) => [...items, { id: crypto.randomUUID(), speaker: 'owner', speakerLabel: 'YOU', text, timestamp: new Date().toISOString(), language, confidence: result.confidence }]);
        } catch (error) { console.warn('[v0] Addis transcription failed', error); }
      },
      onError: (_category: AddisErrorCategory, message) => setErrorMessage(message),
      onSetupComplete: () => service.sendClientPrompt(instruction(language)),
    });
    serviceRef.current = service;
    return () => service.stop();
  }, [language]);

  const startSession = useCallback(async () => { setErrorMessage(null); setTranscriptLogs([]); return serviceRef.current?.startSession() ?? false; }, []);
  const stopSession = useCallback(() => serviceRef.current?.stop(), []);
  const sendClientPrompt = useCallback((text: string) => serviceRef.current?.sendClientPrompt(text), []);
  const interruptVesperAudio = useCallback(() => serviceRef.current?.interruptPlayback(), []);
  const runExtraction = useCallback(() => undefined, []);
  return {
    state, transcriptLogs, errorMessage, startSession, stopSession,
    diagnostics: (serviceRef.current?.getDiagnostics() ?? {}) as any, logs: [] as any[], extractedData: undefined as any,
    isExtracting: false, errorCategory: null as any, interruptVesperAudio, sendClientPrompt,
    setTranscriptLogs, runExtraction,
  };
}
