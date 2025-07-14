import { NestedStack, NestedStackProps, Duration } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { IRestApi } from 'aws-cdk-lib/aws-apigateway'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { RestEndpoint } from './rest-endpoint'


interface LoginApiStackProps extends NestedStackProps {
  api: IRestApi
  serviceStage: string
  alarmsTopic: Topic
}

export class LoginApiStack extends NestedStack {
  constructor(scope: Construct, id: string, props: LoginApiStackProps) {
    super(scope, id, props)

    new RestEndpoint(this, 'Login', {
      api: props.api,
      entry: '../app/lambda/login.lambda.ts',
      httpMethod: 'POST',
      path: '/login',
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: {
        STAGE: props.serviceStage,
      },
      alarmsTopic: props.alarmsTopic,
    })
  }
}
