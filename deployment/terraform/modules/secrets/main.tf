terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Secrets Manager Secret for Database
resource "aws_secretsmanager_secret" "database" {
  name        = "${var.name_prefix}/database"
  description = "Database credentials for Playwright Service"

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    username    = "playwright_user"
    password    = var.database_password
    endpoint    = var.database_endpoint
    port        = 5432
    database    = "playwrightservice"
    DATABASE_URL = "postgresql://playwright_user:${var.database_password}@${var.database_endpoint}:5432/playwrightservice"
  })
}

# Secrets Manager Secret for Redis
resource "aws_secretsmanager_secret" "redis" {
  name        = "${var.name_prefix}/redis"
  description = "Redis connection details for Playwright Service"

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "redis" {
  secret_id = aws_secretsmanager_secret.redis.id
  secret_string = jsonencode({
    endpoint = var.redis_endpoint
    port     = 6379
  })
}

# Secrets Manager Secret for OpenAI API Key (placeholder)
resource "aws_secretsmanager_secret" "openai" {
  name        = "${var.name_prefix}/openai-api-key"
  description = "OpenAI API Key for Playwright Service"

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "openai" {
  secret_id = aws_secretsmanager_secret.openai.id
  secret_string = jsonencode({
    api_key = "your-openai-api-key-here"
  })
}
