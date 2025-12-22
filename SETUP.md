# Quick Setup Guide for Helix

## Step 1: Install Dependencies

```bash
cd helix-app
npm install
```

## Step 2: Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

## Step 3: Configure Environment

Create a `.env.local` file in the `helix-app` directory:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

## Optional: Sentry Monitoring

Add these to `.env.local` to track API failures + endpoint performance (hits/latency) in Sentry:

```bash
SENTRY_DSN=your_sentry_dsn_here
SENTRY_TRACES_SAMPLE_RATE=0.1

# Optional (browser monitoring too):
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1

# Optional (CI only): upload sourcemaps (next.config enables this when all 3 are set)
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=...
SENTRY_PROJECT=...
```

## Step 4: Run the Application

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Example Usage

1. Open the app in your browser
2. Try this prompt:
   ```
   Design a scalable chat application with:
   - WebSocket server for real-time messaging
   - Redis for message caching
   - PostgreSQL for message persistence
   - Kafka for event streaming
   - Load balancer for horizontal scaling
   ```
3. Click "Generate Architecture"
4. Explore the visualization, cost estimates, and generated code
5. Click "Simulate Load" to see performance metrics
6. Click "Generate Code" to get boilerplate code
7. Click "Export Project" to download everything

## Production Deployment (Vercel)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Add environment variable: `GEMINI_API_KEY=your_key`
6. Click "Deploy"

Done! Your Helix app is now live.

## Optional: Database Setup

If you want to persist architectures:

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Update .env.local
DATABASE_URL=postgresql://helix:helix_password@localhost:5432/helix
```

## Troubleshooting

### "Failed to generate architecture"

- Check your Gemini API key is correct
- Ensure you have API quota remaining
- Check network connectivity

### Module not found errors

- Run `npm install` again
- Delete `node_modules` and `.next`, then reinstall

### Port 3000 already in use

- Kill the process using port 3000
- Or use a different port: `npm run dev -- -p 3001`

## Need Help?

Open an issue on GitHub or check the main README.md
