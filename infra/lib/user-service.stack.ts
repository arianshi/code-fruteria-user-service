import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { RestApi } from 'aws-cdk-lib/aws-apigateway'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { ConnectTokenApiStack } from './connect-token-api-stack'
import { UserInfoApiStack } from './userinfo-api-stack'
import { LogoutApiStack } from './logout-api-stack'

export class UserServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & {
    stage: string
  }) {
    super(scope, id, props)

    const api = new RestApi(this, 'UserServiceRestApi', {
      restApiName: 'User Service API',
      description: 'Code Fruteria User Service Rest API',
    })

    const alarmsTopic = new Topic(this, 'UserServiceAlarmsTopic')

    const serviceStage = props.stage.toLowerCase()

    new UserInfoApiStack(this, 'UserInfoApiStack', {
      api,
      serviceStage,
      alarmsTopic,
    })

    new ConnectTokenApiStack(this, 'ConnectTokenStack', {
      api,
      serviceStage,
      alarmsTopic,
    })

    new LogoutApiStack(this, 'LogoutStack', {
      api,
      serviceStage,
      alarmsTopic,
    })

  }
}
