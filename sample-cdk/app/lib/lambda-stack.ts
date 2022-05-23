import { Stack, StackProps, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class LambdaStack extends Stack {

  sqsQueueName: string;
  sqsQueue: sqs.Queue;

  s3BucketName: string;
  s3Bucket: s3.Bucket;

  sqsWriteFunctionName: string;
  sqsWriteFunction: lambda.NodejsFunction;

  s3UploadFunctionName: string;
  s3UploadFunction: lambda.NodejsFunction;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Common Resources
    this.sqsQueueName = `presentation-lambda-queue-${process.env.STAGE}`;
    this.sqsQueue = new sqs.Queue(this, this.sqsQueueName, {
      queueName: this.sqsQueueName,
    });

    this.s3BucketName = `${process.env.BUCKET_NAME}-${process.env.STAGE}`;
    this.s3Bucket = new s3.Bucket(this, this.s3BucketName, {
      bucketName: this.s3BucketName,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL
    });

    // SQS Write Function
    this.sqsWriteFunctionName = `presentation-sqs-write-function-${process.env.STAGE}`;
    this.sqsWriteFunction = new lambda.NodejsFunction(this, this.sqsWriteFunctionName, {
      entry: './lib/src/sqs-write.ts',
      functionName: this.sqsWriteFunctionName,
      handler: 'handler',
      runtime: Runtime.NODEJS_14_X,
      timeout: Duration.seconds(15),
      memorySize: 256,
      retryAttempts: 0,
      environment: {
        SQS_URL: this.sqsQueue.queueUrl,
      },
      initialPolicy: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'sqs:SendMessage'
          ],
          resources: [
            this.sqsQueue.queueArn
          ]
        })
      ],
      bundling: {
        sourceMap: true,
        sourceMapMode: lambda.SourceMapMode.INLINE,
      }
    });

    // S3 Upload Function
    this.s3UploadFunctionName = `presentation-s3-upload-function-${process.env.STAGE}`;
    this.s3UploadFunction = new lambda.NodejsFunction(this, this.s3UploadFunctionName, {
      entry: './lib/src/s3-upload.ts',
      functionName: this.s3UploadFunctionName,
      handler: 'handler',
      runtime: Runtime.NODEJS_14_X,
      timeout: Duration.seconds(15),
      memorySize: 256,
      retryAttempts: 0,
      events: [
        new SqsEventSource(this.sqsQueue),
      ],
      environment: {
        S3_BUCKET_NAME: this.s3Bucket.bucketName,
      },
      initialPolicy: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:Put*'
          ],
          resources: [
            `${this.s3Bucket.bucketArn}/*`
          ]
        })
      ],
      bundling: {
        sourceMap: true,
        sourceMapMode: lambda.SourceMapMode.INLINE,
      }
    });
  }
}
