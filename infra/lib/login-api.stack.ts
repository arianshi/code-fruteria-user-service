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
  
    const usernameAppConfig = Secret.fromSecretNameV2(
      this,
      'LoginUsernameSecret',
      `${props.serviceStage}/login/username`
    )

    const passwordAppConfig = Secret.fromSecretNameV2(
      this,
      'LoginPasswordSecret',
      `${props.serviceStage}/login/password`
    )


    const username = usernameAppConfig
      .secretValueFromJson('username')
      .unsafeUnwrap()


    console.log({
      username
    })

    const password = passwordAppConfig
      .secretValueFromJson('password')
      .unsafeUnwrap()

      console.log({
        password
      })

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
        LOGIN_USERNAME: username,
        LOGIN_PASSWORD: password,
      },
      alarmsTopic: props.alarmsTopic,
    })
  }
}
