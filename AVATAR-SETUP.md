# 🎨 Avatar Setup Guide

Currently seeing "Loading avatar..." forever? You need to add Anam.ai credentials!

## Quick Fix: Disable Avatar (Use Chat Only)

**File:** `app/research/page.tsx`

Change:
```tsx
enableAvatar={true}
```

To:
```tsx
enableAvatar={false}  // Chat bubbles only
```

This will work immediately with just the chat transcript.

---

## Option 2: Enable Avatar (Get Anam Credentials)

### Step 1: Get Anam API Key

1. **Sign up:** https://lab.anam.ai
2. **Get API Key:** Settings → API Keys → Generate
3. **Choose Avatar:** https://docs.anam.ai/resources/avatar-gallery

Popular avatars:
- `anna-generic-1` - Professional female
- `david-generic-1` - Professional male  
- `sarah-generic-1` - Friendly female

### Step 2: Add to Environment

Add these lines to your `.env.local` file:

```bash
# Anam.ai - Avatar Integration
ANAM_API_KEY=your_anam_api_key_here
ANAM_AVATAR_ID=anna-generic-1
```

### Step 3: Restart Server

```bash
# Stop the current dev server (Ctrl+C)
npm run dev
```

### Step 4: Enable Avatar

**File:** `app/research/page.tsx`

Change:
```tsx
enableAvatar={false}
```

To:
```tsx
enableAvatar={true}  // Avatar + chat bubbles
```

### Step 5: Test

Visit http://localhost:3000/research and start a conversation. You should now see the avatar!

---

## Troubleshooting

### Still showing "Loading avatar..."?

**Check logs:**
```bash
# Look for this error in terminal:
ANAM_API_KEY not set in environment
```

**Solutions:**
1. Make sure `.env.local` file exists in project root
2. Check the API key is correct (no quotes, no spaces)
3. Restart the dev server completely
4. Try `cat .env.local` to verify the file contents

### API Key Invalid?

Test your key:
```bash
curl -X POST https://api.anam.ai/v1/auth/session-token \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"personaConfig":{"avatarId":"anna-generic-1"}}'
```

Should return: `{"sessionToken": "..."}`

### Avatar loads but video is black?

This is normal! The avatar only appears during active conversation when receiving audio.

---

## Cost Note

Anam.ai has:
- **Free tier** with limited minutes
- **Paid plans** for production use

Check pricing: https://anam.ai/pricing

For testing/development, the free tier should be sufficient!

---

## Recommendation

**For now:** Set `enableAvatar={false}` and use chat bubbles only.  
**Later:** Get Anam credentials when you're ready for avatar testing.

The chat transcript feature works great without the avatar! 🎯

