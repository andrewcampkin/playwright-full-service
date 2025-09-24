# Database Setup Guide

> **Complete guide for setting up the PostgreSQL database with Prisma ORM for the Playwright AI Service platform.**

## 📋 Navigation
- [Quick Start](#-quick-start)
- [What's Been Added](#-whats-been-added)
- [Database Commands](#-database-commands)
- [Database Schema](#️-database-schema)
- [Authentication](#-authentication)
- [Demo Account](#-demo-account)
- [Migration from .NET](#-migration-from-net)
- [Next Steps](#-next-steps)
- [Troubleshooting](#-troubleshooting)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
yarn install:all
```

### 2. Start Database Services
```bash
yarn docker:up
```

### 3. Set Up Database Schema
```bash
yarn db:setup
```

### 4. Start Development Servers
```bash
yarn dev
```

## 📋 What's Been Added

### **Database Layer**
- ✅ **PostgreSQL** with Docker Compose
- ✅ **Prisma ORM** for type-safe database operations
- ✅ **Database models** migrated from .NET entities
- ✅ **Authentication system** with JWT tokens
- ✅ **User management** with bcrypt password hashing

### **API Endpoints**
- ✅ **Authentication**: `/api/auth/register`, `/api/auth/login`
- ✅ **Project management**: `/api/protected/projects`
- ✅ **Website management**: `/api/protected/websites`
- ✅ **AI crawling**: `/api/protected/crawl-and-generate` (with persistence)
- ✅ **Legacy endpoint**: `/api/crawl-and-generate` (without auth)

### **Data Models**
- ✅ **User** - Authentication and profile
- ✅ **Project** - User project organization
- ✅ **Website** - Websites within projects
- ✅ **TestSuite** - Collections of test cases
- ✅ **TestCase** - Individual test cases with JSON steps
- ✅ **TestExecution** - Test execution results and logs
- ✅ **ExplorationResult** - AI exploration data storage

## 🔧 Database Commands

### **Setup Commands**
```bash
# Generate Prisma client
yarn db:generate

# Push schema to database
yarn db:push

# Run database seed
yarn db:seed

# Complete setup (all above)
yarn db:setup
```

### **Development Commands**
```bash
# Start database services only
yarn docker:up

# Start full development environment
yarn docker:dev

# Stop all services
yarn docker:down

# Reset database (WARNING: deletes all data)
yarn db:reset
```

## 🗄️ Database Schema

### **Users Table**
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `name` (String, Optional)
- `passwordHash` (String, Optional for OAuth users)
- `provider` (String: 'local', 'google', 'github')
- `providerId` (String, External provider ID)
- `avatar` (String, Optional)
- `isActive` (Boolean)
- `createdAt`, `updatedAt` (DateTime)

### **Projects Table**
- `id` (UUID, Primary Key)
- `name` (String, Max 200 chars)
- `description` (String, Max 1000 chars, Optional)
- `userId` (UUID, Foreign Key to Users)
- `isActive` (Boolean)
- `createdAt`, `updatedAt` (DateTime)

### **Websites Table**
- `id` (UUID, Primary Key)
- `name` (String, Max 200 chars)
- `url` (String, Max 500 chars)
- `description` (String, Max 1000 chars, Optional)
- `projectId` (UUID, Foreign Key to Projects)
- `isActive` (Boolean)
- `createdAt`, `updatedAt` (DateTime)

### **Test Suites Table**
- `id` (UUID, Primary Key)
- `name` (String, Max 200 chars)
- `description` (String, Max 1000 chars, Optional)
- `websiteId` (UUID, Foreign Key to Websites)
- `isActive` (Boolean)
- `createdAt`, `updatedAt` (DateTime)

### **Test Cases Table**
- `id` (UUID, Primary Key)
- `name` (String, Max 200 chars)
- `description` (String, Max 1000 chars, Optional)
- `steps` (String, JSON serialized test steps)
- `testSuiteId` (UUID, Foreign Key to Test Suites)
- `isActive` (Boolean)
- `createdAt`, `updatedAt` (DateTime)

### **Test Executions Table**
- `id` (UUID, Primary Key)
- `testCaseId` (UUID, Foreign Key to Test Cases)
- `status` (String: 'Pending', 'Running', 'Passed', 'Failed', 'Skipped', 'Timeout', 'Error')
- `startTime` (DateTime)
- `endTime` (DateTime, Optional)
- `errorMessage` (String, Max 2000 chars, Optional)
- `executionLog` (String, JSON serialized execution log)
- `results` (String, JSON serialized test results)
- `userId` (UUID, Foreign Key to Users, Optional)
- `isActive` (Boolean)
- `createdAt`, `updatedAt` (DateTime)

### **Exploration Results Table**
- `id` (UUID, Primary Key)
- `websiteId` (UUID, Foreign Key to Websites)
- `url` (String, Max 500 chars)
- `sitemap` (String, JSON serialized sitemap)
- `tests` (String, JSON serialized generated tests)
- `explorationData` (String, JSON serialized exploration data)
- `rawResponse` (String, Raw AI response for debugging)
- `isActive` (Boolean)
- `createdAt`, `updatedAt` (DateTime)

## 🔐 Authentication

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

## 🎯 Demo Account

After running `yarn db:seed`, you'll have a demo account:
- **Email**: `demo@playwrightservice.com`
- **Password**: `demo123`

This account includes:
- 1 demo project
- 1 demo website (example.com)
- 1 demo test suite
- 2 demo test cases
- 1 demo test execution

## 🔄 Migration from .NET

The database schema is based on the .NET entities but adapted for Node.js:

### **Reused Concepts**
- ✅ User management and authentication
- ✅ Project/Website/TestSuite/TestCase hierarchy
- ✅ Test execution tracking with status and logs
- ✅ JSON serialization for complex data (steps, logs, results)
- ✅ Soft deletion with `isActive` flags
- ✅ Audit fields (`createdAt`, `updatedAt`)

### **Added for SaaS**
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ OAuth provider support (ready for Google/GitHub)
- ✅ Exploration results storage
- ✅ User access control and permissions

## 🚀 Next Steps

1. **Test the setup**: Use the demo account to verify everything works
2. **Add frontend authentication**: Update React app to use new auth endpoints
3. **Implement test execution**: Add the test execution engine
4. **Add more API endpoints**: CRUD operations for all entities
5. **Add real-time features**: WebSocket support for test execution monitoring

## 🐛 Troubleshooting

### **Database Connection Issues**
```bash
# Check if PostgreSQL is running
docker-compose ps

# View database logs
docker-compose logs postgres

# Reset database
yarn db:reset
```

### **Prisma Issues**
```bash
# Regenerate Prisma client
yarn db:generate

# Check database connection
cd backend-node && npx prisma db pull
```

### **Port Conflicts**
- PostgreSQL: 5432
- Redis: 6379
- Node.js Backend: 3001
- Frontend: 3000 (mapped from 5173)
- pgAdmin: 8080

Change ports in `docker-compose.yml` if needed.
