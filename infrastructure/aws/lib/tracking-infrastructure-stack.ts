import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class TrackingInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for tracking script distribution
    const trackingScriptBucket = new s3.Bucket(this, 'TrackingScriptBucket', {
      bucketName: `tracking-scripts-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // S3 Bucket for event data archival
    const dataArchiveBucket = new s3.Bucket(this, 'DataArchiveBucket', {
      bucketName: `tracking-data-archive-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'MoveToGlacierAfter90Days',
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // DynamoDB Table for caching
    const cacheTable = new dynamodb.Table(this, 'CacheTable', {
      tableName: 'tracking-cache',
      partitionKey: {
        name: 'cache_key',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // CloudFront Distribution for tracking script
    const distribution = new cloudfront.Distribution(this, 'TrackingScriptDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(trackingScriptBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // SQS Queue for event processing
    const eventQueue = new sqs.Queue(this, 'EventQueue', {
      queueName: 'tracking-event-queue',
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14),
      deadLetterQueue: {
        queue: new sqs.Queue(this, 'EventQueueDLQ', {
          queueName: 'tracking-event-queue-dlq',
        }),
        maxReceiveCount: 3,
      },
    });

    // Lambda: Event Enrichment
    const enrichmentFunction = new lambda.Function(this, 'EnrichmentFunction', {
      functionName: 'tracking-event-enrichment',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          // Enrich events with IP geolocation, user-agent parsing
          console.log('Enriching events:', event);
          return { statusCode: 200, body: 'Enriched' };
        };
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        ARCHIVE_BUCKET: dataArchiveBucket.bucketName,
        DYNAMODB_CACHE_TABLE: cacheTable.tableName,
      },
    });

    dataArchiveBucket.grantReadWrite(enrichmentFunction);
    cacheTable.grantReadWriteData(enrichmentFunction);

    // Lambda: Identity Resolution
    const identityResolutionFunction = new lambda.Function(this, 'IdentityResolutionFunction', {
      functionName: 'tracking-identity-resolution',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          // Incremental identity resolution on last 24h events
          console.log('Resolving identities:', event);
          return { statusCode: 200, body: 'Resolved' };
        };
      `),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      environment: {
        DYNAMODB_CACHE_TABLE: cacheTable.tableName,
      },
    });

    cacheTable.grantReadWriteData(identityResolutionFunction);

    // Lambda: Detection Monitoring
    const detectionMonitorFunction = new lambda.Function(this, 'DetectionMonitorFunction', {
      functionName: 'tracking-detection-monitor',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          // Analyze detection metrics and update obfuscation strategies
          console.log('Monitoring detection:', event);
      environment: {
        DYNAMODB_CACHE_TABLE: cacheTable.tableName,
      },
    });

    cacheTable.grantReadWriteData(detectionMonitorFunction     return { statusCode: 200, body: 'Monitored' };
        };
      `),
      timeout: cdk.Duration.minutes(3),
      memorySize: 512,
    });

    // Lambda: Data Lifecycle (move events to archive)
    const lifecycleFunction = new lambda.Function(this, 'LifecycleFunction', {
      functionName: 'tracking-data-lifecycle',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          // Move 31+ day events to S3 archive
          console.log('Managing data lifecycle:', event);
          return { statusCode: 200, body: 'Archived' };
        };
      `),
      timeout: cdk.Duration.minutes(15),
      memorySize: 2048,
      environment: {
        ARCHIVE_BUCKET: dataArchiveBucket.bucketName,
      },
    });

    dataArchiveBucket.grantWrite(lifecycleFunction);

    // EventBridge Rules for scheduled jobs
    // Run identity resolution hourly
    new events.Rule(this, 'IdentityResolutionSchedule', {
      schedule: events.Schedule.rate(cdk.Duration.hours(1)),
      targets: [new targets.LambdaFunction(identityResolutionFunction)],
    });

    // Run detection monitoring daily
    new events.Rule(this, 'DetectionMonitorSchedule', {
      schedule: events.Schedule.rate(cdk.Duration.days(1)),
      targets: [new targets.LambdaFunction(detectionMonitorFunction)],
    });

    // Run data lifecycle daily at midnight
    new events.Rule(this, 'LifecycleSchedule', {
      schedule: events.Schedule.cron({ hour: '0', minute: '0' }),
      targets: [new targets.LambdaFunction(lifecycleFunction)],
    });

    // Outputs
    new cdk.CfnOutput(this, 'TrackingScriptBucketName', {
      value: trackingScriptBucket.bucketName,
      description: 'S3 bucket for tracking scripts',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionDomain', {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution domain for tracking script',
    });

    new cdk.CfnOutput(this, 'EventQueueUrl', {
      value: eventQueue.queueUrl,
      description: 'SQS queue URL for event processing',
    });

    new cdk.CfnOutput(this, 'CacheTableName', {
      value: cacheTable.tableName,
      description: 'DynamoDB table for caching',
    });

    new cdk.CfnOutput(this, 'DataArchiveBucketName', {
      value: dataArchiveBucket.bucketName,
      description: 'S3 bucket for data archival',
    });
  }
}
