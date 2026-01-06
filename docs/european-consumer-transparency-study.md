# European Consumer Transparency Study - Developer Handoff

**Project:** Voice AI Research for DPP Consumer Insights  
**Status:** Active | MVP Phase  
**Start Date:** 2026-01-06  
**Target Launch:** 2026-01-13  
**Owner:** Ward (Tabulas)  
**Developer:** Jacky Vesmoot

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Goals & Success Metrics](#project-goals--success-metrics)
3. [Architecture Overview](#architecture-overview)
4. [Tech Stack Decision](#tech-stack-decision)
5. [ElevenLabs Configuration](#elevenlabs-configuration)
6. [Data Pipeline Implementation](#data-pipeline-implementation)
7. [Landing Page Requirements](#landing-page-requirements)
8. [Existing Code References](#existing-code-references)
9. [Integration with Tabulas Stack](#integration-with-tabulas-stack)
10. [Implementation Checklist](#implementation-checklist)
11. [Timeline & Phases](#timeline--phases)
12. [Security & GDPR](#security--gdpr)
13. [Budget Constraints](#budget-constraints)
14. [Open Questions & Decisions](#open-questions--decisions)

---

## Executive Summary

### What We're Building

A voice AI-powered consumer research tool using ElevenLabs Conversational AI to conduct 3-4 minute interviews with European consumers about Digital Product Passports (DPPs). The goal is to gather 500-2,000 responses to understand what consumers actually want to see when they scan a product.

### Why It Matters

- **Product validation:** Real consumer data to inform Tabulas DPP design
- **Marketing asset:** Quotable statistics for investor pitches and client sales
- **Academic credibility:** Partnership with Howest/Thomas More for legitimacy
- **Lead generation:** Email collection for future engagement

### Key Constraint

**Budget: <€250 total** (ElevenLabs tokens ~€100-200, domain ~€10)

---

## Project Goals & Success Metrics

### Primary Goals

| Goal | Target |
|------|--------|
| Total responses | 500-2,000 |
| Completion rate | >70% |
| Average duration | <4 minutes |
| Email opt-in rate | >60% |
| Countries represented | 5+ EU countries |

### Phased Targets

| Phase | Timeline | Responses | Source |
|-------|----------|-----------|--------|
| Phase 1: Controlled | Week 1 | 50 | Personal network |
| Phase 2: Academic | Week 2-3 | 200-500 | Howest/Thomas More |
| Phase 3: Open | Week 4+ | 500-2,000 | LinkedIn, Substack, partners |

---

## Architecture Overview

### System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   [User clicks tracking link]                                        │
│           │                                                          │
│           ▼                                                          │
│   ┌───────────────────┐                                              │
│   │   Landing Page    │  voice.tabulas.eu/research                   │
│   │   (Optional)      │  - Explains study                            │
│   └─────────┬─────────┘  - GDPR consent                              │
│             │                                                        │
│             ▼                                                        │
│   ┌───────────────────┐                                              │
│   │  ElevenLabs Agent │  Nova character                              │
│   │  (Conversational) │  - 5 questions                               │
│   │                   │  - ~3 min duration                           │
│   └─────────┬─────────┘  - Captures variables                        │
│             │                                                        │
│             ▼                                                        │
│   ┌───────────────────┐                                              │
│   │  Post-Call        │  Fires on conversation end                   │
│   │  Webhook          │  - JSON payload                              │
│   └─────────┬─────────┘  - All captured variables                    │
│             │                                                        │
│             ▼                                                        │
│   ┌───────────────────┐                                              │
│   │  Database         │  Supabase (recommended)                      │
│   │  (Storage)        │  or Airtable (MVP)                           │
│   └─────────┬─────────┘                                              │
│             │                                                        │
│             ▼                                                        │
│   ┌───────────────────┐                                              │
│   │  Analysis         │  Export → Python/Sheets                      │
│   │  Dashboard        │  Real-time view (optional)                   │
│   └───────────────────┘                                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Technology |
|-----------|----------------|------------|
| Landing Page | Context, consent, redirect | Next.js (Vercel) |
| Voice Agent | Conduct interviews, capture data | ElevenLabs Conversational AI |
| Webhook Handler | Receive + validate data | Next.js API Route or Supabase Edge Function |
| Database | Store responses | Supabase PostgreSQL |
| Dashboard | Real-time monitoring | Supabase + simple React chart |

---

## Tech Stack Decision

### Recommended: Supabase (Aligned with Tabulas Stack)

Given Tabulas already uses Supabase, we should use it here for consistency and skill building.

**Pros:**
- Already in tech stack (no new service to learn)
- PostgreSQL = proper SQL queries for analysis
- Edge Functions can receive webhooks
- RLS for security
- No row limits (unlike Airtable)
- Scales to 10k+ responses without issue

**Cons:**
- Slightly more setup than Airtable
- No built-in visual dashboard (need to build or use Metabase)

### Alternative: Airtable (Fastest MVP)

**Pros:**
- Visual interface for monitoring
- 5-minute webhook setup
- Non-technical team can view results
- Good for <1,000 records

**Cons:**
- 1,200 records on free tier (problem at scale)
- Not in our stack (context switching)
- Limited query capabilities
- Data export needed for real analysis

### Decision

**Start with Supabase.** It's 30 minutes more setup but avoids migration later and builds team capability.

---

## ElevenLabs Configuration

### Agent Setup

**Platform:** ElevenLabs Conversational AI  
**Agent Name:** Nova  
**Character:** Friendly research assistant (coffee shop vibe)

### Voice Settings

| Setting | Value | Rationale |
|---------|-------|-----------|
| Voice | "Rachel" or "Bella" | Warm, professional, neutral accent |
| Stability | 0.50-0.60 | Natural variation |
| Clarity + Similarity | 0.75 | Clear but not robotic |
| Style Exaggeration | 0.30 | Slight warmth |
| Language | English (start), NL/FR (Phase 2) |

### System Prompt

```
You are Nova, a friendly research assistant helping Tabulas understand consumer needs.

Your personality:
- Warm, curious, slightly informal
- Like a friendly researcher at a coffee shop
- Efficient - respect people's time
- Non-judgmental - every answer is valid
- Human - occasional "hmm" or "interesting"

You are NOT:
- Corporate or formal
- A salesperson
- Robotic or scripted-sounding
- Pushy

Your job:
- Ask 5 questions about product transparency
- Listen actively, acknowledge answers briefly
- Keep momentum - don't linger
- Collect email and country at the end

Tracking info (do not mention to user):
- Source: {{source}}
- Campaign: {{campaign}}
- Conversation ID: {{system__conversation_id}}

Store responses as:
- Q1 product → {{q1_product}}
- Q1 doubt → {{q1_doubt}}
- Q2 proof → {{q2_proof}}
- Q3 authority → {{q3_authority}}
- Q4 format → {{q4_format}}
- Q5 behavior → {{q5_behavior}}
- Q5 pay more → {{q5_pay_more}}
- Email → {{email}}
- Country → {{country}}

Acknowledgment phrases: "Got it." / "Okay." / "Interesting."
Transition phrases: "Next one." / "Alright." / "Last one."

Keep responses SHORT. This is a 3-4 minute conversation max.

Handling rules:
- If silence >5 seconds: "Take your time." or offer example
- If rambling: "Got it, that's helpful. Next question..."
- If off-topic: "Interesting. Let me ask you this though..."
- If "I don't know": "No worries. What's your gut feeling?"
- If asks about Tabulas: "Small European startup building product transparency infrastructure. Anyway..."
- If asks about privacy: "Your answers help our research. Email is just for sending results. We don't share it."
- If wants to stop: "No problem. Thanks for your time." [END]
```

### Conversation Script

**INTRO (First Message):**
```
Hi! Thanks for taking a few minutes.

I'm Nova, helping Tabulas - a European startup building digital product passports. Passports for products. So you can see where something comes from and what happened on its journey.

To build this the right way, we're asking real people across Europe: what would you actually want to see?

No wrong answers. Just your honest thoughts.

Let's go.

First one. Think of the last product where you thought: can I actually trust this? What was it, and what made you doubt it?
```

**QUESTIONS:**
```
Q1: First one. Think of the last product where you thought: can I actually trust this? What was it, and what made you doubt it?

[After response]
Q2: Got it. If that product could prove something to you, what would you want it to prove?

[After response]
Q3: And who would you trust to verify that? [Let them answer freely - don't give menu options]

[After response]
Q4: Okay, next one. Imagine you scan a product with your phone. What would you want to see? A simple score? A detailed breakdown? The product's journey? Something else?

[After response]
Q5: Alright, last one. If products could show you all this - would it change how you shop? And would you pay a bit more for that transparency?
```

**CLOSE:**
```
That's it. Really helpful.

We're sharing results with everyone who participates. What's your email? I'll send you the report when it's ready.

[After email]
And which country are you in?

[After country]
Thanks! You'll hear from us soon.
```

---

## Data Pipeline Implementation

### Option A: Supabase (Recommended)

#### 1. Database Schema

```sql
-- Create table for research responses
CREATE TABLE consumer_research_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- ElevenLabs system variables
    conversation_id TEXT UNIQUE NOT NULL,
    call_timestamp TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Tracking variables (from URL)
    source TEXT,
    campaign TEXT,
    ref TEXT,
    
    -- Question responses
    q1_product TEXT,
    q1_doubt TEXT,
    q2_proof TEXT,
    q3_authority TEXT,
    q4_format TEXT,
    q5_behavior TEXT,
    q5_pay_more TEXT,
    
    -- Contact info
    email TEXT,
    country TEXT,
    
    -- Metadata
    language TEXT DEFAULT 'en',
    completed BOOLEAN DEFAULT FALSE,
    
    -- Full transcript (optional, for qualitative analysis)
    transcript JSONB
);

-- Index for common queries
CREATE INDEX idx_responses_source ON consumer_research_responses(source);
CREATE INDEX idx_responses_country ON consumer_research_responses(country);
CREATE INDEX idx_responses_created ON consumer_research_responses(created_at);

-- RLS Policy (important for security)
ALTER TABLE consumer_research_responses ENABLE ROW LEVEL SECURITY;

-- Only allow inserts from authenticated service role (webhook)
CREATE POLICY "Allow webhook inserts" ON consumer_research_responses
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Allow reads for authenticated users (dashboard)
CREATE POLICY "Allow authenticated reads" ON consumer_research_responses
    FOR SELECT
    TO authenticated
    USING (true);
```

#### 2. Edge Function for Webhook

Create `supabase/functions/elevenlabs-webhook/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify webhook secret (set in ElevenLabs dashboard)
    const webhookSecret = Deno.env.get('ELEVENLABS_WEBHOOK_SECRET')
    const signature = req.headers.get('x-elevenlabs-signature')
    
    // TODO: Implement signature verification if ElevenLabs provides it
    // For now, use a shared secret in headers
    const providedSecret = req.headers.get('x-webhook-secret')
    if (webhookSecret && providedSecret !== webhookSecret) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const payload = await req.json()
    
    // Extract data from ElevenLabs webhook payload
    const data = {
      conversation_id: payload.conversation_id || payload.system__conversation_id,
      call_timestamp: payload.timestamp || payload.system__time_utc,
      duration_seconds: parseInt(payload.duration_secs || payload.system__call_duration_secs) || null,
      
      // Tracking
      source: payload.source || null,
      campaign: payload.campaign || null,
      ref: payload.ref || null,
      
      // Responses
      q1_product: payload.q1_product || null,
      q1_doubt: payload.q1_doubt || null,
      q2_proof: payload.q2_proof || null,
      q3_authority: payload.q3_authority || null,
      q4_format: payload.q4_format || null,
      q5_behavior: payload.q5_behavior || null,
      q5_pay_more: payload.q5_pay_more || null,
      
      // Contact
      email: payload.email || null,
      country: payload.country || null,
      
      // Meta
      completed: !!(payload.email && payload.country),
      transcript: payload.transcript || null,
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Insert into database
    const { error } = await supabaseClient
      .from('consumer_research_responses')
      .insert(data)

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Database insert failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, conversation_id: data.conversation_id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

#### 3. Deploy Edge Function

```bash
# Login to Supabase CLI
supabase login

# Link to project
supabase link --project-ref YOUR_PROJECT_REF

# Set environment variables
supabase secrets set ELEVENLABS_WEBHOOK_SECRET=your-secret-here

# Deploy function
supabase functions deploy elevenlabs-webhook

# Get function URL
# Format: https://YOUR_PROJECT_REF.supabase.co/functions/v1/elevenlabs-webhook
```

### Option B: Airtable (Alternative MVP)

If you prefer Airtable for faster visual feedback:

#### 1. Airtable Base Schema

| Field Name | Type | Notes |
|------------|------|-------|
| ID | Auto Number | Primary key |
| Conversation ID | Single line text | From ElevenLabs |
| Timestamp | Date/Time | Auto or from webhook |
| Duration | Number | Seconds |
| Source | Single select | linkedin, howest, email, etc. |
| Campaign | Single select | launch, academic, partner |
| Ref | Single line text | Who shared |
| Q1 Product | Single line text | |
| Q1 Doubt | Long text | |
| Q2 Proof | Long text | |
| Q3 Authority | Single line text | |
| Q4 Format | Single line text | |
| Q5 Behavior | Long text | |
| Q5 Pay More | Single line text | |
| Email | Email | |
| Country | Single select | |
| Completed | Checkbox | |

#### 2. Airtable Automation

1. Go to Automations → Create automation
2. Trigger: "When webhook received"
3. Get webhook URL (format: `https://hooks.airtable.com/workflows/v1/...`)
4. Action: "Create record" with field mapping

---

## Landing Page Requirements

### URL Structure

**Primary:** `voice.tabulas.eu/research`  
**Alternative:** `tabulas.eu/research` or `research.tabulas.eu`

### Page Content

```jsx
// pages/research/page.tsx (Next.js App Router)

export default function ResearchPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Help Shape the Future of Product Transparency
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          We're building digital product passports for Europe.
          Before we build, we want to hear from you.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="flex justify-center gap-8 text-sm text-gray-500">
            <span>⏱️ 3 minutes</span>
            <span>❓ 5 questions</span>
            <span>🎁 Get the report</span>
          </div>
        </div>

        {/* GDPR Consent Notice */}
        <p className="text-sm text-gray-500 mb-6">
          By starting the conversation, you agree that your anonymized responses 
          will be used for research purposes. We'll ask for your email at the end 
          only to send you the results — we won't share it.
        </p>

        {/* CTA Button - Links to ElevenLabs agent */}
        <a 
          href="https://elevenlabs.io/convai/[AGENT_ID]"
          className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
        >
          Start Conversation →
        </a>
      </section>

      {/* Partners */}
      <section className="border-t py-8">
        <p className="text-center text-sm text-gray-500">
          A research project by Tabulas in collaboration with Howest and Thomas More
        </p>
      </section>
    </main>
  )
}
```

### Tracking Link Handler

```typescript
// pages/research/page.tsx or app/research/page.tsx

import { redirect } from 'next/navigation'

export default function ResearchPage({
  searchParams,
}: {
  searchParams: { source?: string; campaign?: string; ref?: string }
}) {
  const { source, campaign, ref } = searchParams
  
  // Build ElevenLabs URL with tracking params
  const elevenlabsBaseUrl = 'https://elevenlabs.io/convai/[AGENT_ID]'
  const params = new URLSearchParams()
  
  if (source) params.set('var_source', source)
  if (campaign) params.set('var_campaign', campaign)
  if (ref) params.set('var_ref', ref)
  
  const elevenlabsUrl = `${elevenlabsBaseUrl}?${params.toString()}`
  
  // Option 1: Direct redirect (no landing page)
  // redirect(elevenlabsUrl)
  
  // Option 2: Show landing page with embedded link
  return (
    <main>
      {/* Landing page content */}
      <a href={elevenlabsUrl}>Start Conversation</a>
    </main>
  )
}
```

---

## Existing Code References

### ElevenLabs + React Integration (Previous Project)

We have existing code from the Three.js robot project that demonstrates ElevenLabs integration:

**Key Files:**
- `App.tsx` - ElevenLabs useConversation hook
- `robotStore.ts` - Zustand state management
- Client tools registration pattern

**Relevant Code Pattern:**

```typescript
import { useConversation } from '@11labs/react';

const conversation = useConversation({
  onMessage: (message) => {
    // Track conversation transcript
    setTranscript(prev => [...prev, `${message.source}: ${message.message}`]);
  },
  onError: (error) => {
    console.error('ElevenLabs error:', error);
  },
  onStatusChange: (status) => {
    console.log('Connection status:', status);
  }
});

// Start conversation
const startConversation = async () => {
  await navigator.mediaDevices.getUserMedia({ audio: true });
  await conversation.startSession({
    agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID,
  });
};
```

**Production Security Pattern (Signed URLs):**

```typescript
// API route: /api/elevenlabs-signed-url
export async function GET() {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${process.env.AGENT_ID}`,
    {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
    }
  );
  const { signed_url } = await response.json();
  return Response.json({ signed_url });
}

// Frontend
const { signed_url } = await fetch('/api/elevenlabs-signed-url').then(r => r.json());
await conversation.startSession({ signedUrl: signed_url });
```

### Related GitHub Repositories

| Repo | Purpose | Relevance |
|------|---------|-----------|
| `flybylow/bim` | BIM Viewer MVP | Next.js + TypeScript structure |
| `flybylow/settlemint` | Blockchain integration | Webhook patterns, API routes |

---

## Integration with Tabulas Stack

### Shared Infrastructure

| Component | Existing | New for This Project |
|-----------|----------|----------------------|
| Supabase | ✅ tabulas.eu database | New table in same project |
| Vercel | ✅ tabulas.eu hosting | Subdomain or path |
| Next.js | ✅ 14.x | Same version |
| TypeScript | ✅ 5.x | Same config |
| Tailwind | ✅ 3.x | Same design system |

### Database Integration

The research data should live in the same Supabase project as Tabulas:

```
Supabase Project: tabulas-prod
├── products (existing)
├── stakeholders (existing)
├── events (existing)
└── consumer_research_responses (NEW)
```

This allows future queries like:
```sql
-- What do consumers want to see for chocolate products?
SELECT q4_format, COUNT(*) 
FROM consumer_research_responses 
WHERE q1_product ILIKE '%chocolate%'
GROUP BY q4_format;
```

### Environment Variables

Add to `.env.local` and Vercel:

```bash
# ElevenLabs
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_AGENT_ID=agent_...
ELEVENLABS_WEBHOOK_SECRET=your-secret-here

# Existing Supabase (reuse)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Implementation Checklist

### Phase 0: Setup (Day 1)

- [ ] Create ElevenLabs account (if not exists)
- [ ] Create Conversational AI agent named "Nova"
- [ ] Configure voice settings (Rachel, stability 0.55)
- [ ] Input system prompt
- [ ] Configure conversation flow
- [ ] Test agent manually

### Phase 1: Data Pipeline (Day 2)

- [ ] Create `consumer_research_responses` table in Supabase
- [ ] Apply RLS policies
- [ ] Create Edge Function for webhook
- [ ] Deploy Edge Function
- [ ] Configure ElevenLabs post-call webhook
- [ ] Test end-to-end with sample conversation

### Phase 2: Landing Page (Day 3)

- [ ] Create `/research` route in Tabulas Next.js project
- [ ] Implement tracking parameter passthrough
- [ ] Add GDPR consent copy
- [ ] Style with Tabulas design system
- [ ] Deploy to Vercel
- [ ] Configure `voice.tabulas.eu` subdomain (optional)

### Phase 3: Testing (Day 4)

- [ ] Test with 5 internal users
- [ ] Verify webhook data arrives correctly
- [ ] Check all variables captured
- [ ] Test different tracking links
- [ ] Fix any issues

### Phase 4: Soft Launch (Day 5-7)

- [ ] Generate tracking links for each source
- [ ] Share with 50 people from network
- [ ] Monitor completion rates
- [ ] Iterate on conversation if needed
- [ ] Prepare academic outreach email

### Phase 5: Scale (Week 2+)

- [ ] Contact Howest/Thomas More
- [ ] Launch LinkedIn post
- [ ] Add NL/FR language support
- [ ] Build simple dashboard for monitoring

---

## Timeline & Phases

### Week 1: Build & Test

| Day | Task | Owner |
|-----|------|-------|
| Mon | ElevenLabs agent setup | Jacky |
| Tue | Webhook + database | Jacky |
| Wed | Landing page | Jacky |
| Thu | Internal testing (10 people) | Ward + Jacky |
| Fri | Iterate based on feedback | Jacky |
| Sat-Sun | Soft launch (50 people) | Ward |

### Week 2-3: Academic

| Task | Owner |
|------|-------|
| Send outreach to Howest | Ward |
| Send outreach to Thomas More | Ward |
| Monitor responses | Ward |
| Fix issues | Jacky |
| First analysis (100 responses) | Ward |

### Week 4+: Open Distribution

| Task | Owner |
|------|-------|
| LinkedIn post | Ward |
| Substack article | Ward |
| Partner distribution | Ward |
| Full analysis (500+ responses) | Ward |

---

## Security & GDPR

### Data Handling

| Data Type | Storage | Retention | Access |
|-----------|---------|-----------|--------|
| Responses (anonymized) | Supabase | Indefinite | Team only |
| Email addresses | Supabase | Until report sent | Team only |
| Conversation IDs | Supabase | Indefinite | System only |
| Audio recordings | ElevenLabs | Per ElevenLabs policy | Not accessed |

### GDPR Compliance

1. **Consent:** Collected on landing page before conversation starts
2. **Purpose limitation:** Data used only for stated research purpose
3. **Data minimization:** Only collect what's needed
4. **Right to erasure:** Can delete by conversation_id if requested
5. **No profiling:** Aggregate analysis only

### Consent Copy (Landing Page)

```
By starting the conversation, you agree that:
- Your responses will be used for research into product transparency
- Responses are anonymized and aggregated for analysis
- Your email (optional) is used only to send you the research results
- You can request deletion of your data at any time
- Data is stored securely in the EU

This research is conducted by Tabulas (Belgium) in collaboration with 
Howest and Thomas More universities.
```

---

## Budget Constraints

### Total Budget: <€250

| Item | Estimated Cost | Notes |
|------|----------------|-------|
| ElevenLabs tokens | €100-200 | ~1000 conversations |
| Domain (optional) | €10 | voice.tabulas.eu |
| Supabase | €0 | Using existing project |
| Vercel | €0 | Using existing deployment |
| **Total** | **~€210** | |

### ElevenLabs Cost Optimization

- Short conversations (~3 min) use fewer tokens
- Don't store full transcripts unless needed
- Monitor usage daily in first week
- Pause if approaching budget

---

## Open Questions & Decisions

### Technical Decisions Needed

1. **Supabase vs Airtable?**
   - Recommendation: Supabase
   - Ward to confirm

2. **Landing page location?**
   - Option A: `tabulas.eu/research` (same repo)
   - Option B: `voice.tabulas.eu` (subdomain)
   - Option C: Direct ElevenLabs link (no landing page)
   - Recommendation: Option A

3. **Multi-language timing?**
   - Start English only, add NL/FR in Phase 2?
   - Or NL from day 1 for Belgian universities?
   - Recommendation: English first, NL in week 2

4. **Dashboard needed?**
   - Simple real-time counter?
   - Full analytics dashboard?
   - Recommendation: Basic Supabase views for now, dashboard if >200 responses

### Business Decisions Needed

1. **Academic partnership scope?**
   - Co-authoring papers?
   - Just student panels?
   - Ward to define in outreach email

2. **Incentive for completion?**
   - €50 gift card lottery?
   - Report-only?
   - Recommendation: Start with report-only, add lottery if completion rate <60%

3. **Q3 wording confirmation?**
   - Current: "Who would you trust to verify that?"
   - Alternative: Menu of options (brand, lab, government, consumers)
   - Recommendation: Open-ended (richer data)

---

## Appendix: Tracking Link Generator

### Standard Links

```
LinkedIn:       ?var_source=linkedin&var_campaign=launch&var_ref=ward
Howest:         ?var_source=howest&var_campaign=academic&var_ref=university
Thomas More:    ?var_source=thomasmore&var_campaign=academic&var_ref=university
Email/Substack: ?var_source=email&var_campaign=newsletter&var_ref=substack
GS1 Belgium:    ?var_source=gs1&var_campaign=partner&var_ref=gs1belgium
Personal:       ?var_source=network&var_campaign=soft_launch&var_ref=[your_name]
```

### Full URL Format

```
https://voice.tabulas.eu/research?var_source=linkedin&var_campaign=launch&var_ref=ward
```

Or direct to ElevenLabs:
```
https://elevenlabs.io/convai/[AGENT_ID]?var_source=linkedin&var_campaign=launch&var_ref=ward
```

---

## Appendix: Sample Webhook Payload

```json
{
  "conversation_id": "conv_7f8d9e2a1b3c",
  "system__conversation_id": "conv_7f8d9e2a1b3c",
  "system__time_utc": "2026-01-06T14:32:00Z",
  "system__call_duration_secs": "187",
  "source": "linkedin",
  "campaign": "launch",
  "ref": "ward",
  "q1_product": "chocolate bar",
  "q1_doubt": "fair trade claim seemed fake, couldn't verify it",
  "q2_proof": "farmer payment, origin country, actual percentage of cocoa",
  "q3_authority": "independent lab, not the brand itself",
  "q4_format": "simple score first, then ability to dive deeper",
  "q5_behavior": "yes, definitely would change shopping habits",
  "q5_pay_more": "maybe 10-15% more for verified products",
  "email": "user@example.com",
  "country": "Belgium"
}
```

---

## Appendix: Analysis Queries

### Response Summary

```sql
-- Total responses
SELECT COUNT(*) as total,
       COUNT(CASE WHEN completed THEN 1 END) as completed,
       ROUND(AVG(duration_seconds)) as avg_duration
FROM consumer_research_responses;

-- By source
SELECT source, COUNT(*) as responses
FROM consumer_research_responses
GROUP BY source
ORDER BY responses DESC;

-- By country
SELECT country, COUNT(*) as responses
FROM consumer_research_responses
WHERE country IS NOT NULL
GROUP BY country
ORDER BY responses DESC;
```

### Insight Queries

```sql
-- Most mentioned product categories
SELECT q1_product, COUNT(*) as mentions
FROM consumer_research_responses
WHERE q1_product IS NOT NULL
GROUP BY q1_product
ORDER BY mentions DESC
LIMIT 10;

-- Authority preferences
SELECT q3_authority, COUNT(*) as mentions
FROM consumer_research_responses
WHERE q3_authority IS NOT NULL
GROUP BY q3_authority
ORDER BY mentions DESC;

-- Willingness to pay more
SELECT 
  CASE 
    WHEN q5_pay_more ILIKE '%no%' THEN 'No'
    WHEN q5_pay_more ILIKE '%yes%' OR q5_pay_more ILIKE '%maybe%' THEN 'Yes/Maybe'
    ELSE 'Unclear'
  END as willing_to_pay,
  COUNT(*) as responses
FROM consumer_research_responses
GROUP BY willing_to_pay;
```

---

**Document Version:** 1.0  
**Created:** 2026-01-06  
**Author:** Claude (Jacky project)  
**Status:** Ready for implementation

