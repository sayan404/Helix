-- Helix Database Schema
-- This is an optional PostgreSQL schema if you want to persist architectures

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Architectures table
CREATE TABLE IF NOT EXISTS architectures (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    services JSONB NOT NULL,
    connections JSONB NOT NULL,
    patterns JSONB NOT NULL,
    scaling_model VARCHAR(50) NOT NULL,
    summary TEXT,
    estimated_cost JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
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

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(320) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT users_email_unique UNIQUE (email)
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- Token usage operation enum
DO $$ BEGIN
    CREATE TYPE token_usage_operation AS ENUM (
        'architecture_generation',
        'code_generation',
        'architecture_evaluation'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS architectures_user_id_idx ON architectures(user_id);

-- Token usage table
CREATE TABLE IF NOT EXISTS token_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    operation token_usage_operation NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    architecture_id INTEGER REFERENCES architectures(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS token_usage_user_id_idx ON token_usage(user_id);
CREATE INDEX IF NOT EXISTS token_usage_architecture_id_idx ON token_usage(architecture_id);
CREATE INDEX IF NOT EXISTS token_usage_created_at_idx ON token_usage(created_at);

