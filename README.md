# Career Agent

An automated job searching platform built with Next.js that uses browser automation to find and apply to jobs across multiple platforms.

## Features

- **Multi-platform Job Search**: Automated searching across job boards
- **Real-time Browser Streaming**: Watch job searches happen in real-time
- **Job Management**: Save, track, and manage job applications
- **Automated Applications**: Apply to jobs automatically or manually
- **Session Management**: Start, pause, resume, and stop job searches
- **Real-time Updates**: Live job extraction and status updates

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Browser Automation**: Stagehand (wallcrawler package)
- **Real-time**: Server-Sent Events with Redis pub/sub
- **Database**: Redis (for SSE connections), In-memory storage (demo)
- **Cloud**: AWS provider for browser instances

## Quick Start

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/Volpestyle/career-agent.git
   cd career-agent
   npm install
   ```

2. **Set up Redis**
   ```bash
   # Using Docker (recommended)
   docker run -p 6379:6379 -d redis:latest
   
   # Or install locally (macOS)
   brew install redis
   redis-server
   ```

3. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   # Edit REDIS_URL if needed (defaults to localhost:6379)
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open application**
   - Navigate to http://localhost:3000
   - Create a new job search session
   - Watch real-time job extraction

## Architecture

- **Dashboard**: Overview of active searches and statistics
- **Search Details**: Real-time viewport streaming and job extraction
- **Jobs Management**: Saved jobs with application tracking
- **API Routes**: RESTful endpoints for search and job management
- **Redis Integration**: Production-ready SSE connection management

## Development

- Built with modern React patterns and TypeScript
- Real-time updates via Server-Sent Events
- Responsive design with Tailwind CSS
- Component library with shadcn/ui

## Production Deployment

- Redis required for SSE connections across serverless environments
- Compatible with Vercel, AWS Lambda, or containerized deployments
- Environment variables for Redis and AWS configuration

---

*Generated with Claude Code*