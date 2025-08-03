# Jobseek CDK Infrastructure

This directory contains the AWS CDK infrastructure code for the Jobseek application.

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Node.js 18+ installed
3. AWS CDK CLI installed: `npm install -g aws-cdk`

## Setup

### 1. Install Dependencies

```bash
cd cdk
npm install
```

### 2. Configure Secrets

Before deploying, you need to create the following secrets in AWS Secrets Manager:

#### GitHub Token (for Amplify)
```bash
aws secretsmanager create-secret \
  --name jobseek/github-token \
  --description "GitHub personal access token for Amplify" \
  --secret-string "your-github-token-here"
```

To create a GitHub token:
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with `repo` scope
3. Copy the token and use it in the command above

#### WallCrawler API Key
```bash
aws secretsmanager create-secret \
  --name jobseek/wallcrawler-api-key \
  --description "WallCrawler API key for job searches" \
  --secret-string "your-wallcrawler-api-key"
```

#### NextAuth Secret
Add this to your Amplify environment variables in the AWS Console after deployment:
- Key: `NEXTAUTH_SECRET`
- Value: Generate using `openssl rand -base64 32`

### 3. Update Configuration

Edit the config files in `cdk/config/` to match your setup:
- Update the GitHub repository URL in `amplify-stack.ts`
- Update domain names if you have custom domains

## Deployment

### Deploy to Development
```bash
npm run deploy:dev
```

### Deploy to Staging
```bash
npm run deploy:staging
```

### Deploy to Production
```bash
npm run deploy:prod
```

### View Changes Before Deploying
```bash
npm run diff
```

## Environment Variables

The following environment variables need to be configured for your Next.js app:

- `GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret  
- `TWITTER_CLIENT_ID`: Twitter/X OAuth Client ID
- `TWITTER_CLIENT_SECRET`: Twitter/X OAuth Client Secret
- `NEXTAUTH_URL`: The app URL (configured per environment)
- `NEXTAUTH_SECRET`: NextAuth encryption secret (add manually in Amplify console)

## Stack Architecture

### 1. Backend Stack
- **DynamoDB Single Table**: Uses single table design to store all user data
  - User profiles
  - Saved job listings
  - Search preferences
  - Job applications
  - Custom job boards
- **S3 Bucket**: Resume storage
- **Lambda Functions**: Scheduled job searches

### 2. Amplify Stack
- **Amplify App**: Hosts the Next.js application
- **Branch Deployments**: Automatic deployments from Git branches
- **Custom Domain**: Optional custom domain configuration

### 3. Monitoring Stack (Production only)
- **CloudWatch Dashboard**: System overview and metrics
- **Alarms**: Alerts for errors and throttling
- **Cost Tracking**: Estimated monthly costs

## Cost Estimates

- **Development**: $1-3/month
- **Staging**: $5-10/month
- **Production**: $10-30/month (for 1K users)

## Useful Commands

- `npm run build`: Compile TypeScript to JavaScript
- `npm run watch`: Watch for changes and compile
- `cdk synth`: Synthesize CloudFormation templates
- `cdk diff`: Compare deployed stack with current state
- `cdk docs`: Open CDK documentation

## Troubleshooting

### Amplify Build Failures
Check the Amplify console for build logs. Common issues:
- Missing environment variables
- Node version mismatch
- Build command errors

### DynamoDB Throttling
If you see throttling errors:
1. Check the CloudWatch dashboard
2. Consider switching to provisioned capacity for production
3. Implement exponential backoff in your application

### Lambda Timeouts
The search scheduler has a 15-minute timeout. If searches take longer:
1. Optimize the search logic
2. Consider breaking into smaller batches
3. Use Step Functions for complex workflows

## Clean Up

To remove all resources (WARNING: This will delete all data):

```bash
# For non-production environments only
cdk destroy --all --context environment=dev
```

For production, manually backup data before destroying stacks.