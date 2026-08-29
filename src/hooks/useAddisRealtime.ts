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

export interface LiveUtterance {
  id: string;
  speaker: 'owner' | 'vesper' | 'system';
  speakerLabel: string;
  text: string;
  timestamp: string;
  language: Language;
  confidence?: number;
}

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
        const confidence = data.confidence ?? data.result?.confidence ?? 0.95;

        if (text && text.trim()) {
          const cleanText = text.trim();
          const utterance: LiveUtterance = {
            id: `owner-${Date.now()}`,
            speaker: 'owner',
            speakerLabel: 'OWNER',
            text: cleanText,
            timestamp: formatTimestamp(),
            language: currentLang,
            confidence,
          };

          setTranscriptLogs((prev: LiveUtterance[]) => [...prev, utterance]);
          fullConversationRef.current.push({ speaker: 'Owner', text: cleanText });

          onTurnComplete?.(cleanText, true);

          const fullText = fullConversationRef.current.map((t: { speaker: string; text: string }) => `${t.speaker}: ${t.text}`).join('\n');
          runExtraction(fullText, currentLang);
        }
      } catch (sttErr) {
        console.warn('Addis STT process warning:', sttErr);
      }
    },
    [onTurnComplete, runExtraction]
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
      onSetupComplete: () => {
        let greetingText = "Hello, I'm Vesper. I'll help you prepare your business funding application.";
        if (language === 'am') {
          greetingText = 'ሰላም፣ እኔ ቬስፐር ነኝ። ለንግድዎ የገንዘብ ድጋፍ ማመልከቻ ላዘጋጅ እረዳዎታለሁ።';
        } else if (language === 'om') {
          greetingText = 'Baga nagaan dhuftan! Ani Vesper dha; iyyannoo liqii keessan qopheessuuf isin gargaara.';
        }

        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const timestampStr = `${hours.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;

        const greetingUtterance: LiveUtterance = {
          id: `greeting-${Date.now()}`,
          speaker: 'vesper',
          speakerLabel: 'VESPER',
          text: greetingText,
          timestamp: timestampStr,
          language,
        };

        setTranscriptLogs([greetingUtterance]);
        fullConversationRef.current = [{ speaker: 'Vesper', text: greetingText }];

        // Speak greeting out loud & send prompt frame over WebSocket
        serviceRef.current?.speakGreeting(greetingText, language);
        serviceRef.current?.sendClientPrompt(greetingText);
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

      if (!serviceRef.current) return false;
      return await serviceRef.current.startSession(apiKey);
    },
    []
  );

  const stopSession = useCallback(() => {
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
    if (serviceRef.current) {
      serviceRef.current.sendClientPrompt(text);
    }
  }, []);

  return {
    state,
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
