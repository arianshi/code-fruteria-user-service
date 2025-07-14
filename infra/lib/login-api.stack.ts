import { NestedStack, NestedStackProps, Duration } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { IRestApi } from 'aws-cdk-lib/aws-apigateway'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { RestEndpoint } from './rest-endpoint'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'


interface LoginApiStackProps extends NestedStackProps {
  api: IRestApi
  serviceStage: string
  alarmsTopic: Topic
}

export class LoginApiStack extends NestedStack {
  constructor(scope: Construct, id: string, props: LoginApiStackProps) {
    super(scope, id, props)


    console.log({
      serviceStage: props.serviceStage
    })

    const loginSecretKey = StringParameter.valueForStringParameter(
      this,
      `/${props.serviceStage}/login-secret-key`
    )
  
   
  
    const USERNAE_KEY = Secret.fromSecretNameV2(
      this,
      'UsernameKey',
      `/${props.serviceStage}/username/key`
    )
      .secretValueFromJson('key')
      .unsafeUnwrap()

    const PASSWORD_KEY = Secret.fromSecretNameV2(
      this,
      'PasswordKey',
      `/${props.serviceStage}/password/key`
    )
      .secretValueFromJson('key')
      .unsafeUnwrap()


    new RestEndpoint(this, 'Login', {
      api: props.api,
      entry: '../app/lambda/login.lambda.ts',
      httpMethod: 'POST',
      path: '/login',
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: {
        STAGE: props.serviceStage,
        LOGIN_SECRET_KEY: loginSecretKey,
        LOGIN_USERNAME: USERNAE_KEY,
        LOGIN_PASSWORD: PASSWORD_KEY,
      },
      alarmsTopic: props.alarmsTopic,
    })
  }
}
