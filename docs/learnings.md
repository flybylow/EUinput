# Key Learnings

This document captures important insights and lessons learned during development.

## Documentation Best Practices

### Rule One: Documentation Organization
- **Always** place documentation files in the `/docs` folder
- **Never** place documentation files in the root directory
- Use Markdown format for consistency and readability
- Keep documentation up to date as the project evolves

## Project Development

### Key Insights from Setup Phase (2026-01-06)

**ElevenLabs API Key Permissions:**
- Discovered that API keys can have different permission levels
- Our key has agent access but not `user_read` permission
- This is perfectly fine! We only need agent access for Conversational AI
- User endpoint returns 401 "missing_permissions" - this is expected and OK
- Agent endpoint works perfectly ✅

**Configuration Learnings:**
- API keys start with `sk_` and are typically 51 characters
- Agent IDs start with `agent_` and are 34 characters  
- Webhook secrets should be 64-character hex strings (use `openssl rand -hex 32`)
- Both `ELEVENLABS_AGENT_ID` and `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` must match
- Agent "Tabulas Consumer Research - Nova" is properly configured at `agent_0601ke9yz2mvft986ky6jq8c8hg2`

**Testing Validation:**
- ✅ Can access 6 agents via API
- ✅ Nova agent exists and is accessible
- ✅ Webhook secret generated and set
- ✅ All environment variables properly configured

### Key Insights from Planning Phase

**Architecture Decisions:**
- Chose Supabase over Airtable for scalability and integration with Tabulas stack
- Landing page approach: Start with simple Next.js page, optional subdomain later
- Webhook pattern: Supabase Edge Functions for security and performance

**Conversation Design:**
- Keep it under 4 minutes to maintain >70% completion rate
- "Nova" character: Coffee shop researcher vibe (warm but efficient)
- 5 core questions focused on trust, proof, authority, format, and willingness to pay

**Budget Constraints:**
- Total budget <€250 (mostly ElevenLabs tokens)
- Optimize by keeping conversations short and focused
- No transcript storage unless needed for deep analysis

## Technical Insights

### ElevenLabs Integration Patterns

From previous Three.js robot project, we have working patterns for:
- `useConversation` hook implementation
- Signed URL generation for production security
- Client-side tools registration
- State management with Zustand

### Supabase Edge Functions

Key considerations for webhook handling:
- CORS headers for cross-origin requests
- Signature verification for security
- Service role key for RLS bypass
- Error handling and logging patterns

### Data Pipeline

Conversation flow:
1. User clicks tracking link → lands on Next.js page
2. Redirects to ElevenLabs with tracking params
3. Nova conducts interview, captures variables
4. Post-call webhook fires → Supabase Edge Function
5. Data stored in PostgreSQL with RLS policies
6. Available for analysis via SQL queries

## Resources and References

### External Documentation

- [ElevenLabs Conversational AI Docs](https://elevenlabs.io/docs/conversational-ai)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Next.js App Router](https://nextjs.org/docs/app)

### Related Repositories

- `flybylow/bim` - Next.js + TypeScript structure reference
- `flybylow/settlemint` - Webhook patterns and API routes

### Academic Partners

- **Howest** - Belgian university, target for student panel
- **Thomas More** - Belgian university, academic credibility partner

---

*Last updated: January 6, 2026*

