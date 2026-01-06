# Embedded ElevenLabs Conversation Setup

This document explains the embedded React-based ElevenLabs integration that replaced the simple redirect approach.

---

## What Changed

**Before:** The `/research` page just redirected users to the ElevenLabs hosted page.

**Now:** The conversation is embedded directly in your React application with a clean UI and better user experience.

---

## Architecture

The integration consists of three main components:

### 1. API Route: `/app/api/elevenlabs-signed-url/route.ts`

**Purpose:** Securely generates signed URLs for ElevenLabs conversations without exposing your API key to the client.

**Features:**
- Keeps API key server-side (secure)
- Passes tracking parameters (source, campaign, ref) to ElevenLabs
- Returns signed URL that client can use to start conversation

**Example request:**
```
GET /api/elevenlabs-signed-url?source=linkedin&campaign=launch&ref=ward
```

**Example response:**
```json
{
  "signedUrl": "wss://...",
  "variables": {
    "var_source": "linkedin",
    "var_campaign": "launch",
    "var_ref": "ward"
  }
}
```

### 2. Client Component: `/app/research/ConversationWidget.tsx`

**Purpose:** Embeds the voice conversation directly in the page using the `@elevenlabs/react` library.

**Features:**
- Uses `useConversation` hook from `@elevenlabs/react`
- Handles microphone permissions
- Shows connection status (idle, requesting, connected, error)
- Clean UI with loading states and error handling
- End conversation button

**User Flow:**
1. User clicks "Start Conversation with Nova"
2. Browser requests microphone permission
3. Component fetches signed URL from API
4. Conversation starts in-page (no redirect!)
5. User speaks with Nova
6. User can end conversation or it ends naturally

### 3. Research Page: `/app/research/page.tsx`

**Purpose:** Landing page that embeds the conversation widget with consent and context.

**Features:**
- Explains the study
- Shows GDPR consent notice
- Embeds ConversationWidget component
- Passes tracking parameters from URL to widget

---

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# ElevenLabs API credentials (REQUIRED)
ELEVENLABS_API_KEY=sk_your_api_key_here
ELEVENLABS_AGENT_ID=agent_your_agent_id_here

# Webhook secret for receiving data (if using webhook)
ELEVENLABS_WEBHOOK_SECRET=your_webhook_secret_here

# Supabase (for storing responses)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Getting your credentials:**

1. **API Key:** Go to [ElevenLabs Settings](https://elevenlabs.io/settings) → API Keys
2. **Agent ID:** Go to [Conversational AI](https://elevenlabs.io/conversational-ai) → Your Agent → Copy ID
3. **Webhook Secret:** Generate with `openssl rand -hex 32`

---

## Dependencies

The integration uses the official ElevenLabs React library:

```json
{
  "dependencies": {
    "@elevenlabs/react": "^0.x.x"
  }
}
```

Installed with:
```bash
npm install @elevenlabs/react
```

---

## Benefits of Embedded Approach

### Better User Experience
- No redirect to external site
- Conversation stays within your branded experience
- Seamless integration with your design system

### Better Tracking
- Can add custom analytics around conversation events
- Track when users start/end conversations
- Monitor connection issues

### More Control
- Custom UI and styling
- Add features like transcript display
- Implement custom error handling
- Show typing indicators or custom status messages

### Security
- API key never exposed to client
- Signed URLs are temporary and single-use
- All sensitive operations happen server-side

---

## How It Works: Technical Details

### 1. User Initiates Conversation

```typescript
// ConversationWidget.tsx
const startConversation = async () => {
  // 1. Request microphone access
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  // 2. Get signed URL from your API (with tracking params)
  const response = await fetch('/api/elevenlabs-signed-url?source=...');
  const { signedUrl } = await response.json();
  
  // 3. Start conversation using ElevenLabs SDK
  await conversation.startSession({ signedUrl });
};
```

### 2. API Generates Signed URL

```typescript
// route.ts
const response = await fetch(
  `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
  {
    headers: { 'xi-api-key': apiKey }
  }
);
const { signed_url } = await response.json();
return NextResponse.json({ signedUrl: signed_url });
```

### 3. ElevenLabs SDK Manages Connection

The `useConversation` hook handles:
- WebSocket connection to ElevenLabs
- Audio streaming (bidirectional)
- Conversation state management
- Error handling and reconnection

---

## Testing Locally

### 1. Start the dev server:
```bash
npm run dev
```

### 2. Navigate to:
```
http://localhost:3000/research
```

### 3. Click "Start Conversation with Nova"

### 4. Grant microphone permission when prompted

### 5. Speak with Nova!

---

## Testing with Tracking Parameters

To test the tracking parameter flow:

```
http://localhost:3000/research?source=test&campaign=dev&ref=yourname
```

These parameters will be:
1. Passed to the API route
2. Included in the signed URL request
3. Sent to ElevenLabs as conversation variables
4. Eventually sent to your webhook when conversation ends

---

## Common Issues

### "Failed to get conversation URL"

**Cause:** API route can't reach ElevenLabs or credentials are wrong.

**Fix:**
1. Check `ELEVENLABS_API_KEY` is set in `.env.local`
2. Check `ELEVENLABS_AGENT_ID` is set
3. Verify API key is valid (test with curl)

### "Microphone permission denied"

**Cause:** User blocked microphone access.

**Fix:**
- User must grant permission in browser
- Check browser settings if blocked
- Use HTTPS in production (required for microphone access)

### "Connection error occurred"

**Cause:** Network issue or ElevenLabs service problem.

**Fix:**
1. Check network connection
2. Try again in a few moments
3. Check ElevenLabs status page
4. Verify agent is active in ElevenLabs dashboard

---

## Production Deployment

### Important: HTTPS Required

Microphone access requires HTTPS. Make sure:
- Vercel deployment uses HTTPS (automatic)
- Custom domain has SSL certificate
- No mixed content warnings

### Environment Variables in Vercel

Add these in Vercel dashboard → Project → Settings → Environment Variables:

```
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_AGENT_ID=agent_...
ELEVENLABS_WEBHOOK_SECRET=your_secret
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Future Enhancements

Possible improvements to the embedded experience:

### Transcript Display
Show conversation in real-time as text below the widget:

```typescript
const [messages, setMessages] = useState<string[]>([]);

const conversation = useConversation({
  onMessage: (message) => {
    setMessages(prev => [...prev, `${message.source}: ${message.message}`]);
  },
});
```

### Visual Feedback
Add waveform visualization or speaking indicator:

```typescript
const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);

const conversation = useConversation({
  onModeChange: (mode) => {
    setIsAgentSpeaking(mode.mode === 'speaking');
  },
});
```

### Custom Tools
Add client-side tools that Nova can call:

```typescript
conversation.registerClientTool({
  name: 'show_product_image',
  description: 'Display product image to user',
  parameters: { product: 'string' },
  handler: async ({ product }) => {
    // Show image in UI
    return { success: true };
  }
});
```

---

## Comparison: Embedded vs Redirect

| Feature | Redirect (Old) | Embedded (New) |
|---------|---------------|----------------|
| User stays on your site | ❌ No | ✅ Yes |
| Custom branding | ❌ No | ✅ Yes |
| Tracking events | ⚠️ Limited | ✅ Full control |
| API key security | ⚠️ Exposed in URL | ✅ Server-side only |
| Mobile experience | ⚠️ Opens new tab | ✅ Seamless |
| Setup complexity | Simple | Moderate |

---

## References

- **ElevenLabs React Docs:** https://elevenlabs.io/docs/conversational-ai/sdks/react
- **API Reference:** https://elevenlabs.io/docs/api-reference/conversational-ai
- **Agent Configuration:** `docs/nova-agent-setup.md`
- **Webhook Setup:** `docs/european-consumer-transparency-study.md` (lines 356-446)

---

**Last Updated:** January 6, 2026  
**Implementation By:** Claude  
**Status:** ✅ Ready for testing

