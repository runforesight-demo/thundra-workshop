import * as sqs from '@aws-sdk/client-sqs';
import { Handler } from 'aws-cdk-lib/aws-lambda';

const sqsClient: sqs.SQSClient = new sqs.SQSClient({});
const sqsUrl: string | undefined = process.env['SQS_URL'];

const sqsWrite: Handler = async (event: any): Promise<object> => {
    try {
        await sqsClient.send(new sqs.SendMessageCommand({
            MessageBody: JSON.stringify(event),
            QueueUrl: sqsUrl,
        }));
    } catch (error) {
        throw new Error(`Error while sending the message to SQS: ${error}`);
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
    return response;
}

export const handler = sqsWrite;
