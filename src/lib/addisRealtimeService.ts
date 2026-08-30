// Addis AI Realtime Browser Protocol Service
// Input:  16kHz PCM16 mono -> Base64 JSON over WebSocket
// Output: 24kHz PCM16 mono -> AudioBuffer playback

import { transcriptAdapter } from './addisTranscriptAdapter';

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

  // AI response text
  onVesperSpeechText?: (text: string) => void;

  // USER transcription
  onUserTranscript?: (text: string) => void;

  onUserSpeechSegment?: (audioBlob: Blob) => void;
  onTurnComplete?: () => void;
  onSetupComplete?: () => void;
  onError?: (
    category: AddisErrorCategory,
    message: string
  ) => void;
}

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

// ============================================================
// AUDIO HELPERS
// ============================================================

export function float32ToInt16PCM(
  input: Float32Array
): Int16Array {
  const output = new Int16Array(input.length);

  for (let i = 0; i < input.length; i++) {
    const sample = Math.max(
      -1,
      Math.min(1, input[i])
    );

    output[i] =
      sample < 0
        ? sample * 0x8000
        : sample * 0x7fff;
  }

  return output;
}

export function arrayBufferToBase64(
  buffer: ArrayBufferLike
): string {
  const bytes = new Uint8Array(buffer);

  let binary = '';

  const chunkSize = 0x8000;

  for (
    let i = 0;
    i < bytes.length;
    i += chunkSize
  ) {
    const chunk = bytes.subarray(
      i,
      Math.min(i + chunkSize, bytes.length)
    );

    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

export function base64ToArrayBuffer(
  base64: string
): ArrayBuffer {
  const binary = atob(base64);

  const bytes =
    new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] =
      binary.charCodeAt(i);
  }

  return bytes.buffer;
}

function timestampNow(): string {
  return new Date().toISOString();
}

// ============================================================
// SERVICE
// ============================================================

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

  private activeSources:
    AudioBufferSourceNode[] = [];

  private speechStreakCount: number = 0;
  private userAudioChunks: Float32Array[] = [];
  private isCollectingUserAudio: boolean = false;
  private sttInProgress: boolean = false;
  private silenceBufferCount: number = 0;
  private currentLanguage: string = 'am';
  private setupTimer: ReturnType<typeof setTimeout> | null = null;

  public setLanguage(lang: string) {
    this.currentLanguage = lang;
  }

  private createWavBlob(pcm16: Int16Array, sampleRate: number = 16000): Blob {
    const buffer = new ArrayBuffer(44 + pcm16.length * 2);
    const view = new DataView(buffer);

    const writeString = (v: DataView, offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        v.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + pcm16.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, pcm16.length * 2, true);

    const pcmBytes = new Uint8Array(pcm16.buffer, pcm16.byteOffset, pcm16.byteLength);
    const targetBytes = new Uint8Array(buffer, 44);
    targetBytes.set(pcmBytes);

    return new Blob([buffer], { type: 'audio/wav' });
  }

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

  constructor(
    callbacks: AddisRealtimeCallbacks = {}
  ) {
    this.callbacks = callbacks;
  }

  public setCallbacks(
    callbacks: AddisRealtimeCallbacks
  ) {
    this.callbacks = {
      ...this.callbacks,
      ...callbacks,
    };
  }

  public getState() {
    return this.state;
  }

  public getDiagnostics() {
    return {
      ...this.diagnostics,
    };
  }

  // ============================================================
  // STATE
  // ============================================================

  private setState(
    state: AddisRealtimeState
  ) {
    this.state = state;

    this.log(
      state,
      `State changed to ${state}`,
      'info'
    );

    this.callbacks.onStateChange?.(
      state
    );

    this.emitDiagnostics();
  }

  private emitDiagnostics() {
    this.callbacks.onDiagnosticsUpdate?.({
      ...this.diagnostics,
    });
  }

  // ============================================================
  // LOGGING
  // ============================================================

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
      id:
        `${Date.now()}-${Math.random()}`,

      timestamp:
        timestampNow(),

      state,

      message,

      type,

      payload,
    });
  }

  private reportError(
    category: AddisErrorCategory,
    message: string,
    payload?: any
  ) {
    console.error(
      `[AddisRealtime] ${category}: ${message}`,
      payload
    );

    this.diagnostics.lastServerError =
      message;

    this.diagnostics.errorCategory =
      category;

    this.setState('ERROR');

    this.callbacks.onError?.(
      category,
      message
    );
  }

  // ============================================================
  // START REALTIME SESSION
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
      this.log(
        this.state,
        'Session already active',
        'warning'
      );

      return false;
    }

    try {

      this.reset();

      this.setState('CONNECTING');

      // --------------------------------------------------------
      // MICROPHONE
      // --------------------------------------------------------

      this.log(
        'CONNECTING',
        'Requesting microphone permission...'
      );

      try {

        this.mediaStream =
          await navigator.mediaDevices
            .getUserMedia({
              audio: {
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
              video: false,
            });

        this.diagnostics.hasMicPermission =
          true;

      } catch (error: any) {

        this.reportError(
          'MIC_PERMISSION_ERROR',
          `Microphone access denied: ${
            error?.message || error
          }`
        );

        return false;
      }

      // --------------------------------------------------------
      // AUDIO CONTEXT
      // --------------------------------------------------------

      const AudioContextClass =
        window.AudioContext ||
        (window as any).webkitAudioContext;

      // OUTPUT

      this.outputContext =
        new AudioContextClass({
          sampleRate:
            OUTPUT_SAMPLE_RATE,
        });

      if (
        this.outputContext.state ===
        'suspended'
      ) {
        await this.outputContext.resume();
      }

      this.diagnostics
        .outputAudioContextState =
        this.outputContext.state;

      this.diagnostics
        .outputSampleRate =
        this.outputContext.sampleRate;

      this.nextPlayTime =
        this.outputContext.currentTime;

      // INPUT

      this.inputContext =
        new AudioContextClass({
          sampleRate:
            INPUT_SAMPLE_RATE,
        });

      if (
        this.inputContext.state ===
        'suspended'
      ) {
        await this.inputContext.resume();
      }

      this.diagnostics
        .inputAudioContextState =
        this.inputContext.state;

      this.diagnostics
        .inputSampleRate =
        this.inputContext.sampleRate;

      // --------------------------------------------------------
      // MICROPHONE PROCESSING
      // --------------------------------------------------------

      this.sourceNode =
        this.inputContext
          .createMediaStreamSource(
            this.mediaStream
          );

      this.processorNode =
        this.inputContext
          .createScriptProcessor(
            2048,
            1,
            1
          );

      this.muteGainNode =
        this.inputContext
          .createGain();

      this.muteGainNode.gain.value =
        0;

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

          if (
            !this.socket ||
            this.socket.readyState !==
              WebSocket.OPEN
          ) {
            return;
          }

          if (!this.canStreamAudio) {
            return;
          }

          const audio =
            event.inputBuffer
              .getChannelData(0);

          // MIC LEVEL

          let sum = 0;

          for (
            let i = 0;
            i < audio.length;
            i++
          ) {
            sum +=
              audio[i] *
              audio[i];
          }

          const rms =
            Math.sqrt(
              sum / audio.length
            );

          this.diagnostics.micLevel =
            Math.min(
              100,
              Math.round(rms * 500)
            );

          // ----------------------------------------------------
          // PCM16
          // ----------------------------------------------------

          try {

            const pcm16 =
              float32ToInt16PCM(
                audio
              );

            const base64 =
              arrayBufferToBase64(
                pcm16.buffer
              );

            const payload = {
              data: base64,
              mimeType:
                'audio/pcm;rate=16000',
            };

            this.socket.send(
              JSON.stringify(payload)
            );

            this.diagnostics
              .isAudioStreaming =
              true;

            this.diagnostics
              .lastAudioChunkSentTime =
              timestampNow();

            this.diagnostics
              .lastAudioChunkSentBytes =
              base64.length;

            if (
              this.state === 'READY'
            ) {
              this.setState(
                'LISTENING'
              );
            }

          } catch (error: any) {

            this.reportError(
              'AUDIO_ENCODING_ERROR',
              error?.message ||
                'Audio encoding failed'
            );
          }

          this.emitDiagnostics();
        };

      // --------------------------------------------------------
      // WEBSOCKET URL
      // --------------------------------------------------------

      let wsUrl =
        customWsUrl;

      if (!wsUrl) {

        if (apiKey) {

          wsUrl =
            `wss://relay.addisassistant.com/ws?apiKey=${encodeURIComponent(
              apiKey
            )}`;

        } else {

          const response =
            await fetch(
              '/api/addis/session'
            );

          if (!response.ok) {

            throw new Error(
              `Session endpoint returned ${response.status}`
            );
          }

          const data =
            await response.json();

          if (!data.wsUrl) {

            throw new Error(
              'No WebSocket URL returned'
            );
          }

          wsUrl =
            data.wsUrl;
        }
      }

      // --------------------------------------------------------
      // CONNECT
      // --------------------------------------------------------

      if (!wsUrl) {
        throw new Error('WebSocket URL could not be created. ADDIS_API_KEY missing.');
      }

      this.socket =
        new WebSocket(wsUrl);

      this.diagnostics
        .webSocketState =
        'CONNECTING';

      // --------------------------------------------------------
      // OPEN
      // --------------------------------------------------------

      this.socket.onopen =
        () => {

          this.diagnostics
            .webSocketState =
            'OPEN';

          this.log(
            'WAITING_FOR_SETUP',
            'WebSocket connected. Waiting for setupComplete...',
            'success'
          );

          this.setState(
            'WAITING_FOR_SETUP'
          );
        };

      // --------------------------------------------------------
      // MESSAGE
      // --------------------------------------------------------

      this.socket.onmessage =
        async (event) => {

          try {

            const message =
              JSON.parse(
                event.data
              );

            this.diagnostics
              .lastServerEvent =
              timestampNow();

            this.log(
              this.state,
              'Server event received',
              'server',
              message
            );

            // ==================================================
            // SETUP COMPLETE
            // ==================================================

            if (
              message.setupComplete === true ||
              message.type ===
                'setupComplete' ||
              (
                message.type === 'status' &&
                typeof message.message ===
                  'string' &&
                /ready/i.test(
                  message.message
                )
              )
            ) {

              this.setupComplete =
                true;

              this.canStreamAudio =
                true;

              this.diagnostics
                .setupComplete =
                true;

              this.diagnostics
                .isAudioStreaming =
                true;

              if (
                this.setupTimer
              ) {
                clearTimeout(
                  this.setupTimer
                );

                this.setupTimer =
                  null;
              }

              this.log(
                'READY',
                'Addis is ready. Microphone streaming enabled.',
                'success'
              );

              this.setState(
                'READY'
              );

              this.callbacks
                .onSetupComplete?.();

              return;
            }

            // ==================================================
            // USER TRANSCRIPTION
            // ==================================================

            const userTranscript =
              this.extractUserTranscript(
                message
              );

            if (
              userTranscript
            ) {

              this.log(
                this.state,
                `USER TRANSCRIPT: "${userTranscript}"`,
                'success'
              );

              this.callbacks
                .onUserTranscript?.(
                  userTranscript
                );
            }

            // ==================================================
            // AI RESPONSE
            // ==================================================

            const parts =
              message
                ?.serverContent
                ?.modelTurn
                ?.parts;

            if (
              Array.isArray(parts)
            ) {

              for (
                const part of parts
              ) {

                // --------------------------
                // AI AUDIO
                // --------------------------

                if (
                  part?.inlineData?.data
                ) {

                  const audio =
                    part.inlineData.data;

                  this.diagnostics
                    .lastAiAudioReceivedTime =
                    timestampNow();

                  this.diagnostics
                    .lastAiAudioReceivedBytes =
                    audio.length;

                  this.log(
                    'VESPER_SPEAKING',
                    `AI audio received (${audio.length})`,
                    'audio'
                  );

                  await this.playAudio(
                    audio
                  );
                }

                // --------------------------
                // AI TEXT
                // --------------------------

                if (
                  typeof part?.text ===
                    'string' &&
                  part.text.trim()
                ) {

                  this.log(
                    this.state,
                    `Vesper: ${part.text.trim()}`,
                    'server'
                  );

                  this.callbacks
                    .onVesperSpeechText?.(
                      part.text.trim()
                    );
                }
              }
            }

            // ==================================================
            // DIRECT AUDIO COMPATIBILITY
            // ==================================================

            if (
              typeof message?.audio ===
                'string'
            ) {

              this.diagnostics
                .lastAiAudioReceivedTime =
                timestampNow();

              this.diagnostics
                .lastAiAudioReceivedBytes =
                message.audio.length;

              await this.playAudio(
                message.audio
              );
            }

            // ==================================================
            // TURN COMPLETE
            // ==================================================

            if (
              message
                ?.serverContent
                ?.turnComplete === true ||
              message.turnComplete ===
                true
            ) {

              this.diagnostics
                .turnComplete =
                true;

              this.callbacks
                .onTurnComplete?.();
            }

            // ==================================================
            // INTERRUPTION
            // ==================================================

            if (
              message
                ?.serverContent
                ?.interrupted ===
                true ||
              message.interrupted ===
                true
            ) {

              this.interruptPlayback();
            }

            // ==================================================
            // ERROR
            // ==================================================

            if (
              message.error
            ) {

              const errorText =
                typeof message.error ===
                  'string'
                  ? message.error
                  : message.error.message ||
                    JSON.stringify(
                      message.error
                    );

              this.reportError(
                'ADDIS_SERVER_ERROR',
                errorText,
                message.error
              );
            }

            this.emitDiagnostics();

          } catch (error: any) {

            this.log(
              this.state,
              `Failed to parse server message: ${
                error?.message || error
              }`,
              'warning'
            );
          }
        };

      // --------------------------------------------------------
      // ERROR
      // --------------------------------------------------------

      this.socket.onerror =
        () => {

          this.diagnostics
            .webSocketState =
            'ERROR';

          this.reportError(
            'WEBSOCKET_ERROR',
            'Addis WebSocket transport error'
          );
        };

      // --------------------------------------------------------
      // CLOSE
      // --------------------------------------------------------

      this.socket.onclose =
        (event) => {

          this.diagnostics
            .webSocketState =
            'CLOSED';

          this.diagnostics
            .webSocketCloseCode =
            event.code;

          this.diagnostics
            .webSocketCloseReason =
            event.reason ||
            'No close reason';

          this.canStreamAudio =
            false;

          if (
            event.code !== 1000 &&
            this.state !== 'ENDING' &&
            this.state !== 'ENDED'
          ) {

            this.reportError(
              'WEBSOCKET_CLOSED',
              `WebSocket closed with code ${event.code}: ${
                event.reason ||
                'unknown reason'
              }`
            );

          }
        };

      // --------------------------------------------------------
      // SETUP TIMEOUT
      // --------------------------------------------------------

      this.setupTimer =
        setTimeout(() => {

          if (
            !this.setupComplete
          ) {

            this.reportError(
              'SETUP_TIMEOUT',
              'Addis did not send setupComplete within 15 seconds'
            );
          }

        }, 15000);

      return true;

    } catch (error: any) {

      this.reportError(
        'WEBSOCKET_ERROR',
        error?.message ||
          'Failed to start Addis session'
      );

      return false;
    }
  }

  // ============================================================
  // EXTRACT USER TRANSCRIPTION
  // ============================================================

  private extractUserTranscript(
    message: any
  ): string | null {

    const candidates = [

      // Most likely realtime format
      message
        ?.serverContent
        ?.inputTranscription
        ?.text,

      // Alternative
      message
        ?.serverContent
        ?.inputTranscription,

      // Other possible formats
      message?.inputTranscription?.text,

      message?.inputTranscription,

      message?.inputTranscript,

      message?.userTranscript,

      message?.transcript,

      message?.text?.input,

      message?.user?.transcript,

    ];

    for (
      const candidate of candidates
    ) {

      if (
        typeof candidate ===
          'string' &&
        candidate.trim()
      ) {

        return candidate.trim();
      }
    }

    return null;
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
        this.outputContext.state ===
        'suspended'
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
        this.outputContext
          .createBufferSource();

      source.buffer =
        audioBuffer;

      source.connect(
        this.outputContext.destination
      );

      const startTime =
        Math.max(
          this.outputContext.currentTime,
          this.nextPlayTime
        );

      source.start(
        startTime
      );

      this.nextPlayTime =
        startTime +
        audioBuffer.duration;

      this.activeSources.push(
        source
      );

      this.diagnostics
        .playbackState =
        'PLAYING';

      this.setState(
        'VESPER_SPEAKING'
      );

      source.onended =
        () => {

          this.activeSources =
            this.activeSources.filter(
              item =>
                item !== source
            );

          if (
            this.activeSources.length ===
            0
          ) {

            this.diagnostics
              .playbackState =
              'IDLE';

            this.setState(
              'LISTENING'
            );
          }

          this.emitDiagnostics();
        };

    } catch (error: any) {

      this.reportError(
        'AUDIO_PLAYBACK_ERROR',
        error?.message ||
          'Failed to play AI audio'
      );
    }
  }

  // ============================================================
  // INTERRUPT
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
      this.nextPlayTime = this.outputContext.currentTime;
    }

    this.diagnostics.playbackState = 'IDLE';

    if (this.state === 'VESPER_SPEAKING') {
      this.setState('LISTENING');
    }

    this.emitDiagnostics();
  }

  private async finalizeUserAudioSegment() {
    if (this.userAudioChunks.length === 0 || this.sttInProgress) return;

    const chunksToProcess = [...this.userAudioChunks];
    this.userAudioChunks = [];

    const totalLen = chunksToProcess.reduce((acc, c) => acc + c.length, 0);
    const merged = new Float32Array(totalLen);
    let offset = 0;
    for (const chunk of chunksToProcess) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    // Only send an utterance to STT if it contains enough audio (~300ms = 4800 samples at 16kHz)
    if (merged.length < 4800) {
      return;
    }

    this.sttInProgress = true;
    try {
      const int16 = float32ToInt16PCM(merged);
      const wavBlob = this.createWavBlob(int16, INPUT_SAMPLE_RATE);

      const pcmBlob = new Blob([int16.buffer as ArrayBuffer], { type: 'audio/pcm' });
      this.callbacks.onUserSpeechSegment?.(pcmBlob);

      console.log('[STT] Sending audio to Addis STT');

      const formData = new FormData();
      formData.append('audio', wavBlob, 'user-speech.wav');
      formData.append('language', this.currentLanguage || 'am');

      const response = await fetch('/api/addis/stt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      console.log('[STT] Result:', data);

      if (data.success && data.text && data.text.trim()) {
        console.log('[TRANSCRIPT] Final user transcript:', data.text);
        console.log('[ADDIS STT]', data.text, data.confidence);

        transcriptAdapter.handleUserSpeech(data.text, true, data.confidence);
      }
    } catch (error) {
      console.error('[STT] Failed:', error);
    } finally {
      this.sttInProgress = false;
    }
  }

  // ============================================================
  // SEND TEXT
  // ============================================================

  public sendClientPrompt(text: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.setupComplete) {
      return;
    }

    this.socket.send(
      JSON.stringify({
        clientContent: {
          turns: [
            {
              role: 'user',
              parts: [
                {
                  text,
                },
              ],
            },
          ],
          turnComplete: true,
        },
      })
    );
  }

  // ============================================================
  // STOP
  // ============================================================

  public async stop() {

    this.canStreamAudio =
      false;

    this.setupComplete =
      false;

    this.setState(
      'ENDING'
    );

    if (
      this.setupTimer
    ) {

      clearTimeout(
        this.setupTimer
      );

      this.setupTimer =
        null;
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

    this.processorNode =
      null;

    this.sourceNode =
      null;

    this.muteGainNode =
      null;

    if (
      this.mediaStream
    ) {

      this.mediaStream
        .getTracks()
        .forEach(
          track =>
            track.stop()
        );

      this.mediaStream =
        null;
    }

    if (
      this.socket
    ) {

      try {

        if (
          this.socket.readyState ===
            WebSocket.OPEN ||
          this.socket.readyState ===
            WebSocket.CONNECTING
        ) {

          this.socket.close(
            1000,
            'client-stop'
          );
        }

      } catch {}

      this.socket =
        null;
    }

    if (
      this.inputContext
    ) {

      try {
        await this.inputContext.close();
      } catch {}

      this.inputContext =
        null;
    }

    if (
      this.outputContext
    ) {

      try {
        await this.outputContext.close();
      } catch {}

      this.outputContext =
        null;
    }

    this.setState(
      'ENDED'
    );

    setTimeout(() => {

      if (
        this.state ===
        'ENDED'
      ) {

        this.setState(
          'IDLE'
        );
      }

    }, 200);
  }

  public async speakTTS(text: string, language: string = 'am'): Promise<void> {
    return new Promise<void>((resolve) => {
      (async () => {
        try {
          this.setState('VESPER_SPEAKING');
          this.log(this.state, `Speaking TTS: "${text}"`, 'info');

          if (this.outputContext && this.outputContext.state === 'suspended') {
            await this.outputContext.resume().catch(() => {});
          }

          const res = await fetch('/api/addis/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, language }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.audioBase64) {
              const audioSrc = data.audioBase64.startsWith('data:')
                ? data.audioBase64
                : `data:audio/mp3;base64,${data.audioBase64}`;

              const audio = new Audio(audioSrc);
              this.diagnostics.playbackState = 'PLAYING';
              this.emitDiagnostics();

              const handleEnd = () => {
                this.diagnostics.playbackState = 'IDLE';
                if (this.state === 'VESPER_SPEAKING') {
                  this.setState('LISTENING');
                }
                this.emitDiagnostics();
                resolve();
              };

              audio.onended = handleEnd;
              audio.onerror = (e) => {
                console.warn('HTMLAudioElement error, attempting SpeechSynthesis fallback:', e);
                this.speakFallbackSpeechSynthesis(text, language).then(handleEnd);
              };

              try {
                await audio.play();
                return;
              } catch (playErr) {
                console.warn('Audio.play() blocked, attempting SpeechSynthesis fallback:', playErr);
                await this.speakFallbackSpeechSynthesis(text, language);
                handleEnd();
                return;
              }
            }
          }
        } catch (err: any) {
          this.log(this.state, `TTS audio playback warning: ${err.message}`, 'warning');
        }

        await this.speakFallbackSpeechSynthesis(text, language);

        if (this.state === 'VESPER_SPEAKING') {
          this.setState('LISTENING');
        }
        resolve();
      })();
    });
  }

  private speakFallbackSpeechSynthesis(text: string, language: string): Promise<void> {
    return new Promise<void>((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'am' ? 'am-ET' : language === 'om' ? 'om-ET' : 'en-US';
        utterance.rate = 0.95;

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        window.speechSynthesis.speak(utterance);
      } catch {
        resolve();
      }
    });
  }

  public async speakGreeting(text: string, language: string = 'am') {
    return this.speakTTS(text, language);
  }

  // ============================================================
  // RESET
  // ============================================================

  private reset() {

    this.setupComplete =
      false;

    this.canStreamAudio =
      false;

    this.activeSources =
      [];

    this.nextPlayTime =
      0;

    this.diagnostics = {
      hasMicPermission: false,
      inputAudioContextState:
        'closed',
      inputSampleRate: 0,
      outputAudioContextState:
        'closed',
      outputSampleRate: 0,
      webSocketState:
        'CLOSED',
      setupComplete: false,
      isAudioStreaming: false,
      lastAudioChunkSentTime:
        null,
      lastAudioChunkSentBytes:
        0,
      lastServerEvent:
        null,
      lastAiAudioReceivedTime:
        null,
      lastAiAudioReceivedBytes:
        0,
      playbackState:
        'IDLE',
      turnComplete:
        false,
      webSocketCloseCode:
        null,
      webSocketCloseReason:
        null,
      lastServerError:
        null,
      micLevel:
        0,
      errorCategory:
        null,
    };
  }
}
