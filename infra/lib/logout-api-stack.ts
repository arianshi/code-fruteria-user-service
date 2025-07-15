import { NestedStack, NestedStackProps, Duration } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { IRestApi } from 'aws-cdk-lib/aws-apigateway'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { RestEndpoint } from './rest-endpoint'

interface LogoutApiStackProps extends NestedStackProps {
  api: IRestApi
  serviceStage: string
  alarmsTopic: Topic
}

export class LogoutApiStack extends NestedStack {
  constructor(scope: Construct, id: string, props: LogoutApiStackProps) {
    super(scope, id, props)

    new RestEndpoint(this, 'LogoutEndpoint', {
      api: props.api,
      entry: '../app/lambda/logout.lambda.ts',
      httpMethod: 'POST',
      path: '/logout',
      timeout: Duration.seconds(10),
      memorySize: 128,
      environment: {
        STAGE: props.serviceStage
      },
      alarmsTopic: props.alarmsTopic,
    })
  }
}
