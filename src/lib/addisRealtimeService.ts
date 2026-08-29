// Addis AI Realtime WebSocket & Audio Pipeline Service
// Endpoint: wss://relay.addisassistant.com/ws?apiKey=YOUR_API_KEY
// Input:  16,000 Hz, Float32 -> signed PCM16 -> Base64 JSON (sent ONLY after setupComplete)
// Output: 24,000 Hz, Base64 -> signed PCM16 -> Float32 -> AudioBufferSourceNode queue

export type AddisConnectionStage =
  | 'IDLE'
  | 'CONNECTING'
  | 'WEBSOCKET_CONNECTED'
  | 'WAITING_FOR_SETUP'
  | 'SETUP_COMPLETE'
  | 'MICROPHONE_ACTIVE'
  | 'STREAMING_AUDIO'
  | 'AI_AUDIO_RECEIVED'
  | 'PLAYING_RESPONSE'
  | 'TURN_COMPLETE'
  | 'ERROR'
  | 'CLOSED';

export interface AddisLogEntry {
  id: string;
  time: string;
  stage: AddisConnectionStage;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'audio' | 'server';
  payload?: any;
}

export interface AddisRealtimeEventHandlers {
  onStageChange?: (stage: AddisConnectionStage) => void;
  onLog?: (log: AddisLogEntry) => void;
  onVesperSpeakingChange?: (isSpeaking: boolean) => void;
  onUserSpeakingChange?: (isSpeaking: boolean) => void;
  onMicVolumeChange?: (volume: number) => void;
  onTranscriptReceived?: (text: string, speaker: 'vesper' | 'user') => void;
  onTurnComplete?: () => void;
  onError?: (error: string) => void;
  onClose?: (code: number, reason: string) => void;
}

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

// Conversion helpers
export function float32ToInt16PCM(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

export function arrayBufferToBase64(buffer: ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer as ArrayBuffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToInt16Array(base64: string): Int16Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

export class AddisRealtimeService {
  private socket: WebSocket | null = null;
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private muteGainNode: GainNode | null = null;

  private isSetupComplete: boolean = false;
  private isConnected: boolean = false;
  private isStreamingAudio: boolean = false;
  private isVesperSpeaking: boolean = false;
  private isUserSpeaking: boolean = false;
  private stage: AddisConnectionStage = 'IDLE';

  private activeAudioSources: AudioBufferSourceNode[] = [];
  private nextPlayTime: number = 0;
  private speechStreakCount: number = 0;
  private handlers: AddisRealtimeEventHandlers = {};
  private apiKey: string = '';

  constructor(handlers: AddisRealtimeEventHandlers = {}) {
    this.handlers = handlers;
  }

  public setHandlers(handlers: AddisRealtimeEventHandlers) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  private log(
    stage: AddisConnectionStage,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' | 'audio' | 'server' = 'info',
    payload?: any
  ) {
    this.stage = stage;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    const logEntry: AddisLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: timeStr,
      stage,
      message,
      type,
      payload,
    };

    console.log(`[Addis Realtime] [${stage}] ${message}`, payload || '');
    this.handlers.onLog?.(logEntry);
    this.handlers.onStageChange?.(stage);
  }

  // 1. Connect to Addis Realtime WebSocket endpoint
  public async connect(apiKey?: string, wsEndpointOverride?: string): Promise<boolean> {
    try {
      this.stop(); // Clean any previous session

      this.log('CONNECTING', 'Initiating Addis AI Realtime WebSocket handshake...', 'info');

      let targetWsUrl = wsEndpointOverride;
      let finalKey = apiKey;

      if (!targetWsUrl) {
        if (!finalKey) {
          // Fetch token/URL securely from local server endpoint
          const sessionRes = await fetch('/api/addis/session');
          if (!sessionRes.ok) {
            throw new Error(`Server returned session error ${sessionRes.status}: ${await sessionRes.text()}`);
          }
          const sessionJson = await sessionRes.json();
          targetWsUrl = sessionJson.wsUrl;
        } else {
          targetWsUrl = `wss://relay.addisassistant.com/ws?apiKey=${encodeURIComponent(finalKey)}`;
        }
      }

      if (!targetWsUrl) {
        throw new Error('No WebSocket URL available. ADDIS_API_KEY is required.');
      }

      // Initialize Output AudioContext at exactly 24000 Hz
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.outputContext = new AudioCtx({ sampleRate: OUTPUT_SAMPLE_RATE });
        if (this.outputContext.state === 'suspended') {
          await this.outputContext.resume();
        }
        this.nextPlayTime = this.outputContext.currentTime;
      } catch (err: any) {
        this.log('ERROR', `Output AudioContext (24kHz) init error: ${err.message}`, 'warning');
      }

      this.socket = new WebSocket(targetWsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.isSetupComplete = false;
        this.log('WEBSOCKET_CONNECTED', 'WebSocket connected to relay.addisassistant.com', 'success');
        this.log('WAITING_FOR_SETUP', 'Waiting for {"setupComplete": true} from server before streaming audio...', 'info');
      };

      this.socket.onmessage = async (event: MessageEvent) => {
        await this.handleServerMessage(event.data);
      };

      this.socket.onerror = (event: Event) => {
        const errMsg = 'WebSocket connection error occurred.';
        this.log('ERROR', errMsg, 'error', event);
        this.handlers.onError?.(errMsg);
      };

      this.socket.onclose = (event: CloseEvent) => {
        this.isConnected = false;
        this.isSetupComplete = false;
        this.isStreamingAudio = false;
        const reason = event.reason || (event.code === 1000 ? 'Normal session closure' : 'Session closed by server/client');
        this.log('CLOSED', `WebSocket Closed: Code=${event.code} (${reason})`, event.code === 1000 ? 'info' : 'warning');
        this.handlers.onClose?.(event.code, reason);
      };

      return true;
    } catch (err: any) {
      const msg = err?.message || 'Failed to connect to Addis Realtime';
      this.log('ERROR', msg, 'error');
      this.handlers.onError?.(msg);
      return false;
    }
  }

  // 2. Start Microphone (16,000 Hz, Mono, PCM16 conversion)
  public async startMicrophone(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone getUserMedia API is not supported in this browser.');
      }

      // Initialize Input AudioContext at exactly 16000 Hz
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.inputContext || this.inputContext.state === 'closed') {
        this.inputContext = new AudioCtx({ sampleRate: INPUT_SAMPLE_RATE });
      }
      if (this.inputContext.state === 'suspended') {
        await this.inputContext.resume();
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: INPUT_SAMPLE_RATE,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      this.sourceNode = this.inputContext.createMediaStreamSource(this.mediaStream);

      // ScriptProcessor to capture PCM16 16kHz frames (2048 samples = ~128ms chunks)
      this.processorNode = this.inputContext.createScriptProcessor(2048, 1, 1);

      // Mute gain node to prevent microphone feedback loops
      this.muteGainNode = this.inputContext.createGain();
      this.muteGainNode.gain.value = 0;

      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.muteGainNode);
      this.muteGainNode.connect(this.inputContext.destination);

      this.log('MICROPHONE_ACTIVE', 'Microphone active at 16000Hz (PCM16 Int16 converter ready)', 'success');

      // Audio frame callback
      this.processorNode.onaudioprocess = (event: AudioProcessingEvent) => {
        const float32 = event.inputBuffer.getChannelData(0);

        // Volume / RMS Calculation
        let sumSquares = 0;
        for (let i = 0; i < float32.length; i++) {
          sumSquares += float32[i] * float32[i];
        }
        const rms = Math.sqrt(sumSquares / float32.length);
        const volumeScore = Math.min(100, Math.round(rms * 450));
        this.handlers.onMicVolumeChange?.(volumeScore);

        // Voice activity / Interruption detection
        if (rms > 0.035) {
          this.speechStreakCount++;
          if (this.speechStreakCount >= 2) {
            if (!this.isUserSpeaking) {
              this.isUserSpeaking = true;
              this.handlers.onUserSpeakingChange?.(true);
            }
            // Barge-in: if Vesper is speaking, stop playback immediately
            if (this.isVesperSpeaking) {
              this.interruptPlayback();
            }
          }
        } else {
          this.speechStreakCount = Math.max(0, this.speechStreakCount - 1);
          if (this.speechStreakCount === 0 && this.isUserSpeaking) {
            this.isUserSpeaking = false;
            this.handlers.onUserSpeakingChange?.(false);
          }
        }

        // Send to Addis WebSocket ONLY IF setupComplete has been received!
        if (this.isSetupComplete && this.socket && this.socket.readyState === WebSocket.OPEN) {
          const int16 = float32ToInt16PCM(float32);
          const base64Audio = arrayBufferToBase64(int16.buffer);

          const payload = {
            data: base64Audio,
            mimeType: 'audio/pcm;rate=16000',
          };

          this.socket.send(JSON.stringify(payload));

          if (!this.isStreamingAudio) {
            this.isStreamingAudio = true;
            this.log('STREAMING_AUDIO', 'Streaming PCM16 16000Hz audio chunks to Addis AI...', 'audio');
          }
        }
      };

      return true;
    } catch (err: any) {
      const msg = `Microphone access failed: ${err?.message || err}`;
      this.log('ERROR', msg, 'error');
      this.handlers.onError?.(msg);
      return false;
    }
  }

  // 3. Handle Server WebSocket Messages
  private async handleServerMessage(dataStr: string) {
    try {
      const msg = JSON.parse(dataStr);

      // A. Check for setupComplete
      if (msg.setupComplete === true || msg.type === 'setupComplete') {
        this.isSetupComplete = true;
        this.log('SETUP_COMPLETE', 'Server acknowledged setupComplete: true. Audio transmission unlocked!', 'success', msg);
        return;
      }

      // B. Check for AI Audio response in serverContent.modelTurn.parts[].inlineData.data
      if (msg.serverContent?.modelTurn?.parts && Array.isArray(msg.serverContent.modelTurn.parts)) {
        for (const part of msg.serverContent.modelTurn.parts) {
          // Check for PCM16 audio data
          if (part.inlineData?.data && typeof part.inlineData.data === 'string') {
            const b64Data = part.inlineData.data;
            this.log('AI_AUDIO_RECEIVED', `Received AI audio chunk (${b64Data.length} chars base64, mime: ${part.inlineData.mimeType || 'pcm24k'})`, 'audio');
            await this.playPCM16AudioChunk(b64Data);
          }

          // Check for transcript text in part
          if (part.text && typeof part.text === 'string' && part.text.trim()) {
            this.log('PLAYING_RESPONSE', `AI Response Text: "${part.text.trim()}"`, 'server', { text: part.text });
            this.handlers.onTranscriptReceived?.(part.text.trim(), 'vesper');
          }
        }
      }

      // C. Also check alternative direct audio fields for backwards compatibility
      if (msg.audio && typeof msg.audio === 'string') {
        this.log('AI_AUDIO_RECEIVED', `Received direct audio field (${msg.audio.length} chars)`, 'audio');
        await this.playPCM16AudioChunk(msg.audio);
      }

      // D. Check for turnComplete
      if (msg.serverContent?.turnComplete === true || msg.turnComplete === true) {
        this.log('TURN_COMPLETE', 'Turn complete received from Addis AI', 'success');
        this.handlers.onTurnComplete?.();
      }

      // E. Check for user transcript if server exposes it
      if (msg.serverContent?.userTurn?.parts) {
        for (const part of msg.serverContent.userTurn.parts) {
          if (part.text && typeof part.text === 'string' && part.text.trim()) {
            this.log('TURN_COMPLETE', `Caller Transcript: "${part.text.trim()}"`, 'info');
            this.handlers.onTranscriptReceived?.(part.text.trim(), 'user');
          }
        }
      }

      // F. Server interruption signal
      if (msg.serverContent?.interrupted || msg.interrupted) {
        this.log('PLAYING_RESPONSE', 'Server signaled barge-in interruption. Halting local playback.', 'warning');
        this.interruptPlayback();
      }

      // G. Warnings and errors
      if (msg.warning) {
        this.log('ERROR', `Server Warning: ${JSON.stringify(msg.warning)}`, 'warning', msg.warning);
      }
      if (msg.error) {
        const errorText = typeof msg.error === 'string' ? msg.error : msg.error.message || JSON.stringify(msg.error);
        this.log('ERROR', `Server Error: ${errorText}`, 'error', msg.error);
        this.handlers.onError?.(errorText);
      }

      // H. Usage metadata
      if (msg.usageMetadata) {
        this.log('TURN_COMPLETE', `Usage Metadata: ${JSON.stringify(msg.usageMetadata)}`, 'info', msg.usageMetadata);
      }
    } catch (err: any) {
      this.log('ERROR', `Failed to parse server message: ${err.message}`, 'warning', dataStr.slice(0, 200));
    }
  }

  // 4. Playback PCM16 Audio at 24000 Hz
  private async playPCM16AudioChunk(base64Data: string) {
    try {
      if (!this.outputContext) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.outputContext = new AudioCtx({ sampleRate: OUTPUT_SAMPLE_RATE });
      }
      if (this.outputContext.state === 'suspended') {
        await this.outputContext.resume();
      }

      const pcm16 = base64ToInt16Array(base64Data);
      if (pcm16.length === 0) return;

      // Convert Int16 -> Float32
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768;
      }

      const audioBuffer = this.outputContext.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
      audioBuffer.copyToChannel(float32, 0);

      const sourceNode = this.outputContext.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(this.outputContext.destination);

      // Queue playback seamlessly without overlap
      const startAt = Math.max(this.outputContext.currentTime, this.nextPlayTime);
      sourceNode.start(startAt);
      this.nextPlayTime = startAt + audioBuffer.duration;

      this.activeAudioSources.push(sourceNode);

      if (!this.isVesperSpeaking) {
        this.isVesperSpeaking = true;
        this.handlers.onVesperSpeakingChange?.(true);
      }

      sourceNode.onended = () => {
        this.activeAudioSources = this.activeAudioSources.filter((s) => s !== sourceNode);
        if (this.activeAudioSources.length === 0) {
          this.isVesperSpeaking = false;
          this.handlers.onVesperSpeakingChange?.(false);
        }
      };
    } catch (err: any) {
      this.log('ERROR', `Audio playback error: ${err.message}`, 'warning');
    }
  }

  // 5. Immediate Barge-in / Interruption
  public interruptPlayback() {
    if (this.activeAudioSources.length > 0) {
      this.activeAudioSources.forEach((src) => {
        try {
          src.stop();
          src.disconnect();
        } catch {
          // ignore
        }
      });
      this.activeAudioSources = [];
    }
    if (this.outputContext) {
      this.nextPlayTime = this.outputContext.currentTime;
    }
    if (this.isVesperSpeaking) {
      this.isVesperSpeaking = false;
      this.handlers.onVesperSpeakingChange?.(false);
    }
  }

  // 6. Stop Entire Session & Free Hardware Resources
  public stop() {
    this.interruptPlayback();

    // Stop mic processor and tracks
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.muteGainNode) {
      this.muteGainNode.disconnect();
      this.muteGainNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.inputContext && this.inputContext.state !== 'closed') {
      try {
        this.inputContext.close();
      } catch {
        // ignore
      }
      this.inputContext = null;
    }

    // Close WebSocket
    if (this.socket) {
      try {
        if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
          this.socket.close(1000, 'Session stopped by user');
        }
      } catch {
        // ignore
      }
      this.socket = null;
    }

    this.isConnected = false;
    this.isSetupComplete = false;
    this.isStreamingAudio = false;
    this.isUserSpeaking = false;
    this.isVesperSpeaking = false;
    this.stage = 'IDLE';
    this.handlers.onVesperSpeakingChange?.(false);
    this.handlers.onUserSpeakingChange?.(false);
    this.handlers.onMicVolumeChange?.(0);
    this.log('IDLE', 'Session ended and audio contexts released.', 'info');
  }

  public getStatus() {
    return {
      stage: this.stage,
      isConnected: this.isConnected,
      isSetupComplete: this.isSetupComplete,
      isStreamingAudio: this.isStreamingAudio,
      isVesperSpeaking: this.isVesperSpeaking,
      isUserSpeaking: this.isUserSpeaking,
      wsReadyState: this.socket?.readyState ?? WebSocket.CLOSED,
    };
  }
}
