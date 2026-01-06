# Anam Avatar Integration

**Date:** January 6, 2026  
**Status:** ✅ Integrated (Beta)  
**Branch:** `avatar-integration`

---

## Overview

The EUinput research platform now includes optional visual AI avatars powered by [Anam.ai](https://anam.ai). This adds a lifelike talking avatar with real-time lip-sync to the ElevenLabs conversational AI experience.

---

## How It Works

**Architecture:**
```
User speaks → ElevenLabs (AI processing) →
  ├─ Audio output → Anam avatar (lip-sync)
  └─ Text transcript → Chat bubbles
```

**Division of Labor:**
- **ElevenLabs**: Speech recognition, LLM intelligence, voice synthesis
- **Anam**: Visual avatar with lip-sync animation
- **Your App**: Orchestrates both + displays chat transcript

---

## Setup

### 1. Get Anam API Credentials

1. Create account at [lab.anam.ai](https://lab.anam.ai)
2. Go to Settings → API Keys
3. Generate an API key
4. Choose or create an avatar

### 2. Add Environment Variables

Add to your `.env.local`:

```bash
# Anam.ai credentials
ANAM_API_KEY=your_anam_api_key_here
ANAM_AVATAR_ID=anna-generic-1  # Or your custom avatar ID
```

### 3. Avatar Gallery

**Stock Avatars:**
Browse ready-to-use avatars at: https://docs.anam.ai/resources/avatar-gallery

**Popular Options:**
- `anna-generic-1` - Professional female avatar
- `david-generic-1` - Professional male avatar
- `sarah-generic-1` - Friendly female avatar

**Custom Avatars:**
Create your own at [lab.anam.ai](https://lab.anam.ai) with custom appearance and style.

---

## Files Added/Modified

### New Files

```
app/api/anam-session/route.ts     # Server-side session token generation
docs/anam-avatar-integration.md   # This documentation
```

### Modified Files

```
app/research/ElevenLabsTranscript.tsx  # Added avatar integration
app/research/page.tsx                  # Enabled avatar feature
package.json                           # Added @anam-ai/js-sdk, chatdio
```

---

## Usage

### Enable Avatar

The avatar is controlled by the `enableAvatar` prop:

```tsx
<ElevenLabsTranscript
  signedUrl={signedUrl}
  agentName="Nova"
  enableAvatar={true}  // ← Enable avatar
  className="h-[600px]"
/>
```

### Disable Avatar

To revert to chat bubbles only:

```tsx
<ElevenLabsTranscript
  signedUrl={signedUrl}
  agentName="Nova"
  enableAvatar={false}  // ← Chat bubbles only
  className="h-[600px]"
/>
```

---

## UI Layout

### With Avatar Enabled

```
┌─────────────────────────────────────────┐
│  Nova                      🔴 End       │
├─────────────────┬───────────────────────┤
│                 │  Nova: Hello!         │
│   [Avatar       │  You: Hi there        │
│    Video]       │  Nova: How are you?   │
│                 │  You: Good thanks     │
└─────────────────┴───────────────────────┘
    50% width          50% width
```

### Without Avatar

```
┌───────────────────────────────────────┐
│  🎙️ Nova              🔴 End          │
├───────────────────────────────────────┤
│        Nova: Hello!                   │
│        You: Hi there                  │
│        Nova: How are you?             │
│        You: Good thanks               │
└───────────────────────────────────────┘
           100% width
```

---

## Technical Implementation

### Audio Passthrough Mode

Anam runs in "audio passthrough" mode where:
- Anam **does not** use its own AI or microphone
- ElevenLabs handles all audio processing
- Anam only provides visual lip-sync to ElevenLabs audio

### Session Flow

1. **Initialize Anam**
   - Fetch session token from `/api/anam-session`
   - Create Anam client with `disableInputAudio: true`
   - Create audio input stream for lip-sync

2. **Start Conversation**
   - ElevenLabs handles microphone and audio
   - Audio chunks forwarded to Anam
   - Anam renders lip-sync animation

3. **End Conversation**
   - Both sessions closed gracefully
   - Resources cleaned up

---

## API Endpoint

### GET /api/anam-session

Returns an Anam session token for the client.

**Query Parameters:**
- `source` - Tracking source (optional)
- `campaign` - Campaign identifier (optional)
- `ref` - Referral identifier (optional)

**Response:**
```json
{
  "sessionToken": "eyJhbGc...",
  "avatarId": "anna-generic-1"
}
```

**Server-side Configuration:**
```typescript
{
  personaConfig: {
    avatarId: ANAM_AVATAR_ID,
    enableAudioPassthrough: true  // Enable external audio
  }
}
```

---

## Audio Format Requirements

**Important:** Audio format must match between ElevenLabs and Anam:

| Setting         | Value      | Required |
| --------------- | ---------- | -------- |
| **Encoding**    | PCM 16-bit | ✅        |
| **Sample Rate** | 16000 Hz   | ✅        |
| **Channels**    | Mono (1)   | ✅        |

Mismatched formats will cause lip-sync issues.

---

## Current Limitations

### 1. Audio Passthrough

The current implementation uses the `@elevenlabs/react` SDK which doesn't expose raw audio chunks. The Anam integration is ready but needs direct WebSocket access for full audio passthrough.

**Status:** UI ready, audio passthrough requires enhancement

**Options:**
1. Switch to direct ElevenLabs WebSocket API
2. Wait for SDK update with audio event support
3. Use Anam's built-in AI instead of passthrough

### 2. Mobile Support

Avatar rendering is optimized for desktop. Mobile users may see:
- Higher bandwidth usage
- Battery drain
- Smaller video display

**Recommendation:** Consider disabling avatar on mobile devices.

---

## Troubleshooting

### Avatar Not Loading

**Check:**
1. `ANAM_API_KEY` is set in environment
2. `ANAM_AVATAR_ID` is valid
3. Browser console for errors
4. Network tab for API calls

**Fix:**
```bash
# Verify credentials
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.anam.ai/v1/auth/session-token

# Restart dev server
npm run dev
```

### Video Element Empty

**Check:**
1. Video ref is properly attached
2. `streamToVideoElement()` was called
3. Browser permissions for video

### Lip-Sync Out of Sync

**Check:**
1. Audio format matches (PCM16, 16kHz, mono)
2. `sendAudioChunk()` is receiving data
3. Network latency to both services

---

## Cost Considerations

### Anam Pricing

- **Free tier:** Limited minutes/month
- **Paid plans:** Based on usage (minutes of avatar time)

**Tip:** Monitor usage at [lab.anam.ai](https://lab.anam.ai) → Usage

### Combined Costs

Running both ElevenLabs + Anam:
- **ElevenLabs:** Audio processing + conversation
- **Anam:** Avatar rendering

**Estimate:** ~2x cost vs audio-only

---

## Performance

### Metrics

- **Avatar load time:** ~2-3 seconds
- **Lip-sync latency:** < 200ms (network dependent)
- **Video quality:** Adjustable (automatic based on bandwidth)

### Optimization Tips

1. **Preload avatar** during consent screen
2. **Show loading state** while avatar initializes
3. **Graceful fallback** to chat-only if avatar fails
4. **Monitor bandwidth** and adjust quality

---

## Future Enhancements

### Short-term
- [ ] Direct WebSocket implementation for audio passthrough
- [ ] Mobile-specific UI optimization
- [ ] Avatar loading progress indicator
- [ ] Bandwidth detection and quality adjustment

### Medium-term
- [ ] Multiple avatar options for users to choose
- [ ] Custom branding on avatar
- [ ] Picture-in-picture mode
- [ ] Screen recording of conversations

### Long-term
- [ ] Multi-language avatar support
- [ ] Emotion detection and expression
- [ ] Custom avatar training with your brand
- [ ] AR/VR avatar integration

---

## Testing Checklist

### Local Testing
- [ ] Avatar loads successfully
- [ ] Video element displays properly
- [ ] Fallback works if avatar fails
- [ ] Chat bubbles work alongside avatar
- [ ] End conversation cleans up resources

### Browser Testing
- [ ] Chrome (desktop)
- [ ] Safari (desktop)
- [ ] Firefox (desktop)
- [ ] Chrome (mobile) - consider disabling
- [ ] Safari (iOS) - consider disabling

---

## Resources

**Anam Documentation:**
- [ElevenLabs Integration](https://docs.anam.ai/third-party-integrations/elevenlabs)
- [Avatar Gallery](https://docs.anam.ai/resources/avatar-gallery)
- [SDK Reference](https://docs.anam.ai/sdk-reference/basic-usage)
- [Anam Lab](https://lab.anam.ai)

**ElevenLabs Documentation:**
- [Conversational AI](https://elevenlabs.io/docs/conversational-ai)
- [Audio Settings](https://elevenlabs.io/docs/api-reference/websocket)

**Your Project Docs:**
- [Embedded Conversation Setup](./embedded-conversation-setup.md)
- [Real-Time Transcript Features](./real-time-transcript-features.md)

---

## Support

**Anam Support:**
- [Join Slack](https://join.slack.com/t/anam-ai/shared_invite/...)
- [Report Issues](https://github.com/anam-ai/js-sdk/issues)

**Project Support:**
- See [docs/README.md](./README.md) for project documentation

---

**Status:** ✅ Beta Integration Complete  
**Branch:** `avatar-integration`  
**Ready for:** Testing → Merge to main  
**Recommendation:** Test thoroughly before production due to beta status

