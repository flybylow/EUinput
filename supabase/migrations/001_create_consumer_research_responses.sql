-- Create table for research responses
CREATE TABLE consumer_research_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- ElevenLabs system variables
    conversation_id TEXT UNIQUE NOT NULL,
    call_timestamp TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Tracking variables (from URL)
    source TEXT,
    campaign TEXT,
    ref TEXT,
    
    -- Question responses
    q1_product TEXT,
    q1_doubt TEXT,
    q2_proof TEXT,
    q3_authority TEXT,
    q4_format TEXT,
    q5_behavior TEXT,
    q5_pay_more TEXT,
    
    -- Contact info
    email TEXT,
    country TEXT,
    
    -- Metadata
    language TEXT DEFAULT 'en',
    completed BOOLEAN DEFAULT FALSE,
    
    -- Full transcript (optional, for qualitative analysis)
    transcript JSONB
);

-- Index for common queries
CREATE INDEX idx_responses_source ON consumer_research_responses(source);
CREATE INDEX idx_responses_country ON consumer_research_responses(country);
CREATE INDEX idx_responses_created ON consumer_research_responses(created_at);

-- RLS Policy (important for security)
ALTER TABLE consumer_research_responses ENABLE ROW LEVEL SECURITY;

-- Only allow inserts from authenticated service role (webhook)
CREATE POLICY "Allow webhook inserts" ON consumer_research_responses
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Allow reads for authenticated users (dashboard)
CREATE POLICY "Allow authenticated reads" ON consumer_research_responses
    FOR SELECT
    TO authenticated
    USING (true);

-- Comment for documentation
COMMENT ON TABLE consumer_research_responses IS 'Stores voice AI interview responses for European Consumer Transparency Study';

