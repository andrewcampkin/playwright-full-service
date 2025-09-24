variable "name_prefix" {
  description = "Name prefix for resources"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "database_secret_arn" {
  description = "Database secret ARN from Secrets Manager"
  type        = string
}

variable "redis_secret_arn" {
  description = "Redis secret ARN from Secrets Manager"
  type        = string
}

variable "openai_secret_arn" {
  description = "OpenAI secret ARN from Secrets Manager"
  type        = string
}

variable "backend_repository_url" {
  description = "Backend ECR repository URL"
  type        = string
}

variable "test_runner_repository_url" {
  description = "Test runner ECR repository URL"
  type        = string
}

variable "backend_cpu" {
  description = "Backend service CPU units"
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Backend service memory in MB"
  type        = number
  default     = 1024
}

variable "test_runner_cpu" {
  description = "Test runner service CPU units"
  type        = number
  default     = 1024
}

variable "test_runner_memory" {
  description = "Test runner service memory in MB"
  type        = number
  default     = 2048
}

variable "min_capacity" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 10
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "alb_security_group_id" {
  description = "ALB security group ID"
  type        = string
}

variable "backend_target_group_arn" {
  description = "Backend target group ARN"
  type        = string
}

variable "test_runner_target_group_arn" {
  description = "Test runner target group ARN"
  type        = string
}

variable "alb_listener_arn" {
  description = "ALB listener ARN"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
