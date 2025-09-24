# Playwright AI Service - Simplified

A simplified AI-powered website crawler and test generator using Playwright MCP tools.

## What This Does

1. **Enter a URL** → User provides a website URL
2. **AI Crawls Website** → OpenAI uses Playwright MCP tools to explore the site
3. **Generate Tests** → AI creates comprehensive Playwright test cases
4. **Display Results** → Show sitemap and generated tests in a clean UI

## Quick Start

### Prerequisites
- Docker and Docker Compose
- OpenAI API key

### Setup

1. **Set up environment:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   JWT_SECRET=your_jwt_secret_here
   ```

2. **Start with Docker:**
   ```bash
   docker-compose up -d
   ```

This will start:
- PostgreSQL database on port 5432
- Backend API on http://localhost:3001
- Frontend UI on http://localhost:3000

### Optional: Database Management

To start pgAdmin for database management:
```bash
docker-compose --profile tools up -d
```

**Access pgAdmin:**
- URL: http://localhost:8080
- Email: admin@playwrightservice.com
- Password: admin123

**Connect to database in pgAdmin:**
1. Right-click "Servers" → "Create" → "Server"
2. **General tab:** Name: `Playwright DB`
3. **Connection tab:**
   - Host: `postgres`
   - Port: `5432`
   - Database: `playwrightservice`
   - Username: `playwright_user`
   - Password: `playwright_password`

### Usage

1. Open http://localhost:3000 in your browser
2. Enter a website URL (e.g., https://example.com)
3. Click "Generate Tests"
4. Wait for AI to explore the website and generate tests
5. View the discovered sitemap and generated test cases

## Architecture

### Service Responsibilities

**Backend-Node Service** (Database Owner):
- **Single source of truth** for database schema (Prisma)
- **Database management**: Migrations, seeding, and schema changes
- **API endpoints**: CRUD operations for all entities
- **AI Integration**: OpenAI function calling with Playwright MCP tools
- **Authentication**: JWT with bcrypt password hashing

**Test-Runner Service** (Database Consumer):
- **Test execution**: Runs Playwright tests from queue
- **Database access**: Uses shared schema, no schema management
- **Job processing**: Redis-based queue system
- **Real-time updates**: WebSocket for execution status

**Frontend** (React + TypeScript + Vite):
- **Test generation**: URL input and AI crawling
- **Test execution**: Dashboard with real-time monitoring
- **Results analytics**: Comprehensive test results and trends
- **Three-tab interface**: Generate → Execute → Results

### Database Architecture
- **PostgreSQL**: Central database shared by all services
- **Backend-Node**: Manages schema, migrations, and seeding
- **Test-Runner**: Consumes database using generated Prisma client
- **Redis**: Job queue for test execution

## How It Works

1. **User submits URL** → Frontend sends to backend
2. **AI starts conversation** → OpenAI with function definitions for Playwright tools
3. **AI explores website** → Uses tools like navigate, screenshot, get_content, find_elements
4. **AI generates tests** → Creates comprehensive test cases based on exploration
5. **Results returned** → Sitemap and tests sent back to frontend

## Available AI Tools

The AI has access to these Playwright MCP tools:
- `navigate_to_url` - Navigate to pages
- `take_screenshot` - Capture page screenshots
- `get_page_content` - Get HTML content
- `get_visible_text` - Extract visible text
- `find_interactive_elements` - Find buttons, links, forms
- `click_element` - Click on elements
- `fill_input` - Fill form fields
- `get_page_links` - Discover site structure

## Development

### Docker Development (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart backend-node

# Stop all services
docker-compose down
```

### Local Development (Alternative)
```bash
# Backend only
cd backend-node
yarn dev

# Frontend only  
cd frontend
yarn dev

# Both services
yarn dev
```

## Environment Variables

### Root .env file
```
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your_jwt_secret_here
```

### Docker Services
- **PostgreSQL**: Automatically configured in docker-compose.yml
- **Backend**: Loads environment from .env file
- **Frontend**: Configured via docker-compose environment variables

## API Endpoints

### POST /api/crawl-and-generate
**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://example.com",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "sitemap": [
    {
      "url": "https://example.com",
      "title": "Homepage",
      "description": "Main page"
    }
  ],
  "tests": [
    {
      "name": "Basic Navigation Test",
      "description": "Test basic navigation",
      "steps": [
        {
          "action": "navigate",
          "target": "https://example.com",
          "value": null
        }
      ]
    }
  ],
  "explorationLog": 15
}
```

## Troubleshooting

### Common Issues

1. **OpenAI API Key Error**
   - Make sure you've set `OPENAI_API_KEY` in `backend-node/.env`
   - Verify the API key is valid and has credits

2. **CORS Errors**
   - Backend is configured to allow frontend origin
   - Check that frontend is running on http://localhost:5173

3. **Playwright Browser Issues**
   - Docker setup includes Chromium browser automatically
   - If issues persist, rebuild: `docker-compose up -d --build`

4. **Port Conflicts**
   - Backend uses port 3001
   - Frontend uses port 3000 (Docker)
   - PostgreSQL uses port 5432
   - pgAdmin uses port 8080 (with --profile tools)

## Next Steps

This version includes core functionality with database persistence. Future enhancements could include:

- Test execution engine and results tracking
- Test case editing and management UI
- Advanced AI features and customization
- Real-time test execution monitoring
- Deployment and scaling

## Why This Approach Works

✅ **Actually functional** - AI really crawls websites using Playwright
✅ **Database persistence** - PostgreSQL with Prisma for data management
✅ **User authentication** - JWT-based auth with proper security
✅ **Easy to develop** - Node.js with excellent Cursor support
✅ **Real AI integration** - Uses OpenAI function calling properly
✅ **SaaS-ready** - Multi-tenant architecture with proper access control
✅ **Easy to test** - Clear input/output, debuggable flow
