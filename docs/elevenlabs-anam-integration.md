# ElevenLabs + Anam Integration Guide

## Overview

This guide shows how to integrate ElevenLabs conversational AI with Anam visual avatars for real-time lip-synced video conversations.

## Architecture

### Two Integration Approaches

#### Approach 1: Standalone Anam (✅ Currently Working)
Anam handles both conversation and avatar:

```
User ↔ Browser ↔ Anam SDK ↔ Anam API (LLM + Avatar)
                      ↓
                  Video Element
```

**Pros:** Simple, all-in-one solution  
**Cons:** Uses Anam's LLM, not ElevenLabs

**Status:** ✅ Working - Test at `/anam-simple-test.html`

---

#### Approach 2: ElevenLabs + Anam Audio Passthrough (Advanced)
ElevenLabs for conversation, Anam for avatar visualization:

```
User Microphone
     ↓
ElevenLabs WebSocket → Process → Audio Response
     ↓                              ↓
Transcripts                    Base64 Audio Chunks
     ↓                              ↓
Chat Bubbles                   Anam SDK (passthrough)
                                    ↓
                               Video Element (lip-sync)
```

**Pros:** Use ElevenLabs agents, custom conversation logic  
**Cons:** More complex, requires WebSocket management

**Status:** ⚠️ Implementation exists but needs testing

---

## Approach 2: Detailed Implementation

### Step 1: Enable Audio Passthrough

When generating Anam session tokens, add `enableAudioPassthrough: true`:

**File:** `/app/api/anam-session/route.ts`

```typescript
const response = await fetch('https://api.anam.ai/v1/auth/session-token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${ANAM_API_KEY}`,
  },
  body: JSON.stringify({
    personaConfig: {
      avatarId: ANAM_AVATAR_ID,
      enableAudioPassthrough: true, // 🔑 Key setting for ElevenLabs integration
    },
  }),
});
```

**Note:** With `enableAudioPassthrough: true`, Anam won't use its own LLM/voice - it just displays the avatar synced to your audio.

### Step 2: Create Direct WebSocket Client

The `@elevenlabs/react` SDK doesn't expose raw audio chunks, so you need a direct WebSocket connection.

**File:** `/lib/elevenlabs-websocket.ts`

```typescript
export class ElevenLabsWebSocketClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  
  constructor(
    private agentId: string,
    private callbacks: ElevenLabsCallbacks
  ) {}
  
  async connect() {
    // Connect to ElevenLabs WebSocket
    this.ws = new WebSocket(
      `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${this.agentId}`
    );
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'audio':
          // 🔑 This is what you need for Anam!
          if (this.callbacks.onAudio) {
            this.callbacks.onAudio(message.audio_event.audio_base_64);
          }
          break;
          
        case 'transcript':
          if (this.callbacks.onTranscript) {
            this.callbacks.onTranscript(message.transcript_event);
          }
          break;
          
        case 'agent_response':
          // Signal end of agent's speech
          if (this.callbacks.onAgentResponse) {
            this.callbacks.onAgentResponse();
          }
          break;
      }
    };
  }
  
  // Capture and send user audio
  async startAudioCapture() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    
    // Process audio and send to WebSocket
    // (Full implementation in lib/elevenlabs-websocket.ts)
  }
}
```

### Step 3: Initialize Anam with Audio Passthrough

**File:** `/app/research/AnamElevenLabsTranscript.tsx`

```typescript
import { createClient } from '@anam-ai/js-sdk';
import { ElevenLabsWebSocketClient } from '@/lib/elevenlabs-websocket';

export function AnamElevenLabsTranscript() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const anamClientRef = useRef<any>(null);
  const audioInputStreamRef = useRef<any>(null);
  
  // Step 1: Initialize Anam avatar
  const initializeAvatar = async () => {
    // Get session token (with enableAudioPassthrough: true)
    const response = await fetch('/api/anam-session');
    const { sessionToken } = await response.json();
    
    // Create Anam client
    const anamClient = createClient(sessionToken, {
      disableInputAudio: true, // ElevenLabs handles microphone
    });
    
    // Stream to video element
    await anamClient.streamToVideoElement('video-id');
    
    // 🔑 Create audio input stream for lip-sync
    const audioInputStream = anamClient.createAgentAudioInputStream({
      encoding: 'pcm_s16le',
      sampleRate: 16000,
      channels: 1,
    });
    
    anamClientRef.current = anamClient;
    audioInputStreamRef.current = audioInputStream;
  };
  
  // Step 2: Connect to ElevenLabs
  const startConversation = async () => {
    await initializeAvatar();
    
    const elevenLabsClient = new ElevenLabsWebSocketClient(agentId, {
      // Forward audio chunks to Anam
      onAudio: (base64Audio: string) => {
        if (audioInputStreamRef.current) {
          // 🔑 Send audio to Anam for lip-sync
          audioInputStreamRef.current.sendAudioChunk(base64Audio);
        }
      },
      
      // Display transcripts as chat bubbles
      onTranscript: (transcript) => {
        setMessages(prev => [...prev, {
          role: transcript.source,
          content: transcript.message,
        }]);
      },
      
      // Signal end of agent's speech
      onAgentResponse: () => {
        if (audioInputStreamRef.current) {
          // 🔑 Tell Anam the audio sequence is complete
          audioInputStreamRef.current.endSequence();
        }
      },
    });
    
    await elevenLabsClient.connect();
    await elevenLabsClient.startAudioCapture();
  };
  
  return (
    <div>
      <video ref={videoRef} id="video-id" autoPlay playsInline />
      <button onClick={startConversation}>Start</button>
    </div>
  );
}
```

### Key Methods

#### `createAgentAudioInputStream(config)`

Creates a stream for sending audio to Anam avatar:

```typescript
const audioInputStream = anamClient.createAgentAudioInputStream({
  encoding: 'pcm_s16le',  // Audio format
  sampleRate: 16000,       // Must match ElevenLabs output
  channels: 1,             // Mono audio
});
```

#### `sendAudioChunk(base64Audio)`

Send audio data for lip-sync:

```typescript
audioInputStream.sendAudioChunk(base64Audio);
```

**Important:** Audio must be:
- Base64 encoded
- PCM 16-bit signed little-endian
- 16kHz sample rate
- Mono (1 channel)

#### `endSequence()`

Signal that audio sequence is complete:

```typescript
audioInputStream.endSequence();
```

Call this when the agent finishes speaking (on `agent_response` message).

---

## Audio Format Conversion

ElevenLabs outputs PCM16 audio which matches Anam's expected format. No conversion needed!

```
ElevenLabs Output:
- Format: PCM16 (pcm_s16le)
- Sample Rate: 16000 Hz
- Channels: Mono (1)
- Encoding: Base64

Anam Input:
- Format: pcm_s16le ✅ Match
- Sample Rate: 16000 ✅ Match  
- Channels: 1 ✅ Match
- Encoding: Base64 ✅ Match
```

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User starts conversation                                     │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │ Initialize Anam     │
        │ - Get session token │
        │ - Create client     │
        │ - Stream to video   │
        │ - Create audio stream│
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │ Connect ElevenLabs  │
        │ - WebSocket connect │
        │ - Start mic capture │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │ User speaks         │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────────────┐
        │ Mic → AudioWorklet          │
        │ PCM16 16kHz → Base64        │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────────────┐
        │ Send to ElevenLabs WebSocket│
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────────────┐
        │ ElevenLabs processes        │
        │ (LLM + TTS)                 │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────────────┐
        │ Receive messages:           │
        │ 1. transcript               │
        │ 2. audio chunks (base64)    │
        │ 3. agent_response (done)    │
        └──────┬────────┬──────┬──────┘
               │        │      │
       ┌───────▼───┐    │      │
       │ Display   │    │      │
       │ as chat   │    │      │
       │ bubbles   │    │      │
       └───────────┘    │      │
                   ┌────▼────┐ │
                   │ Forward │ │
                   │ to Anam │ │
                   │ stream  │ │
                   └────┬────┘ │
                        │      │
                   ┌────▼──────▼─────┐
                   │ Anam avatar     │
                   │ - Lip-sync      │
                   │ - Animate       │
                   └─────────────────┘
```

---

## Testing

### Test Page 1: Standalone Anam (Working)

```
http://localhost:3000/anam-simple-test.html
```

This tests Anam-only (no ElevenLabs). Good for verifying Anam setup.

### Test Page 2: ElevenLabs + Anam Integration

```
http://localhost:3000/research/avatar
```

Full integration with both services. Tests audio passthrough.

### Test Page 3: Chat-Only (Production)

```
http://localhost:3000/research
```

Current production version with chat bubbles only (no avatar).

---

## Troubleshooting

### Issue: Avatar loads but doesn't lip-sync

**Symptoms:**
- Video element shows avatar
- Avatar is idle (not moving lips)
- Audio plays but no animation

**Causes:**
1. `enableAudioPassthrough` not set to `true`
2. Audio chunks not being forwarded
3. `endSequence()` not called

**Debug:**
```typescript
// Add logging
onAudio: (base64Audio) => {
  console.log('Received audio chunk:', base64Audio.substring(0, 50));
  audioInputStream.sendAudioChunk(base64Audio);
},

onAgentResponse: () => {
  console.log('Agent finished speaking, ending sequence');
  audioInputStream.endSequence();
}
```

### Issue: Audio format mismatch

**Symptoms:**
- Distorted audio
- Choppy lip-sync
- Console errors about format

**Solution:**
Verify audio parameters match:
```typescript
// ElevenLabs WebSocket config
sampleRate: 16000,
encoding: 'pcm_16',

// Anam audio input stream config
{
  encoding: 'pcm_s16le',
  sampleRate: 16000,
  channels: 1,
}
```

### Issue: WebSocket disconnects

**Symptoms:**
- Connection drops mid-conversation
- "WebSocket closed" errors

**Solutions:**
1. Implement ping/pong keepalive
2. Add reconnection logic
3. Check network stability

```typescript
// Keepalive implementation
setInterval(() => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 5000);
```

### Issue: Lip-sync lag

**Symptoms:**
- Lips move after audio plays
- Visible delay between sound and movement

**Solutions:**
1. Reduce network latency (use CDN/edge functions)
2. Call `sendAudioChunk()` immediately when received
3. Ensure `endSequence()` is called promptly
4. Check browser performance (use Chrome DevTools)

---

## Performance Optimization

### 1. Audio Chunk Buffering

Don't buffer unnecessarily - forward immediately:

```typescript
// ❌ Bad - adds latency
const buffer = [];
onAudio: (chunk) => {
  buffer.push(chunk);
  if (buffer.length > 10) {
    buffer.forEach(c => audioInputStream.sendAudioChunk(c));
    buffer = [];
  }
}

// ✅ Good - minimal latency
onAudio: (chunk) => {
  audioInputStream.sendAudioChunk(chunk);
}
```

### 2. Video Element Settings

```tsx
<video
  ref={videoRef}
  autoPlay          // Start immediately
  playsInline       // Mobile Safari
  muted={false}     // Allow audio
  style={{
    width: '100%',
    height: 'auto',
    objectFit: 'cover'
  }}
/>
```

### 3. Preload Avatar

Initialize Anam before starting conversation:

```typescript
// Preload on page load
useEffect(() => {
  initializeAvatar(); // Don't wait for user to click start
}, []);
```

---

## Production Checklist

Before deploying ElevenLabs + Anam integration:

- [ ] Test on multiple browsers (Chrome, Safari, Firefox, Edge)
- [ ] Test on mobile devices (iOS Safari, Chrome Android)
- [ ] Verify audio quality at different network speeds
- [ ] Test lip-sync accuracy
- [ ] Implement error handling and fallbacks
- [ ] Add reconnection logic for dropped connections
- [ ] Monitor Anam usage/costs
- [ ] Add analytics tracking
- [ ] Test with multiple concurrent users
- [ ] Implement graceful degradation (fallback to chat-only)

---

## Cost Considerations

### ElevenLabs
- Charged per character generated
- ~$0.30 per 1,000 characters (Pro plan)
- Voice conversations use more than text

### Anam
- Charged per minute of avatar streaming
- Check current pricing: https://anam.ai/pricing
- Free tier available for development

### Optimization Tips
1. Use chat-only mode when avatar isn't critical
2. Implement usage limits per user/session
3. Cache avatar sessions when possible
4. Monitor usage with analytics

---

## Files Reference

| File | Purpose |
|------|---------|
| `/lib/elevenlabs-websocket.ts` | Direct WebSocket client for ElevenLabs |
| `/app/research/AnamElevenLabsTranscript.tsx` | Integrated component (ElevenLabs + Anam) |
| `/app/research/ElevenLabsTranscript.tsx` | Chat-only component (production) |
| `/app/api/anam-session/route.ts` | Session token API (with passthrough) |
| `/app/api/anam-session-standard/route.ts` | Session token API (standalone Anam) |
| `/public/anam-simple-test.html` | Simple standalone Anam test |
| `/app/research/avatar/page.tsx` | ElevenLabs + Anam test page |

---

## Next Steps

1. ✅ **Standalone Anam working** - Test at `/anam-simple-test.html`
2. ⏳ **Test full integration** - Visit `/research/avatar`
3. ⏳ **Verify lip-sync quality**
4. ⏳ **Production testing** - Multiple browsers/devices
5. ⏳ **Deploy to staging**

---

## Resources

**Official Documentation:**
- [Anam ElevenLabs Integration](https://docs.anam.ai/third-party-integrations/elevenlabs)
- [Anam Audio Passthrough](https://docs.anam.ai/features/audio-passthrough)
- [ElevenLabs WebSocket API](https://elevenlabs.io/docs/api-reference/websocket)
- [ElevenLabs Conversational AI](https://elevenlabs.io/docs/conversational-ai/overview)

**Project Documentation:**
- [docs/anam-avatar-integration.md](./anam-avatar-integration.md) - Standalone Anam guide
- [AVATAR-INTEGRATION-SOLUTION.md](../AVATAR-INTEGRATION-SOLUTION.md) - Full integration notes
- [ANAM-WORKING.md](../ANAM-WORKING.md) - Current working status

---

## Summary

✅ **Approach 1 (Standalone):** Fully working  
⚠️ **Approach 2 (ElevenLabs + Anam):** Implementation exists, needs testing  

**Recommended Path:**
1. Use standalone Anam for immediate testing
2. Test ElevenLabs + Anam integration at `/research/avatar`
3. Choose based on requirements (custom agents vs. simplicity)

**Key Difference:**
- **Standalone:** Anam does everything (simpler, working now)
- **Integration:** ElevenLabs for conversation, Anam for visuals (more control, needs testing)

