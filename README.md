# Helix - AI-Powered System Design Autopilot

Generate scalable system designs, cost estimations, and boilerplate code from natural language prompts.

## Features

- 🎨 **AI System Design Generator** - Convert plain English to architecture blueprints
- 📊 **Interactive D3.js Visualizations** - Dynamic architecture diagrams
- 💰 **Cost Estimation** - Monthly infrastructure cost calculations
- ⚡ **Load Simulation** - Performance and scalability metrics
- 🔍 **Pattern-Based Similarity Search** - Find similar architectures
- 💻 **Code Generation** - Boilerplate service code with Gemini AI
- 📦 **Project Export** - Download complete Docker-ready projects

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui, D3.js
- **Backend**: Next.js API Routes
- **AI**: Google Gemini AI
- **Database**: PostgreSQL (optional)
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd helix-app
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Gemini API key:

```
GEMINI_API_KEY=your_api_key_here
```

Optional (Monitoring): add Sentry DSN to capture API errors + endpoint performance (throughput/latency):

```
SENTRY_DSN=your_sentry_dsn_here
# Optional overrides:
SENTRY_TRACES_SAMPLE_RATE=0.1

# Optional (client-side DSN if you want browser errors too):
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1

# Optional (CI only): upload sourcemaps
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=...
SENTRY_PROJECT=...
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Usage

1. **Enter a System Prompt**: Describe your architecture in plain English

   - Example: "Design a scalable e-commerce platform with Redis caching"

2. **Generate Architecture**: Click "Generate Architecture" to create the design

3. **Visualize**: View the interactive D3.js diagram

4. **Simulate Load**: Test performance under various loads

5. **Generate Code**: Create boilerplate code for services

6. **Export**: Download the complete project package

## Example Prompts

- "Design an architecture for an Uber-like ride-hailing platform"
- "Show me a scalable chat system with Redis and Kafka"
- "Create a microservices architecture for a food delivery app"
- "Design a real-time collaboration tool like Google Docs"
- "Build an e-commerce platform with payment processing"

## Optional: PostgreSQL Setup

To persist architectures and enable advanced similarity search:

1. Start PostgreSQL with Docker:

```bash
docker-compose up -d postgres
```

2. The database will be initialized with the schema from `lib/db/schema.sql`

3. Uncomment database code in `lib/db/client.ts` and install `pg`:

```bash
npm install pg
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub

2. Import project in Vercel

3. Add environment variable: `GEMINI_API_KEY`

4. Deploy!

### Docker

```bash
docker build -t helix-app .
docker run -p 3000:3000 -e GEMINI_API_KEY=your_key helix-app
```

## Project Structure

```
helix-app/
├── app/
│   ├── api/           # API routes
│   ├── layout.tsx     # Root layout
│   ├── page.tsx       # Main page
│   └── globals.css    # Global styles
├── components/
│   ├── ui/            # shadcn/ui components
│   ├── ArchitectureVisualizer.tsx
│   └── LoadSimulationChart.tsx
├── lib/
│   ├── ai/            # Gemini AI integration
│   ├── db/            # Database utilities
│   ├── utils/         # Helper functions
│   └── types.ts       # TypeScript types
└── public/            # Static assets
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or PR.

## Support

For issues or questions, please open a GitHub issue.



one more thing end points are not returning anythingn is the token left is 0 
also add a support button to redirect to the buy me a coffee page 