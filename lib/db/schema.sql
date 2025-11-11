-- Helix Database Schema
-- This is an optional PostgreSQL schema if you want to persist architectures

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Architectures table
CREATE TABLE IF NOT EXISTS architectures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt TEXT NOT NULL,
    services JSONB NOT NULL,
    connections JSONB NOT NULL,
    patterns TEXT[] NOT NULL,
    scaling_model VARCHAR(50) NOT NULL,
    summary TEXT,
    estimated_cost JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for pattern-based search
CREATE INDEX IF NOT EXISTS idx_patterns ON architectures USING GIN (patterns);
CREATE INDEX IF NOT EXISTS idx_created_at ON architectures (created_at DESC);

-- Function to calculate similarity score
CREATE OR REPLACE FUNCTION calculate_similarity_score(
    target_patterns TEXT[],
    target_scaling VARCHAR(50),
    target_service_count INTEGER,
    compare_patterns TEXT[],
    compare_scaling VARCHAR(50),
    compare_service_count INTEGER
) RETURNS FLOAT AS $$
DECLARE
    pattern_score FLOAT := 0;
    scaling_score FLOAT := 0;
    count_score FLOAT := 0;
    shared_patterns INTEGER;
BEGIN
    -- Calculate pattern overlap (40% weight)
    shared_patterns := (
        SELECT COUNT(*)
        FROM unnest(target_patterns) AS tp
        WHERE tp = ANY(compare_patterns)
    );
    pattern_score := (shared_patterns::FLOAT / GREATEST(array_length(target_patterns, 1), array_length(compare_patterns, 1))) * 40;
    
    -- Scaling model match (20% weight)
    IF target_scaling = compare_scaling THEN
        scaling_score := 20;
    END IF;
    
    -- Service count similarity (20% weight)
    count_score := (1 - ABS(target_service_count - compare_service_count)::FLOAT / GREATEST(target_service_count, compare_service_count)) * 20;
    
    RETURN pattern_score + scaling_score + count_score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- View for easy querying
CREATE OR REPLACE VIEW architecture_summary AS
SELECT 
    id,
    prompt,
    array_length(ARRAY(SELECT jsonb_array_elements(services)), 1) as service_count,
    patterns,
    scaling_model,
    (estimated_cost->>'monthly_cost')::FLOAT as monthly_cost,
    created_at
FROM architectures;

-- Early access waitlist
CREATE TABLE IF NOT EXISTS early_access_requests (
    id SERIAL PRIMARY KEY,
    email VARCHAR(320) NOT NULL,
    source VARCHAR(64) DEFAULT 'early-access',
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS early_access_requests_email_idx
    ON early_access_requests (email);

