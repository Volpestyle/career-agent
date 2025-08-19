import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as logs from "aws-cdk-lib/aws-logs";

export interface BackendStackProps extends cdk.StackProps {
  environment: string;
  config: any;
}

export class BackendStack extends cdk.Stack {
  public readonly usersTable: dynamodb.Table;
  public readonly resumeBucket: s3.Bucket;
  public readonly lambdaFunctions: Record<string, lambda.Function>;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    // Single table for all user data
    this.usersTable = new dynamodb.Table(this, "UsersTable", {
      tableName: `jobseek-users-${props.environment}`,
      partitionKey: {
        name: "userId",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "dataType",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: "ttl", // Enable TTL for rate limit cleanup
      pointInTimeRecovery:
        props.environment === "prod" || props.config.enableBackups,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy:
        props.environment === "prod"
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    });

    // GSI for querying by data type
    this.usersTable.addGlobalSecondaryIndex({
      indexName: "DataTypeIndex",
      partitionKey: { name: "dataType", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });

    // GSI for active searches
    this.usersTable.addGlobalSecondaryIndex({
      indexName: "ActiveSearchesIndex",
      partitionKey: { name: "isActive", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "nextRunAt", type: dynamodb.AttributeType.STRING },
    });

    // GSI for job boards by visibility
    this.usersTable.addGlobalSecondaryIndex({
      indexName: "BoardVisibilityIndex",
      partitionKey: { name: "isPublic", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });

    // GSI for anonymous user queries
    this.usersTable.addGlobalSecondaryIndex({
      indexName: "AnonymousSessionIndex",
      partitionKey: { name: "anonymousId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "searchId", type: dynamodb.AttributeType.STRING },
    });

    // GSI for querying all results by master search ID
    this.usersTable.addGlobalSecondaryIndex({
      indexName: "SearchIdIndex",
      partitionKey: { name: "searchId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "boardName", type: dynamodb.AttributeType.STRING },
    });

    this.resumeBucket = new s3.Bucket(this, "ResumeBucket", {
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
            ? [`https://${props.config.domainName}`, "http://localhost:3000"]
            : [
                "http://localhost:3000",
                `https://${props.config.branchName || "main"}.*.amplifyapp.com`,
              ],
          allowedHeaders: ["*"],
          exposedHeaders: ["ETag"],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [
        {
          id: "DeleteOldVersions",
          noncurrentVersionExpiration: cdk.Duration.days(90),
          enabled: true,
        },
        {
          id: "TransitionOldResumes",
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          enabled: props.environment === "prod",
        },
      ],
      removalPolicy:
        props.environment === "prod"
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.environment !== "prod",
    });

    const wallcrawlerSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      "WallcrawlerApiKey",
      props.config.wallcrawlerApiKeySecretName
    );

    const searchSchedulerRole = new iam.Role(this, "SearchSchedulerRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    this.usersTable.grantReadWriteData(searchSchedulerRole);
    wallcrawlerSecret.grantRead(searchSchedulerRole);

    const searchScheduler = new lambda.Function(this, "SearchScheduler", {
      functionName: `jobseek-search-scheduler-${props.environment}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda/search-scheduler"),
      role: searchSchedulerRole,
      environment: {
        USERS_TABLE: this.usersTable.tableName,
        WALLCRAWLER_API_KEY_SECRET_ARN: wallcrawlerSecret.secretArn,
        ENVIRONMENT: props.environment,
      },
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      tracing: lambda.Tracing.ACTIVE,
      logRetention:
        props.environment === "prod"
          ? logs.RetentionDays.ONE_MONTH
          : logs.RetentionDays.ONE_WEEK,
    });

    new events.Rule(this, "DailySearchRule", {
      ruleName: `jobseek-daily-search-${props.environment}`,
      description: "Trigger daily job searches",
      schedule: events.Schedule.cron({
        minute: "0",
        hour: "9",
        day: "*",
        month: "*",
        year: "*",
      }),
      targets: [new targets.LambdaFunction(searchScheduler)],
    });

    this.lambdaFunctions = {
      searchScheduler,
    };

    new cdk.CfnOutput(this, "UsersTableName", {
      value: this.usersTable.tableName,
      exportName: `jobseek-users-table-${props.environment}`,
      description: "DynamoDB table name for user data",
    });

    new cdk.CfnOutput(this, "ResumeBucketName", {
      value: this.resumeBucket.bucketName,
      exportName: `jobseek-resume-bucket-${props.environment}`,
      description: "S3 bucket name for resume storage",
    });

    new cdk.CfnOutput(this, "UsersTableArn", {
      value: this.usersTable.tableArn,
      exportName: `jobseek-users-table-arn-${props.environment}`,
      description: "DynamoDB table ARN",
    });

    new cdk.CfnOutput(this, "ResumeBucketArn", {
      value: this.resumeBucket.bucketArn,
      exportName: `jobseek-resume-bucket-arn-${props.environment}`,
      description: "S3 bucket ARN",
    });
  }
}
