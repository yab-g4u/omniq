/**
 * Addis AI Transcript Event Adapter for Vesper.ai
 *
 * Normalizes incoming raw Addis AI events (microphones, STT, WebSocket streaming, TTS)
 * into normalized Transcript Events and dispatches standard AG-UI events.
 */

export interface NormalizedTranscriptEvent {
  messageId: string;
  role: 'user' | 'assistant';
  text: string;
  isPartial: boolean;
  isFinal: boolean;
  timestamp: number;
  confidence?: number;
}

export type TranscriptEventListener = (event: NormalizedTranscriptEvent) => void;

export class AddisTranscriptAdapter {
  private listeners: Set<TranscriptEventListener> = new Set();
  private activeUserMessageId: string | null = null;
  private activeAssistantMessageId: string | null = null;

  public subscribe(listener: TranscriptEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: NormalizedTranscriptEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[AddisTranscriptAdapter Listener Error]:', err);
      }
    });
  }

  /**
   * Process incoming user speech (partial or finalized)
   */
  public handleUserSpeech(text: string, isFinal: boolean = false, confidence?: number): NormalizedTranscriptEvent {
    if (!this.activeUserMessageId || isFinal) {
      this.activeUserMessageId = `user-msg-${Date.now()}`;
    }

    const event: NormalizedTranscriptEvent = {
      messageId: this.activeUserMessageId,
      role: 'user',
      text: text.trim(),
      isPartial: !isFinal,
      isFinal,
      timestamp: Date.now(),
      confidence,
    };

    this.emit(event);

    if (isFinal) {
      this.activeUserMessageId = null;
    }

    return event;
  }

  /**
   * Process incoming assistant AI response speech
   */
  public handleAssistantSpeech(text: string, isFinal: boolean = false): NormalizedTranscriptEvent {
    if (!this.activeAssistantMessageId || isFinal) {
      this.activeAssistantMessageId = `ai-msg-${Date.now()}`;
    }

    const event: NormalizedTranscriptEvent = {
      messageId: this.activeAssistantMessageId,
      role: 'assistant',
      text: text.trim(),
      isPartial: !isFinal,
      isFinal,
      timestamp: Date.now(),
    };

    this.emit(event);

    if (isFinal) {
      this.activeAssistantMessageId = null;
    }

    return event;
  }

  public reset(): void {
    this.activeUserMessageId = null;
    this.activeAssistantMessageId = null;
  }
}

export const transcriptAdapter = new AddisTranscriptAdapter();
