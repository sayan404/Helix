-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(320) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  max_allowed_tokens INTEGER NOT NULL DEFAULT 5000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT users_email_unique UNIQUE (email)
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

