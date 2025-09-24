output "backend_repository_url" {
  description = "Backend ECR repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "test_runner_repository_url" {
  description = "Test runner ECR repository URL"
  value       = aws_ecr_repository.test_runner.repository_url
}

output "backend_repository_arn" {
  description = "Backend ECR repository ARN"
  value       = aws_ecr_repository.backend.arn
}

output "test_runner_repository_arn" {
  description = "Test runner ECR repository ARN"
  value       = aws_ecr_repository.test_runner.arn
}
