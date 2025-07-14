import {
  SendMessageCommand,
  SendMessageCommandInput,
  SQSClient,
} from '@aws-sdk/client-sqs'

const sqsClient = new SQSClient({ region: process.env.AWS_REGION })

export interface ICreateThreadCommand {
  userId: string;
  threadId: string | string[];
  role: string;
  content: string;
  createdAt: string;
}

export async function createThreadCommand(
  createThreadQueueUrl: string,
  createThreadCommand: ICreateThreadCommand
) {
  const input: SendMessageCommandInput = {
    QueueUrl: createThreadQueueUrl,
    MessageBody: JSON.stringify(createThreadCommand),
  }

  return sqsClient.send(new SendMessageCommand(input))
}
