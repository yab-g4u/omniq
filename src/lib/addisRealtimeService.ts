// Official Addis AI Realtime Browser Protocol Service
// Endpoint: wss://relay.addisassistant.com/ws?apiKey=YOUR_API_KEY
// Input:  16,000 Hz, Float32 -> Int16 PCM16 -> Base64 JSON over WebSocket
// Output: 24,000 Hz, Base64 PCM16 -> Int16 -> Float32 -> AudioBuffer Queue over WebSocket

export type AddisRealtimeState =
  | 'IDLE'
  | 'CONNECTING'
  | 'WAITING_FOR_SETUP'
  | 'READY'
  | 'LISTENING'
  | 'VESPER_SPEAKING'
  | 'ERROR'
  | 'ENDING'
  | 'ENDED';

export type AddisErrorCategory =
  | 'MIC_PERMISSION_ERROR'
  | 'WEBSOCKET_ERROR'
  | 'WEBSOCKET_CLOSED'
  | 'SETUP_TIMEOUT'
  | 'ADDIS_SERVER_ERROR'
  | 'AUDIO_ENCODING_ERROR'
  | 'AUDIO_PLAYBACK_ERROR'
  | 'STT_ERROR';

export interface AddisLogEntry {
  id: string;
  timestamp: string;
  state: AddisRealtimeState;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'audio' | 'server';
  payload?: any;
}

export interface DiagnosticsState {
  hasMicPermission: boolean;
  inputAudioContextState: string;
  inputSampleRate: number;
  outputAudioContextState: string;
  outputSampleRate: number;
  webSocketState: string;
  setupComplete: boolean;
  isAudioStreaming: boolean;
  lastAudioChunkSentTime: string | null;
  lastAudioChunkSentBytes: number;
  lastServerEvent: string | null;
  lastAiAudioReceivedTime: string | null;
  lastAiAudioReceivedBytes: number;
  playbackState: 'IDLE' | 'PLAYING';
  turnComplete: boolean;
  webSocketCloseCode: number | null;
  webSocketCloseReason: string | null;
  lastServerError: string | null;
  micLevel: number;
  errorCategory: AddisErrorCategory | null;
}

export interface AddisRealtimeCallbacks {
  onStateChange?: (state: AddisRealtimeState) => void;
  onDiagnosticsUpdate?: (diag: DiagnosticsState) => void;
  onLog?: (entry: AddisLogEntry) => void;
  onVesperSpeechText?: (text: string) => void;
  onUserSpeechSegment?: (audioBlob: Blob) => void;
  onTurnComplete?: () => void;
  onSetupComplete?: () => void;
  onError?: (category: AddisErrorCategory, message: string) => void;
}

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

// Convert Float32 [-1.0, 1.0] to signed Int16 PCM16 ArrayBuffer
export function float32ToInt16PCM(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

// ArrayBuffer to Base64
export function arrayBufferToBase64(buffer: ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer as ArrayBuffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Base64 string to Int16Array PCM16
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

  private state: AddisRealtimeState = 'IDLE';
  private callbacks: AddisRealtimeCallbacks = {};

  private setupComplete: boolean = false;
  private canStreamAudio: boolean = false;

  private activeAudioSources: AudioBufferSourceNode[] = [];
  private nextPlayTime: number = 0;

  private speechStreakCount: number = 0;
  private setupTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

  private userAudioChunks: Float32Array[] = [];
  private isCollectingUserAudio: boolean = false;

  private diagnostics: DiagnosticsState = {
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
  };

  constructor(callbacks: AddisRealtimeCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public setCallbacks(callbacks: AddisRealtimeCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public getState(): AddisRealtimeState {
    return this.state;
  }

  public getDiagnostics(): DiagnosticsState {
    return { ...this.diagnostics };
  }

  private setState(newState: AddisRealtimeState) {
    if (this.state === newState) return;
    this.state = newState;
    this.log(newState, `State changed to ${newState}`, 'info');
    this.callbacks.onStateChange?.(newState);
    this.emitDiagnostics();
  }

  private emitDiagnostics() {
    this.callbacks.onDiagnosticsUpdate?.({ ...this.diagnostics });
  }

  private log(
    state: AddisRealtimeState,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' | 'audio' | 'server' = 'info',
    payload?: any
  ) {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    const logEntry: AddisLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp,
      state,
      message,
      type,
      payload,
    };

    console.log(`[AddisRealtime] [${state}] ${message}`, payload ?? '');
    this.callbacks.onLog?.(logEntry);
  }

  private reportError(category: AddisErrorCategory, message: string, payload?: any) {
    this.diagnostics.lastServerError = message;
    this.diagnostics.errorCategory = category;
    this.log(this.state, `Error (${category}): ${message}`, 'error', payload);
    this.setState('ERROR');
    this.callbacks.onError?.(category, message);
  }

  // =========================================================================
  // START REALTIME WEBSOCKET SESSION
  // =========================================================================
  public async startSession(apiKey?: string, customWsUrl?: string): Promise<boolean> {
    if (this.state !== 'IDLE' && this.state !== 'ENDED' && this.state !== 'ERROR') {
      this.log(this.state, 'Session active, ignoring duplicate start call', 'warning');
      return false;
    }

    try {
      this.resetStateVars();
      this.setState('CONNECTING');

      // 1. Request Microphone Permission
      this.log('CONNECTING', 'Requesting microphone permission...', 'info');
      try {
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
        this.diagnostics.hasMicPermission = true;
      } catch (micErr: any) {
        this.diagnostics.hasMicPermission = false;
        this.reportError('MIC_PERMISSION_ERROR', `Microphone access denied: ${micErr.message}`, micErr);
        return false;
      }

      // 2. Initialize Output AudioContext at exactly 24000 Hz
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.outputContext = new AudioCtx({ sampleRate: OUTPUT_SAMPLE_RATE });
      if (this.outputContext.state === 'suspended') {
        await this.outputContext.resume();
      }
      this.diagnostics.outputAudioContextState = this.outputContext.state;
      this.diagnostics.outputSampleRate = this.outputContext.sampleRate;
      this.nextPlayTime = this.outputContext.currentTime;

      // 3. Initialize Input AudioContext at exactly 16000 Hz
      this.inputContext = new AudioCtx({ sampleRate: INPUT_SAMPLE_RATE });
      if (this.inputContext.state === 'suspended') {
        await this.inputContext.resume();
      }
      this.diagnostics.inputAudioContextState = this.inputContext.state;
      this.diagnostics.inputSampleRate = this.inputContext.sampleRate;

      // 4. Create Microphone Audio Nodes & Muted GainNode
      this.sourceNode = this.inputContext.createMediaStreamSource(this.mediaStream);
      this.processorNode = this.inputContext.createScriptProcessor(2048, 1, 1);
      this.muteGainNode = this.inputContext.createGain();
      this.muteGainNode.gain.value = 0; // Muted to prevent feedback

      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.muteGainNode);
      this.muteGainNode.connect(this.inputContext.destination);

      this.processorNode.onaudioprocess = (evt: AudioProcessingEvent) => this.handleAudioProcess(evt);

      // 5. Connect WebSocket directly to Addis AI
      let wsUrl = customWsUrl;
      if (!wsUrl) {
        if (apiKey) {
          wsUrl = `wss://relay.addisassistant.com/ws?apiKey=${encodeURIComponent(apiKey)}`;
        } else {
          const sessionRes = await fetch('/api/addis/session');
          if (!sessionRes.ok) {
            throw new Error(`Failed to fetch session (${sessionRes.status})`);
          }
          const sessionData = await sessionRes.json();
          wsUrl = sessionData.wsUrl;
        }
      }

      if (!wsUrl) {
        throw new Error('WebSocket URL could not be created. ADDIS_API_KEY missing.');
      }

      this.log('CONNECTING', `Connecting WebSocket to ${wsUrl.replace(/apiKey=[^&]+/, 'apiKey=REDACTED')}`, 'info');
      this.socket = new WebSocket(wsUrl);
      this.diagnostics.webSocketState = 'CONNECTING';

      this.setupTimeoutTimer = setTimeout(() => {
        if (!this.setupComplete && (this.state === 'CONNECTING' || this.state === 'WAITING_FOR_SETUP')) {
          this.reportError('SETUP_TIMEOUT', 'Server setupComplete timeout (15000ms)');
        }
      }, 15000);

      this.socket.onopen = () => {
        this.diagnostics.webSocketState = 'OPEN';
        this.log('WAITING_FOR_SETUP', 'WebSocket connected. Waiting for setupComplete from Addis AI...', 'success');
        this.setState('WAITING_FOR_SETUP');
      };

      this.socket.onmessage = (evt: MessageEvent) => {
        this.handleServerMessage(evt.data);
      };

      this.socket.onerror = (evt: Event) => {
        this.diagnostics.webSocketState = 'ERROR';
        this.reportError('WEBSOCKET_ERROR', 'WebSocket transport error', evt);
      };

      this.socket.onclose = (evt: CloseEvent) => {
        this.diagnostics.webSocketState = 'CLOSED';
        this.diagnostics.webSocketCloseCode = evt.code;
        this.diagnostics.webSocketCloseReason = evt.reason || (evt.code === 1000 ? 'Normal closure' : 'Closed unexpectedly');
        this.log('ENDED', `WebSocket Close Code=${evt.code}, Reason="${this.diagnostics.webSocketCloseReason}"`, evt.code === 1000 ? 'info' : 'warning');
        
        if (this.state !== 'ENDING' && this.state !== 'ENDED' && this.state !== 'IDLE') {
          if (evt.code !== 1000) {
            this.reportError('WEBSOCKET_CLOSED', `WebSocket closed with code ${evt.code}: ${this.diagnostics.webSocketCloseReason}`);
          } else {
            this.setState('ENDED');
          }
        }
      };

      return true;
    } catch (err: any) {
      this.reportError('WEBSOCKET_ERROR', `Session startup error: ${err.message || err}`);
      return false;
    }
  }

  // Send client prompt / text turn directly over WebSocket to Addis AI
  public sendClientPrompt(text: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.setupComplete) {
      const payload = {
        clientContent: {
          turns: [
            {
              role: 'user',
              parts: [{ text }],
            },
          ],
          turnComplete: true,
        },
      };
      this.socket.send(JSON.stringify(payload));
      this.log(this.state, `Sent client prompt over WebSocket to Addis AI: "${text}"`, 'info');
    }
  }

  // =========================================================================
  // SERVER WEBSOCKET MESSAGE HANDLING
  // =========================================================================
  private async handleServerMessage(dataStr: string) {
    try {
      this.diagnostics.lastServerEvent = timestampNow();
      const msg = JSON.parse(dataStr);
      this.log(this.state, 'Server Message Received', 'server', msg);

      // A. Check setupComplete
      if (
        msg.setupComplete === true ||
        msg.type === 'setupComplete' ||
        (msg.type === 'status' && msg.message && /ready/i.test(msg.message))
      ) {
        if (this.setupTimeoutTimer) {
          clearTimeout(this.setupTimeoutTimer);
          this.setupTimeoutTimer = null;
        }
        this.setupComplete = true;
        this.canStreamAudio = true;
        this.diagnostics.setupComplete = true;
        this.diagnostics.isAudioStreaming = true;

        this.log('READY', 'Server setup complete! Unlocking microphone audio streaming.', 'success');
        this.setState('READY');
        this.callbacks.onSetupComplete?.();
        setTimeout(() => {
          if (this.state === 'READY') {
            this.setState('LISTENING');
          }
        }, 100);
        return;
      }

      // B. AI Model Turn Output PCM16 Audio
      if (msg.serverContent?.modelTurn?.parts && Array.isArray(msg.serverContent.modelTurn.parts)) {
        for (const part of msg.serverContent.modelTurn.parts) {
          if (part.inlineData?.data && typeof part.inlineData.data === 'string') {
            const b64Data = part.inlineData.data;
            this.diagnostics.lastAiAudioReceivedTime = timestampNow();
            this.diagnostics.lastAiAudioReceivedBytes = b64Data.length;
            this.log('VESPER_SPEAKING', `Received AI PCM16 model audio chunk (${b64Data.length} chars)`, 'audio');
            await this.playPCM16AudioChunk(b64Data);
          }

          if (part.text && typeof part.text === 'string' && part.text.trim()) {
            this.log(this.state, `Vesper Text Response: "${part.text.trim()}"`, 'server');
            this.callbacks.onVesperSpeechText?.(part.text.trim());
          }
        }
      }

      // C. Direct audio field compatibility
      if (msg.audio && typeof msg.audio === 'string') {
        this.diagnostics.lastAiAudioReceivedTime = timestampNow();
        this.diagnostics.lastAiAudioReceivedBytes = msg.audio.length;
        await this.playPCM16AudioChunk(msg.audio);
      }

      // D. Turn Complete
      if (msg.serverContent?.turnComplete === true || msg.turnComplete === true) {
        this.diagnostics.turnComplete = true;
        this.log('LISTENING', 'Turn complete received from Addis AI', 'success');
        this.callbacks.onTurnComplete?.();
        if (this.state === 'VESPER_SPEAKING' && this.activeAudioSources.length === 0) {
          this.setState('LISTENING');
        }
      }

      // E. Interruption signal from server
      if (msg.serverContent?.interrupted || msg.interrupted) {
        this.log('LISTENING', 'Server signaled barge-in interruption. Halting local playback.', 'warning');
        this.interruptPlayback();
      }

      // F. Warnings
      if (msg.warning || msg.type === 'warning') {
        this.log(this.state, `Server Warning: ${JSON.stringify(msg.warning || msg)}`, 'warning');
      }

      // G. Error payload
      if (msg.error) {
        const errorText = typeof msg.error === 'string' ? msg.error : msg.error.message || JSON.stringify(msg.error);
        this.reportError('ADDIS_SERVER_ERROR', errorText, msg.error);
      }

      this.emitDiagnostics();
    } catch (err: any) {
      this.log(this.state, `Failed to parse server JSON: ${err.message}`, 'warning');
    }
  }

  // =========================================================================
  // MICROPHONE CALLBACK & BARGE-IN DETECTION
  // =========================================================================
  private handleAudioProcess(event: AudioProcessingEvent) {
    if (this.state === 'ENDING' || this.state === 'ENDED' || this.state === 'IDLE') return;

    const float32 = event.inputBuffer.getChannelData(0);

    // Calculate RMS volume level
    let sum = 0;
    for (let i = 0; i < float32.length; i++) {
      sum += float32[i] * float32[i];
    }
    const rms = Math.sqrt(sum / float32.length);
    const volumeScore = Math.min(100, Math.round(rms * 400));
    this.diagnostics.micLevel = volumeScore;

    // Barge-in Interruption Detection
    if (rms > 0.035) {
      this.speechStreakCount++;
      if (this.speechStreakCount >= 2) {
        if (!this.isCollectingUserAudio) {
          this.isCollectingUserAudio = true;
          this.userAudioChunks = [];
        }
        this.userAudioChunks.push(new Float32Array(float32));

        if (this.state === 'VESPER_SPEAKING') {
          this.log('LISTENING', 'User voice detected during AI speech! Interupting playback.', 'warning');
          this.interruptPlayback();
        }
      }
    } else {
      this.speechStreakCount = Math.max(0, this.speechStreakCount - 1);
      if (this.speechStreakCount === 0 && this.isCollectingUserAudio) {
        this.isCollectingUserAudio = false;
        this.finalizeUserAudioSegment();
      }
    }

    // Send PCM16 to WebSocket ONLY IF setupComplete is true and session is active
    if (
      this.setupComplete &&
      this.canStreamAudio &&
      this.socket &&
      this.socket.readyState === WebSocket.OPEN &&
      (this.state === 'READY' || this.state === 'LISTENING' || this.state === 'VESPER_SPEAKING')
    ) {
      try {
        const int16 = float32ToInt16PCM(float32);
        const base64PCM = arrayBufferToBase64(int16.buffer);

        const payload = {
          data: base64PCM,
          mimeType: 'audio/pcm;rate=16000',
        };

        this.socket.send(JSON.stringify(payload));

        this.diagnostics.lastAudioChunkSentTime = timestampNow();
        this.diagnostics.lastAudioChunkSentBytes = base64PCM.length;
      } catch (err: any) {
        this.log(this.state, `Audio encoding / WebSocket send error: ${err.message}`, 'warning');
      }
    }

    this.emitDiagnostics();
  }

  private finalizeUserAudioSegment() {
    if (this.userAudioChunks.length === 0) return;
    try {
      const totalLen = this.userAudioChunks.reduce((acc, c) => acc + c.length, 0);
      const merged = new Float32Array(totalLen);
      let offset = 0;
      for (const chunk of this.userAudioChunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      this.userAudioChunks = [];

      const int16 = float32ToInt16PCM(merged);
      const pcmBlob = new Blob([int16.buffer as ArrayBuffer], { type: 'audio/pcm' });
      this.callbacks.onUserSpeechSegment?.(pcmBlob);
    } catch (e) {
      console.warn('Failed to encode user audio segment:', e);
    }
  }

  // =========================================================================
  // AUDIO OUTPUT PLAYBACK (24000 Hz PCM16 from Addis AI Model)
  // =========================================================================
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

      // Convert Int16 [-32768, 32767] -> Float32 [-1.0, 1.0]
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      const audioBuffer = this.outputContext.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
      audioBuffer.copyToChannel(float32, 0);

      const sourceNode = this.outputContext.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(this.outputContext.destination);

      const startAt = Math.max(this.outputContext.currentTime, this.nextPlayTime);
      sourceNode.start(startAt);
      this.nextPlayTime = startAt + audioBuffer.duration;

      this.activeAudioSources.push(sourceNode);
      this.diagnostics.playbackState = 'PLAYING';
      this.setState('VESPER_SPEAKING');

      sourceNode.onended = () => {
        this.activeAudioSources = this.activeAudioSources.filter((s) => s !== sourceNode);
        if (this.activeAudioSources.length === 0) {
          this.diagnostics.playbackState = 'IDLE';
          if (this.state === 'VESPER_SPEAKING') {
            this.setState('LISTENING');
          }
        }
        this.emitDiagnostics();
      };
    } catch (err: any) {
      this.reportError('AUDIO_PLAYBACK_ERROR', `Audio playback error: ${err.message}`, err);
    }
  }

  // Immediate Barge-in / Interruption
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
    this.diagnostics.playbackState = 'IDLE';
    if (this.state === 'VESPER_SPEAKING') {
      this.setState('LISTENING');
    }
  }

  // Synthesize & speak opening greeting audio out loud
  public async speakGreeting(text: string, language: string = 'am') {
    try {
      this.setState('VESPER_SPEAKING');
      this.log(this.state, `Speaking Vesper greeting: "${text}"`, 'info');

      const res = await fetch('/api/addis/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(data.audioBase64);
          this.diagnostics.playbackState = 'PLAYING';
          this.emitDiagnostics();

          audio.onended = () => {
            this.diagnostics.playbackState = 'IDLE';
            if (this.state === 'VESPER_SPEAKING') {
              this.setState('LISTENING');
            }
            this.emitDiagnostics();
          };

          await audio.play();
          return;
        }
      }
    } catch (err: any) {
      this.log(this.state, `Greeting audio playback warning: ${err.message}`, 'warning');
    }

    if (this.state === 'VESPER_SPEAKING') {
      this.setState('LISTENING');
    }
  }

  // =========================================================================
  // STOP & CLEANUP SESSION
  // =========================================================================
  public stop() {
    this.setState('ENDING');

    if (this.setupTimeoutTimer) {
      clearTimeout(this.setupTimeoutTimer);
      this.setupTimeoutTimer = null;
    }

    this.interruptPlayback();

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

    if (this.outputContext && this.outputContext.state !== 'closed') {
      try {
        this.outputContext.close();
      } catch {
        // ignore
      }
      this.outputContext = null;
    }

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

    this.resetStateVars();
    this.setState('ENDED');

    setTimeout(() => {
      if (this.state === 'ENDED') {
        this.setState('IDLE');
      }
    }, 100);
  }

  private resetStateVars() {
    this.setupComplete = false;
    this.canStreamAudio = false;
    this.speechStreakCount = 0;
    this.activeAudioSources = [];
    this.userAudioChunks = [];
    this.isCollectingUserAudio = false;

    this.diagnostics = {
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
    };
  }
}

function timestampNow(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
}
