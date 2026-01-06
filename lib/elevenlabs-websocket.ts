// =============================================================================
// ElevenLabs WebSocket Client (Direct API)
// =============================================================================
// Direct WebSocket connection to ElevenLabs Conversational AI
// Exposes raw audio chunks for Anam avatar integration
// Based on: https://docs.anam.ai/third-party-integrations/elevenlabs
// =============================================================================

export interface ElevenLabsCallbacks {
  onReady?: () => void;
  onAudio?: (base64Audio: string) => void;
  onUserTranscript?: (text: string) => void;
  onAgentResponse?: (text: string) => void;
  onInterrupt?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export class ElevenLabsWebSocketClient {
  private ws: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  
  constructor(
    private agentId: string,
    private callbacks: ElevenLabsCallbacks
  ) {}
  
  async connect() {
    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      
      // Connect to ElevenLabs WebSocket
      this.ws = new WebSocket(
        `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${this.agentId}`
      );
      
      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onerror = (error) => this.handleError(error);
      this.ws.onclose = () => this.handleClose();
      
    } catch (error) {
      console.error('Failed to connect:', error);
      this.callbacks.onError?.(error);
    }
  }
  
  private async handleOpen() {
    console.log('ElevenLabs WebSocket connected');
    
    try {
      // Set up audio processing
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream!);
      
      // Create processor for capturing audio
      await this.audioContext.audioWorklet.addModule(
        URL.createObjectURL(
          new Blob([this.getWorkletCode()], { type: 'application/javascript' })
        )
      );
      
      this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
      this.workletNode.port.onmessage = (event) => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          // Send audio to ElevenLabs
          this.ws.send(
            JSON.stringify({
              user_audio_chunk: this.arrayBufferToBase64(event.data),
            })
          );
        }
      };
      
      source.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination);
      
      this.callbacks.onReady?.();
    } catch (error) {
      console.error('Audio setup failed:', error);
      this.callbacks.onError?.(error);
    }
  }
  
  private handleMessage(event: MessageEvent) {
    try {
      const msg = JSON.parse(event.data);
      
      switch (msg.type) {
        case 'audio':
          if (msg.audio_event?.audio_base_64) {
            this.callbacks.onAudio?.(msg.audio_event.audio_base_64);
          }
          break;
          
        case 'agent_response':
          if (msg.agent_response_event?.agent_response) {
            this.callbacks.onAgentResponse?.(msg.agent_response_event.agent_response);
          }
          break;
          
        case 'user_transcript':
          if (msg.user_transcription_event?.user_transcript) {
            this.callbacks.onUserTranscript?.(msg.user_transcription_event.user_transcript);
          }
          break;
          
        case 'interruption':
          this.callbacks.onInterrupt?.();
          break;
          
        case 'ping':
          // Respond to ping
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(
              JSON.stringify({
                type: 'pong',
                event_id: msg.ping_event?.event_id,
              })
            );
          }
          break;
      }
    } catch (error) {
      console.error('Message handling error:', error);
    }
  }
  
  private handleError(error: Event) {
    console.error('WebSocket error:', error);
    this.callbacks.onError?.(error);
  }
  
  private handleClose() {
    console.log('ElevenLabs WebSocket disconnected');
    this.cleanup();
    this.callbacks.onDisconnect?.();
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
    this.cleanup();
  }
  
  private cleanup() {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }
  
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  
  private getWorkletCode(): string {
    return `
      class AudioProcessor extends AudioWorkletProcessor {
        process(inputs, outputs, parameters) {
          const input = inputs[0];
          if (input && input[0]) {
            // Convert Float32Array to Int16Array for PCM16
            const float32 = input[0];
            const int16 = new Int16Array(float32.length);
            for (let i = 0; i < float32.length; i++) {
              const s = Math.max(-1, Math.min(1, float32[i]));
              int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            this.port.postMessage(int16.buffer, [int16.buffer]);
          }
          return true;
        }
      }
      registerProcessor('audio-processor', AudioProcessor);
    `;
  }
}

