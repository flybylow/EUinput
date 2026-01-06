# Quick Start Guide

Get EUinput running locally in 5 minutes.

---

## Prerequisites

- Node.js 18+ installed
- Git installed
- Supabase account (free tier works)
- ElevenLabs account

---

## 1. Install Dependencies

```bash
npm install
```

---

## 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
- Get Supabase credentials from your Supabase project dashboard
- ElevenLabs agent ID comes after you create the agent (Step 3)

---

## 3. Set Up Database

### Run Migration

```bash
# Using Supabase CLI
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Or manually run the SQL from:
`supabase/migrations/001_create_consumer_research_responses.sql`

---

## 4. Create ElevenLabs Agent

Follow detailed instructions in: `docs/nova-agent-setup.md`

**Quick version:**
1. Go to [ElevenLabs Conversational AI](https://elevenlabs.io/conversational-ai)
2. Create agent named "Nova"
3. Copy system prompt from `docs/nova-agent-setup.md`
4. Configure voice (Rachel, stability 0.55)
5. Set up variables and webhook
6. Copy Agent ID to `.env.local`

---

## 5. Deploy Edge Function

```bash
# Set webhook secret
supabase secrets set ELEVENLABS_WEBHOOK_SECRET=your-secret-here

# Deploy function
supabase functions deploy elevenlabs-webhook
```

Copy the function URL and add it to ElevenLabs webhook configuration.

---

## 6. Run Locally

```bash
npm run dev
```

Visit: http://localhost:3000

Test the research page: http://localhost:3000/research

---

## 7. Test End-to-End

1. Click "Start Conversation" on /research page
2. Complete the interview with Nova
3. Check data in Supabase:
   ```sql
   SELECT * FROM consumer_research_responses 
   ORDER BY created_at DESC LIMIT 1;
   ```

---

## 8. Deploy to Production

See full deployment guide: `docs/deployment-guide.md`

**Quick Vercel deployment:**
```bash
npm install -g vercel
vercel
```

Add all environment variables in Vercel dashboard.

---

## Common Issues

**"Agent ID not found"**
- Make sure `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` is set in `.env.local`

**"Webhook not receiving data"**
- Check webhook URL in ElevenLabs dashboard
- Verify `x-webhook-secret` header matches your secret
- Check Edge Function logs in Supabase

**"Cannot connect to database"**
- Verify Supabase credentials in `.env.local`
- Check table exists (run migration)
- Verify RLS policies are set

---

## Next Steps

- Review full documentation in `docs/`
- Customize landing page design
- Set up tracking links
- Plan soft launch strategy

---

**Need help?** Check the full documentation:
- **Technical Spec:** `docs/european-consumer-transparency-study.md`
- **Deployment:** `docs/deployment-guide.md`
- **Agent Setup:** `docs/nova-agent-setup.md`

