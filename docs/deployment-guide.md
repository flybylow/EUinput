# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Supabase account and project
- ElevenLabs account
- Vercel account (for hosting)

---

## Step 1: Install Dependencies

```bash
npm install
```

---

## Step 2: Configure Environment Variables

### Local Development

Create `.env.local` file (copy from `.env.example`):

```bash
cp .env.example .env.local
```

Fill in the values:

```bash
# ElevenLabs
ELEVENLABS_API_KEY=sk_...                    # From ElevenLabs dashboard
ELEVENLABS_AGENT_ID=agent_...                # Created in Step 3
ELEVENLABS_WEBHOOK_SECRET=your-secret-here   # Generate a random string
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_...    # Same as ELEVENLABS_AGENT_ID

# Supabase (from Tabulas project or new project)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Production (Vercel)

Add all environment variables to Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add each variable from `.env.local`
3. Select all environments (Production, Preview, Development)

---

## Step 3: Set Up ElevenLabs Agent

### Create Agent

1. Go to [ElevenLabs Conversational AI](https://elevenlabs.io/conversational-ai)
2. Click "Create Agent"
3. Name: **Nova**
4. Description: **European Consumer Transparency Research Assistant**

### Configure Voice

- **Voice:** Rachel or Bella
- **Stability:** 0.55
- **Clarity:** 0.75
- **Style Exaggeration:** 0.30

### System Prompt

Copy the complete system prompt from:
`docs/european-consumer-transparency-study.md` → Section "System Prompt"

Key variables to configure:
- `{{source}}` - tracking source
- `{{campaign}}` - tracking campaign
- `{{q1_product}}` - response capture
- `{{q1_doubt}}` - response capture
- etc. (see full list in docs)

### Configure Webhook

1. In Agent Settings → Webhooks
2. Add **Post-Call Webhook**
3. URL: Your Supabase Edge Function URL (from Step 4)
4. Method: POST
5. Headers:
   ```
   x-webhook-secret: [your ELEVENLABS_WEBHOOK_SECRET]
   ```

### Get Agent ID

Copy the Agent ID from the URL or dashboard and add to `.env.local`:
```
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_xxx
```

---

## Step 4: Set Up Supabase Database

### Install Supabase CLI

```bash
npm install -g supabase
```

### Login to Supabase

```bash
supabase login
```

### Link to Project

If using existing Tabulas project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Or create a new project:
```bash
supabase init
```

### Run Migration

```bash
supabase db push
```

Or manually run the SQL from:
`supabase/migrations/001_create_consumer_research_responses.sql`

---

## Step 5: Deploy Edge Function

### Set Secrets

```bash
supabase secrets set ELEVENLABS_WEBHOOK_SECRET=your-secret-here
```

### Deploy Function

```bash
supabase functions deploy elevenlabs-webhook
```

### Get Function URL

The URL will be displayed after deployment:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/elevenlabs-webhook
```

Copy this URL and add it to ElevenLabs webhook configuration (Step 3).

---

## Step 6: Deploy to Vercel

### Option A: GitHub Integration (Recommended)

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/flybylow/EUinput.git
   git push -u origin main
   ```

2. Connect to Vercel:
   - Go to [Vercel](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Add environment variables
   - Deploy

### Option B: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

Follow the prompts to deploy.

---

## Step 7: Test the System

### Test Landing Page

1. Visit: `https://your-app.vercel.app/research`
2. Verify page loads correctly
3. Check tracking parameters:
   ```
   https://your-app.vercel.app/research?source=test&campaign=launch&ref=manual
   ```

### Test Voice Agent

1. Click "Start Conversation"
2. Complete full interview
3. Provide email and country

### Verify Data Pipeline

1. Check Supabase table:
   ```sql
   SELECT * FROM consumer_research_responses 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

2. Verify all fields captured correctly
3. Check tracking parameters are present

---

## Step 8: Generate Tracking Links

Use the tracking link generator pattern:

```
# LinkedIn Launch
https://your-app.vercel.app/research?source=linkedin&campaign=launch&ref=ward

# Academic - Howest
https://your-app.vercel.app/research?source=howest&campaign=academic&ref=university

# Personal Network
https://your-app.vercel.app/research?source=network&campaign=soft_launch&ref=john
```

See complete list in: `docs/european-consumer-transparency-study.md` → Appendix

---

## Step 9: Monitor and Debug

### Check Logs

**Vercel Logs:**
```bash
vercel logs
```

**Supabase Edge Function Logs:**
1. Go to Supabase Dashboard
2. Functions → elevenlabs-webhook → Logs

### Common Issues

**Issue:** Agent ID not found
- Solution: Check `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` is set correctly

**Issue:** Webhook not firing
- Solution: Verify webhook URL in ElevenLabs dashboard
- Check webhook secret matches

**Issue:** Data not in database
- Solution: Check Edge Function logs
- Verify service role key is correct
- Check RLS policies

---

## Optional: Configure Custom Domain

### Option A: Subdomain

Configure DNS:
```
voice.tabulas.eu → CNAME → cname.vercel-dns.com
```

Add to Vercel:
1. Project Settings → Domains
2. Add `voice.tabulas.eu`
3. Follow DNS configuration steps

### Option B: Path-based

Deploy to existing Tabulas domain and use:
```
https://tabulas.eu/research
```

---

## Production Checklist

- [ ] All environment variables set in Vercel
- [ ] ElevenLabs agent tested and working
- [ ] Webhook delivering data to Supabase
- [ ] Database table created with RLS policies
- [ ] Landing page accessible
- [ ] Tracking parameters working
- [ ] GDPR consent text visible
- [ ] Test conversation completed successfully
- [ ] Data visible in Supabase
- [ ] Monitoring/logging configured

---

## Maintenance

### Monitor Budget

Check ElevenLabs usage daily:
1. Dashboard → Usage
2. Set up budget alerts if available
3. Pause if approaching €200

### Export Data

Regular backups:
```sql
-- Export to CSV
COPY (
  SELECT * FROM consumer_research_responses
) TO '/path/to/backup.csv' WITH CSV HEADER;
```

Or use Supabase dashboard → Table → Export

---

*Last updated: January 6, 2026*

