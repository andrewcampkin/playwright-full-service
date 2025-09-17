# Local Development Setup Guide

This guide will help you set up the Playwright as a Service project for local development.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Docker Desktop** (latest version)
- **Docker Compose** (included with Docker Desktop)
- **Git** (latest version)
- **Visual Studio Code** or your preferred IDE

## Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd playwright-full-service
```

### 2. Environment Configuration
Copy the environment example file and update the values:
```bash
cp env.example .env
```

Edit the `.env` file with your specific configuration:
```bash
# Update these values as needed
POSTGRES_PASSWORD=your-secure-password
JWT_SECRET_KEY=your-super-secret-key-that-is-at-least-32-characters-long
OPENAI_API_KEY=your-openai-api-key
```

### 3. Start the Development Environment
```bash
# Start all services
docker-compose up -d

# View logs (optional)
docker-compose logs -f
```

### 4. Access the Applications
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation (OpenAPI)**: http://localhost:5000/openapi/v1.json
- **Weather Forecast API**: http://localhost:5000/weatherforecast
- **pgAdmin** (optional): http://localhost:8080
  - Email: admin@playwrightservice.com
  - Password: admin123

## Development Workflow

### Backend Development
The backend runs in development mode with hot reload enabled. Changes to your C# code will automatically restart the application.

```bash
# View backend logs
docker-compose logs -f backend

# Access backend container
docker-compose exec backend bash

# Run database migrations (when available)
docker-compose exec backend dotnet ef database update
```

### Frontend Development
The frontend runs with Vite's hot module replacement. Changes to your React code will automatically reload in the browser.

```bash
# View frontend logs
docker-compose logs -f frontend

# Access frontend container
docker-compose exec frontend sh

# Install new dependencies
docker-compose exec frontend yarn add <package-name>
```

### Database Management
The PostgreSQL database is automatically created and configured. You can manage it using:

1. **pgAdmin** (web interface): http://localhost:8080
2. **Direct connection**: `localhost:5432`
   - Database: `playwrightservice`
   - Username: `playwright_user`
   - Password: `playwright_password`

```bash
# Access database directly
docker-compose exec postgres psql -U playwright_user -d playwrightservice

# View database logs
docker-compose logs -f postgres
```

## Service Architecture

### Services Overview
- **postgres**: PostgreSQL 16 database
- **redis**: Redis 7 cache and session store
- **backend**: .NET 9.0 Web API with Playwright
- **frontend**: React 19 + TypeScript + Vite
- **pgadmin**: Database management interface (optional)

### Network Configuration
All services run on a custom Docker network (`playwright-network`) for secure communication.

### Volume Mounts
- **postgres_data**: Persistent database storage
- **redis_data**: Persistent cache storage
- **pgadmin_data**: Persistent pgAdmin configuration
- **./backend**: Backend source code (hot reload)
- **./frontend**: Frontend source code (hot reload)

## Development Commands

### Docker Compose Commands
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgres

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# View service status
docker-compose ps

# View logs for all services
docker-compose logs

# View logs for specific service
docker-compose logs backend

# Restart specific service
docker-compose restart backend

# Rebuild and start services
docker-compose up --build -d
```

### Backend Commands
```bash
# Access backend container
docker-compose exec backend bash

# Install new NuGet package
docker-compose exec backend dotnet add package <package-name>

# Create new migration
docker-compose exec backend dotnet ef migrations add <migration-name>

# Update database
docker-compose exec backend dotnet ef database update

# Run tests
docker-compose exec backend dotnet test

# Build the application
docker-compose exec backend dotnet build
```

### Frontend Commands
```bash
# Access frontend container
docker-compose exec frontend sh

# Install new package
docker-compose exec frontend yarn add <package-name>

# Install dev dependency
docker-compose exec frontend yarn add -D <package-name>

# Run linting
docker-compose exec frontend yarn lint

# Build for production
docker-compose exec frontend yarn build

# Run type checking
docker-compose exec frontend yarn tsc --noEmit
```

## Troubleshooting

### Common Issues

#### 1. Port Conflicts
If you get port conflicts, check what's running on the ports:
```bash
# Check port usage
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000
netstat -tulpn | grep :5432
```

#### 2. Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres pg_isready -U playwright_user
```

#### 3. Backend Build Issues
```bash
# Clean and rebuild
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

#### 4. Frontend Build Issues
```bash
# Clear node_modules and reinstall
docker-compose exec frontend rm -rf node_modules
docker-compose exec frontend yarn install
```

#### 5. Permission Issues
```bash
# Fix file permissions (Linux/Mac)
sudo chown -R $USER:$USER .
```

### Reset Everything
If you need to start completely fresh:
```bash
# Stop all services and remove volumes
docker-compose down -v

# Remove all containers and images
docker system prune -a

# Rebuild everything
docker-compose up --build -d
```

## Development Tips

### 1. Hot Reload
- Backend: Changes to C# files automatically restart the application
- Frontend: Changes to React/TypeScript files automatically reload the browser

### 2. Debugging
- Backend: Use Visual Studio Code with the C# extension for debugging
- Frontend: Use browser dev tools and React DevTools extension

### 3. Database Development
- Use pgAdmin for visual database management
- Create migrations for schema changes
- Use seed data for development

### 4. API Testing
- Use the OpenAPI specification at http://localhost:5000/openapi/v1.json
- Test the Weather Forecast endpoint at http://localhost:5000/weatherforecast
- Use Postman or similar tools for API testing
- Check the `backend/PlaywrightService/PlaywrightService.http` file for example requests

### 5. Performance Monitoring
- Monitor container resource usage: `docker stats`
- Check application logs for performance issues
- Use browser dev tools for frontend performance

## Next Steps

Once your local development environment is running:

1. **Explore the API**: Visit http://localhost:5000/swagger
2. **Check the Frontend**: Visit http://localhost:3000
3. **Database Management**: Visit http://localhost:8080 (pgAdmin)
4. **Start Development**: Follow the implementation roadmap in `IMPLEMENTATION_ROADMAP.md`

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the Docker Compose logs
3. Ensure all prerequisites are installed
4. Check the project documentation

Happy coding! 🚀
