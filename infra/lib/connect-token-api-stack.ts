import { NestedStack, NestedStackProps, Duration } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { IRestApi } from 'aws-cdk-lib/aws-apigateway'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { RestEndpoint } from './rest-endpoint'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'

interface ConnectTokenApiStackProps extends NestedStackProps {
  api: IRestApi
  serviceStage: string
  alarmsTopic: Topic
}

export class ConnectTokenApiStack extends NestedStack {
  constructor(scope: Construct, id: string, props: ConnectTokenApiStackProps) {
    super(scope, id, props)

    const loginSecretKey = StringParameter.valueForStringParameter(
      this,
      `/${props.serviceStage}/login-secret-key`
    )

    const USERNAME_KEY = Secret.fromSecretNameV2(
      this,
      'ConnectTokenUsernameKey',
      `/${props.serviceStage}/username/key`
    )
      .secretValueFromJson('key')
      .unsafeUnwrap()

    const PASSWORD_KEY = Secret.fromSecretNameV2(
      this,
      'ConnectTokenPasswordKey',
      `/${props.serviceStage}/password/key`
    )
      .secretValueFromJson('key')
      .unsafeUnwrap()

    const JWT_SECRET = Secret.fromSecretNameV2(
      this,
      'JwtSecretKey',
      `/${props.serviceStage}/jwt-secret/key`
    )
      .secretValueFromJson('key')
      .unsafeUnwrap()

    new RestEndpoint(this, 'ConnectToken', {
      api: props.api,
      entry: '../app/lambda/connect-token.lamba.ts',
      httpMethod: 'POST',
      path: '/connect/token',
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: {
        STAGE: props.serviceStage,
        LOGIN_SECRET_KEY: loginSecretKey,
        LOGIN_USERNAME: USERNAME_KEY,
        LOGIN_PASSWORD: PASSWORD_KEY,
        JWT_SECRET: JWT_SECRET,
      },
      alarmsTopic: props.alarmsTopic,
    })
  }
}
