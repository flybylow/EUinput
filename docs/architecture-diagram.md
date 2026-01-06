# Architecture Diagram: Embedded ElevenLabs Integration

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                              │
└─────────────────────────────────────────────────────────────────┘

1. User visits: https://yoursite.com/research?source=linkedin
                                ↓
2. Landing page loads with consent & context
                                ↓
3. User clicks "Start Conversation with Nova"
                                ↓
4. Browser requests microphone permission
                                ↓
5. EMBEDDED conversation starts (user stays on your site!)
                                ↓
6. User speaks with Nova (3-4 minutes)
                                ↓
7. Conversation ends naturally or user clicks "End"
                                ↓
8. ElevenLabs sends webhook with data
                                ↓
9. Data stored in Supabase for analysis
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React/Next.js)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────┐         │
│  │  /research Page (Server Component)                 │         │
│  │  ├─ Landing page content                           │         │
│  │  ├─ GDPR consent                                   │         │
│  │  ├─ Tracking params from URL                       │         │
│  │  │  (source, campaign, ref)                        │         │
│  │  └─ Embeds: ConversationWidget ────────────────┐   │         │
│  └────────────────────────────────────────────────│───┘         │
│                                                   │              │
│  ┌────────────────────────────────────────────────▼───┐         │
│  │  ConversationWidget (Client Component)         │   │         │
│  │  ├─ useConversation hook (@elevenlabs/react)   │   │         │
│  │  ├─ Microphone handling                        │   │         │
│  │  ├─ Status indicators                           │   │         │
│  │  └─ Error handling                              │   │         │
│  └────────────────────────────────────────────────┬───┘         │
│                                                   │              │
└───────────────────────────────────────────────────┼─────────────┘
                                                    │
                                                    │ GET /api/elevenlabs-signed-url
                                                    │ ?source=...&campaign=...&ref=...
                                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API ROUTE (Server-side)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────┐         │
│  │  /api/elevenlabs-signed-url/route.ts               │         │
│  │                                                     │         │
│  │  1. Receives tracking params                       │         │
│  │  2. Reads ELEVENLABS_API_KEY (server-side)         │         │
│  │  3. Calls ElevenLabs API ──────────────────────────┼─────┐   │
│  │  4. Gets signed WebSocket URL                      │     │   │
│  │  5. Returns to client                              │     │   │
│  └────────────────────────────────────────────────────┘     │   │
│                                                              │   │
└──────────────────────────────────────────────────────────────┼───┘
                                                               │
                  ┌────────────────────────────────────────────┘
                  │ POST https://api.elevenlabs.io/v1/convai/
                  │      conversation/get-signed-url
                  │ Headers: xi-api-key: sk_...
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ELEVENLABS SERVICE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────┐         │
│  │  Conversational AI Platform                        │         │
│  │  ├─ Generates signed WebSocket URL                 │         │
│  │  ├─ Manages conversation with Nova agent           │         │
│  │  ├─ Bidirectional audio streaming                  │         │
│  │  ├─ Captures conversation variables                │         │
│  │  └─ Sends post-call webhook ───────────────────────┼─────┐   │
│  └────────────────────────────────────────────────────┘     │   │
│                                                              │   │
└──────────────────────────────────────────────────────────────┼───┘
                                                               │
                  ┌────────────────────────────────────────────┘
                  │ POST https://your-project.supabase.co/
                  │      functions/v1/elevenlabs-webhook
                  │ Headers: x-webhook-secret: ...
                  │ Body: { conversation_id, q1_product, ... }
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA PIPELINE                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────┐         │
│  │  Supabase Edge Function                            │         │
│  │  (elevenlabs-webhook)                              │         │
│  │                                                     │         │
│  │  1. Receives webhook from ElevenLabs               │         │
│  │  2. Validates webhook secret                       │         │
│  │  3. Extracts conversation data                     │         │
│  │  4. Inserts into database ─────────────────────────┼─────┐   │
│  └────────────────────────────────────────────────────┘     │   │
│                                                              │   │
│  ┌────────────────────────────────────────────────────┐     │   │
│  │  Supabase PostgreSQL                               │ ◄───┘   │
│  │  Table: consumer_research_responses                │         │
│  │                                                     │         │
│  │  Stores:                                           │         │
│  │  ├─ conversation_id                                │         │
│  │  ├─ tracking (source, campaign, ref)               │         │
│  │  ├─ responses (q1, q2, q3, q4, q5)                 │         │
│  │  ├─ contact (email, country)                       │         │
│  │  └─ metadata (timestamp, duration, etc)            │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Detail

### 1. Conversation Start

```
User Browser                  Your API                ElevenLabs
    │                           │                         │
    ├─ Click "Start" ──────────►│                         │
    │                           │                         │
    │                           ├─ POST /get-signed-url ─►│
    │                           │   + API Key (secure)    │
    │                           │   + agent_id            │
    │                           │                         │
    │                           │◄─ signed_url ───────────┤
    │                           │   (temporary, secure)   │
    │                           │                         │
    │◄─ { signedUrl } ──────────┤                         │
    │                           │                         │
    ├─ Connect to WebSocket ────────────────────────────►│
    │   using signedUrl                                   │
    │                                                     │
    │◄────────── Audio Stream (bidirectional) ───────────►│
    │                                                     │
```

### 2. During Conversation

```
User speaks ─► Browser captures audio ─► ElevenLabs processes
                                          │
                                          ├─ Speech-to-text
                                          ├─ LLM reasoning (Nova)
                                          ├─ Text-to-speech
                                          │
Browser plays audio ◄────────────────────┘
```

### 3. Conversation End

```
Conversation Ends           ElevenLabs          Webhook Handler      Database
      │                         │                      │                │
      │                         ├─ POST webhook ──────►│                │
      │                         │  {                   │                │
      │                         │    conversation_id,  │                │
      │                         │    source,           │                │
      │                         │    q1_product,       │                │
      │                         │    email,            │                │
      │                         │    ...               │                │
      │                         │  }                   │                │
      │                         │                      │                │
      │                         │                      ├─ Validate ─────┤
      │                         │                      │                │
      │                         │                      ├─ INSERT ───────►│
      │                         │                      │                │
      │                         │◄─ 200 OK ────────────┤                │
      │                         │                      │                │
```

---

## Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY BOUNDARIES                           │
└─────────────────────────────────────────────────────────────────┘

CLIENT (Browser)
├─ ✅ Can see: Agent ID, signed URL (temporary)
├─ ❌ Cannot see: API key
└─ ✅ Encrypted: All audio via WSS (WebSocket Secure)

SERVER (Your API)
├─ ✅ Has: API key (in environment variables)
├─ ✅ Generates: Temporary signed URLs
└─ ✅ Never exposes: API key to client

ELEVENLABS
├─ ✅ Validates: API key (server-side only)
├─ ✅ Issues: Temporary signed URLs
├─ ✅ Sends webhook: With secret validation
└─ ✅ Encrypts: All communications (HTTPS/WSS)

DATABASE (Supabase)
├─ ✅ Protected: Row-level security (RLS)
├─ ✅ Validates: Webhook secret before insert
└─ ✅ Accessible: Only to authenticated users
```

---

## Key Security Features

### 1. API Key Never Exposed
```typescript
// ❌ BAD: Exposing API key to client
const conversation = useConversation({
  agentId: 'agent_xxx',
  apiKey: 'sk_xxx'  // NEVER DO THIS!
});

// ✅ GOOD: Using signed URL from server
const { signedUrl } = await fetch('/api/elevenlabs-signed-url');
const conversation = useConversation({ signedUrl });
```

### 2. Temporary Signed URLs
- Each URL is single-use
- Expires after short time
- Cannot be reused or shared
- Generated fresh for each conversation

### 3. Webhook Validation
```typescript
// Webhook handler validates secret
const webhookSecret = Deno.env.get('ELEVENLABS_WEBHOOK_SECRET');
const providedSecret = req.headers.get('x-webhook-secret');

if (providedSecret !== webhookSecret) {
  return new Response('Unauthorized', { status: 401 });
}
```

---

## Performance Characteristics

### Latency
- **Connection setup:** ~500-1000ms (microphone + WebSocket)
- **Speech-to-text:** ~100-300ms (streaming)
- **LLM response:** ~500-2000ms (depends on complexity)
- **Text-to-speech:** ~200-500ms (streaming starts immediately)

### Bandwidth
- **Audio upload:** ~12-24 KB/s (16kHz mono)
- **Audio download:** ~12-24 KB/s (speech synthesis)
- **Overhead:** Minimal (WebSocket protocol)

### Cost (ElevenLabs)
- **Per conversation:** ~€0.10-0.20 (3-4 minutes)
- **1000 conversations:** ~€100-200
- **Monitoring recommended:** Watch usage daily

---

## Technology Stack

```
Frontend
├─ Next.js 14 (App Router)
├─ React 18
├─ TypeScript
├─ Tailwind CSS
└─ @elevenlabs/react (official SDK)

Backend
├─ Next.js API Routes (serverless)
├─ Supabase Edge Functions (Deno)
└─ PostgreSQL (Supabase)

External Services
├─ ElevenLabs Conversational AI
├─ Supabase (database + functions)
└─ Vercel (hosting)
```

---

## Scalability

### Concurrent Users
- **Limited by:** ElevenLabs plan
- **Typical:** 10-50 concurrent conversations
- **Our target:** <10 concurrent (500-2000 total over weeks)

### Database
- **Supabase free tier:** 500 MB storage
- **Each response:** ~2 KB
- **Capacity:** ~250,000 responses (way more than needed)

### API Routes
- **Vercel serverless:** Auto-scales
- **Cold start:** ~100-300ms
- **Not an issue:** Only called once per conversation

---

## Monitoring Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    WHAT TO MONITOR                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend                                                        │
│  ├─ Conversation start success rate                             │
│  ├─ Microphone permission grant rate                            │
│  ├─ Connection errors                                           │
│  └─ Average conversation duration                               │
│                                                                  │
│  API Route                                                       │
│  ├─ Signed URL request errors                                   │
│  ├─ ElevenLabs API errors                                       │
│  └─ Response times                                              │
│                                                                  │
│  ElevenLabs                                                      │
│  ├─ Token usage (cost)                                          │
│  ├─ Conversation count                                          │
│  ├─ Average duration                                            │
│  └─ Error rate                                                  │
│                                                                  │
│  Database                                                        │
│  ├─ Webhook success rate                                        │
│  ├─ Completion rate (email + country captured)                  │
│  ├─ Responses by source                                         │
│  └─ Data quality issues                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Comparison: Architecture Approaches

### Approach 1: Simple Redirect (Old)
```
User → Your Site → ElevenLabs Hosted Page
```
- ✅ Simple to implement
- ❌ User leaves your site
- ❌ No control over UX
- ❌ Limited tracking

### Approach 2: Embedded (Current - ✅ Implemented)
```
User → Your Site (with embedded conversation)
```
- ✅ User stays on your site
- ✅ Full control over UX
- ✅ Complete tracking
- ✅ Secure (API key server-side)
- ⚠️ More complex setup

### Approach 3: Fully Custom (Future)
```
User → Your Site → Your Backend → Speech APIs → Your LLM
```
- ✅ Complete control
- ✅ No vendor lock-in
- ❌ Very complex
- ❌ Expensive
- ❌ Not needed for MVP

**Decision:** Approach 2 (Embedded) is the sweet spot for this project.

---

**Created:** January 6, 2026  
**Status:** ✅ Current architecture  
**Next:** Testing and deployment

