terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = var.tags
}

# ECS Cluster Capacity Providers
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

# Security Group for ECS Tasks
resource "aws_security_group" "ecs" {
  name_prefix = "${var.name_prefix}-ecs-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 3001
    to_port         = 3003
    protocol        = "tcp"
    security_groups = [var.alb_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ecs-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for ECS Tasks
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.name_prefix}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Role for ECS Tasks (application role)
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.name_prefix}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.name_prefix}-backend"
  retention_in_days = 7

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "test_runner" {
  name              = "/ecs/${var.name_prefix}-test-runner"
  retention_in_days = 7

  tags = var.tags
}

# ECS Task Definition for Backend
resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.name_prefix}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "backend"
      image = "${var.backend_repository_url}:latest"
      
      portMappings = [
        {
          containerPort = 3001
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "PORT"
          value = "3001"
        }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${var.database_secret_arn}:DATABASE_URL::"
        },
        {
          name      = "REDIS_HOST"
          valueFrom = "${var.redis_secret_arn}:endpoint::"
        },
        {
          name      = "REDIS_PORT"
          valueFrom = "${var.redis_secret_arn}:port::"
        },
        {
          name      = "OPENAI_API_KEY"
          valueFrom = "${var.openai_secret_arn}:api_key::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.backend.name
          awslogs-region        = data.aws_region.current.name
          awslogs-stream-prefix = "ecs"
        }
      }

      essential = true
    }
  ])

  tags = var.tags
}

# ECS Task Definition for Test Runner
resource "aws_ecs_task_definition" "test_runner" {
  family                   = "${var.name_prefix}-test-runner"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.test_runner_cpu
  memory                   = var.test_runner_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "test-runner"
      image = "${var.test_runner_repository_url}:latest"
      
      portMappings = [
        {
          containerPort = 3002
          protocol      = "tcp"
        },
        {
          containerPort = 3003
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "PORT"
          value = "3002"
        },
        {
          name  = "WEBSOCKET_PORT"
          value = "3003"
        }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${var.database_secret_arn}:DATABASE_URL::"
        },
        {
          name      = "REDIS_HOST"
          valueFrom = "${var.redis_secret_arn}:endpoint::"
        },
        {
          name      = "REDIS_PORT"
          valueFrom = "${var.redis_secret_arn}:port::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.test_runner.name
          awslogs-region        = data.aws_region.current.name
          awslogs-stream-prefix = "ecs"
        }
      }

      essential = true
    }
  ])

  tags = var.tags
}

# ECS Service for Backend
resource "aws_ecs_service" "backend" {
  name            = "${var.name_prefix}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs.id]
    subnets          = var.private_subnet_ids
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.backend_target_group_arn
    container_name   = "backend"
    container_port   = 3001
  }

  depends_on = [var.alb_listener_arn]

  tags = var.tags
}

# ECS Service for Test Runner
resource "aws_ecs_service" "test_runner" {
  name            = "${var.name_prefix}-test-runner"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.test_runner.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs.id]
    subnets          = var.private_subnet_ids
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.test_runner_target_group_arn
    container_name   = "test-runner"
    container_port   = 3002
  }

  depends_on = [var.alb_listener_arn]

  tags = var.tags
}

# Auto Scaling Target for Backend
resource "aws_appautoscaling_target" "backend" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  tags = var.tags
}

# Auto Scaling Policy for Backend
resource "aws_appautoscaling_policy" "backend" {
  name               = "${var.name_prefix}-backend-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

# Auto Scaling Target for Test Runner
resource "aws_appautoscaling_target" "test_runner" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.test_runner.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  tags = var.tags
}

# Auto Scaling Policy for Test Runner
resource "aws_appautoscaling_policy" "test_runner" {
  name               = "${var.name_prefix}-test-runner-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.test_runner.resource_id
  scalable_dimension = aws_appautoscaling_target.test_runner.scalable_dimension
  service_namespace  = aws_appautoscaling_target.test_runner.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

# Data sources
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}
