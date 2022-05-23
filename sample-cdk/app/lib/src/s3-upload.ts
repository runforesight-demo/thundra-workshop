import * as s3 from '@aws-sdk/client-s3';
import * as sqs from '@aws-sdk/client-sqs';
import { Handler } from 'aws-cdk-lib/aws-lambda';

const s3Client: s3.S3Client = new s3.S3Client({});
const s3BucketName: string | undefined = process.env['S3_BUCKET_NAME'];

const s3Upload: Handler = async (event: any): Promise<void> => {
    try {
        const buffer = Buffer.from(JSON.stringify({
            MessageId: event.Records[0].messageId,
            Attributes: event.Records[0].attributes,
            Body: JSON.parse(event.Records[0].body),
        }));

        await s3Client.send(new s3.PutObjectCommand({
            Bucket: s3BucketName,
            Key: `${event.Records[0].messageId}.json`,
            Body: buffer,
            ContentEncoding: 'base64',
            ContentType: 'application/json',
            ACL: 'public-read',
        }));
    } catch (error) {
        throw new Error(`Error while uploading the message to S3: ${error}`);
    }

    let response = {
        statusCode: 200,
        body: JSON.stringify(
            {
                message: 'Your function executed successfully!',
                input: event,
            },
            null,
            2
        ),
    };

    console.log(response);

    return;
}

export const handler = s3Upload;
