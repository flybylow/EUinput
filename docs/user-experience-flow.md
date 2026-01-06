# User Experience Flow - Embedded Conversation

This document shows what users will experience with the new embedded conversation.

---

## Visual Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    STEP 1: Landing Page                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Help Shape the Future of Product Transparency              │
│  We're building digital product passports for Europe.       │
│  Before we build, we want to hear from you.                 │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │  ⏱️ 3 minutes  │  ❓ 5 questions  │  🎁 Get the report │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  What to Expect:                                            │
│  ✓ You'll talk with Nova, our friendly AI assistant         │
│  ✓ 5 quick questions about product trust                    │
│  ✓ Your honest opinions - no wrong answers                  │
│  ✓ We'll ask for your email at the end                      │
│                                                              │
│  Privacy & Data Use:                                        │
│  By starting the conversation, you agree that...            │
│  • Your responses will be used for research                 │
│  • Responses are anonymized and aggregated                  │
│  • Data is stored securely in the EU                        │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │  🎤 Start Conversation with Nova                │ ◄───── User clicks
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  💡 You'll be asked for microphone permission               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              STEP 2: Microphone Permission                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │  🎤 https://localhost:3000 wants to use your   │         │
│  │     microphone                                 │         │
│  │                                                 │         │
│  │  [Block]                      [Allow] ◄─────── User clicks
│  └────────────────────────────────────────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               STEP 3: Connecting State                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │        ⏳ Connecting...                         │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  Requesting microphone access...                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              STEP 4: Connected to Nova                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │  🟢 Connected to Nova        [End Conversation] │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  Speak naturally - Nova is listening and will respond       │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🎙️  USER: [Speaking...]                             │    │
│  │                                                      │    │
│  │ 🤖  NOVA: "Hi! Thanks for taking a few minutes.     │    │
│  │          I'm Nova, helping Tabulas build digital    │    │
│  │          product passports..."                       │    │
│  └─────────────────────────────────────────────────────┘    │
│     (This transcript display is optional/future)            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                    3-4 minutes of conversation
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            STEP 5: Conversation Complete                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Conversation ended - status returns to idle]              │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │  🎤 Start Conversation with Nova                │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  Thanks for participating! You'll receive the research      │
│  report at the email you provided.                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## State Transitions

### State 1: Idle (Initial)
**Visual:**
- Blue button: "🎤 Start Conversation with Nova"
- Text: "Click the button above to start your conversation"
- Notice: "💡 You'll be asked for microphone permission"

**User Action:** Click button

---

### State 2: Requesting (Loading)
**Visual:**
- Gray button (disabled): "⏳ Connecting..."
- Spinner animation
- Text: "Requesting microphone access..."

**System Action:** 
1. Request microphone permission
2. Fetch signed URL from API
3. Establish WebSocket connection

---

### State 3: Connected (Active)
**Visual:**
- Green banner with pulse: "🟢 Connected to Nova"
- "End Conversation" button in banner
- Text: "Speak naturally - Nova is listening and will respond"
- No large button (conversation in progress)

**User Action:** Speak with Nova

**System Action:**
- Stream audio bidirectionally
- Process conversation
- Capture responses

---

### State 4: Error (If issues occur)
**Visual:**
- Red banner: "❌ [Error message]"
- "Try Again" button
- Helpful error text

**Example Errors:**
- "Failed to get conversation URL" → Check API configuration
- "Microphone permission denied" → User must grant permission
- "Connection error occurred" → Network or service issue

**User Action:** Click "Try Again" → Returns to Idle state

---

## Conversation Script (What User Hears)

### 1. Nova's Introduction (~10 seconds)
```
"Hi! Thanks for taking a few minutes.

I'm Nova, helping Tabulas - a European startup building digital 
product passports. Passports for products. So you can see where 
something comes from and what happened on its journey.

To build this the right way, we're asking real people across 
Europe: what would you actually want to see?

No wrong answers. Just your honest thoughts. Let's go."
```

### 2. Question 1 (~30-60 seconds)
```
NOVA: "First one. Think of the last product where you thought: 
can I actually trust this? What was it, and what made you doubt it?"

USER: [Responds - e.g., "A chocolate bar with fair trade claims"]

NOVA: "Got it."
```

### 3. Question 2 (~20-40 seconds)
```
NOVA: "If that product could prove something to you, what would 
you want it to prove?"

USER: [Responds - e.g., "That farmers actually got paid fairly"]

NOVA: "Okay."
```

### 4. Question 3 (~20-40 seconds)
```
NOVA: "And who would you trust to verify that?"

USER: [Responds - e.g., "Independent lab, not the brand"]

NOVA: "Interesting."
```

### 5. Question 4 (~30-60 seconds)
```
NOVA: "Next one. Imagine you scan a product with your phone. 
What would you want to see? A simple score? A detailed breakdown? 
The product's journey? Something else?"

USER: [Responds - e.g., "Simple score first, then details if I want"]

NOVA: "Alright."
```

### 6. Question 5 (~30-60 seconds)
```
NOVA: "Last one. If products could show you all this - would it 
change how you shop? And would you pay a bit more for that 
transparency?"

USER: [Responds - e.g., "Yes, definitely. Maybe 10-15% more"]

NOVA: "That's it. Really helpful."
```

### 7. Closing (~20 seconds)
```
NOVA: "We're sharing results with everyone who participates. 
What's your email? I'll send you the report when it's ready."

USER: [Provides email]

NOVA: "And which country are you in?"

USER: [Provides country]

NOVA: "Thanks! You'll hear from us soon."

[Conversation ends]
```

**Total Time:** ~3-4 minutes

---

## UI Components Detail

### Button States

#### Idle State
```
┌──────────────────────────────────────────────┐
│  🎤 Start Conversation with Nova              │
│                                              │
│  [Hover: slightly darker blue]               │
│  [Cursor: pointer]                           │
└──────────────────────────────────────────────┘
Classes: bg-blue-600 hover:bg-blue-700 text-white
         px-8 py-4 rounded-lg text-lg font-semibold
```

#### Loading State
```
┌──────────────────────────────────────────────┐
│  ⏳ Connecting...                             │
│                                              │
│  [Spinner animation]                         │
│  [Cursor: not-allowed]                       │
└──────────────────────────────────────────────┘
Classes: bg-blue-400 text-white cursor-not-allowed
```

### Status Banner (Connected)
```
┌──────────────────────────────────────────────┐
│  🟢 Connected to Nova     [End Conversation] │
└──────────────────────────────────────────────┘
Classes: bg-green-50 border-green-200 p-4 rounded-lg
```

### Error Banner
```
┌──────────────────────────────────────────────┐
│  ❌ Failed to start conversation               │
│                                              │
│  [Try Again]                                 │
└──────────────────────────────────────────────┘
Classes: bg-red-50 border-red-200 p-4 rounded-lg
```

---

## Mobile Experience

### Portrait Phone (375px width)

```
┌─────────────────────────┐
│  EUinput Header         │
│  ═════════════════      │
│                         │
│  Help Shape the         │
│  Future of Product      │
│  Transparency           │
│                         │
│  ┌───────────────────┐  │
│  │ ⏱️ 3 min          │  │
│  │ ❓ 5 questions    │  │
│  │ 🎁 Get report     │  │
│  └───────────────────┘  │
│                         │
│  What to Expect:        │
│  ✓ Talk with Nova       │
│  ✓ 5 quick questions    │
│  ✓ Honest opinions      │
│  ✓ Get results          │
│                         │
│  Privacy & Data:        │
│  [Collapsed on mobile]  │
│                         │
│  ┌───────────────────┐  │
│  │  🎤 Start Conv.   │  │
│  │  with Nova        │  │
│  └───────────────────┘  │
│                         │
│  💡 Microphone needed   │
│                         │
│  ─────────────────────  │
│  A research project by  │
│  Tabulas                │
└─────────────────────────┘
```

**Mobile Optimizations:**
- Button text wraps nicely
- Status indicators stack vertically
- Microphone permission prompt is native mobile UI
- Audio works with phone earpiece or speaker

---

## Accessibility Features

### Keyboard Navigation
- ✅ Button focusable with Tab
- ✅ Activates with Enter or Space
- ✅ Clear focus outline

### Screen Readers
- ✅ Button labeled: "Start Conversation with Nova"
- ✅ Status changes announced
- ✅ Error messages read aloud

### Visual
- ✅ High contrast text
- ✅ Clear status indicators (color + icon + text)
- ✅ No reliance on color alone

---

## Performance Characteristics

### Loading Times
- **Initial page load:** ~500-1000ms (Next.js SSR)
- **Button click → Connected:** ~1-2 seconds
  - Microphone permission: ~300ms
  - API call (signed URL): ~200-500ms
  - WebSocket connection: ~500-1000ms

### Audio Quality
- **Sample rate:** 16kHz (voice optimized)
- **Latency:** ~500-1500ms (speech → response start)
- **Connection stability:** Handles brief network issues

### Browser Compatibility
- ✅ Chrome/Edge (best experience)
- ✅ Firefox (fully supported)
- ✅ Safari (requires HTTPS)
- ⚠️ Mobile browsers (varies by OS/browser)

---

## Error Scenarios & Recovery

### 1. Microphone Permission Denied
**User sees:**
```
┌──────────────────────────────────────────────┐
│  ❌ Microphone permission denied               │
│                                              │
│  Please grant permission in browser settings │
│  and try again.                              │
│                                              │
│  [Try Again]                                 │
└──────────────────────────────────────────────┘
```

**Recovery:** User grants permission → Click "Try Again"

### 2. API Error (Invalid Credentials)
**User sees:**
```
┌──────────────────────────────────────────────┐
│  ❌ Failed to get conversation URL             │
│                                              │
│  Please try again in a moment. If the        │
│  problem persists, contact support.          │
│                                              │
│  [Try Again]                                 │
└──────────────────────────────────────────────┘
```

**Recovery:** Wait → Click "Try Again"  
**Note:** Check server logs for actual cause

### 3. Connection Lost During Conversation
**User sees:**
```
┌──────────────────────────────────────────────┐
│  ⚠️  Connection lost                           │
│                                              │
│  [Automatically reconnecting...]             │
└──────────────────────────────────────────────┘
```

**Recovery:** Automatic (ElevenLabs SDK handles reconnection)

---

## Comparison: Old vs New Experience

### Old Experience (Redirect)
```
1. User visits your site
2. User clicks button
3. → REDIRECTS to elevenlabs.io
4. User leaves your site
5. Different branding/UI
6. Conversation happens on ElevenLabs site
7. User closes tab when done
8. No easy way back to your site
```

**Issues:**
- ❌ User leaves your site
- ❌ Different UI/branding
- ❌ Lost context
- ❌ Poor mobile experience (new tab)

### New Experience (Embedded)
```
1. User visits your site
2. User clicks button
3. Conversation starts IN YOUR PAGE
4. User stays on your site
5. Your branding throughout
6. Conversation happens seamlessly
7. Clear status indicators
8. User can continue browsing after
```

**Benefits:**
- ✅ User stays on your site
- ✅ Consistent UI/branding
- ✅ Better control and tracking
- ✅ Seamless mobile experience

---

## Testing Checklist

### Desktop Testing
- [ ] Click "Start Conversation" button
- [ ] Grant microphone permission
- [ ] Verify connection indicator shows
- [ ] Speak and verify Nova responds
- [ ] Test "End Conversation" button
- [ ] Test "Try Again" after error
- [ ] Test with tracking params: `?source=test&campaign=dev`

### Mobile Testing
- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] Verify button is easily tappable
- [ ] Verify microphone permission works
- [ ] Test with phone speaker
- [ ] Test with headphones

### Browser Testing
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers

---

## Future Enhancements

### Transcript Display
Show conversation text in real-time:
```
┌──────────────────────────────────────────────┐
│  🟢 Connected to Nova     [End Conversation] │
└──────────────────────────────────────────────┘

Conversation Transcript:
┌──────────────────────────────────────────────┐
│  NOVA: Hi! Thanks for taking a few minutes.  │
│  I'm Nova, helping Tabulas...                │
│                                              │
│  YOU: [Your response here]                   │
│                                              │
│  NOVA: Got it. If that product could prove...│
└──────────────────────────────────────────────┘
```

### Visual Feedback
Add speaking indicator:
```
┌──────────────────────────────────────────────┐
│  🟢 Connected to Nova     [End Conversation] │
│                                              │
│  🎙️  ▂▃▅▇▆▄▂▁ Nova is speaking...            │
└──────────────────────────────────────────────┘
```

### Progress Indicator
Show which question you're on:
```
┌──────────────────────────────────────────────┐
│  🟢 Connected to Nova     [End Conversation] │
│                                              │
│  Progress: ████████░░ Question 3 of 5        │
└──────────────────────────────────────────────┘
```

---

**Document Status:** ✅ Complete  
**User Experience:** Fully documented  
**Ready for:** Testing and launch

