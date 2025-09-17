-- Initialize the PlaywrightService database
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create database if it doesn't exist (this is handled by POSTGRES_DB env var)
-- But we can add any additional setup here

-- Create a read-only user for reporting (optional)
-- CREATE USER playwright_readonly WITH PASSWORD 'readonly_password';
-- GRANT CONNECT ON DATABASE playwrightservice TO playwright_readonly;
-- GRANT USAGE ON SCHEMA public TO playwright_readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO playwright_readonly;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO playwright_readonly;

-- Log successful initialization
SELECT 'Database initialization completed successfully' AS status;
