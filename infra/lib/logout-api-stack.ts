import { NestedStack, NestedStackProps, Duration } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { IRestApi } from 'aws-cdk-lib/aws-apigateway'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { RestEndpoint } from './rest-endpoint'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'

interface LogoutApiStackProps extends NestedStackProps {
  api: IRestApi
  serviceStage: string
  alarmsTopic: Topic
}

export class LogoutApiStack extends NestedStack {
  constructor(scope: Construct, id: string, props: LogoutApiStackProps) {
    super(scope, id, props)


    const JWT_SECRET = Secret.fromSecretNameV2(
          this,
          'JwtSecretKey',
          `/${props.serviceStage}/jwt-secret/key`
        )
          .secretValueFromJson('key')
          .unsafeUnwrap()
          
    new RestEndpoint(this, 'LogoutEndpoint', {
      api: props.api,
      entry: '../app/lambda/logout.lambda.ts',
      httpMethod: 'POST',
      path: '/logout',
      timeout: Duration.seconds(10),
      memorySize: 128,
      environment: {
        STAGE: props.serviceStage,
        JWT_SECRET: JWT_SECRET,
      },
      alarmsTopic: props.alarmsTopic,
    })
  }
}
