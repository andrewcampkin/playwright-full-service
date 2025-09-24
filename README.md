# Playwright AI Service - Complete SaaS Platform

> **AI-powered website testing platform that generates, executes, and analyzes Playwright test cases automatically.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

## 🚀 **What This Platform Does**

**Playwright AI Service** is a complete SaaS platform that transforms website testing by:

1. **🤖 AI-Powered Test Generation** - Enter any URL and AI automatically explores the website to generate comprehensive test cases
2. **⚡ Real-Time Test Execution** - Execute tests with live monitoring, parallel processing, and detailed results
3. **📊 Intelligent Analytics** - AI analyzes test patterns to provide improvement suggestions and insights
4. **👥 Multi-Tenant SaaS** - User authentication, project management, and team collaboration features

### **Key Features**
- ✅ **AI Website Exploration** - OpenAI-powered crawling with Playwright automation
- ✅ **Test Case Generation** - Comprehensive test suites created automatically
- ✅ **Real-Time Execution** - Live test monitoring with WebSocket updates
- ✅ **User Authentication** - JWT-based auth with secure password hashing
- ✅ **Project Management** - Organize tests by projects and websites
- ✅ **Test Analytics** - AI-powered insights and improvement suggestions
- ✅ **Database Persistence** - PostgreSQL with Prisma ORM
- ✅ **Docker Ready** - Complete containerized development environment

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Test Runner   │
│   React + TS    │◄──►│   Node.js +     │◄──►│   Service       │
│   Vite + TW     │    │   Express +     │    │   Playwright    │
│                 │    │   Prisma + PG   │    │   Execution     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   PostgreSQL    │              │
         │              │   Database      │              │
         │              └─────────────────┘              │
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         └──────────────►│   OpenAI API    │◄─────────────┘
                        │   AI Services   │
                        └─────────────────┘
```

## 🚀 **Quick Start**

### **Prerequisites**
- Docker and Docker Compose
- OpenAI API key
- Node.js 18+ (for local development)

### **1. Clone and Setup**
```bash
git clone <repository-url>
cd playwright-full-service
cp env.example .env
```

### **2. Configure Environment**
Edit `.env` and add your credentials:
```env
# Required
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your_jwt_secret_here

# Database (auto-configured in Docker so not needed unless you want to setup local without docker)
DATABASE_URL=postgresql://playwright_user:playwright_password@localhost:5432/playwrightservice
```

### **3. Local with docker**

#### Install packages
```bash
# Backend
cd backend-node
yarn

# Frontend
cd frontend
yarn

# Test runner service
cd test-runner
yarn
```

#### Running
```bash
# Start all services with Docker
docker-compose up -d

# Start all services with Docker including rebuilding
docker-compose up --build -d

# Or for development with tools
docker-compose --profile tools up -d

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart backend-node

# Stop all services
docker-compose down
```

### **4. Access the Platform**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database Admin**: http://localhost:8080 (with `--profile tools`)

## 🎯 **User Journey**

### **New Users (Marketing Flow)**
1. **Land on homepage** → See compelling value proposition
2. **Enter URL** → Generate tests instantly (no signup required)
3. **See results** → Preview generated test cases
4. **Sign up to save** → Provide test suite name and account details
5. **Access dashboard** → Full access to test management features

### **Existing Users**
1. **Sign in** → Quick access to dashboard
2. **Select test suite** → Choose from previously recorded tests
3. **Execute tests** → Run tests on selected suites
4. **View results** → Analyze test execution history
5. **Get AI insights** → Receive improvement suggestions

## 📁 **Project Structure**

```
playwright-full-service/
├── 📁 docs/                     # Documentation
│   ├── setup-database.md        # Database setup guide
│   ├── setup-openai.md          # OpenAI configuration
│   ├── test-execution.md        # Test execution features
│   ├── ai-test-improvement.md   # AI analysis system
│   └── saas-roadmap.md          # Development roadmap
├── 📁 backend-node/             # Main API service
│   ├── src/
│   │   ├── server.js           # Express server
│   │   └── services/           # Business logic
│   └── prisma/                 # Database schema
├── 📁 frontend/                 # React application
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── contexts/           # React contexts
│   │   └── services/           # API services
├── 📁 test-runner/              # Test execution service
├── 📁 deployment/               # Infrastructure configs
└── docker-compose.yml           # Development environment
```

## 📖 **Documentation**

### **Setup & Configuration**
- **[Database Setup Guide](docs/setup-database.md)** - PostgreSQL setup with Prisma ORM
- **[OpenAI Configuration](docs/setup-openai.md)** - API key setup and configuration

### **Features & Development**
- **[Test Execution & Results](docs/test-execution.md)** - Frontend dashboard and analytics
- **[AI Test Improvement](docs/ai-test-improvement.md)** - AI-powered test analysis system
- **[SaaS Development Roadmap](docs/saas-roadmap.md)** - Complete development plan and priorities

### **Frontend Documentation**
- **[Frontend Guide](frontend/README.md)** - React application architecture and features

## 🔧 **Development**

### **Local Development without docker**

Install the playwright browsers in the backend and the test runner if you are not running it in docker

```bash
# Backend only
cd backend-node
yarn install
yarn dev

# Frontend only  
cd frontend
yarn install
yarn dev

# Database setup
yarn db:setup
```

### **Available Scripts**
```bash
# Database operations
yarn db:setup      # Complete database setup
yarn db:generate   # Generate Prisma client
yarn db:push       # Push schema to database
yarn db:seed       # Seed with demo data
yarn db:reset      # Reset database (WARNING: deletes data)

# Docker operations
yarn docker:up     # Start database services
yarn docker:dev    # Start full development environment
yarn docker:down   # Stop all services
```

## 🔐 **Authentication**

The platform includes a complete authentication system:

### **Registration**
```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### **Login**
```bash
POST /api/auth/login
{
  "email": "user@example.com", 
  "password": "password123"
}
```

### **Protected Endpoints**
All endpoints under `/api/protected/` require authentication:
```bash
Authorization: Bearer <jwt_token>
```

## 📊 **API Endpoints**

### **Public Endpoints**
- `POST /api/crawl-and-generate` - Generate tests without authentication

### **Protected Endpoints**
- `GET /api/protected/projects` - List user projects
- `POST /api/protected/projects` - Create new project
- `GET /api/protected/websites` - List project websites
- `POST /api/protected/websites` - Create new website
- `GET /api/protected/test-suites` - List test suites
- `POST /api/protected/crawl-and-generate` - Generate tests with persistence
- `POST /api/protected/execute-test` - Execute individual test
- `POST /api/protected/execute-test-suite` - Execute test suite
- `GET /api/protected/executions` - Get execution history
- `GET /api/protected/execution-stats` - Get execution statistics

## 🗄️ **Database Schema**

The platform uses PostgreSQL with Prisma ORM. Key entities:

- **User** - Authentication and profile information
- **Project** - User project organization
- **Website** - Websites within projects
- **TestSuite** - Collections of test cases
- **TestCase** - Individual test cases with JSON steps
- **TestExecution** - Test execution results and logs
- **ExplorationResult** - AI exploration data storage

See [Database Setup Guide](docs/setup-database.md) for detailed schema information.

## 🧠 **AI Integration**

The platform integrates OpenAI's GPT models with Playwright MCP tools:

### **Available AI Tools**
- `navigate_to_url` - Navigate to pages
- `take_screenshot` - Capture page screenshots
- `get_page_content` - Get HTML content
- `get_visible_text` - Extract visible text
- `find_interactive_elements` - Find buttons, links, forms
- `click_element` - Click on elements
- `fill_input` - Fill form fields
- `get_page_links` - Discover site structure

### **AI Analysis Features**
- Test execution pattern analysis
- Failure pattern recognition
- Performance optimization suggestions
- Test coverage recommendations
- Flaky test detection

See [AI Test Improvement Guide](docs/ai-test-improvement.md) for detailed information.

## 🚀 **Deployment**

### **Production Deployment**
The platform is designed for easy deployment to cloud providers:

- **AWS**: ECS, RDS, ElastiCache, S3
- **Azure**: Container Instances, SQL Database, Redis Cache
- **Google Cloud**: Cloud Run, Cloud SQL, Memorystore

### **Environment Variables**
```env
# Required
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_jwt_secret

# Database
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port

# Optional
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
```

## 📈 **Business Model**

### **Pricing Tiers**
- **Free Tier**: 5 test generations/month, basic features
- **Pro Tier**: $29/month - Unlimited tests, team collaboration
- **Enterprise**: $99/month - Advanced features, SSO, priority support

### **Key Metrics**
- Test generations per user
- Test execution frequency  
- User retention and engagement
- Feature adoption rates

## 🐛 **Troubleshooting**

### **Common Issues**

**OpenAI API Key Error**
- Ensure `OPENAI_API_KEY` is set in `.env`
- Verify API key is valid and has credits

**Database Connection Issues**
```bash
# Check if PostgreSQL is running
docker-compose ps

# View database logs
docker-compose logs postgres

# Reset database
yarn db:reset
```

**Port Conflicts**
- PostgreSQL: 5432
- Backend: 3001
- Frontend: 3000
- pgAdmin: 8080

### **Getting Help**
- **[Database Setup Guide](docs/setup-database.md)** - PostgreSQL setup with Prisma ORM
- **[OpenAI Configuration](docs/setup-openai.md)** - API key setup and configuration
- **[Test Execution & Results](docs/test-execution.md)** - Frontend dashboard and analytics
- **[AI Test Improvement](docs/ai-test-improvement.md)** - AI-powered test analysis system
- **[SaaS Development Roadmap](docs/saas-roadmap.md)** - Development status and priorities
- **[Frontend Guide](frontend/README.md)** - React application architecture
- Open an issue for bugs or feature requests

### **Immediate Priorities**
- ✅ User authentication and project management
- ✅ AI-powered test generation
- ✅ Test execution and monitoring
- 🚧 Advanced analytics and AI insights
- 📋 CI/CD integration and enterprise features

See [SaaS Roadmap](docs/saas-roadmap.md) for the complete development plan.

---

**Built using React, Node.js, PostgreSQL, and OpenAI**