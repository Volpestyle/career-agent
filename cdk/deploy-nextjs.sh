#!/bin/bash
# Jobseek Next.js App Deployment Script
# Usage: ./deploy-nextjs.sh [environment] [options]

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-dev}
AUTO_APPROVE=""

# Show usage
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Usage: ./deploy-nextjs.sh [environment] [options]"
    echo ""
    echo "Environments:"
    echo "  dev         Development environment (default)"
    echo "  staging     Staging environment"
    echo "  prod        Production environment"
    echo ""
    echo "Options:"
    echo "  --auto-approve    Skip CDK approval prompts (dev only)"
    echo "  --help, -h        Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy-nextjs.sh                    # Deploy dev Next.js app"
    echo "  ./deploy-nextjs.sh staging            # Deploy staging Next.js app"
    echo "  ./deploy-nextjs.sh prod               # Deploy production Next.js app"
    exit 0
fi

# Parse additional options
for arg in "$@"; do
    case $arg in
        --auto-approve)
            if [[ "$ENVIRONMENT" == "dev" ]]; then
                AUTO_APPROVE="--require-approval never"
            else
                echo -e "${YELLOW}⚠️  --auto-approve is only allowed for dev environment${NC}"
            fi
            ;;
    esac
done

echo -e "${BLUE}🚀 Jobseek Next.js App Deployment Script${NC}"
echo -e "${BLUE}=====================================${NC}"
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
    echo -e "${YELLOW}Please create the environment file first${NC}"
    exit 1
fi

# Install dependencies if needed
if [[ ! -d "node_modules" ]]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    pnpm install
fi

# Check if backend stack exists
echo -e "${YELLOW}🔍 Checking if backend infrastructure exists...${NC}"
BACKEND_STACK="JobseekBackend-$ENVIRONMENT"
if ! aws cloudformation describe-stacks --stack-name "$BACKEND_STACK" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Backend infrastructure not found. Deploy it first with: ./deploy-backend.sh $ENVIRONMENT${NC}"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Deploy Amplify stack only
echo -e "${YELLOW}🏗️  Deploying Next.js app via Amplify...${NC}"

CONTEXT_FILE="cdk.context.$ENVIRONMENT.json"
if [[ ! -f "$CONTEXT_FILE" ]]; then
    echo -e "${YELLOW}⚠️  Context file not found. Running secrets deployment to generate it...${NC}"
    npx ts-node deploy-secrets.ts "$ENVIRONMENT"
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

# Deploy Amplify stack
echo -e "${YELLOW}Deploying Amplify stack...${NC}"
cdk deploy "JobseekAmplify-$ENVIRONMENT" --context-file "$CONTEXT_FILE" $AUTO_APPROVE

if [[ $? -ne 0 ]]; then
    echo -e "${RED}❌ Amplify deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Next.js app deployed successfully${NC}"
echo ""

# Get app info
APP_ID=$(aws amplify list-apps --query "apps[?name=='jobseek-$ENVIRONMENT'].appId" --output text)
if [[ -n "$APP_ID" ]]; then
    APP_URL=$(aws amplify get-branch --app-id "$APP_ID" --branch-name main --query "branch.defaultDomain" --output text)
    echo -e "${GREEN}🎉 Deployment complete!${NC}"
    echo ""
    echo -e "${YELLOW}📝 App Information:${NC}"
    echo "- App ID: $APP_ID"
    echo "- URL: https://main.$APP_URL"
    echo ""
    echo -e "${YELLOW}📝 Next Steps:${NC}"
    echo "1. If this is the first deployment, manually trigger a build in Amplify console"
    echo "2. Configure OAuth redirect URLs in Google/Twitter consoles with the app URL"
    echo "3. Test the authentication flow"
else
    echo -e "${GREEN}🎉 Deployment complete!${NC}"
    echo ""
    echo -e "${YELLOW}📝 Next Steps:${NC}"
    echo "1. Check the Amplify console for your app URL"
    echo "2. Manually trigger a build in Amplify"
    echo "3. Configure OAuth redirect URLs"
fi