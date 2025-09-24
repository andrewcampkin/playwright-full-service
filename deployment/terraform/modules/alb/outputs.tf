output "alb_arn" {
  description = "Application Load Balancer ARN"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Application Load Balancer zone ID"
  value       = aws_lb.main.zone_id
}

output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "backend_target_group_arn" {
  description = "Backend target group ARN"
  value       = aws_lb_target_group.backend.arn
}

output "test_runner_target_group_arn" {
  description = "Test runner target group ARN"
  value       = aws_lb_target_group.test_runner.arn
}

output "https_listener_arn" {
  description = "HTTPS listener ARN"
  value       = var.certificate_arn != "" ? aws_lb_listener.https[0].arn : ""
}
