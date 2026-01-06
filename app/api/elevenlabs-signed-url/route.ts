import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID;

    if (!apiKey || !agentId) {
      return NextResponse.json(
        { error: 'Missing ElevenLabs configuration' },
        { status: 500 }
      );
    }

    // Get tracking params from URL
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const campaign = searchParams.get('campaign');
    const ref = searchParams.get('ref');

    // Build variables object for ElevenLabs
    const variables: Record<string, string> = {};
    if (source) variables.var_source = source;
    if (campaign) variables.var_campaign = campaign;
    if (ref) variables.var_ref = ref;

    // Request signed URL from ElevenLabs
    const elevenlabsUrl = new URL(
      'https://api.elevenlabs.io/v1/convai/conversation/get-signed-url'
    );
    elevenlabsUrl.searchParams.set('agent_id', agentId);

    const response = await fetch(elevenlabsUrl.toString(), {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', error);
      return NextResponse.json(
        { error: 'Failed to get signed URL from ElevenLabs' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      signedUrl: data.signed_url,
      variables,
    });
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

