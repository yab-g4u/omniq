import { useCallback, useEffect, useRef, useState } from 'react';
import type { Language } from '../types';
import { AddisRealtimeService, AddisRealtimeState, AddisErrorCategory } from '../lib/addisRealtimeService';
import { getGreeting, getEligibilityQuestion, getEligibilityResponse } from '../lib/library';

export interface LiveUtterance { id: string; speaker: 'owner' | 'vesper' | 'system'; speakerLabel: string; text: string; timestamp: string; language: Language; confidence?: number; }

const instruction = (language: Language) => `You are Sequa SME Support, an Ethiopian SME funding assistant. Speak ${language === 'am' ? 'natural Amharic' : language === 'om' ? 'natural Afaan Oromoo' : 'natural English'}. After the eligibility gate, have a friendly natural conversation, ask one follow-up at a time, and never invent information. Understand the business, sector, location, employees, revenue, funding purpose, amount requested, and jobs created.`;

export function useAddisRealtime({ language, onFieldUpdate: _onFieldUpdate }: { language: Language; onFieldUpdate?: (fields: unknown, notes: string) => void }) {
  const [state, setState] = useState<AddisRealtimeState>('IDLE');
  const [transcriptLogs, setTranscriptLogs] = useState<LiveUtterance[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const serviceRef = useRef<AddisRealtimeService | null>(null);
  const gateRef = useRef<1 | 2 | 'done'>(1);

  useEffect(() => {
    const service = new AddisRealtimeService({
      onStateChange: setState,
      onVesperSpeechText: (text) => setTranscriptLogs((items) => [...items, { id: crypto.randomUUID(), speaker: 'vesper', speakerLabel: 'SEQUA', text, timestamp: new Date().toISOString(), language }]),
      onUserSpeechSegment: async (audioBlob) => {
        if (gateRef.current === 'done') return;
        try {
          const bytes = new Uint8Array(await audioBlob.arrayBuffer());
          let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
          const response = await fetch('/api/addis/stt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audioBase64: `data:audio/wav;base64,${btoa(binary)}`, language }) });
          if (!response.ok) throw new Error('Transcription failed');
          const result = await response.json();
          const text = result.text ?? result.data?.transcription;
          if (text) {
            setTranscriptLogs((items) => [...items, { id: crypto.randomUUID(), speaker: 'owner', speakerLabel: 'YOU', text, timestamp: new Date().toISOString(), language, confidence: result.confidence }]);
            const normalized = text.toLowerCase();
            const positive = /^(yes|yeah|yep|የ|አዎ|አዎን|እሺ|eeyyee|eyyee|dhugaa)/i.test(normalized);
            const negative = /^(no|nope|not|አይ|አይደለም|lakki|miti)/i.test(normalized);
            if (!positive && !negative) return;
            if (negative) { gateRef.current = 'done'; await serviceRef.current?.speakGreeting(getEligibilityResponse(language === 'om' ? 'en' : language, false), language); serviceRef.current?.stop(); return; }
            if (gateRef.current === 1) { gateRef.current = 2; await serviceRef.current?.speakGreeting(getEligibilityQuestion(language === 'om' ? 'en' : language, 2), language); }
            else { gateRef.current = 'done'; await serviceRef.current?.speakGreeting(getEligibilityResponse(language === 'om' ? 'en' : language, true), language); serviceRef.current?.sendClientPrompt(instruction(language)); }
          }
        } catch (error) { console.warn('[v0] Addis transcription failed', error); }
      },
      onError: (_category: AddisErrorCategory, message) => setErrorMessage(message),
      onSetupComplete: async () => { gateRef.current = 1; await service.speakGreeting(getGreeting(language === 'om' ? 'en' : language), language); await service.speakGreeting(getEligibilityQuestion(language === 'om' ? 'en' : language, 1), language); },
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
