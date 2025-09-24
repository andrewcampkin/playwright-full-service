# Playwright Service AWS Deployment

This directory contains all the necessary files and scripts to deploy the Playwright Service to AWS.

## Architecture Overview

The deployment uses a simple, scalable AWS architecture:

- **Frontend**: S3 + CloudFront (static hosting)
- **Backend API**: ECS Fargate (containerized)
- **Test Runner**: ECS Fargate (containerized, auto-scaling)
- **Database**: RDS PostgreSQL (managed)
- **Cache**: ElastiCache Redis (managed)
- **Load Balancer**: Application Load Balancer
- **Container Registry**: ECR
- **Secrets**: Secrets Manager
- **Monitoring**: CloudWatch

## Prerequisites

1. **AWS CLI** installed and configured (for initial setup only)
2. **GitHub repository** with proper secrets configured

## Quick Start

### 1. Set up GitHub Secrets

Add the following secrets to your GitHub repository:

- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `AWS_ACCOUNT_ID`: Your AWS account ID
- `TERRAFORM_STATE_BUCKET`: S3 bucket name for Terraform state
- `DOMAIN_NAME`: Your domain name (optional)
- `CERTIFICATE_ARN`: ACM certificate ARN (optional)

### 2. Create Terraform State Bucket

Create an S3 bucket for Terraform state:

```bash
aws s3 mb s3://your-terraform-state-bucket
```

### 3. Configure Terraform Variables

Copy the example terraform variables file:

```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
```

Edit `terraform.tfvars` with your specific values.

### 4. Deploy via GitHub Actions

Push to the `main` branch to deploy to production. The GitHub Actions workflow will automatically:

1. Build and push Docker images to ECR
2. Deploy infrastructure with Terraform
3. Deploy the application to ECS
4. Deploy the frontend to S3/CloudFront

## Manual Deployment Steps

### 1. Infrastructure (Terraform)

```bash
cd terraform

# Initialize Terraform
terraform init \
  -backend-config="bucket=your-terraform-state-bucket" \
  -backend-config="key=playwright-service/dev/terraform.tfstate" \
  -backend-config="region=us-east-1"

# Plan deployment
terraform plan -var="environment=dev"

# Apply deployment
terraform apply
```

### 2. Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build backend image
cd ../backend-node
docker build -t <account-id>.dkr.ecr.us-east-1.amazonaws.com/playwright-service-dev-backend:latest .
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/playwright-service-dev-backend:latest

# Build test-runner image
cd ../test-runner
docker build -t <account-id>.dkr.ecr.us-east-1.amazonaws.com/playwright-service-dev-test-runner:latest .
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/playwright-service-dev-test-runner:latest
```

### 3. Deploy Frontend

```bash
cd ../frontend

# Install dependencies and build
yarn install
VITE_API_URL=https://your-alb-dns-name yarn build

# Deploy to S3
aws s3 sync ./dist/ s3://your-frontend-bucket --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id <distribution-id> --paths "/*"
```

### 4. Update ECS Services

```bash
# Update backend service
aws ecs update-service \
  --cluster playwright-service-dev-cluster \
  --service playwright-service-dev-backend \
  --force-new-deployment

# Update test-runner service
aws ecs update-service \
  --cluster playwright-service-dev-cluster \
  --service playwright-service-dev-test-runner \
  --force-new-deployment
```

## Environment Configuration

### Development Environment

- **Database**: db.t3.micro
- **Redis**: cache.t3.micro
- **ECS**: 512 CPU, 1024 MB memory (backend)
- **ECS**: 1024 CPU, 2048 MB memory (test-runner)

### Production Environment

- **Database**: db.t3.small or larger
- **Redis**: cache.t3.small or larger
- **ECS**: Auto-scaling enabled
- **Monitoring**: Enhanced monitoring enabled

## Secrets Management

The following secrets are managed in AWS Secrets Manager:

- Database credentials
- Redis connection details
- OpenAI API key

Update secrets using the AWS Console or CLI:

```bash
aws secretsmanager update-secret \
  --secret-id playwright-service-dev/openai-api-key \
  --secret-string '{"api_key":"your-actual-api-key"}'
```

## Monitoring and Logging

### CloudWatch Logs

- Backend logs: `/ecs/playwright-service-dev-backend`
- Test runner logs: `/ecs/playwright-service-dev-test-runner`
- Redis logs: `/aws/elasticache/redis/playwright-service-dev`

### CloudWatch Metrics

- ECS service metrics
- RDS performance metrics
- ElastiCache metrics
- ALB metrics

## Cost Optimization

### Development Environment

- Use t3.micro instances for cost savings
- Single AZ deployment
- Minimal storage allocation

### Production Environment

- Use appropriate instance sizes
- Multi-AZ deployment for high availability
- Auto-scaling for cost efficiency
- Reserved instances for predictable workloads

## Security Considerations

1. **Network Security**
   - Private subnets for ECS tasks
   - Security groups with minimal access
   - VPC endpoints for AWS services

2. **Data Security**
   - Encryption at rest and in transit
   - Secrets Manager for sensitive data
   - IAM roles with least privilege

3. **Container Security**
   - Non-root users in containers
   - Regular security scanning
   - Minimal base images

## Troubleshooting

### Common Issues

1. **ECS Service Won't Start**
   - Check CloudWatch logs
   - Verify security group rules
   - Check task definition

2. **Database Connection Issues**
   - Verify security group rules
   - Check VPC configuration
   - Verify secrets in Secrets Manager

3. **Frontend Not Loading**
   - Check S3 bucket permissions
   - Verify CloudFront distribution
   - Check CORS configuration

### Useful Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster playwright-service-dev-cluster --services playwright-service-dev-backend

# View CloudWatch logs
aws logs tail /ecs/playwright-service-dev-backend --follow

# Check RDS status
aws rds describe-db-instances --db-instance-identifier playwright-service-dev-postgres
```

## CI/CD Integration

The deployment is integrated with GitHub Actions:

- **CI Pipeline**: Runs tests and security scans
- **CD Pipeline**: Builds, pushes, and deploys automatically
- **Infrastructure Pipeline**: Manages Terraform deployments

See `.github/workflows/` for workflow definitions.

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review CloudWatch logs
3. Check GitHub Actions workflow runs
4. Create an issue in the repository
