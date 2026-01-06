// =============================================================================
// Anam Session Token API Route - STANDARD MODE
// =============================================================================
// Creates a session token for Anam avatar in STANDARD mode (not passthrough)
// For testing Anam standalone without ElevenLabs integration
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

const ANAM_API_KEY = process.env.ANAM_API_KEY;
// Use a known working avatar ID from Anam's gallery
const ANAM_AVATAR_ID = process.env.ANAM_AVATAR_ID || 'anna-generic-1';  // Fallback to public avatar

export async function GET(request: NextRequest) {
  try {
    if (!ANAM_API_KEY) {
      console.error('ANAM_API_KEY not set in environment');
      return NextResponse.json(
        { error: 'Anam API key not configured' },
        { status: 500 }
      );
    }

    console.log('Creating Anam session (STANDARD MODE) with:', {
      avatarId: ANAM_AVATAR_ID,
    });

    // Create Anam session token WITHOUT audio passthrough
    const response = await fetch('https://api.anam.ai/v1/auth/session-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ANAM_API_KEY}`,
      },
      body: JSON.stringify({
        personaConfig: {
          name: "Nova",
          avatarId: ANAM_AVATAR_ID,
          voiceId: "6bfbe25a-979d-40f3-a92b-5394170af54b", // Default Anam voice
          llmId: "0934d97d-0c3a-4f33-91b0-5e136a0ef466", // Default Anam LLM
          systemPrompt: "You are Nova, a friendly research assistant helping with consumer transparency studies.",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anam API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to create Anam session', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      sessionToken: data.sessionToken,
      avatarId: ANAM_AVATAR_ID,
    });
  } catch (error: any) {
    console.error('Error creating Anam session:', error);
    return NextResponse.json(
      { error: 'Failed to create Anam session', message: error.message },
      { status: 500 }
    );
  }
}

