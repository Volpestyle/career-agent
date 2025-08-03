#!/bin/bash
# Jobseek Backend Infrastructure Deployment Script
# Usage: ./deploy-backend.sh [environment] [options]

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-dev}
SKIP_SECRETS=${2:-false}
AUTO_APPROVE=""

# Show usage
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Usage: ./deploy-backend.sh [environment] [options]"
    echo ""
    echo "Environments:"
    echo "  dev         Development environment (default)"
    echo "  staging     Staging environment"
    echo "  prod        Production environment"
    echo ""
    echo "Options:"
    echo "  --skip-secrets    Skip secrets deployment (use existing)"
    echo "  --auto-approve    Skip CDK approval prompts (dev only)"
    echo "  --help, -h        Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy-backend.sh                    # Deploy dev backend"
    echo "  ./deploy-backend.sh staging            # Deploy staging backend"
    echo "  ./deploy-backend.sh prod               # Deploy production backend"
    echo "  ./deploy-backend.sh dev --skip-secrets # Deploy dev, skip secrets update"
    exit 0
fi

# Parse additional options
for arg in "$@"; do
    case $arg in
        --skip-secrets)
            SKIP_SECRETS=true
            ;;
        --auto-approve)
            if [[ "$ENVIRONMENT" == "dev" ]]; then
                AUTO_APPROVE="--require-approval never"
            else
                echo -e "${YELLOW}⚠️  --auto-approve is only allowed for dev environment${NC}"
            fi
            ;;
    esac
done

echo -e "${BLUE}🚀 Jobseek Backend Infrastructure Deployment Script${NC}"
echo -e "${BLUE}===============================================${NC}"
echo -e "Environment: ${GREEN}$ENVIRONMENT${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    exit 1
fi

# Check CDK
if ! command -v cdk &> /dev/null; then
    echo -e "${RED}❌ AWS CDK is not installed${NC}"
    echo "Install with: npm install -g aws-cdk"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Check for environment file
ENV_FILE=".env.deploy.$ENVIRONMENT"
if [[ ! -f "$ENV_FILE" ]]; then
    echo -e "${RED}❌ Environment file not found: $ENV_FILE${NC}"
    echo -e "${YELLOW}Creating from template...${NC}"
    cp .env.deploy.example "$ENV_FILE"
    echo -e "${YELLOW}⚠️  Please edit $ENV_FILE with your values and run again${NC}"
    exit 1
fi

# Install dependencies if needed
if [[ ! -d "node_modules" ]]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    pnpm install
fi

# Step 1: Deploy secrets (unless skipped)
if [[ "$SKIP_SECRETS" != "true" ]]; then
    echo -e "${YELLOW}🔐 Deploying secrets to AWS Secrets Manager...${NC}"
    npx ts-node deploy-secrets.ts "$ENVIRONMENT"
    
    if [[ $? -ne 0 ]]; then
        echo -e "${RED}❌ Failed to deploy secrets${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Secrets deployed successfully${NC}"
    echo ""
else
    echo -e "${YELLOW}⏩ Skipping secrets deployment${NC}"
    echo ""
fi

# Step 2: Bootstrap CDK if needed
echo -e "${YELLOW}🔧 Checking CDK bootstrap...${NC}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=${AWS_REGION:-us-east-1}

if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region "$REGION" &> /dev/null; then
    echo -e "${YELLOW}Bootstrapping CDK for account $ACCOUNT_ID in region $REGION...${NC}"
    cdk bootstrap "aws://$ACCOUNT_ID/$REGION"
else
    echo -e "${GREEN}✅ CDK already bootstrapped${NC}"
fi
echo ""

# Step 3: Deploy Backend stack
echo -e "${YELLOW}🏗️  Deploying backend infrastructure...${NC}"

CONTEXT_FILE="cdk.context.$ENVIRONMENT.json"
if [[ ! -f "$CONTEXT_FILE" ]]; then
    echo -e "${RED}❌ Context file not found: $CONTEXT_FILE${NC}"
    echo "Run the secrets deployment first"
    exit 1
fi

# Confirm for production
if [[ "$ENVIRONMENT" == "prod" ]]; then
    echo -e "${YELLOW}⚠️  WARNING: You are about to deploy to PRODUCTION${NC}"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        echo -e "${RED}❌ Deployment cancelled${NC}"
        exit 1
    fi
fi

# Deploy Backend stack
echo -e "${YELLOW}Deploying Backend stack...${NC}"
cdk deploy "JobseekBackend-$ENVIRONMENT" --context-file "$CONTEXT_FILE" $AUTO_APPROVE

if [[ $? -ne 0 ]]; then
    echo -e "${RED}❌ Backend deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend infrastructure deployed successfully${NC}"
echo ""

# Show outputs
echo -e "${YELLOW}📋 Infrastructure Details:${NC}"
aws cloudformation describe-stacks \
    --stack-name "JobseekBackend-$ENVIRONMENT" \
    --query 'Stacks[0].Outputs[?OutputKey==`UsersTableName`].OutputValue' \
    --output text | xargs -I {} echo "- DynamoDB Table: {}"

aws cloudformation describe-stacks \
    --stack-name "JobseekBackend-$ENVIRONMENT" \
    --query 'Stacks[0].Outputs[?OutputKey==`ResumeBucketName`].OutputValue' \
    --output text | xargs -I {} echo "- S3 Bucket: {}"

echo ""
echo -e "${GREEN}🎉 Backend deployment complete!${NC}"
echo ""

# Show next steps
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Deploy the Next.js app: ./deploy-nextjs.sh $ENVIRONMENT"
echo "2. Update your .env.local with the infrastructure details"
echo "3. Test the backend services"
echo ""

# Show useful commands
echo -e "${YELLOW}🛠️  Useful Commands:${NC}"
echo "- View logs: aws logs tail /aws/lambda/jobseek-search-scheduler-$ENVIRONMENT --follow"
echo "- Test Lambda: aws lambda invoke --function-name jobseek-search-scheduler-$ENVIRONMENT output.json"
echo "- Destroy stack: cdk destroy JobseekBackend-$ENVIRONMENT --context-file $CONTEXT_FILE"