import { useCallback, useEffect, useRef, useState } from 'react';
import type { Language } from '../types';
import { AddisRealtimeService, AddisRealtimeState, AddisErrorCategory } from '../lib/addisRealtimeService';

export interface LiveUtterance { id: string; speaker: 'owner' | 'vesper' | 'system'; speakerLabel: string; text: string; timestamp: string; language: Language; confidence?: number; }

const greeting = 'ሰላም፣ ወደ Sequa SME Support እንኳን በደህና መጡ። ስለ ንግድዎ በአጭሩ ይንገሩኝ።';
const instruction = (language: Language) => language === 'am' ? `You are Sequa SME Support. Speak natural Amharic only. Be warm and conversational, never a rigid questionnaire. Help the caller understand and prepare their SME funding application. Begin by saying exactly: ${greeting}` : language === 'om' ? 'You are Sequa SME Support. Speak natural Afaan Oromoo. Be warm and conversational, never a rigid questionnaire. Help the caller understand and prepare their SME funding application.' : 'You are Sequa SME Support. Speak natural English. Be warm and conversational, never a rigid questionnaire. Help the caller understand and prepare their SME funding application.';

export function useAddisRealtime({ language, onFieldUpdate: _onFieldUpdate }: { language: Language; onFieldUpdate?: (fields: unknown, notes: string) => void }) {
  const [state, setState] = useState<AddisRealtimeState>('IDLE');
  const [transcriptLogs, setTranscriptLogs] = useState<LiveUtterance[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const serviceRef = useRef<AddisRealtimeService | null>(null);

  useEffect(() => {
    const service = new AddisRealtimeService({
      onStateChange: setState,
      onVesperSpeechText: (text) => setTranscriptLogs((items) => [...items, { id: crypto.randomUUID(), speaker: 'vesper', speakerLabel: 'SEQUA', text, timestamp: new Date().toISOString(), language }]),
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
