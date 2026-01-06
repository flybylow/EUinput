# Anam Avatar Integration Guide

## Overview

Successfully integrated Anam.ai visual avatars with real-time AI conversation using the `@anam-ai/js-sdk`. This document covers everything learned during the integration process.

## Key Components

### 1. Session Token Generation

Anam requires **ephemeral session tokens** with a complete persona configuration. Legacy tokens without full persona configs are no longer supported.

**API Endpoint:** `/app/api/anam-session-standard/route.ts`

```typescript
const response = await fetch('https://api.anam.ai/v1/auth/session-token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${ANAM_API_KEY}`,
  },
  body: JSON.stringify({
    personaConfig: {
      name: "Nova",
      avatarId: ANAM_AVATAR_ID,        // REQUIRED
      voiceId: "...",                   // REQUIRED
      llmId: "...",                     // REQUIRED
      systemPrompt: "...",              // REQUIRED
    },
  }),
});
```

### 2. Required Persona Configuration

All fields are **mandatory** for ephemeral sessions:

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `name` | string | Display name for the persona | ✅ Yes |
| `avatarId` | string | Avatar ID from your Anam account | ✅ Yes |
| `voiceId` | string | Voice ID for TTS | ✅ Yes |
| `llmId` | string | LLM model ID | ✅ Yes |
| `systemPrompt` | string | System instructions for the AI | ✅ Yes |

**Important:** Omitting `avatarId` will cause error: `"Avatar ID is required for ephemeral sessions."`

### 3. Environment Variables

```bash
# .env.local
ANAM_API_KEY=your-api-key-here
ANAM_AVATAR_ID=your-avatar-id-here
```

**Note:** Next.js dev server must be restarted after changing `.env.local` to pick up new values.

### 4. Client SDK Usage

#### Basic Implementation

```javascript
import { createClient } from '@anam-ai/js-sdk';

// 1. Get session token from your API
const response = await fetch('/api/anam-session-standard');
const { sessionToken } = await response.json();

// 2. Create client
const client = createClient(sessionToken);

// 3. Start session
await client.startSession();

// 4. Stream to video element
await client.streamToVideoElement('video-element-id'); // Pass ID string, not element

// 5. Stop streaming
await client.stopStreaming();
```

#### Available Client Methods

The Anam client provides these methods:

**Session Management:**
- `startSession()` - Initiate the avatar session
- `startSessionIfNeeded()` - Start only if not already active
- `stopStreaming()` - Stop the avatar stream
- `getActiveSessionId()` - Get current session ID

**Streaming:**
- `stream()` - Start media stream
- `streamToVideoElement(elementId)` - Stream to specific video element (pass ID string)
- `streamToVideoAndAudioElements(videoId, audioId)` - Stream to separate elements
- `isStreaming()` - Check streaming status

**Interaction:**
- `talk(message)` - Send text message to avatar
- `sendUserMessage(message)` - Send user message
- `sendDataMessage(data)` - Send data payload
- `interruptPersona()` - Interrupt avatar speaking

**Audio Control:**
- `getInputAudioState()` - Get microphone state
- `muteInputAudio()` - Mute user microphone
- `unmuteInputAudio()` - Unmute user microphone
- `changeAudioInputDevice(deviceId)` - Switch audio input

**Advanced:**
- `createTalkMessageStream()` - Create message stream
- `createAgentAudioInputStream()` - For audio passthrough mode
- `setPersonaConfig(config)` - Update persona
- `getPersonaConfig()` - Get current persona
- `addListener(event, callback)` - Event listener
- `removeListener(event, callback)` - Remove listener

### 5. Avatar ID Discovery

To find available avatars in your account:

```bash
curl -s https://api.anam.ai/v1/avatars \
  -H "Authorization: Bearer YOUR_API_KEY" | jq
```

Or in Node.js:

```javascript
const response = await fetch('https://api.anam.ai/v1/avatars', {
  headers: { Authorization: `Bearer ${ANAM_API_KEY}` }
});
const { data } = await response.json();
data.forEach(avatar => {
  console.log(`${avatar.displayName}: ${avatar.id}`);
});
```

## Common Issues & Solutions

### Issue 1: "Legacy session tokens are no longer supported"

**Cause:** Missing or incomplete `personaConfig` when generating session token.

**Solution:** Include ALL required fields in `personaConfig`:
- `name`
- `avatarId`
- `voiceId`
- `llmId`
- `systemPrompt`

### Issue 2: "Avatar with id X does not exist"

**Cause:** 
- Avatar ID doesn't exist in your account
- Avatar is not published/active
- Using a generic/example avatar ID

**Solution:**
1. List available avatars using the API
2. Use a valid avatar ID from your account
3. Ensure avatar is published in Anam dashboard

### Issue 3: "Avatar ID is required for ephemeral sessions"

**Cause:** `avatarId` field omitted from `personaConfig`.

**Solution:** Always include `avatarId` in the persona configuration.

### Issue 4: Environment variables not loading

**Cause:** Next.js dev server not restarted after `.env.local` changes.

**Solution:** 
```bash
pkill -f "next dev"
npm run dev
```

### Issue 5: "video element with id [object HTMLVideoElement] not found"

**Cause:** Passing the video element object instead of its ID string.

**Solution:**
```javascript
// ❌ Wrong
await client.streamToVideoElement(videoElement);

// ✅ Correct
await client.streamToVideoElement('video-id');
```

### Issue 6: Browser caching old session tokens

**Cause:** Browser caching API responses with old avatar IDs.

**Solution:**
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
- Add cache-busting headers to API route
- Add timestamp to API requests: `/api/endpoint?t=${Date.now()}`

## Test Files

### Simple Standalone Test

**File:** `/public/anam-simple-test.html`

A minimal HTML file for testing Anam integration without framework overhead:
- Uses CDN for SDK (`https://cdn.jsdelivr.net/npm/@anam-ai/js-sdk@latest/+esm`)
- Direct API token generation
- Simple start/stop controls
- Logging for debugging

**Usage:**
```
http://localhost:3000/anam-simple-test.html
```

### React Component Test

**File:** `/app/research/avatar-test/page.tsx`

React-based test page for Anam integration with Next.js.

## Architecture Options

### Option 1: Standalone Anam (Current Working Solution)

Anam handles both visual avatar and conversation AI:

```
User ↔ Browser ↔ Anam Client ↔ Anam API
                      ↓
                  Video Element
```

**Pros:**
- Simple integration
- All-in-one solution
- Working and tested

**Cons:**
- Less control over conversation flow
- Can't use custom LLM/voice providers easily

### Option 2: Audio Passthrough (Advanced)

Use ElevenLabs for conversation and forward audio to Anam for lip-sync:

```
User ↔ Browser ↔ ElevenLabs ↔ Custom Agent
         ↓
    Anam Client (audio passthrough)
         ↓
    Video Element
```

**Pros:**
- Custom conversation logic
- Use ElevenLabs agents
- More control

**Cons:**
- Complex WebSocket management
- Requires audio forwarding
- More potential points of failure

## Best Practices

1. **Always validate avatar ID** before deploying
2. **Restart dev server** after environment variable changes
3. **Use cache-busting** for API endpoints that return session tokens
4. **Pass element IDs as strings** to SDK methods, not DOM objects
5. **Handle errors gracefully** with try-catch blocks
6. **Clear video srcObject** when stopping to free resources
7. **Test in incognito mode** to avoid cache issues
8. **Keep session tokens secure** - generate server-side only

## Default IDs for Testing

### Voice IDs (Anam Defaults)
- `6bfbe25a-979d-40f3-a92b-5394170af54b` - Default Anam voice

### LLM IDs (Anam Defaults)
- `0934d97d-0c3a-4f33-91b0-5e136a0ef466` - Default Anam LLM

**Note:** These are Anam system defaults and should work with any account.

## Next Steps

- [ ] Integrate avatar into main research flow (`/app/research/page.tsx`)
- [ ] Add avatar toggle in UI
- [ ] Test with ElevenLabs audio passthrough (advanced)
- [ ] Add avatar selection UI for multiple avatars
- [ ] Implement error recovery and reconnection logic
- [ ] Add analytics/tracking for avatar interactions

## Resources

- [Anam Documentation](https://docs.anam.ai/)
- [Anam Dashboard](https://lab.anam.ai/)
- [Migration Guide for Legacy Tokens](https://docs.anam.ai/resources/migrating-legacy)
- [SDK Reference](https://docs.anam.ai/js-sdk/reference)
