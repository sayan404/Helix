# Helix - AI-Powered System Design Autopilot 🚀

**Transform natural language into production-ready system architectures in seconds.**

Helix is an AI-powered platform that bridges the gap between system design ideas and real-world implementation. Simply describe your system in plain English, and watch as Helix generates complete architecture blueprints, cost estimations, performance simulationsand and all powered by LLMs.

---

## 🌟 Insane Capabilities

### What Makes Helix Special?

Helix doesn't just generate diagrams—it creates **complete, production-ready system designs** with:

- **🤖 AI-Powered Architecture Generation**: Convert plain English prompts into sophisticated, scalable system architectures with proper component identification, technology recommendations, and communication patterns
- **🎨 Interactive Visual Whiteboard**: Drag-and-drop diagram editor with real-time visualization, zoom, pan, and manual editing capabilities
- **💰 Intelligent Cost Estimation**: Get detailed monthly infrastructure cost breakdowns (compute, storage, network) before you build
- **⚡ Performance Simulation Engine**: Simulate load testing scenarios with RPS calculations, latency metrics (P95, P99), and scalability predictions
- **💻 AI Code Generation**: Generate complete boilerplate code for all services (TypeScript/Node.js) with proper structure, Dockerfiles, and API handlers
- **📦 One-Click Project Export**: Download complete Docker-ready projects with docker-compose.yml, README, and all generated code
- **🔍 Pattern-Based Similarity Search**: Find similar architectures from your past projects using intelligent pattern matching
- **💬 Conversational AI Assistant**: Iterate on designs through natural language conversations—ask for improvements, evaluate risks, or request modifications
- **📊 Real-Time Architecture Persistence**: All your designs are automatically saved and can be loaded anytime
- **🎯 Token-Based Usage System**: Fair usage tracking with visual quota indicators and graceful handling when limits are reached

---

## 🎯 Core Features Deep Dive

### 1. AI System Design Generator

**Input**: Natural language prompt  
**Output**: Complete architecture blueprint with services, databases, caches, queues, and connections

**How it works:**

- Uses LLMs to analyze your prompt
- Automatically identifies system components (microservices, databases, caches, message queues, CDNs, load balancers)
- Determines communication patterns (sync/async/pub-sub)
- Recommends appropriate technologies (Node.js, Go, Python, PostgreSQL, Redis, Kafka, etc.)
- Generates structured JSON blueprint with relationships and properties

**Example Prompts:**

```
"Design a scalable e-commerce platform with Redis caching and payment processing"
"Create an Uber-like ride-hailing system with real-time tracking"
"Build a chat application with WebSockets and message queuing"
```

### 2. Interactive Architecture Whiteboard

**Features:**

- **Drag-and-Drop Editing**: Reposition components by dragging nodes
- **Visual Connection Builder**: Connect services with sync, async, or pub-sub relationships
- **Component Library**: Searchable palette with 30+ pre-configured components across categories:
  - Edge & Routing (API Gateway, Load Balancer, CDN)
  - Compute & Services (Node.js, Go, Python, Java services)
  - Data Stores (PostgreSQL, MySQL, DynamoDB, Elasticsearch)
  - Messaging & Events (Kafka, RabbitMQ, Pub/Sub, SQS)
  - Caching Layers (Redis, Memcached, Edge Cache)
  - Observability & Ops (Monitoring, Logging, Alerting)
  - Identity & Security (Auth Service, Policy Service, Secrets Manager)
- **Zoom & Pan Controls**: Navigate large architectures with smooth zoom (35%-150%) and pan
- **Fit-to-View**: Automatically frame your entire architecture
- **Save to Architecture**: Persist manual edits back to the AI-generated design

### 3. Cost Estimation Engine

**Calculates:**

- Monthly infrastructure costs broken down by:
  - **Compute**: Service instances, containers, serverless functions
  - **Storage**: Database storage, object storage, backups
  - **Network**: Data transfer, CDN usage, API gateway requests
  - **Additional Services**: Message queues, caches, monitoring tools

**Output**: Detailed cost breakdown with total monthly estimate

### 4. Load Simulation & Performance Analysis

**Simulates:**

- Various request-per-second (RPS) scenarios
- Latency calculations (average, P95, P99)
- Success rate predictions
- Bottleneck identification

**Visualization:**

- Interactive D3.js line chart showing latency vs. load
- Real-time performance metrics display
- Scalability predictions

<!-- ### 5. AI Code Generation

**Generates complete boilerplate for each service:**

- `index.ts` - Main service entry point
- `routes.ts` - API route handlers
- `Dockerfile` - Container configuration
- `package.json` - Dependencies and scripts
- Service-specific configuration files -->

**Features:**

- Technology-aware code generation (Node.js/Express, Go/Fiber, Python/FastAPI, Java/Spring Boot)
- Streaming generation for multiple services (see progress in real-time)
- Copy individual files or entire service code
- Export all code as a ZIP file
- Automatic code persistence (saved with architecture)

### 6. Project Export

**Downloads complete project package:**

- `docker-compose.yml` - All services configured and ready
- `README.md` - Architecture documentation
- Generated code for all services
- Architecture JSON blueprint
- Cost estimation summary

**Ready to deploy** with a single `docker-compose up` command!

### 7. Conversational AI Assistant

**Two modes:**

**Generate Mode:**

- Create new architectures from scratch
- Iterate on existing designs ("add Redis caching", "make it more scalable")
- Refine architectures through conversation

**Evaluate Mode:**

- Get feedback on your current design
- Identify potential risks and bottlenecks
- Receive improvement suggestions
- Ask architecture questions

**Features:**

- Full conversation history
- Context-aware responses
- Iteration tracking
- Automatic architecture updates

### 8. Architecture Persistence

**Automatic saving:**

- All generated architectures are saved to database
- Past projects accessible from sidebar
- Load previous designs with one click
- View project metadata (services count, connections, last updated)

**Project Management:**

- View all past projects
- Quick access to recent designs
- Automatic versioning through iterations

---

## 🚀 Complete End-to-End Workflow

### Step 1: Sign Up / Login

1. Navigate to the application
2. Create an account or log in
3. You'll receive an initial token quota (default: 5,000 tokens)

### Step 2: Generate Your First Architecture

1. **Enter a prompt** in the chat interface:

   ```
   "Design a scalable microservices architecture for a food delivery app"
   ```

2. **Click Send** or press Enter

3. **Wait for generation** (typically 10-30 seconds):

   - AI analyzes your prompt
   - Generates architecture blueprint
   - Creates visualization
   - Calculates cost estimation

4. **View the result**:
   - Interactive diagram appears in the Design tab
   - Architecture summary in chat
   - Cost breakdown visible

### Step 3: Explore the Architecture

**Design Tab:**

- View the interactive diagram
- Drag nodes to reposition
- Use zoom controls to navigate
- Click on nodes to see details

**Whiteboard Mode:**

- Click "Add Component" to manually add services
- Use "Connect" mode to draw relationships
- Save changes back to architecture

### Step 4: Iterate and Refine

**Continue the conversation:**

```
"Add Redis caching layer"
"Make the database more scalable"
"Add a message queue for async processing"
```

Each iteration updates your architecture while preserving the conversation history.

### Step 5: Simulate Performance

1. Navigate to **Simulation & Cost** tab
2. Click **"Run Simulation"**
3. View performance metrics:
   - Max RPS capacity
   - Average latency
   - Performance graph
4. Analyze scalability predictions

<!-- ### Step 6: Generate Code

1. Navigate to **Code** tab
2. Click **"Generate Code"**
3. Watch as code streams in for each service:
   - Service 1: User Service ✓
   - Service 2: Order Service ✓
   - Service 3: Payment Service ✓
4. **Copy individual files** or **Export All** as ZIP
-->

### Step 7: Export Project

1. Click **"Export"** button
2. Download complete project package

### Step 8: Evaluate and Improve

Use the chat to get AI feedback:

```
"What are the potential bottlenecks in this design?"
"How can I improve scalability?"
"What security considerations should I add?"
```

---

## 💰 Token System & Usage

### How Tokens Work

Helix uses a **token-based quota system** to manage AI usage fairly:

- **Initial Quota**: 5,000 tokens per user (default)
  <!-- - **Token Consumption**: Each AI operation consumes tokens:
    - Architecture generation: ~500-2000 tokens -->
    <!-- - Code generation: ~200-500 tokens per service -->
    <!-- - Architecture evaluation: ~300-800 tokens
    - Iterations: ~400-1500 tokens -->

### Token Display

- **Header Badge**: Shows remaining tokens
- **Auto-refresh**: Updates every 15 seconds
- **Color coding**:
  - Green: Plenty of tokens remaining
  - Red: Low tokens (approaching limit)

### What Happens When Tokens Reach Zero?

**Important**: When your token quota reaches 0:

1. **Endpoints stop generating new content**:

   - Architecture generation is disabled
   - Code generation is disabled
   - New evaluations are blocked

2. **You can still:**

   - View all past architectures
   - View all previously generated code
   - Export existing projects
   - Navigate the interface
   - Load and examine saved designs

3. **User-friendly messaging**:

   - Clear error messages explain the situation
   - Direct link to support page
   - No abrupt redirects—you stay in control

4. **Get more tokens**:
   - Click the **"Contribute"** button in header
   - Or visit `/support-my-work` page
   - Support the project to receive additional tokens (1rs → 25 Tokens & 1$ → 2,125 Tokens)
   - Email `sayanmajumder2002@gmail.com` after supporting

### Token Quota Management

- **Real-time tracking**: See exactly how many tokens you've used
- **Operation history**: View detailed token usage per operation
- **Fair limits**: Prevents abuse while allowing generous usage
- **Support-based expansion**: Contributors receive additional tokens

---

## 🎁 Support & Contribution

### Why Support Helix?

Your support helps:

- Cover AI infrastructure costs (Gemini API usage)
- Maintain and improve the platform
- Add new features and capabilities
- Scale infrastructure for all users

### How to Support

1. **Click the "Contribute" button** in the header (⭐ icon)
2. Or navigate to `/support-my-work` page
3. Click **"Support with Coffee"** button
4. Complete your contribution
5. **Email** `sayanmajumder2002@gmail.com` with your contribution details
6. Receive additional tokens and premium features

### Token Pricing

Support the project and receive tokens based on your contribution:

- **1 Rupee (₹1)** → **15 Tokens**
- **1 Dollar ($1)** → **1,275 Tokens**

_Example: A $10 contribution gives you 12,750 tokens!_

### What You Get

- **More tokens** for architecture generation
- **Faster responses** with priority processing
- **Early access** to new features and AI models
- **Premium support** and feature requests
- **Help scale** infrastructure for the community

---

## 🛠️ Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **D3.js** - Interactive data visualizations
- **React Hooks** - Modern state management

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **Node.js** - Runtime environment
- **PostgreSQL** - Database (optional, for persistence)
- **Drizzle ORM** - Type-safe database queries

### AI & Services

- **Google Gemini AI** - Architecture and code generation
- **Sentry** - Error monitoring and performance tracking (optional)

### DevOps

- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Vercel** - Deployment platform

---

## 📦 Installation & Setup

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm or pnpm** - Package manager
- **Gemini API Key** - [Get from Google AI Studio](https://makersuite.google.com/app/apikey)
- **PostgreSQL** (optional) - For architecture persistence

### Quick Start

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd helix-app
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables:**

   Create `.env.local` file:

   ```bash
   # Required
   GEMINI_API_KEY=your_gemini_api_key_here

   # Optional: Database (for persistence)
   DATABASE_URL=postgresql://user:password@localhost:5432/helix

   # Optional: Sentry (for error monitoring)
   SENTRY_DSN=your_sentry_dsn_here
   SENTRY_TRACES_SAMPLE_RATE=0.1

   # Optional: Client-side Sentry
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
   NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
   ```

4. **Run development server:**

   ```bash
   npm run dev
   ```

5. **Open browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Optional: PostgreSQL Setup

For architecture persistence and advanced features:

1. **Start PostgreSQL with Docker:**

   ```bash
   docker-compose up -d postgres
   ```

2. **Install PostgreSQL client:**

   ```bash
   npm install pg
   ```

3. **Initialize database:**
   The schema will be automatically created from `lib/db/schema.sql`

4. **Update `.env.local`:**
   ```bash
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/helix
   ```

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Push to GitHub:**

   ```bash
   git push origin main
   ```

2. **Import in Vercel:**

   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Add environment variables:**

   - `GEMINI_API_KEY` (required)
   - `DATABASE_URL` (optional)
   - `SENTRY_DSN` (optional)

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Your app is live!

### Docker

1. **Build the image:**

   ```bash
   docker build -t helix-app .
   ```

2. **Run the container:**

   ```bash
   docker run -p 3000:3000 \
     -e GEMINI_API_KEY=your_key \
     -e DATABASE_URL=your_db_url \
     helix-app
   ```

3. **Access the app:**
   Open [http://localhost:3000](http://localhost:3000)

### Docker Compose

1. **Update `docker-compose.yml`** with your environment variables

2. **Start services:**

   ```bash
   docker-compose up -d
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f
   ```

---

## 📁 Project Structure

```
helix-app/
├── app/
│   ├── api/                    # API Routes
│   │   ├── design/            # Architecture generation
│   │   ├── chat/              # AI conversation/evaluation
│   │   ├── generate-code/     # Code generation
│   │   ├── simulate/           # Load simulation
<!-- │   │   ├── export/             # Project export
│   │   ├── export-boilerplate/ # Code export -->
│   │   ├── architectures/      # Architecture CRUD
│   │   ├── code-templates/     # Code template management
│   │   ├── token-usage/        # Token tracking
│   │   └── auth/                # Authentication
│   ├── workspace/              # Main workspace page
│   ├── login/                  # Login page
│   ├── signup/                 # Signup page
│   ├── support-my-work/        # Support/contribution page
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── diagram/
│   │   ├── DiagramEditor.tsx   # Main diagram editor
│   │   ├── CustomNode.tsx      # Node component
│   │   ├── PropertiesPanel.tsx # Properties panel
│   │   └── Sidebar.tsx          # Component library sidebar
│   ├── ArchitectureWhiteboard.tsx # Interactive whiteboard
│   ├── LoadSimulationChart.tsx   # Performance chart
│   └── ErrorBoundary.tsx         # Error handling
├── lib/
│   ├── ai/
│   │   └── gemini-client.ts    # Gemini AI integration
│   ├── auth/
│   │   ├── get-user.ts         # User authentication
│   │   └── utils.ts            # Auth utilities
│   ├── db/
│   │   ├── schema.ts           # Database schema
│   │   ├── schema.sql          # SQL schema
│   │   ├── drizzle.ts          # Drizzle ORM setup
│   │   └── client.ts           # Database client
│   ├── utils/
│   │   ├── cost-estimator.ts   # Cost calculation
│   │   ├── similarity-search.ts # Pattern matching
│   │   └── token-quota.ts      # Token management
│   ├── monitoring/
│   │   └── api-monitoring.ts   # API performance tracking
│   └── types.ts                # TypeScript types
├── docker-compose.yml          # Docker services
├── Dockerfile                  # Production container
├── package.json                # Dependencies
├── tailwind.config.ts          # Tailwind configuration
└── tsconfig.json               # TypeScript configuration
```

---

## 📚 Usage Examples

### Example 1: E-Commerce Platform

**Prompt:**

```
"Design a scalable e-commerce platform with microservices architecture.
Include user authentication, product catalog, shopping cart, payment processing,
and order management. Use Redis for caching and Kafka for event streaming."
```

**Result:**

- 8+ services generated (User Service, Product Service, Cart Service, Payment Service, Order Service, etc.)
- Redis cache layer
- Kafka message queue
- PostgreSQL database
- API Gateway
- Cost estimation: ~$2,500/month
- Complete code generated for all services

### Example 2: Real-Time Chat System

**Prompt:**

```
"Create a real-time chat application with WebSocket support,
message persistence, and user presence tracking.
Use Redis for pub/sub and PostgreSQL for message storage."
```

**Result:**

- WebSocket service
- Message service
- Presence service
- Redis pub/sub
- PostgreSQL database
- Load balancer
- Performance simulation shows 10,000+ concurrent users

### Example 3: Ride-Hailing Platform

**Prompt:**

```
"Design an Uber-like ride-hailing platform with real-time location tracking,
driver matching, payment processing, and notification system."
```

**Result:**

- Location service with geospatial database
- Matching service with algorithm
- Payment service
- Notification service
- Real-time tracking with WebSockets
- Message queue for async processing

---

## 🔧 Configuration

### Environment Variables

**Required:**

- `GEMINI_API_KEY` - Your Google Gemini API key

**Optional:**

- `DATABASE_URL` - PostgreSQL connection string
- `SENTRY_DSN` - Sentry error monitoring
- `NEXT_PUBLIC_SENTRY_DSN` - Client-side Sentry
- `SENTRY_TRACES_SAMPLE_RATE` - Performance monitoring rate

### Database Schema

The database schema includes:

- `users` - User accounts and token quotas
- `architectures` - Saved architecture blueprints
- `code_templates` - Generated code templates
- `token_usage` - Token consumption tracking

See `lib/db/schema.sql` for complete schema.

---

## 🐛 Troubleshooting

### Endpoints Not Returning Data When Tokens = 0

**This is expected behavior!** When your token quota reaches 0:

- ✅ **You can still:**

  - View all past architectures
  - View previously generated code
  - Export existing projects
  - Navigate the interface

- ❌ **You cannot:**
  - Generate new architectures
  - Generate new code
  - Run new evaluations

**Solution:**

1. Click the **"Contribute"** button (⭐ icon) in the header
2. Or visit `/support-my-work` page
3. Support the project to receive more tokens
4. Email `sayanmajumder2002@gmail.com` after supporting

### Common Issues

**"Authentication required" error:**

- Make sure you're logged in
- Clear cookies and try again
- Check that database is connected (if using persistence)

**"Token limit reached" error:**

- Your quota has been exhausted
- Support the project to get more tokens
- Check token usage in the header badge

**"Failed to generate architecture":**

- Check your `GEMINI_API_KEY` is valid
- Verify API key has sufficient quota
- Check network connection

**Database connection issues:**

- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check database credentials

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Report bugs** - Open an issue with detailed description
2. **Suggest features** - Share your ideas for improvements
3. **Submit PRs** - Fix bugs or add features
4. **Improve documentation** - Help make docs better
5. **Support the project** - Help cover infrastructure costs

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- **Google Gemini AI** - Powering the architecture and code generation
- **Next.js Team** - Amazing React framework
- **shadcn/ui** - Beautiful component library
- **D3.js** - Powerful visualization library
- **All Contributors** - Making Helix better every day

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Email**: sayanmajumder2002@gmail.com
- **Support Page**: `/support-my-work` (in-app)

---

## 🎉 Get Started Now!

1. **Clone the repo** and install dependencies
2. **Add your Gemini API key** to `.env.local`
3. **Run `npm run dev`**
4. **Start designing** your first architecture!

**Happy Architecting! 🚀**

---

_Built with ❤️ using Next.js, TypeScript, and Google Gemini AI_
