#!/bin/bash
# Stream-safe deployment verification script for Jobseek
# This script verifies deployment without exposing sensitive information

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get environment from argument
ENVIRONMENT=${1:-dev}

echo "🔍 Verifying Jobseek deployment for environment: $ENVIRONMENT"
echo "=================================================="

# 1. Verify Secrets in Secrets Manager
echo -e "\n${YELLOW}1. Checking AWS Secrets Manager...${NC}"

# Check GitHub token
if aws secretsmanager describe-secret --secret-id jobseek/github-token &>/dev/null; then
    echo -e "${GREEN}✅ GitHub token exists${NC}"
    LAST_CHANGED=$(aws secretsmanager describe-secret \
        --secret-id jobseek/github-token \
        --query 'LastChangedDate' \
        --output text)
    echo "   Last updated: $LAST_CHANGED"
else
    echo -e "${RED}❌ GitHub token not found${NC}"
fi

# Check Wallcrawler API key
if aws secretsmanager describe-secret --secret-id jobseek/wallcrawler-api-key &>/dev/null; then
    echo -e "${GREEN}✅ Wallcrawler API key exists${NC}"
else
    echo -e "${YELLOW}ℹ️  Wallcrawler API key not configured (optional)${NC}"
fi

# 2. Verify Backend Stack
echo -e "\n${YELLOW}2. Checking Backend Stack...${NC}"

# Check DynamoDB table
TABLE_NAME="jobseek-table-${ENVIRONMENT}"
if aws dynamodb describe-table --table-name "$TABLE_NAME" &>/dev/null; then
    echo -e "${GREEN}✅ DynamoDB table exists: $TABLE_NAME${NC}"
    
    # Get table status (safe to show)
    STATUS=$(aws dynamodb describe-table \
        --table-name "$TABLE_NAME" \
        --query 'Table.TableStatus' \
        --output text)
    echo "   Status: $STATUS"
    
    # Count GSIs (safe to show)
    GSI_COUNT=$(aws dynamodb describe-table \
        --table-name "$TABLE_NAME" \
        --query 'length(Table.GlobalSecondaryIndexes)' \
        --output text)
    echo "   Global Secondary Indexes: $GSI_COUNT"
else
    echo -e "${RED}❌ DynamoDB table not found: $TABLE_NAME${NC}"
fi

# Check Lambda functions
echo -e "\n${YELLOW}3. Checking Lambda Functions...${NC}"
LAMBDA_PREFIX="JobseekBackend-${ENVIRONMENT}"
LAMBDA_COUNT=$(aws lambda list-functions \
    --query "length(Functions[?starts_with(FunctionName, '$LAMBDA_PREFIX')])" \
    --output text)

if [ "$LAMBDA_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $LAMBDA_COUNT Lambda function(s)${NC}"
    
    # List function names only (safe to show)
    aws lambda list-functions \
        --query "Functions[?starts_with(FunctionName, '$LAMBDA_PREFIX')].FunctionName" \
        --output text | tr '\t' '\n' | while read func; do
        echo "   - $func"
    done
else
    echo -e "${RED}❌ No Lambda functions found with prefix: $LAMBDA_PREFIX${NC}"
fi

# Check S3 buckets
echo -e "\n${YELLOW}4. Checking S3 Buckets...${NC}"
BUCKET_PREFIX="jobseek-.*-${ENVIRONMENT}"
BUCKETS=$(aws s3 ls | grep -E "$BUCKET_PREFIX" || true)

if [ -n "$BUCKETS" ]; then
    echo -e "${GREEN}✅ Found S3 bucket(s):${NC}"
    echo "$BUCKETS" | awk '{print "   - " $3}'
else
    echo -e "${YELLOW}⚠️  No S3 buckets found with pattern: $BUCKET_PREFIX${NC}"
fi

# 5. Verify Amplify App
echo -e "\n${YELLOW}5. Checking Amplify App...${NC}"
APP_NAME="jobseek-${ENVIRONMENT}"
APP_ID=$(aws amplify list-apps \
    --query "apps[?name=='$APP_NAME'].appId" \
    --output text)

if [ -n "$APP_ID" ]; then
    echo -e "${GREEN}✅ Amplify app exists: $APP_NAME${NC}"
    echo "   App ID: $APP_ID"
    
    # Get app URL (safe to show)
    DEFAULT_DOMAIN=$(aws amplify get-app \
        --app-id "$APP_ID" \
        --query 'app.defaultDomain' \
        --output text)
    echo "   Default domain: https://$DEFAULT_DOMAIN"
    
    # Check branch status
    BRANCH_NAME=$(aws amplify list-branches \
        --app-id "$APP_ID" \
        --query 'branches[0].branchName' \
        --output text)
    
    if [ -n "$BRANCH_NAME" ]; then
        echo "   Active branch: $BRANCH_NAME"
        
        # Verify environment variables exist (without showing values)
        echo -e "\n   ${YELLOW}Environment Variables:${NC}"
        ENV_VARS=$(aws amplify get-branch \
            --app-id "$APP_ID" \
            --branch-name "$BRANCH_NAME" \
            --query 'branch.environmentVariables' \
            --output json 2>/dev/null || echo "{}")
        
        if [ "$ENV_VARS" != "{}" ] && [ "$ENV_VARS" != "null" ]; then
            echo "$ENV_VARS" | jq -r 'keys[]' | while read key; do
                # Don't show the actual values, just confirm they exist
                echo -e "   ${GREEN}✅ $key is configured${NC}"
            done
        else
            echo -e "   ${YELLOW}⚠️  No environment variables configured${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Amplify app not found: $APP_NAME${NC}"
fi

# 6. Check CloudFormation stacks
echo -e "\n${YELLOW}6. Checking CloudFormation Stacks...${NC}"
STACKS=("JobseekBackend-${ENVIRONMENT}" "JobseekAmplify-${ENVIRONMENT}" "JobseekMonitoring-${ENVIRONMENT}")

for STACK in "${STACKS[@]}"; do
    STATUS=$(aws cloudformation describe-stacks \
        --stack-name "$STACK" \
        --query 'Stacks[0].StackStatus' \
        --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$STATUS" != "NOT_FOUND" ]; then
        if [ "$STATUS" == "CREATE_COMPLETE" ] || [ "$STATUS" == "UPDATE_COMPLETE" ]; then
            echo -e "${GREEN}✅ $STACK: $STATUS${NC}"
        else
            echo -e "${YELLOW}⚠️  $STACK: $STATUS${NC}"
        fi
    else
        if [[ "$STACK" == *"Monitoring"* ]]; then
            echo -e "${YELLOW}ℹ️  $STACK: Not deployed (optional)${NC}"
        else
            echo -e "${RED}❌ $STACK: Not found${NC}"
        fi
    fi
done

# 7. Summary
echo -e "\n${YELLOW}=================================================="
echo -e "Verification Complete for Environment: $ENVIRONMENT"
echo -e "==================================================${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Visit your Amplify URL to test the application"
echo "2. Try logging in with Google OAuth"
echo "3. Check CloudWatch logs for any errors"
echo "4. Monitor the CloudWatch dashboard (if deployed)"

echo -e "\n${YELLOW}Useful Commands:${NC}"
echo "- View Lambda logs: aws logs tail /aws/lambda/jobseek-search-scheduler-${ENVIRONMENT} --follow"
echo "- Check Amplify build logs: Open AWS Amplify console"
echo "- Monitor costs: aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 --metrics 'UnblendedCost'"