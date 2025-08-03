import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as amplify from 'aws-cdk-lib/aws-amplify';

export interface MonitoringStackProps extends cdk.StackProps {
  environment: string;
  config: any;
  amplifyApp: amplify.CfnApp;
  tables: Record<string, dynamodb.Table>;
  lambdaFunctions: Record<string, lambda.Function>;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `jobseek-alarms-${props.environment}`,
      displayName: `Jobseek Alarms (${props.environment})`,
    });

    if (props.config.alarmEmail) {
      alarmTopic.addSubscription(
        new snsSubscriptions.EmailSubscription(props.config.alarmEmail)
      );
    }

    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `jobseek-${props.environment}`,
      defaultInterval: cdk.Duration.hours(3),
    });

    const dynamodbWidgets: cloudwatch.IWidget[] = [];
    Object.entries(props.tables).forEach(([name, table]) => {
      const readThrottle = new cloudwatch.Metric({
        namespace: 'AWS/DynamoDB',
        metricName: 'ReadThrottleEvents',
        dimensionsMap: {
          TableName: table.tableName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      });

      const writeThrottle = new cloudwatch.Metric({
        namespace: 'AWS/DynamoDB',
        metricName: 'WriteThrottleEvents',
        dimensionsMap: {
          TableName: table.tableName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      });

      dynamodbWidgets.push(
        new cloudwatch.GraphWidget({
          title: `${name} Table Throttles`,
          left: [readThrottle],
          right: [writeThrottle],
          width: 12,
          height: 6,
        })
      );

      if (props.environment === 'prod') {
        new cloudwatch.Alarm(this, `${name}TableReadThrottleAlarm`, {
          metric: readThrottle,
          threshold: 10,
          evaluationPeriods: 2,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
          alarmDescription: `DynamoDB ${name} table read throttles`,
        }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

        new cloudwatch.Alarm(this, `${name}TableWriteThrottleAlarm`, {
          metric: writeThrottle,
          threshold: 10,
          evaluationPeriods: 2,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
          alarmDescription: `DynamoDB ${name} table write throttles`,
        }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));
      }
    });

    const lambdaWidgets: cloudwatch.IWidget[] = [];
    Object.entries(props.lambdaFunctions).forEach(([name, func]) => {
      const errors = new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        dimensionsMap: {
          FunctionName: func.functionName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      });

      const duration = new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Duration',
        dimensionsMap: {
          FunctionName: func.functionName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      });

      const invocations = new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Invocations',
        dimensionsMap: {
          FunctionName: func.functionName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      });

      lambdaWidgets.push(
        new cloudwatch.GraphWidget({
          title: `${name} Lambda Metrics`,
          left: [invocations, errors],
          right: [duration],
          width: 12,
          height: 6,
        })
      );

      if (props.environment === 'prod') {
        new cloudwatch.Alarm(this, `${name}LambdaErrorAlarm`, {
          metric: errors,
          threshold: 5,
          evaluationPeriods: 2,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
          alarmDescription: `Lambda ${name} function errors`,
        }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));
      }
    });

    const costWidget = new cloudwatch.TextWidget({
      markdown: `
# Cost Tracking

Monitor your AWS costs in the [Cost Explorer](https://console.aws.amazon.com/cost-management/home#/dashboard)

### Estimated Monthly Costs (${props.environment}):
- **Amplify Hosting**: $${props.environment === 'prod' ? '10-30' : '1-3'}
- **DynamoDB**: $${props.environment === 'prod' ? '5-15' : '0-2'}
- **S3**: $${props.environment === 'prod' ? '2-5' : '0-1'}
- **Lambda**: $${props.environment === 'prod' ? '1-5' : '0'}
- **Total**: $${props.environment === 'prod' ? '18-55' : '1-6'}/month
      `,
      width: 24,
      height: 6,
    });

    const overviewWidget = new cloudwatch.TextWidget({
      markdown: `
# Jobseek Infrastructure Overview (${props.environment})

### Key Resources:
- **Amplify App**: [Open Console](https://console.aws.amazon.com/amplify/home#/${props.amplifyApp.attrAppId})
- **Cognito User Pool**: [Open Console](https://console.aws.amazon.com/cognito/users/)
- **DynamoDB Tables**: ${Object.keys(props.tables).length} tables
- **Lambda Functions**: ${Object.keys(props.lambdaFunctions).length} functions

### Quick Links:
- [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/home#logs:)
- [X-Ray Traces](https://console.aws.amazon.com/xray/home#/traces)
- [Cost Explorer](https://console.aws.amazon.com/cost-management/home#/dashboard)
      `,
      width: 24,
      height: 6,
    });

    dashboard.addWidgets(overviewWidget);
    dashboard.addWidgets(costWidget);
    
    if (dynamodbWidgets.length > 0) {
      dashboard.addWidgets(...dynamodbWidgets);
    }
    
    if (lambdaWidgets.length > 0) {
      dashboard.addWidgets(...lambdaWidgets);
    }

    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}