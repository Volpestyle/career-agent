import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export interface BackendStackProps extends cdk.StackProps {
  environment: string;
  config: any;
}

export class BackendStack extends cdk.Stack {
  public readonly userPoolId: string;
  public readonly userPoolClientId: string;
  public readonly tables: Record<string, dynamodb.Table>;
  public readonly resumeBucket: s3.Bucket;
  public readonly lambdaFunctions: Record<string, lambda.Function>;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `jobseek-users-${props.environment}`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        provider: new cognito.StringAttribute({
          mutable: false,
          minLen: 1,
          maxLen: 50,
        }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: props.environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = userPool.addClient('WebClient', {
      userPoolClientName: `jobseek-web-client-${props.environment}`,
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: props.config.domainName
          ? [
              `https://${props.config.domainName}/api/auth/callback/cognito`,
              `http://localhost:3000/api/auth/callback/cognito`,
            ]
          : [`http://localhost:3000/api/auth/callback/cognito`],
        logoutUrls: props.config.domainName
          ? [
              `https://${props.config.domainName}`,
              `http://localhost:3000`,
            ]
          : [`http://localhost:3000`],
      },
      generateSecret: true,
      preventUserExistenceErrors: true,
    });

    this.userPoolId = userPool.userPoolId;
    this.userPoolClientId = userPoolClient.userPoolClientId;

    this.tables = {
      savedJobs: this.createTable('SavedJobs', 'userId', 'jobId', props),
      savedSearches: this.createTable('SavedSearches', 'userId', 'searchId', props),
      applications: this.createTable('Applications', 'userId', 'applicationId', props),
      jobBoards: this.createTable('JobBoards', 'userId', 'boardId', props),
      userPreferences: this.createTable('UserPreferences', 'userId', undefined, props),
    };

    this.tables.savedJobs.addGlobalSecondaryIndex({
      indexName: 'SourceIndex',
      partitionKey: { name: 'source', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'savedAt', type: dynamodb.AttributeType.STRING },
    });

    this.tables.savedSearches.addGlobalSecondaryIndex({
      indexName: 'ActiveSearchesIndex',
      partitionKey: { name: 'isActive', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'nextRunAt', type: dynamodb.AttributeType.STRING },
    });

    this.resumeBucket = new s3.Bucket(this, 'ResumeBucket', {
      bucketName: `jobseek-resumes-${props.environment}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: props.config.domainName
            ? [`https://${props.config.domainName}`, 'http://localhost:3000']
            : ['http://localhost:3000'],
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
          enabled: true,
        },
        {
          id: 'TransitionOldResumes',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          enabled: props.environment === 'prod',
        },
      ],
      removalPolicy: props.environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.environment !== 'prod',
    });

    const wallcrawlerSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'WallcrawlerApiKey',
      props.config.wallcrawlerApiKeySecretName
    );

    const searchSchedulerRole = new iam.Role(this, 'SearchSchedulerRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    this.tables.savedSearches.grantReadWriteData(searchSchedulerRole);
    this.tables.savedJobs.grantWriteData(searchSchedulerRole);
    wallcrawlerSecret.grantRead(searchSchedulerRole);

    const searchScheduler = new lambda.Function(this, 'SearchScheduler', {
      functionName: `jobseek-search-scheduler-${props.environment}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/search-scheduler'),
      role: searchSchedulerRole,
      environment: {
        SAVED_SEARCHES_TABLE: this.tables.savedSearches.tableName,
        SAVED_JOBS_TABLE: this.tables.savedJobs.tableName,
        WALLCRAWLER_API_KEY_SECRET_ARN: wallcrawlerSecret.secretArn,
        ENVIRONMENT: props.environment,
      },
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      tracing: lambda.Tracing.ACTIVE,
    });

    new events.Rule(this, 'DailySearchRule', {
      ruleName: `jobseek-daily-search-${props.environment}`,
      description: 'Trigger daily job searches',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '9',
        day: '*',
        month: '*',
        year: '*',
      }),
      targets: [new targets.LambdaFunction(searchScheduler)],
    });

    this.lambdaFunctions = {
      searchScheduler,
    };

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      exportName: `jobseek-user-pool-id-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      exportName: `jobseek-user-pool-client-id-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'ResumeBucketName', {
      value: this.resumeBucket.bucketName,
      exportName: `jobseek-resume-bucket-${props.environment}`,
    });

    Object.entries(this.tables).forEach(([name, table]) => {
      new cdk.CfnOutput(this, `${name}TableName`, {
        value: table.tableName,
        exportName: `jobseek-${name}-table-${props.environment}`,
      });
    });
  }

  private createTable(
    name: string,
    partitionKey: string,
    sortKey?: string,
    props?: BackendStackProps
  ): dynamodb.Table {
    const table = new dynamodb.Table(this, `${name}Table`, {
      tableName: `jobseek-${name.toLowerCase()}-${props?.environment || 'dev'}`,
      partitionKey: {
        name: partitionKey,
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: sortKey
        ? {
            name: sortKey,
            type: dynamodb.AttributeType.STRING,
          }
        : undefined,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: props?.environment === 'prod' || props?.config.enableBackups,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: props?.environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });

    return table;
  }
}