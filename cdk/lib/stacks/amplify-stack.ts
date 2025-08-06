import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as amplify from 'aws-cdk-lib/aws-amplify';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export interface AmplifyStackProps extends cdk.StackProps {
  environment: string;
  config: any;
  backendOutputs?: {
    userTableName?: string;
    resumeBucketName?: string;
  };
  envVars?: {
    googleClientId?: string;
    googleClientSecret?: string;
    twitterClientId?: string;
    twitterClientSecret?: string;
    nextAuthSecret?: string;
  };
}

export class AmplifyStack extends cdk.Stack {
  public readonly amplifyApp: amplify.CfnApp;

  constructor(scope: Construct, id: string, props: AmplifyStackProps) {
    super(scope, id, props);

    const githubTokenSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'GitHubToken',
      props.config.githubTokenSecretName
    );

    this.amplifyApp = new amplify.CfnApp(this, 'JobseekApp', {
      name: `jobseek-${props.environment}`,
      repository: 'https://github.com/Volpestyle/jobseek',
      oauthToken: githubTokenSecret.secretValueFromJson('token').unsafeUnwrap(),
      environmentVariables: [
        { name: 'AMPLIFY_MONOREPO_APP_ROOT', value: '.' },
        { name: '_LIVE_UPDATES', value: '[{"pkg":"next","type":"npm","version":"latest"}]' },
        { name: 'GOOGLE_CLIENT_ID', value: props.envVars?.googleClientId || '{{GOOGLE_CLIENT_ID}}' },
        { name: 'GOOGLE_CLIENT_SECRET', value: props.envVars?.googleClientSecret || '{{GOOGLE_CLIENT_SECRET}}' },
        { name: 'TWITTER_CLIENT_ID', value: props.envVars?.twitterClientId || '{{TWITTER_CLIENT_ID}}' },
        { name: 'TWITTER_CLIENT_SECRET', value: props.envVars?.twitterClientSecret || '{{TWITTER_CLIENT_SECRET}}' },
        { name: 'NEXTAUTH_SECRET', value: props.envVars?.nextAuthSecret || '{{NEXTAUTH_SECRET}}' },
        { name: 'AWS_REGION', value: props.config.awsRegion || 'us-east-1' },
        { name: 'DYNAMODB_TABLE_NAME', value: props.backendOutputs?.userTableName || `jobseek-users-${props.environment}` },
        { name: 'S3_RESUME_BUCKET', value: props.backendOutputs?.resumeBucketName || '' },
        { name: 'NODE_ENV', value: props.environment === 'prod' ? 'production' : 'development' },
      ],
      customRules: [
        {
          source: '/api/<*>',
          target: '/api/<*>',
          status: '200',
        },
        {
          source: '/<*>',
          target: '/<*>',
          status: '200',
        },
      ],
      buildSpec: `version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install -g pnpm
        - pnpm install --frozen-lockfile
    build:
      commands:
        - pnpm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .pnpm-store/**/*
      - .next/cache/**/*`,
    });

    const branch = new amplify.CfnBranch(this, 'MainBranch', {
      appId: this.amplifyApp.attrAppId,
      branchName: props.config.branchName || 'main',
      stage: props.environment === 'prod' ? 'PRODUCTION' : 'DEVELOPMENT',
      environmentVariables: [
        { name: 'NEXT_PUBLIC_APP_ENV', value: props.environment },
        {
          name: 'NEXTAUTH_URL',
          value: props.config.domainName
            ? `https://${props.config.domainName}`
            : `https://${props.config.branchName}.${this.amplifyApp.attrDefaultDomain}`
        },
      ],
      enableAutoBuild: true,
      enablePerformanceMode: props.environment === 'prod',
      enablePullRequestPreview: props.environment !== 'prod',
      pullRequestEnvironmentName: 'pr',
    });

    if (props.config.domainName) {
      new amplify.CfnDomain(this, 'Domain', {
        appId: this.amplifyApp.attrAppId,
        domainName: props.config.domainName,
        subDomainSettings: [
          {
            branchName: branch.branchName,
            prefix: props.environment === 'prod' ? '' : props.environment,
          },
        ],
      });
    }

    new cdk.CfnOutput(this, 'AmplifyAppId', {
      value: this.amplifyApp.attrAppId,
      description: 'Amplify App ID',
    });

    new cdk.CfnOutput(this, 'AmplifyDefaultDomain', {
      value: `https://${props.config.branchName}.${this.amplifyApp.attrDefaultDomain}`,
      description: 'Amplify Default Domain',
    });
  }
}