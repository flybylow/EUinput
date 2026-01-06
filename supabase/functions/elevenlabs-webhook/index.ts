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
      console.error('Webhook authentication failed')
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const payload = await req.json()
    console.log('Received webhook payload:', JSON.stringify(payload, null, 2))
    
    // Extract data from ElevenLabs webhook payload
    const data = {
      conversation_id: payload.conversation_id || payload.system__conversation_id,
      call_timestamp: payload.timestamp || payload.system__time_utc,
      duration_seconds: parseInt(payload.duration_secs || payload.system__call_duration_secs) || null,
      
      // Tracking
      source: payload.source || payload.var_source || null,
      campaign: payload.campaign || payload.var_campaign || null,
      ref: payload.ref || payload.var_ref || null,
      
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

    console.log('Processed data:', JSON.stringify(data, null, 2))

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
        JSON.stringify({ error: 'Database insert failed', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Successfully stored response:', data.conversation_id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        conversation_id: data.conversation_id,
        completed: data.completed
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

