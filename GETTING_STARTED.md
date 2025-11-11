# 🚀 Getting Started with Helix

Welcome to **Helix** - your AI-powered system design autopilot! This guide will get you up and running in minutes.

## Quick Start (3 Steps)

### Step 1: Install Dependencies

**Windows:**

```powershell
cd helix-app
npm install
```

**Mac/Linux:**

```bash
cd helix-app
npm install
```

Or use the installation script:

- **Windows**: `.\install.ps1`
- **Mac/Linux**: `chmod +x install.sh && ./install.sh`

### Step 2: Get Your Gemini API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key

Create a `.env.local` file in the `helix-app` folder:

```bash
GEMINI_API_KEY=paste_your_key_here
```

### Step 3: Run the App

```bash
npm run dev
```

Open your browser to: **http://localhost:3000**

**That's it! 🎉**

---

## 🎯 Your First Architecture

Let's create your first system design:

1. In the **prompt box**, enter:

   ```
   Design a scalable e-commerce platform with:
   - Product catalog service
   - User authentication service
   - Payment processing
   - Order management
   - Redis cache for product data
   - PostgreSQL database
   - Message queue for order processing
   - Load balancer for high availability
   ```

2. Click **"Generate Architecture"**

3. Wait 5-10 seconds while Gemini AI creates your design

4. Explore the results:

   - **Diagram Tab**: Interactive D3.js visualization
   - **Performance Tab**: Click "Simulate Load" to see metrics
   - **Code Tab**: Click "Generate Code" for boilerplate
   - **Details Tab**: View all components and patterns

5. Click **"Export Project"** to download everything!

---

## 📚 More Example Prompts

### Ride-Hailing App (like Uber)

```
Design a ride-hailing system with:
- Rider and driver mobile apps
- Real-time location tracking
- Ride matching algorithm
- Payment processing
- Notification service
- PostgreSQL for ride history
- Redis for real-time data
- Kafka for event streaming
- WebSocket server for real-time updates
```

### Real-Time Chat Application

```
Create a scalable chat application with:
- WebSocket server for real-time messaging
- User authentication
- Message persistence in PostgreSQL
- Redis for online user status
- Media file storage (CDN)
- Push notification service
- Load balancer
- Horizontal scaling
```

### Streaming Platform (like Netflix)

```
Design a video streaming platform with:
- Content delivery network (CDN)
- Video encoding service
- User recommendation engine
- Authentication and subscription service
- PostgreSQL for user data
- Redis for session management
- Object storage for video files
- Load balancer
```

### Social Media Platform

```
Build a social media platform with:
- User profile service
- Post creation and feed service
- Real-time notifications
- Image/video upload service
- PostgreSQL for user data
- Redis for feed caching
- Kafka for activity streams
- CDN for media delivery
- Search service with Elasticsearch
```

---

## 🎨 UI Guide

### Left Panel

- **Prompt Input**: Describe your system
- **Generate Button**: Creates architecture
- **Action Buttons**:
  - Simulate Load: Performance testing
  - Generate Code: Create service templates
  - Export Project: Download everything
- **Cost Card**: Monthly cost estimation

### Right Panel (Tabs)

1. **Diagram**:

   - Drag nodes to rearrange
   - Hover for details
   - Legend shows component types

2. **Performance**:

   - Run simulation first
   - View latency vs load chart
   - See max RPS, P95, P99 metrics

3. **Code**:

   - Generate code first
   - Expand to see file contents
   - Copy code for each service

4. **Details**:
   - All services listed
   - Architecture patterns
   - Scaling model

---

## 💡 Pro Tips

### Get Better Results

- **Be specific**: Include technologies you want (Redis, Kafka, etc.)
- **Mention scale**: "for 1M users" or "high traffic"
- **Specify patterns**: "microservices", "event-driven", "CQRS"

### Example of Good Prompt

```
Design a microservices architecture for a food delivery platform
handling 100K orders/day with:
- Order service (Node.js)
- Restaurant service (Node.js)
- Delivery tracking service (real-time with WebSockets)
- Payment service with Stripe integration
- Notification service (email and push)
- PostgreSQL databases
- Redis for order status caching
- RabbitMQ for async order processing
- API Gateway for routing
- Load balancer for high availability
- Event-driven architecture for order status updates
```

### Performance Optimization

- Add "horizontal scaling" for better load handling
- Include "cache layer" for faster response times
- Specify "load balancer" for high availability
- Use "message queue" for async processing

---

## 🐳 Optional: Docker Setup

To run with PostgreSQL and Redis:

```bash
# Start services
docker-compose up -d

# Your app connects to:
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

Update `.env.local`:

```bash
DATABASE_URL=postgresql://helix:helix_password@localhost:5432/helix
```

---

## 🚀 Deploy to Vercel

1. Push your code to GitHub:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com)

3. Click **"Import Project"**

4. Select your repository

5. Add environment variable:

   - Name: `GEMINI_API_KEY`
   - Value: your Gemini API key

6. Click **"Deploy"**

7. Your app is live! 🎉

---

## 🆘 Troubleshooting

### "Failed to generate architecture"

**Solution**: Check your Gemini API key in `.env.local`

### Port 3000 already in use

**Solution**: Use a different port:

```bash
npm run dev -- -p 3001
```

### Module not found errors

**Solution**:

```bash
rm -rf node_modules .next
npm install
```

### Slow generation

**Solution**: Gemini AI can take 5-15 seconds. This is normal.

### Visualization not showing

**Solution**:

- Check browser console for errors
- Ensure architecture was generated successfully
- Try refreshing the page

---

## 📖 Learn More

- **README.md**: Full project documentation
- **PROJECT_SUMMARY.md**: Technical overview
- **SETUP.md**: Advanced setup options

## 🤝 Need Help?

- Check the [GitHub Issues](your-repo-url/issues)
- Read the documentation files
- Review example prompts above

---

**Enjoy designing systems with Helix! 🎨✨**
