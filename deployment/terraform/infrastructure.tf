# VPC Module
module "vpc" {
  source = "./modules/vpc"

  name_prefix        = local.name_prefix
  availability_zones = data.aws_availability_zones.available.names
  tags               = local.common_tags
}

# Database Module
module "database" {
  source = "./modules/database"

  name_prefix              = local.name_prefix
  vpc_id                   = module.vpc.vpc_id
  private_subnet_ids       = module.vpc.private_subnet_ids
  allowed_security_groups  = [module.ecs.ecs_security_group_id]
  instance_class           = var.db_instance_class
  allocated_storage        = var.db_allocated_storage
  max_allocated_storage    = var.db_max_allocated_storage
  environment              = var.environment
  tags                     = local.common_tags

  depends_on = [module.vpc]
}

# Cache Module
module "cache" {
  source = "./modules/cache"

  name_prefix             = local.name_prefix
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  allowed_security_groups = [module.ecs.ecs_security_group_id]
  node_type               = var.redis_node_type
  num_cache_nodes         = var.redis_num_cache_nodes
  tags                    = local.common_tags

  depends_on = [module.vpc]
}

# ECR Module
module "ecr" {
  source = "./modules/ecr"

  name_prefix = local.name_prefix
  tags        = local.common_tags
}

# Application Load Balancer Module
module "alb" {
  source = "./modules/alb"

  name_prefix       = local.name_prefix
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  backend_sg_id     = module.ecs.ecs_security_group_id
  domain_name       = var.domain_name
  certificate_arn   = var.certificate_arn
  environment       = var.environment
  tags              = local.common_tags

  depends_on = [module.vpc, module.ecs]
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"

  name_prefix                = local.name_prefix
  vpc_id                     = module.vpc.vpc_id
  private_subnet_ids         = module.vpc.private_subnet_ids
  public_subnet_ids          = module.vpc.public_subnet_ids
  database_secret_arn        = module.secrets.database_secret_arn
  redis_secret_arn           = module.secrets.redis_secret_arn
  openai_secret_arn          = module.secrets.openai_secret_arn
  backend_repository_url     = module.ecr.backend_repository_url
  test_runner_repository_url = module.ecr.test_runner_repository_url
  backend_cpu                = var.backend_cpu
  backend_memory             = var.backend_memory
  test_runner_cpu            = var.test_runner_cpu
  test_runner_memory         = var.test_runner_memory
  min_capacity               = var.min_capacity
  max_capacity               = var.max_capacity
  environment                = var.environment
  alb_security_group_id      = module.alb.alb_security_group_id
  backend_target_group_arn   = module.alb.backend_target_group_arn
  test_runner_target_group_arn = module.alb.test_runner_target_group_arn
  alb_listener_arn           = module.alb.https_listener_arn
  tags                       = local.common_tags

  depends_on = [module.database, module.cache, module.ecr, module.alb]
}


# Frontend Module (S3 + CloudFront)
module "frontend" {
  source = "./modules/frontend"

  name_prefix     = local.name_prefix
  domain_name     = var.domain_name
  certificate_arn = var.certificate_arn
  environment     = var.environment
  tags            = local.common_tags
}

# Secrets Manager Module
module "secrets" {
  source = "./modules/secrets"

  name_prefix        = local.name_prefix
  database_endpoint  = module.database.rds_endpoint
  database_password  = module.database.database_password
  redis_endpoint     = module.cache.redis_endpoint
  environment        = var.environment
  tags               = local.common_tags

  depends_on = [module.database, module.cache]
}
