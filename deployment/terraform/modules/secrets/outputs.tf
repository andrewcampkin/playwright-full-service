output "database_secret_arn" {
  description = "Secrets Manager ARN for database credentials"
  value       = aws_secretsmanager_secret.database.arn
}

output "redis_secret_arn" {
  description = "Secrets Manager ARN for Redis credentials"
  value       = aws_secretsmanager_secret.redis.arn
}

output "openai_secret_arn" {
  description = "Secrets Manager ARN for OpenAI API key"
  value       = aws_secretsmanager_secret.openai.arn
}
