#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AmplifyStack } from '../lib/stacks/amplify-stack';
import { BackendStack } from '../lib/stacks/backend-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';
import * as fs from 'fs';
import * as path from 'path';

const app = new cdk.App();

const environment = app.node.tryGetContext('environment') || 'dev';
const configPath = path.join(__dirname, '..', 'config', `${environment}.json`);

if (!fs.existsSync(configPath)) {
  throw new Error(`Configuration file not found: ${configPath}`);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

const tags = {
  Environment: environment,
  Project: 'jobseek',
  ManagedBy: 'cdk',
};

const backendStack = new BackendStack(app, `JobseekBackend-${environment}`, {
  env,
  environment,
  config,
  tags,
});

// Get environment variables from context (if provided by deploy-secrets.ts)
const envVars = {
  googleClientId: app.node.tryGetContext('googleClientId'),
  googleClientSecret: app.node.tryGetContext('googleClientSecret'),
  twitterClientId: app.node.tryGetContext('twitterClientId'),
  twitterClientSecret: app.node.tryGetContext('twitterClientSecret'),
  nextAuthSecret: app.node.tryGetContext('nextAuthSecret'),
};

const amplifyStack = new AmplifyStack(app, `JobseekAmplify-${environment}`, {
  env,
  environment,
  config,
  tags,
  envVars: Object.values(envVars).some(v => v) ? envVars : undefined,
});

amplifyStack.addDependency(backendStack);

if (environment === 'prod' || config.enableDetailedMonitoring) {
  const monitoringStack = new MonitoringStack(app, `JobseekMonitoring-${environment}`, {
    env,
    environment,
    config,
    amplifyApp: amplifyStack.amplifyApp,
    usersTable: backendStack.usersTable,
    lambdaFunctions: backendStack.lambdaFunctions,
    tags,
  });

  monitoringStack.addDependency(backendStack);
  monitoringStack.addDependency(amplifyStack);
}