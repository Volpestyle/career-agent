#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { SecretsManagerClient, CreateSecretCommand, UpdateSecretCommand, DescribeSecretCommand } from '@aws-sdk/client-secrets-manager';

interface DeployConfig {
  // Secrets Manager secrets
  GITHUB_TOKEN: string;
  WALLCRAWLER_API_KEY?: string;
  
  // Amplify environment variables
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  TWITTER_CLIENT_ID?: string;
  TWITTER_CLIENT_SECRET?: string;
  NEXTAUTH_SECRET: string;
  
  // AWS Configuration
  AWS_REGION?: string;
  AWS_PROFILE?: string;
  
  // DynamoDB and S3 (from backend stack outputs)
  DYNAMODB_USERS_TABLE?: string;
  S3_RESUME_BUCKET?: string;
}

async function createOrUpdateSecret(client: SecretsManagerClient, secretName: string, secretValue: string) {
  try {
    // Check if secret exists
    await client.send(new DescribeSecretCommand({ SecretId: secretName }));
    
    // Update existing secret
    await client.send(new UpdateSecretCommand({
      SecretId: secretName,
      SecretString: secretValue
    }));
    console.log(`✅ Updated secret: ${secretName}`);
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      // Create new secret
      await client.send(new CreateSecretCommand({
        Name: secretName,
        SecretString: secretValue
      }));
      console.log(`✅ Created secret: ${secretName}`);
    } else {
      throw error;
    }
  }
}

async function main() {
  const environment = process.argv[2] || 'dev';
  const envFile = process.argv[3] || `.env.deploy.${environment}`;
  
  console.log(`🚀 Deploying secrets for environment: ${environment}`);
  console.log(`📄 Reading from: ${envFile}`);
  
  // Load environment file
  const envPath = path.resolve(process.cwd(), envFile);
  if (!fs.existsSync(envPath)) {
    console.error(`❌ Environment file not found: ${envPath}`);
    console.log('\nCreate a file based on .env.deploy.example:');
    console.log(`cp .env.deploy.example ${envFile}`);
    process.exit(1);
  }
  
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  const config = envConfig as unknown as DeployConfig;
  
  // Validate required fields
  const required = ['GITHUB_TOKEN', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'NEXTAUTH_SECRET'];
  const missing = required.filter(key => !config[key as keyof DeployConfig]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  // Configure AWS client
  const region = config.AWS_REGION || process.env.AWS_REGION || 'us-east-1';
  const clientConfig: any = { region };
  
  if (config.AWS_PROFILE) {
    process.env.AWS_PROFILE = config.AWS_PROFILE;
    console.log(`🔑 Using AWS profile: ${config.AWS_PROFILE}`);
  }
  
  const client = new SecretsManagerClient(clientConfig);
  
  try {
    // Deploy to Secrets Manager
    console.log('\n📦 Deploying to AWS Secrets Manager...');
    
    // GitHub token
    await createOrUpdateSecret(
      client,
      `jobseek/github-token`,
      JSON.stringify({ token: config.GITHUB_TOKEN })
    );
    
    // Wallcrawler API key (if provided)
    if (config.WALLCRAWLER_API_KEY) {
      await createOrUpdateSecret(
        client,
        `jobseek/wallcrawler-api-key`,
        JSON.stringify({ apiKey: config.WALLCRAWLER_API_KEY })
      );
    }
    
    // Generate CDK context for Amplify environment variables
    const amplifyEnvVars = {
      googleClientId: config.GOOGLE_CLIENT_ID,
      googleClientSecret: config.GOOGLE_CLIENT_SECRET,
      twitterClientId: config.TWITTER_CLIENT_ID || '',
      twitterClientSecret: config.TWITTER_CLIENT_SECRET || '',
      nextAuthSecret: config.NEXTAUTH_SECRET,
    };
    
    console.log('\n📝 CDK deployment command:');
    console.log(`cdk deploy --all \\
  --context environment=${environment} \\
  --context googleClientId="${amplifyEnvVars.googleClientId}" \\
  --context googleClientSecret="${amplifyEnvVars.googleClientSecret}" \\
  --context twitterClientId="${amplifyEnvVars.twitterClientId}" \\
  --context twitterClientSecret="${amplifyEnvVars.twitterClientSecret}" \\
  --context nextAuthSecret="${amplifyEnvVars.nextAuthSecret}"`);
    
    // Save context to file for easier deployment
    const contextFile = `cdk.context.${environment}.json`;
    fs.writeFileSync(
      contextFile,
      JSON.stringify({
        environment,
        ...amplifyEnvVars
      }, null, 2)
    );
    
    console.log(`\n✅ Context saved to: ${contextFile}`);
    console.log('\nAlternative deployment command:');
    console.log(`cdk deploy --all --context-file ${contextFile}`);
    
    console.log('\n✅ Secrets deployment complete!');
    
  } catch (error) {
    console.error('❌ Error deploying secrets:', error);
    process.exit(1);
  }
}

main().catch(console.error);