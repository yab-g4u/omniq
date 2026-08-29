import { useState, useRef, useEffect, useCallback } from 'react';
import { Language, ExtractedFieldsMap, ApplicationExtractionResult } from '../types';
import { getApprovedPhrase } from '../data/phraseLibrary';
import { extractFieldsDeterministically, computeBusinessGrade } from '../lib/deterministicExtractor';
import {
  AddisRealtimeService,
  AddisConnectionStage,
  AddisLogEntry,
} from '../lib/addisRealtimeService';

export interface TranscriptLogItem {
  id: string;
  speaker: 'agent' | 'caller' | 'system';
  text: string;
  time: string;
  isInterrupted?: boolean;
  rawPcmDuration?: number;
}

export interface UseAddisRealtimeOptions {
  language: Language;
  onFieldUpdate?: (fields: ExtractedFieldsMap, notes: string) => void;
  onTurnComplete?: (transcript: string, isCaller: boolean) => void;
}

export function useAddisRealtime({
  language,
  onFieldUpdate,
  onTurnComplete,
}: UseAddisRealtimeOptions) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isVesperSpeaking, setIsVesperSpeaking] = useState<boolean>(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState<boolean>(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [hasMicPermission, setHasMicPermission] = useState<boolean>(false);
  const [micStatus, setMicStatus] = useState<'idle' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [stage, setStage] = useState<AddisConnectionStage>('IDLE');
  const [logs, setLogs] = useState<AddisLogEntry[]>([]);
  const [transcriptLogs, setTranscriptLogs] = useState<TranscriptLogItem[]>([]);
  const [currentVesperText, setCurrentVesperText] = useState<string>('');
  const [currentCallerText, setCurrentCallerText] = useState<string>('');
  const [turnCount, setTurnCount] = useState<number>(0);
  const [extractedData, setExtractedData] = useState<ApplicationExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const serviceRef = useRef<AddisRealtimeService | null>(null);
  const accumulatedConversationRef = useRef<{ speaker: string; text: string }[]>([]);

  // Format time mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Trigger live honest extraction after turns (Deterministic engine with zero hallucinations)
  const triggerIncrementalExtraction = useCallback(
    (fullTranscriptText: string, lang: Language) => {
      if (!fullTranscriptText.trim()) return;
      setIsExtracting(true);
      try {
        const localFields = extractFieldsDeterministically(fullTranscriptText, lang);
        const grading = computeBusinessGrade(localFields);

        const localResult: ApplicationExtractionResult = {
          transcript: fullTranscriptText,
          transcript_language: lang === 'am' ? 'am' : lang === 'om' ? 'om' : 'en',
          fields: localFields,
          extraction_notes: 'Extracted in real-time from Addis voice transcription with verbatim source quotes.',
          engine: 'addis-realtime-deterministic',
          processedAt: Date.now(),
          aiGrading: grading,
        };

        setExtractedData(localResult);

        if (onFieldUpdate) {
          onFieldUpdate(localFields, localResult.extraction_notes);
        }
      } catch (e) {
        console.error('[Local Extraction Error]:', e);
      } finally {
        setIsExtracting(false);
      }
    },
    [onFieldUpdate]
  );

  // Initialize service
  useEffect(() => {
    const service = new AddisRealtimeService({
      onStageChange: (newStage) => {
        setStage(newStage);
        if (newStage === 'WEBSOCKET_CONNECTED' || newStage === 'SETUP_COMPLETE' || newStage === 'STREAMING_AUDIO') {
          setIsConnected(true);
          setIsConnecting(false);
        }
        if (newStage === 'STREAMING_AUDIO') {
          setIsStreaming(true);
        }
        if (newStage === 'IDLE' || newStage === 'CLOSED') {
          setIsConnected(false);
          setIsStreaming(false);
        }
      },
      onLog: (newLog) => {
        setLogs((prev) => [...prev.slice(-100), newLog]);
      },
      onMicVolumeChange: (vol) => setMicVolume(vol),
      onVesperSpeakingChange: (speaking) => setIsVesperSpeaking(speaking),
      onUserSpeakingChange: (speaking) => setIsUserSpeaking(speaking),
      onError: (err) => setError(err),
      onClose: (code, reason) => {
        setIsConnected(false);
        setIsStreaming(false);
      },
      onTranscriptReceived: (text, speaker) => {
        if (speaker === 'vesper') {
          setCurrentVesperText(text);
          const newLog: TranscriptLogItem = {
            id: `vesper-${Date.now()}`,
            speaker: 'agent',
            text,
            time: formatTime(turnCount * 8 + 3),
          };
          setTranscriptLogs((prev) => [...prev, newLog]);
          accumulatedConversationRef.current.push({ speaker: 'Vesper', text });
          onTurnComplete?.(text, false);
        } else {
          setCurrentCallerText(text);
          const callerLog: TranscriptLogItem = {
            id: `caller-${Date.now()}`,
            speaker: 'caller',
            text,
            time: formatTime(turnCount * 8 + 1),
          };
          setTranscriptLogs((prev) => [...prev, callerLog]);
          accumulatedConversationRef.current.push({ speaker: 'Caller', text });
          setTurnCount((c) => c + 1);
          onTurnComplete?.(text, true);

          // Trigger extraction on full transcript
          const fullDialogue = accumulatedConversationRef.current
            .map((t) => `${t.speaker}: ${t.text}`)
            .join('\n');
          triggerIncrementalExtraction(fullDialogue, language);
        }
      },
    });

    serviceRef.current = service;

    return () => {
      service.stop();
    };
  }, [language, triggerIncrementalExtraction, onTurnComplete, turnCount]);

  // Connect to Addis Realtime Audio WebSocket & Start Mic
  const startSession = useCallback(
    async (callStartTime = 0) => {
      try {
        setError(null);
        setIsConnecting(true);

        if (!serviceRef.current) return;

        // 1. Connect WebSocket
        const connected = await serviceRef.current.connect();
        if (!connected) {
          setIsConnecting(false);
          return;
        }

        // 2. Start Microphone
        const micGranted = await serviceRef.current.startMicrophone();
        setHasMicPermission(micGranted);
        setMicStatus(micGranted ? 'granted' : 'denied');

        // Initial greeting
        const greetingText =
          getApprovedPhrase('greetings', 'welcome', language) ||
          (language === 'am'
            ? 'እንኳን ወደ 8800 የነፃ የንግድ ብድር አገልግሎት በደህና መጡ። እኔ ቬስፐር ነኝ፤ የብድር ማመልከቻዎን ለማዘጋጀት እረዳዎታለሁ።'
            : language === 'om'
            ? 'Baga gara tajaajila liqii bilisaa 8800 nagaan dhuftan. Ani Vesper dha; iyyannoo liqii keessan qopheessuuf isin gargaara.'
            : 'Welcome to the 8800 Toll-Free Business Funding Hotline. I am Vesper, your voice underwriting assistant.');

        setCurrentVesperText(greetingText);
        const initialLog: TranscriptLogItem = {
          id: `log-${Date.now()}`,
          speaker: 'agent',
          text: greetingText,
          time: '00:01',
        };
        setTranscriptLogs([initialLog]);
        accumulatedConversationRef.current = [{ speaker: 'Vesper', text: greetingText }];
      } catch (err: any) {
        const fullErr = err?.message || 'Addis Realtime session initialization failed.';
        setIsConnecting(false);
        setError(fullErr);
      }
    },
    [language]
  );

  // Submit intentional caller turn
  const submitCallerTurn = useCallback(
    async (spokenText: string, currentCallSeconds = 0) => {
      if (!spokenText.trim()) return;

      // 1. Interrupt any current audio
      if (serviceRef.current) {
        serviceRef.current.interruptPlayback();
      }

      // 2. Log Caller Turn
      const callerTime = formatTime(currentCallSeconds);
      const callerLog: TranscriptLogItem = {
        id: `caller-${Date.now()}`,
        speaker: 'caller',
        text: spokenText,
        time: callerTime,
      };

      setTranscriptLogs((prev) => [...prev, callerLog]);
      accumulatedConversationRef.current.push({ speaker: 'Caller', text: spokenText });
      const nextTurn = turnCount + 1;
      setTurnCount(nextTurn);

      // 3. Immediately trigger live extraction into the table
      const fullText = accumulatedConversationRef.current
        .map((t) => `${t.speaker}: ${t.text}`)
        .join('\n');
      triggerIncrementalExtraction(fullText, language);

      // 4. Request Next Natural Vesper Response from Server
      try {
        const response = await fetch('/api/ivr/voice-turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language,
            stepId: Math.min(nextTurn, 7),
            userSpokenText: spokenText,
          }),
        });

        const data = await response.json();
        const nextResponseText =
          data.responseText || 'እናመሰግናለን። እባክዎ የስራዎን ዝርዝር ይንገሩን።';

        setCurrentVesperText(nextResponseText);
        const nextTime = formatTime(currentCallSeconds + 2);
        const agentLog: TranscriptLogItem = {
          id: `agent-${Date.now()}`,
          speaker: 'agent',
          text: nextResponseText,
          time: nextTime,
        };

        setTranscriptLogs((prev) => [...prev, agentLog]);
        accumulatedConversationRef.current.push({ speaker: 'Vesper', text: nextResponseText });

        // Synthesize via Addis TTS if available
        try {
          const ttsRes = await fetch('/api/addis/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: nextResponseText,
              language,
            }),
          });
          const ttsData = await ttsRes.json();
          if (ttsData.audioBase64) {
            const audio = new Audio(ttsData.audioBase64);
            audio.play().catch((e) => console.warn('TTS playback note:', e));
          }
        } catch {
          // ignore TTS audio error
        }
      } catch (err: any) {
        console.error('[Addis Turn Error]:', err);
      }
    },
    [language, turnCount, triggerIncrementalExtraction]
  );

  // Stop Session
  const stopSession = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stop();
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsStreaming(false);
    setIsVesperSpeaking(false);
    setIsUserSpeaking(false);
  }, []);

  const setupMicrophone = useCallback(async () => {
    if (!serviceRef.current) return false;
    const granted = await serviceRef.current.startMicrophone();
    setHasMicPermission(granted);
    setMicStatus(granted ? 'granted' : 'denied');
    return granted;
  }, []);

  const interruptVesperAudio = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.interruptPlayback();
    }
  }, []);

  return {
    isConnected,
    isConnecting,
    isStreaming,
    isVesperSpeaking,
    isUserSpeaking,
    micVolume,
    hasMicPermission,
    micStatus,
    setupMicrophone,
    stage,
    logs,
    transcriptLogs,
    currentVesperText,
    currentCallerText,
    turnCount,
    extractedData,
    isExtracting,
    error,
    startSession,
    stopSession,
    interruptVesperAudio,
    submitCallerTurn,
    triggerIncrementalExtraction,
    setTranscriptLogs,
  };
}
