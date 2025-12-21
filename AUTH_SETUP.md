# Authentication Setup Guide

This guide explains how to set up and use the user authentication system in Helix.

## Features

- User signup with email and password
- User login with email and password
- JWT-based session management
- Protected routes via middleware
- Password hashing with bcrypt
- HTTP-only cookies for secure token storage

## Database Setup

### 1. Run the Migration

Create the users table in your database by running the SQL migration:

```sql
-- Run this in your PostgreSQL database
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(320) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
```

Or use the migration file: `lib/db/migrations/create_users_table.sql`

## Environment Variables

Add the following to your `.env` file:

```env
# JWT Secret (use a strong random string in production)
JWT_SECRET=your-secret-key-change-in-production

# Enable/disable authentication (default: enabled)
AUTH_ENABLED=true

# Early access system (can be disabled if using auth)
EARLY_ACCESS_DISABLE=false
```

**Important**: Generate a strong JWT_SECRET for production:
```bash
# Generate a secure random string
openssl rand -base64 32
```

## API Routes

### POST `/api/auth/signup`
Create a new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "ok": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### POST `/api/auth/login`
Authenticate a user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "ok": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### POST `/api/auth/logout`
Log out the current user.

### GET `/api/auth/me`
Get the current authenticated user's information.

## Pages

- `/signup` - User registration page
- `/login` - User login page
- `/workspace` - Protected workspace (requires authentication)

## Middleware

The middleware (`middleware.ts`) automatically:
- Protects routes (except public paths like `/login`, `/signup`, `/`)
- Redirects unauthenticated users to `/login`
- Preserves the intended destination via `redirect` query parameter

## Disabling Authentication

To disable authentication and use the early access passcode system instead:

1. Set `AUTH_ENABLED=false` in your `.env` file
2. The middleware will fall back to the early access cookie system

## Security Notes

- Passwords are hashed using bcrypt with 10 rounds
- JWT tokens are stored in HTTP-only cookies
- Tokens expire after 7 days
- Email addresses are normalized (lowercase) before storage
- Passwords must be at least 8 characters long

