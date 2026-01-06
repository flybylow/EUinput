# ElevenLabs API Testing & Troubleshooting

Documentation of API key validation and common issues discovered during setup.

---

## Key Learnings

### API Key Permissions

**Important Discovery:** ElevenLabs API keys can have different permission levels.

- **User Read Permission:** Required for `/v1/user` endpoint (account details)
- **Agent Access Permission:** Required for `/v1/convai/agents` endpoint (what we need!)

**For this project:** We only need agent access, NOT user_read permission.

### Test Results (2026-01-06)

```bash
# Testing user endpoint
curl -H "xi-api-key: $API_KEY" https://api.elevenlabs.io/v1/user
# Result: 401 - missing_permissions (user_read)

# Testing agent endpoint  
curl -H "xi-api-key: $API_KEY" https://api.elevenlabs.io/v1/convai/agents
# Result: 200 - SUCCESS! ✅
```

**Conclusion:** API key works perfectly for our needs even without `user_read` permission.

---

## How to Verify Your API Key

### Quick Test Script

```bash
cd /Users/warddem/dev/EUinput

# Load API key from .env.local
API_KEY=$(grep "^ELEVENLABS_API_KEY=" .env.local | cut -d'=' -f2)

# Test agent access (what we actually need)
curl -s -H "xi-api-key: $API_KEY" \
  "https://api.elevenlabs.io/v1/convai/agents" | \
  python3 -c "import sys, json; data=json.load(sys.stdin); \
  print(f\"✅ Found {len(data.get('agents', []))} agents\"); \
  [print(f\"  - {a['name']}\") for a in data.get('agents', [])]"
```

### Expected Output

```
✅ Found 6 agents
  - Tabulas Consumer Research - Nova
  - Pawn Shop Chair
  - Tailor_Ann
  - Eleven
  - ben
  - (additional agents...)
```

---

## Configuration Status Check

### Complete Validation Script

```bash
#!/bin/bash
cd /Users/warddem/dev/EUinput

echo "=== ElevenLabs Configuration Status ==="
echo ""

# Check all environment variables
echo "📋 Environment Variables:"
grep "ELEVENLABS" .env.local | while IFS='=' read -r key value; do
  if [ "$value" = "sk_..." ] || [ "$value" = "agent_..." ] || [ "$value" = "your-secret-here" ]; then
    echo "  ❌ $key: PLACEHOLDER"
  else
    echo "  ✅ $key: Set (${#value} chars)"
  fi
done

echo ""
echo "🔌 API Connection Test:"

# Test API key
API_KEY=$(grep "^ELEVENLABS_API_KEY=" .env.local | cut -d'=' -f2)
AGENT_ID=$(grep "^ELEVENLABS_AGENT_ID=" .env.local | cut -d'=' -f2)

# Test agent access
RESPONSE=$(curl -s -w "\nHTTP:%{http_code}" \
  -H "xi-api-key: $API_KEY" \
  "https://api.elevenlabs.io/v1/convai/agents")

STATUS=$(echo "$RESPONSE" | grep "HTTP:" | cut -d':' -f2)

if [ "$STATUS" = "200" ]; then
  echo "  ✅ API Key Valid - Agent access working"
  echo "  ✅ Agent ID: $AGENT_ID"
else
  echo "  ❌ API Key Issue - Status: $STATUS"
fi

echo ""
echo "=== Configuration Complete ==="
```

---

## Common Issues & Solutions

### Issue 1: "401 Unauthorized" on User Endpoint

**Error:**
```json
{
  "detail": {
    "status": "missing_permissions",
    "message": "The API key you used is missing the permission user_read"
  }
}
```

**Solution:** This is expected! We don't need `user_read` permission. Test agent access instead.

**Verify it works:**
```bash
curl -H "xi-api-key: $API_KEY" https://api.elevenlabs.io/v1/convai/agents
```

---

### Issue 2: API Key Format

**Valid Format:**
- Starts with `sk_`
- Typically 51 characters long
- Example: `sk_91aec12cab60c85cd637e732359401a8999178eb243d29c5`

**Invalid Formats:**
- `sk_...` (placeholder)
- Less than 40 characters
- Missing `sk_` prefix

---

### Issue 3: Agent ID Not Found

**Check Agent Exists:**
```bash
API_KEY="your_key_here"
curl -s -H "xi-api-key: $API_KEY" \
  https://api.elevenlabs.io/v1/convai/agents | \
  python3 -m json.tool
```

**Look for your agent:**
```json
{
  "agents": [
    {
      "agent_id": "agent_0601ke9yz2mvft986ky6jq8c8hg2",
      "name": "Tabulas Consumer Research - Nova",
      ...
    }
  ]
}
```

**Solution:** Copy the exact `agent_id` to both:
- `ELEVENLABS_AGENT_ID`
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`

---

### Issue 4: Webhook Secret Not Set

**Check:**
```bash
grep "ELEVENLABS_WEBHOOK_SECRET" .env.local
```

**If shows `your-secret-here`:**
```bash
# Generate secure secret
WEBHOOK_SECRET=$(openssl rand -hex 32)
echo $WEBHOOK_SECRET

# Update .env.local manually or:
sed -i '' "s/ELEVENLABS_WEBHOOK_SECRET=.*/ELEVENLABS_WEBHOOK_SECRET=$WEBHOOK_SECRET/" .env.local
```

**Verify:**
```bash
grep "ELEVENLABS_WEBHOOK_SECRET" .env.local
# Should show 64-character hex string
```

---

## Working Configuration Example

Our verified working setup (2026-01-06):

```bash
# ElevenLabs Configuration
ELEVENLABS_API_KEY=sk_91aec12cab60c85cd637e732359401a8999178eb243d29c5
ELEVENLABS_AGENT_ID=agent_0601ke9yz2mvft986ky6jq8c8hg2
ELEVENLABS_WEBHOOK_SECRET=fd11a6c8cc0cb0669f8c6a40b002e53517b748af30dd805ce12e7c00ef08135c
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_0601ke9yz2mvft986ky6jq8c8hg2
```

**Test Results:**
- ✅ Agent access: Working
- ✅ Agent found: "Tabulas Consumer Research - Nova"
- ✅ Agent ID matches: Both fields identical
- ✅ Webhook secret: Generated (64 chars)
- ⚠️  User endpoint: Not needed (missing permission is OK)

---

## API Endpoints Reference

### Endpoints We Use

| Endpoint | Purpose | Permission Needed | Status |
|----------|---------|-------------------|--------|
| `/v1/convai/agents` | List agents | Agent access | ✅ Working |
| `/v1/convai/conversation` | Start conversation | Agent access | ✅ Working |
| `/v1/convai/conversation/get-signed-url` | Secure URLs | Agent access | ✅ Working |

### Endpoints We Don't Use

| Endpoint | Purpose | Permission Needed | Status |
|----------|---------|-------------------|--------|
| `/v1/user` | Account info | `user_read` | ❌ Not needed |
| `/v1/voices` | List voices | Voice access | ❌ Not needed |

---

## Testing Checklist

Before starting development:

- [ ] API key format is valid (starts with `sk_`, 51 chars)
- [ ] Agent access endpoint returns 200
- [ ] Agent ID exists in agents list
- [ ] Agent name is "Tabulas Consumer Research - Nova"
- [ ] Both agent ID fields match in .env.local
- [ ] Webhook secret is generated (64 chars, not placeholder)
- [ ] .env.local file is in .gitignore

---

## Debugging Commands

### Show Current Configuration (Safe)

```bash
cd /Users/warddem/dev/EUinput
echo "API Key: $(grep ELEVENLABS_API_KEY .env.local | cut -d'=' -f2 | head -c 15)... (${#$(grep ELEVENLABS_API_KEY .env.local | cut -d'=' -f2)} chars)"
echo "Agent ID: $(grep ELEVENLABS_AGENT_ID .env.local | cut -d'=' -f2)"
echo "Webhook Secret: $(grep ELEVENLABS_WEBHOOK_SECRET .env.local | cut -d'=' -f2 | head -c 20)... (${#$(grep ELEVENLABS_WEBHOOK_SECRET .env.local | cut -d'=' -f2)} chars)"
```

### Test API Connection

```bash
API_KEY=$(grep "^ELEVENLABS_API_KEY=" .env.local | cut -d'=' -f2)
curl -s -w "\nStatus: %{http_code}\n" \
  -H "xi-api-key: $API_KEY" \
  https://api.elevenlabs.io/v1/convai/agents
```

### List All Agents

```bash
API_KEY=$(grep "^ELEVENLABS_API_KEY=" .env.local | cut -d'=' -f2)
curl -s -H "xi-api-key: $API_KEY" \
  https://api.elevenlabs.io/v1/convai/agents | \
  python3 -m json.tool
```

---

## Security Notes

### Do NOT Commit

Never commit these files to git:
- `.env.local`
- `.env`
- `.env.production`

**Verify:**
```bash
cat .gitignore | grep "env"
```

Should include:
```
.env
.env*.local
.env.production
```

### Rotate Keys

If API key is ever exposed:
1. Go to ElevenLabs dashboard
2. Revoke the exposed key
3. Generate new key
4. Update `.env.local`
5. Redeploy (Vercel/production)

---

## Troubleshooting Flow

```
Is API key set?
├─ No → Get from ElevenLabs dashboard
└─ Yes → Test agent access
    ├─ 401/403 → Key invalid, get new one
    ├─ 200 → ✅ Working!
    └─ Other → Check network/firewall
    
Is agent ID set?
├─ No → Create agent or get ID from dashboard
└─ Yes → Verify agent exists
    ├─ Found → ✅ Working!
    └─ Not found → Update ID from agents list
    
Is webhook secret set?
├─ "your-secret-here" → Generate: openssl rand -hex 32
└─ 64 chars → ✅ Working!
```

---

**Last Updated:** January 6, 2026  
**Tested By:** Claude + Ward  
**Status:** ✅ All systems operational

