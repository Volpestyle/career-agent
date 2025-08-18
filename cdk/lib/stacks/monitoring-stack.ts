import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as sns from "aws-cdk-lib/aws-sns";
import * as snsSubscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as cloudwatchActions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as amplify from "aws-cdk-lib/aws-amplify";

export interface MonitoringStackProps extends cdk.StackProps {
  environment: string;
  config: any;
  amplifyApp: amplify.CfnApp;
  usersTable: dynamodb.Table;
  lambdaFunctions: Record<string, lambda.Function>;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const alarmTopic = new sns.Topic(this, "AlarmTopic", {
      topicName: `jobseek-alarms-${props.environment}`,
      displayName: `Jobseek Alarms (${props.environment})`,
    });

    if (props.config.alarmEmail) {
      alarmTopic.addSubscription(
        new snsSubscriptions.EmailSubscription(props.config.alarmEmail)
      );
    }

    const dashboard = new cloudwatch.Dashboard(this, "Dashboard", {
      dashboardName: `jobseek-${props.environment}`,
      defaultInterval: cdk.Duration.hours(3),
    });

    const dynamodbWidgets: cloudwatch.IWidget[] = [];

    // Metrics for the single users table
    const readThrottle = new cloudwatch.Metric({
      namespace: "AWS/DynamoDB",
      metricName: "ReadThrottleEvents",
      dimensionsMap: {
        TableName: props.usersTable.tableName,
      },
      statistic: "Sum",
      period: cdk.Duration.minutes(5),
    });

    const writeThrottle = new cloudwatch.Metric({
      namespace: "AWS/DynamoDB",
      metricName: "WriteThrottleEvents",
      dimensionsMap: {
        TableName: props.usersTable.tableName,
      },
      statistic: "Sum",
      period: cdk.Duration.minutes(5),
    });

    new cloudwatch.Alarm(this, "UsersTableThrottleAlarm", {
      metric: new cloudwatch.MathExpression({
        expression: "m1 + m2",
        usingMetrics: {
          m1: readThrottle,
          m2: writeThrottle,
        },
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: "DynamoDB users table is being throttled",
      actionsEnabled: props.environment === "prod",
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    dynamodbWidgets.push(
      new cloudwatch.GraphWidget({
        title: "Users Table Metrics",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/DynamoDB",
            metricName: "ConsumedReadCapacityUnits",
            dimensionsMap: {
              TableName: props.usersTable.tableName,
            },
            statistic: "Sum",
          }),
          new cloudwatch.Metric({
            namespace: "AWS/DynamoDB",
            metricName: "ConsumedWriteCapacityUnits",
            dimensionsMap: {
              TableName: props.usersTable.tableName,
            },
            statistic: "Sum",
          }),
        ],
        right: [readThrottle, writeThrottle],
        width: 12,
        height: 6,
      })
    );

    const lambdaWidgets: cloudwatch.IWidget[] = [];
    Object.entries(props.lambdaFunctions).forEach(([name, func]) => {
      const errors = new cloudwatch.Metric({
        namespace: "AWS/Lambda",
        metricName: "Errors",
        dimensionsMap: {
          FunctionName: func.functionName,
        },
        statistic: "Sum",
      });

      const throttles = new cloudwatch.Metric({
        namespace: "AWS/Lambda",
        metricName: "Throttles",
        dimensionsMap: {
          FunctionName: func.functionName,
        },
        statistic: "Sum",
      });

      new cloudwatch.Alarm(this, `${name}FunctionErrorAlarm`, {
        metric: errors,
        threshold: 5,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `Lambda function ${name} has errors`,
        actionsEnabled: props.environment === "prod",
      }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

      lambdaWidgets.push(
        new cloudwatch.GraphWidget({
          title: `${name} Function Metrics`,
          left: [
            new cloudwatch.Metric({
              namespace: "AWS/Lambda",
              metricName: "Invocations",
              dimensionsMap: {
                FunctionName: func.functionName,
              },
              statistic: "Sum",
            }),
            new cloudwatch.Metric({
              namespace: "AWS/Lambda",
              metricName: "Duration",
              dimensionsMap: {
                FunctionName: func.functionName,
              },
              statistic: "Average",
            }),
          ],
          right: [errors, throttles],
          width: 12,
          height: 6,
        })
      );
    });

    const amplifyBuildSuccessRate = new cloudwatch.MathExpression({
      expression: "100 * (m1 / (m1 + m2))",
      usingMetrics: {
        m1: new cloudwatch.Metric({
          namespace: "AWS/Amplify",
          metricName: "Builds",
          dimensionsMap: {
            App: props.amplifyApp.ref,
            Result: "SUCCEED",
          },
          statistic: "Sum",
        }),
        m2: new cloudwatch.Metric({
          namespace: "AWS/Amplify",
          metricName: "Builds",
          dimensionsMap: {
            App: props.amplifyApp.ref,
            Result: "FAILED",
          },
          statistic: "Sum",
        }),
      },
      label: "Build Success Rate",
      period: cdk.Duration.hours(1),
    });

    new cloudwatch.Alarm(this, "AmplifyBuildFailureAlarm", {
      metric: amplifyBuildSuccessRate,
      threshold: 95,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: "Amplify build success rate is below 95%",
      actionsEnabled: props.environment === "prod",
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: `# Jobseek Dashboard (${props.environment})`,
        width: 24,
        height: 1,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.SingleValueWidget({
        title: "API Health",
        metrics: [
          new cloudwatch.MathExpression({
            expression: "100 - (100 * errors / requests)",
            usingMetrics: {
              requests: new cloudwatch.Metric({
                namespace: "AWS/ApiGateway",
                metricName: "Count",
                statistic: "Sum",
              }),
              errors: new cloudwatch.Metric({
                namespace: "AWS/ApiGateway",
                metricName: "5XXError",
                statistic: "Sum",
              }),
            },
            label: "Success Rate",
            period: cdk.Duration.hours(1),
          }),
        ],
        width: 8,
        height: 4,
      }),
      new cloudwatch.SingleValueWidget({
        title: "Amplify Build Success",
        metrics: [amplifyBuildSuccessRate],
        width: 8,
        height: 4,
      }),
      new cloudwatch.SingleValueWidget({
        title: "Active Users",
        metrics: [
          new cloudwatch.Metric({
            namespace: "CWLogs",
            metricName: "IncomingLogEvents",
            statistic: "Sum",
          }),
        ],
        width: 8,
        height: 4,
      })
    );

    dashboard.addWidgets(...dynamodbWidgets);
    dashboard.addWidgets(...lambdaWidgets);

    const apiGatewayWidget = new cloudwatch.GraphWidget({
      title: "API Gateway Performance",
      left: [
        new cloudwatch.Metric({
          namespace: "AWS/ApiGateway",
          metricName: "Count",
          statistic: "Sum",
        }),
        new cloudwatch.Metric({
          namespace: "AWS/ApiGateway",
          metricName: "Latency",
          statistic: "Average",
        }),
      ],
      right: [
        new cloudwatch.Metric({
          namespace: "AWS/ApiGateway",
          metricName: "4XXError",
          statistic: "Sum",
        }),
        new cloudwatch.Metric({
          namespace: "AWS/ApiGateway",
          metricName: "5XXError",
          statistic: "Sum",
        }),
      ],
      width: 24,
      height: 6,
    });

    dashboard.addWidgets(apiGatewayWidget);

    new cloudwatch.Alarm(this, "ApiGateway5xxAlarm", {
      metric: new cloudwatch.Metric({
        namespace: "AWS/ApiGateway",
        metricName: "5XXError",
        statistic: "Sum",
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: "API Gateway has high 5XX error rate",
      actionsEnabled: props.environment === "prod",
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));
  }
}
