import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { RestApi } from 'aws-cdk-lib/aws-apigateway'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { LoginApiStack } from './login-api.stack'

export class UserServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & {
    stage: string
  }) {
    super(scope, id, props)

    const api = new RestApi(this, 'LoginRestApi', {
      restApiName: 'User Login API',
    })

    const alarmsTopic = new Topic(this, 'LoginAlarmsTopic')

    const serviceStage = props.stage.toLowerCase()

    new LoginApiStack(this, 'LoginApiStack', {
      api,
      serviceStage,
      alarmsTopic,
    })
  }
}
