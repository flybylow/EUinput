import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Create client with fallback values (dashboard won't work without real credentials)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type ConsumerResearchResponse = {
  id: string
  created_at: string
  conversation_id: string
  call_timestamp: string | null
  duration_seconds: number | null
  source: string | null
  campaign: string | null
  ref: string | null
  q1_product: string | null
  q1_doubt: string | null
  q2_proof: string | null
  q3_authority: string | null
  q4_format: string | null
  q5_behavior: string | null
  q5_pay_more: string | null
  email: string | null
  country: string | null
  language: string
  completed: boolean
  transcript: any | null
}

