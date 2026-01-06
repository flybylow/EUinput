// =============================================================================
// Anam Session Token API Route
// =============================================================================
// Creates a session token for Anam avatar with audio passthrough mode
// This keeps your Anam API key secure on the server
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

const ANAM_API_KEY = process.env.ANAM_API_KEY;
const ANAM_AVATAR_ID = process.env.ANAM_AVATAR_ID || 'anna-generic-1'; // Default avatar

export async function GET(request: NextRequest) {
  try {
    // Validate API key
    if (!ANAM_API_KEY) {
      console.error('ANAM_API_KEY not set in environment');
      return NextResponse.json(
        { error: 'Anam API key not configured' },
        { status: 500 }
      );
    }

    // Get tracking parameters from URL
    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get('source') || 'direct';
    const campaign = searchParams.get('campaign');
    const ref = searchParams.get('ref');

    console.log('Creating Anam session with:', {
      avatarId: ANAM_AVATAR_ID,
      source,
      campaign,
      ref,
    });

    // Create Anam session token with audio passthrough enabled
    const response = await fetch('https://api.anam.ai/v1/auth/session-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ANAM_API_KEY}`,
      },
      body: JSON.stringify({
        personaConfig: {
          avatarId: ANAM_AVATAR_ID,
          enableAudioPassthrough: true, // Re-enabled for direct WebSocket implementation
        },
        // Optional: Store tracking metadata
        metadata: {
          source,
          campaign: campaign || undefined,
          ref: ref || undefined,
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

