import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as path from 'path'

export class UserServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const loginLambda = new lambda.Function(this, 'LoginLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'code-fruteria-user-service.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
    })

    const api = new apigateway.RestApi(this, 'LoginAPI', {
      restApiName: 'Login Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    })

    const loginResource = api.root.addResource('login')
    loginResource.addMethod('POST', new apigateway.LambdaIntegration(loginLambda))
  }
}
