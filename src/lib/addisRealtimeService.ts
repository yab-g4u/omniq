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

function float32ToInt16PCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);

  for (let i = 0; i < input.length; i++) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    output[i] = sample < 0
      ? sample * 0x8000
      : sample * 0x7fff;
  }

  return output;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

function timestampNow(): string {
  return new Date().toISOString();
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

  private setupComplete = false;
  private canStreamAudio = false;

  private nextPlayTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];

  private setupTimer: ReturnType<typeof setTimeout> | null = null;

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
    this.callbacks = {
      ...this.callbacks,
      ...callbacks,
    };
  }

  public getState() {
    return this.state;
  }

  public getDiagnostics() {
    return { ...this.diagnostics };
  }

  private setState(state: AddisRealtimeState) {
    this.state = state;

    this.log(
      state,
      `State changed to ${state}`,
      'info'
    );

    this.callbacks.onStateChange?.(state);
    this.emitDiagnostics();
  }

  private emitDiagnostics() {
    this.callbacks.onDiagnosticsUpdate?.({
      ...this.diagnostics,
    });
  }

  private log(
    state: AddisRealtimeState,
    message: string,
    type:
      | 'info'
      | 'success'
      | 'warning'
      | 'error'
      | 'audio'
      | 'server' = 'info',
    payload?: any
  ) {
    console.log(
      `[AddisRealtime] [${state}] ${message}`,
      payload ?? ''
    );

    this.callbacks.onLog?.({
      id: `${Date.now()}-${Math.random()}`,
      timestamp: timestampNow(),
      state,
      message,
      type,
      payload,
    });
  }

  private error(
    category: AddisErrorCategory,
    message: string,
    payload?: any
  ) {
    console.error(
      `[AddisRealtime] ${category}: ${message}`,
      payload
    );

    this.diagnostics.lastServerError = message;
    this.diagnostics.errorCategory = category;

    this.setState('ERROR');

    this.callbacks.onError?.(
      category,
      message
    );
  }

  // ============================================================
  // START
  // ============================================================

  public async startSession(
    apiKey?: string,
    customWsUrl?: string
  ): Promise<boolean> {

    if (
      this.state !== 'IDLE' &&
      this.state !== 'ENDED' &&
      this.state !== 'ERROR'
    ) {
      return false;
    }

    try {
      this.reset();

      this.setState('CONNECTING');

      // --------------------------------------------------------
      // 1. MICROPHONE
      // --------------------------------------------------------

      this.log(
        'CONNECTING',
        'Requesting microphone permission...'
      );

      this.mediaStream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

      this.diagnostics.hasMicPermission = true;

      // --------------------------------------------------------
      // 2. OUTPUT AUDIO
      // --------------------------------------------------------

      const AudioContextClass =
        window.AudioContext ||
        (window as any).webkitAudioContext;

      this.outputContext =
        new AudioContextClass({
          sampleRate: OUTPUT_SAMPLE_RATE,
        });

      await this.outputContext.resume();

      this.diagnostics.outputAudioContextState =
        this.outputContext.state;

      this.diagnostics.outputSampleRate =
        this.outputContext.sampleRate;

      this.nextPlayTime =
        this.outputContext.currentTime;

      // --------------------------------------------------------
      // 3. INPUT AUDIO
      // --------------------------------------------------------

      this.inputContext =
        new AudioContextClass({
          sampleRate: INPUT_SAMPLE_RATE,
        });

      await this.inputContext.resume();

      this.diagnostics.inputAudioContextState =
        this.inputContext.state;

      this.diagnostics.inputSampleRate =
        this.inputContext.sampleRate;

      // --------------------------------------------------------
      // 4. MICROPHONE PROCESSOR
      // --------------------------------------------------------

      this.sourceNode =
        this.inputContext.createMediaStreamSource(
          this.mediaStream
        );

      this.processorNode =
        this.inputContext.createScriptProcessor(
          2048,
          1,
          1
        );

      this.muteGainNode =
        this.inputContext.createGain();

      this.muteGainNode.gain.value = 0;

      this.sourceNode.connect(
        this.processorNode
      );

      this.processorNode.connect(
        this.muteGainNode
      );

      this.muteGainNode.connect(
        this.inputContext.destination
      );

      this.processorNode.onaudioprocess =
        (event) => {

          const audio =
            event.inputBuffer.getChannelData(0);

          // microphone level
          let sum = 0;

          for (let i = 0; i < audio.length; i++) {
            sum += audio[i] * audio[i];
          }

          const rms =
            Math.sqrt(sum / audio.length);

          this.diagnostics.micLevel =
            Math.min(100, Math.round(rms * 500));

          // IMPORTANT:
          // Do not send anything until Addis says setupComplete.
          if (
            !this.canStreamAudio ||
            !this.socket ||
            this.socket.readyState !== WebSocket.OPEN
          ) {
            this.emitDiagnostics();
            return;
          }

          try {

            const pcm16 =
              float32ToInt16PCM(audio);

            const base64 =
              arrayBufferToBase64(
                pcm16.buffer
              );

            const message = JSON.stringify({
              data: base64,
              mimeType: 'audio/pcm;rate=16000',
            });

            this.socket.send(message);

            this.diagnostics.isAudioStreaming = true;

            this.diagnostics.lastAudioChunkSentTime =
              timestampNow();

            this.diagnostics.lastAudioChunkSentBytes =
              base64.length;

            if (this.state === 'READY') {
              this.setState('LISTENING');
            }

          } catch (err: any) {

            this.error(
              'AUDIO_ENCODING_ERROR',
              err.message || 'Failed to encode microphone audio'
            );
          }

          this.emitDiagnostics();
        };

      // --------------------------------------------------------
      // 5. GET WEBSOCKET URL
      // --------------------------------------------------------

      let wsUrl = customWsUrl;

      if (!wsUrl) {

        if (apiKey) {

          wsUrl =
            `wss://relay.addisassistant.com/ws?apiKey=${encodeURIComponent(apiKey)}`;

        } else {

          const response =
            await fetch('/api/addis/session');

          if (!response.ok) {
            throw new Error(
              `Session endpoint returned ${response.status}`
            );
          }

          const data =
            await response.json();

          if (!data.wsUrl) {
            throw new Error(
              'Session endpoint did not return wsUrl'
            );
          }

          wsUrl = data.wsUrl;
        }
      }

      // --------------------------------------------------------
      // 6. CONNECT
      // --------------------------------------------------------

      this.log(
        'CONNECTING',
        'Connecting to Addis Realtime...'
      );

      this.socket =
        new WebSocket(wsUrl);

      this.diagnostics.webSocketState =
        'CONNECTING';

      this.socket.onopen = () => {

        this.diagnostics.webSocketState =
          'OPEN';

        this.log(
          'WAITING_FOR_SETUP',
          'Connected. Waiting for Addis setupComplete...',
          'success'
        );

        this.setState(
          'WAITING_FOR_SETUP'
        );
      };

      // --------------------------------------------------------
      // 7. SERVER EVENTS
      // --------------------------------------------------------

      this.socket.onmessage =
        async (event) => {

          try {

            const message =
              JSON.parse(event.data);

            this.diagnostics.lastServerEvent =
              timestampNow();

            this.log(
              this.state,
              'Server event received',
              'server',
              message
            );

            // ------------------------------
            // SETUP
            // ------------------------------

            if (
              message.setupComplete === true ||
              (
                message.type === 'status' &&
                typeof message.message === 'string' &&
                /ready/i.test(message.message)
              )
            ) {

              this.setupComplete = true;
              this.canStreamAudio = true;

              this.diagnostics.setupComplete =
                true;

              this.diagnostics.isAudioStreaming =
                true;

              if (this.setupTimer) {
                clearTimeout(this.setupTimer);
                this.setupTimer = null;
              }

              this.log(
                'READY',
                'Addis Realtime is ready. Microphone streaming started.',
                'success'
              );

              this.setState('READY');

              this.callbacks.onSetupComplete?.();

              return;
            }

            // ------------------------------
            // AI AUDIO
            // ------------------------------

            const parts =
              message
                ?.serverContent
                ?.modelTurn
                ?.parts;

            if (Array.isArray(parts)) {

              for (const part of parts) {

                if (
                  part?.inlineData?.data
                ) {

                  const audio =
                    part.inlineData.data;

                  this.diagnostics.lastAiAudioReceivedTime =
                    timestampNow();

                  this.diagnostics.lastAiAudioReceivedBytes =
                    audio.length;

                  this.log(
                    'VESPER_SPEAKING',
                    `AI audio received (${audio.length} bytes)`,
                    'audio'
                  );

                  await this.playAudio(audio);
                }

                if (
                  typeof part?.text === 'string' &&
                  part.text.trim()
                ) {

                  this.callbacks
                    .onVesperSpeechText?.(
                      part.text.trim()
                    );
                }
              }
            }

            // ------------------------------
            // TURN COMPLETE
            // ------------------------------

            if (
              message?.serverContent?.turnComplete === true
            ) {

              this.diagnostics.turnComplete =
                true;

              this.callbacks
                .onTurnComplete?.();
            }

            // ------------------------------
            // INTERRUPTION
            // ------------------------------

            if (
              message?.serverContent?.interrupted === true
            ) {

              this.interruptPlayback();
            }

            // ------------------------------
            // ERROR
            // ------------------------------

            if (message?.error) {

              const errorMessage =
                typeof message.error === 'string'
                  ? message.error
                  : message.error.message ||
                    JSON.stringify(message.error);

              this.error(
                'ADDIS_SERVER_ERROR',
                errorMessage,
                message.error
              );
            }

            this.emitDiagnostics();

          } catch (err: any) {

            this.log(
              this.state,
              `Invalid server message: ${err.message}`,
              'warning'
            );
          }
        };

      // --------------------------------------------------------
      // 8. WEBSOCKET ERROR
      // --------------------------------------------------------

      this.socket.onerror = () => {

        this.diagnostics.webSocketState =
          'ERROR';

        this.error(
          'WEBSOCKET_ERROR',
          'Addis WebSocket error'
        );
      };

      // --------------------------------------------------------
      // 9. CLOSED
      // --------------------------------------------------------

      this.socket.onclose =
        (event) => {

          this.diagnostics.webSocketState =
            'CLOSED';

          this.diagnostics.webSocketCloseCode =
            event.code;

          this.diagnostics.webSocketCloseReason =
            event.reason || 'No close reason';

          this.canStreamAudio = false;

          this.log(
            'ENDED',
            `WebSocket closed: ${event.code} ${event.reason || ''}`,
            event.code === 1000
              ? 'info'
              : 'warning'
          );

          if (
            event.code !== 1000 &&
            this.state !== 'ENDING' &&
            this.state !== 'ENDED'
          ) {

            this.error(
              'WEBSOCKET_CLOSED',
              `WebSocket closed with code ${event.code}: ${event.reason || 'unknown'}`
            );

          }
        };

      // --------------------------------------------------------
      // 10. SETUP TIMEOUT
      // --------------------------------------------------------

      this.setupTimer =
        setTimeout(() => {

          if (!this.setupComplete) {

            this.error(
              'SETUP_TIMEOUT',
              'Addis did not send setupComplete within 15 seconds'
            );
          }

        }, 15000);

      return true;

    } catch (err: any) {

      this.error(
        'WEBSOCKET_ERROR',
        err.message || 'Failed to start realtime session'
      );

      return false;
    }
  }

  // ============================================================
  // PLAY AI AUDIO
  // ============================================================

  private async playAudio(
    base64Audio: string
  ) {

    try {

      if (!this.outputContext) {
        return;
      }

      if (
        this.outputContext.state === 'suspended'
      ) {
        await this.outputContext.resume();
      }

      const buffer =
        base64ToArrayBuffer(
          base64Audio
        );

      const pcm16 =
        new Int16Array(buffer);

      if (!pcm16.length) {
        return;
      }

      const float32 =
        new Float32Array(
          pcm16.length
        );

      for (
        let i = 0;
        i < pcm16.length;
        i++
      ) {
        float32[i] =
          pcm16[i] / 32768;
      }

      const audioBuffer =
        this.outputContext.createBuffer(
          1,
          float32.length,
          OUTPUT_SAMPLE_RATE
        );

      audioBuffer.copyToChannel(
        float32,
        0
      );

      const source =
        this.outputContext.createBufferSource();

      source.buffer = audioBuffer;

      source.connect(
        this.outputContext.destination
      );

      const startTime =
        Math.max(
          this.outputContext.currentTime,
          this.nextPlayTime
        );

      source.start(startTime);

      this.nextPlayTime =
        startTime + audioBuffer.duration;

      this.activeSources.push(
        source
      );

      this.diagnostics.playbackState =
        'PLAYING';

      this.setState(
        'VESPER_SPEAKING'
      );

      source.onended = () => {

        this.activeSources =
          this.activeSources.filter(
            (item) => item !== source
          );

        if (
          this.activeSources.length === 0
        ) {

          this.diagnostics.playbackState =
            'IDLE';

          this.setState(
            'LISTENING'
          );
        }

        this.emitDiagnostics();
      };

    } catch (err: any) {

      this.error(
        'AUDIO_PLAYBACK_ERROR',
        err.message || 'Failed to play AI audio'
      );
    }
  }

  // ============================================================
  // INTERRUPT AI
  // ============================================================

  public interruptPlayback() {

    for (const source of this.activeSources) {

      try {
        source.stop();
        source.disconnect();
      } catch {}
    }

    this.activeSources = [];

    if (this.outputContext) {
      this.nextPlayTime =
        this.outputContext.currentTime;
    }

    this.diagnostics.playbackState =
      'IDLE';

    if (this.state === 'VESPER_SPEAKING') {
      this.setState('LISTENING');
    }

    this.emitDiagnostics();
  }

  // ============================================================
  // STOP
  // ============================================================

  public async stop() {

    this.canStreamAudio = false;
    this.setupComplete = false;

    this.setState('ENDING');

    if (this.setupTimer) {
      clearTimeout(this.setupTimer);
      this.setupTimer = null;
    }

    this.interruptPlayback();

    try {
      this.processorNode?.disconnect();
    } catch {}

    try {
      this.sourceNode?.disconnect();
    } catch {}

    try {
      this.muteGainNode?.disconnect();
    } catch {}

    this.processorNode = null;
    this.sourceNode = null;
    this.muteGainNode = null;

    if (this.mediaStream) {

      this.mediaStream
        .getTracks()
        .forEach(track => track.stop());

      this.mediaStream = null;
    }

    if (this.socket) {

      try {

        if (
          this.socket.readyState === WebSocket.OPEN ||
          this.socket.readyState === WebSocket.CONNECTING
        ) {

          this.socket.close(
            1000,
            'client-stop'
          );
        }

      } catch {}

      this.socket = null;
    }

    if (this.inputContext) {

      try {
        await this.inputContext.close();
      } catch {}

      this.inputContext = null;
    }

    if (this.outputContext) {

      try {
        await this.outputContext.close();
      } catch {}

      this.outputContext = null;
    }

    this.setState('ENDED');

    setTimeout(() => {

      if (this.state === 'ENDED') {
        this.setState('IDLE');
      }

    }, 100);
  }

  // ============================================================
  // RESET
  // ============================================================

  private reset() {

    this.setupComplete = false;
    this.canStreamAudio = false;
    this.activeSources = [];
    this.nextPlayTime = 0;

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
