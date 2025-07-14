import { Duration } from 'aws-cdk-lib'
import {
  IAuthorizer,
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway'
import { IGrantable } from 'aws-cdk-lib/aws-iam'
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction, SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { Construct } from 'constructs'
import { pick } from 'lodash/fp'
import { defaultPreflightOptions } from './cors'
import { ISecurityGroup, IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2'

export interface IRestEndpointProps {
  architecture?: Architecture
  api: IRestApi
  entry: string
  path: string
  httpMethod: string
  timeout?: Duration
  environment?: Record<string, string>
  authorizer?: IAuthorizer
  memorySize?: number
  alarmsTopic: Topic
  vpc?: IVpc
  securityGroups?: ISecurityGroup[]
  subnets?: SubnetSelection
}

export class RestEndpoint extends Construct {
  public readonly handler: NodejsFunction
  public readonly resource: Resource

  constructor(scope: Construct, id: string, props: IRestEndpointProps) {
    super(scope, id)

    if (!props.environment) {
      props.environment = {}
    }
    props.environment.POWERTOOLS_SERVICE_NAME = id
    props.environment.NODE_OPTIONS = '--enable-source-maps'

    const handler = (this.handler = new NodejsFunction(this, `${id}Handler`, {
      runtime: Runtime.NODEJS_18_X,
      architecture: props.architecture || Architecture.ARM_64,
      entry: props.entry,
      awsSdkConnectionReuse: true,
      handler: 'handler',
      timeout: props.timeout || Duration.seconds(5),
      environment: props.environment,
      vpc: props.vpc,
      securityGroups: props.securityGroups,
      vpcSubnets: props.subnets,
      bundling: {
        sourceMap: true,
        sourceMapMode: SourceMapMode.DEFAULT,
      },
      memorySize: props.memorySize || 1024,
    }))

    const resource = (this.resource = props.api.root.resourceForPath(
      props.path
    ))

    try {
      resource.addCorsPreflight(defaultPreflightOptions)
    } catch (error) {}

    resource.addMethod(props.httpMethod, new LambdaIntegration(handler), {
      authorizer: props.authorizer,
    })
  }
}

export type EndpointProps = Partial<IRestEndpointProps> &
  Pick<IRestEndpointProps, 'path' | 'httpMethod' | 'entry'> & {
    id: string
    grants?: (grantable: IGrantable) => void
  }
export interface IServiceApiProps {
  api: IRestApi
  alarmsTopic: Topic
  defaultTimeout?: Duration
  defaultEnvironment?: Record<string, string>
  defaultAuthorizer?: IAuthorizer
  defaultMemorySize?: number
  endpoints: EndpointProps[]
  grants?: (grantable: IGrantable) => void
}

export class ServiceApi extends Construct {
  public readonly api: IRestApi
  public readonly endpoints: RestEndpoint[] = []
  public readonly grants?: (grantable: IGrantable) => void
  public readonly defaultParams: Partial<
    Pick<
      IRestEndpointProps,
      'timeout' | 'environment' | 'authorizer' | 'memorySize'
    >
  >

  constructor(scope: Construct, id: string, props: IServiceApiProps) {
    super(scope, id)
    this.api = props.api
    this.grants = props.grants

    this.defaultParams = {
      timeout: props.defaultTimeout,
      environment: props.defaultEnvironment,
      authorizer: props.defaultAuthorizer,
      memorySize: props.defaultMemorySize,
    }

    this.endpoints = props.endpoints.map((endpointProps) => {
      const endpoint = new RestEndpoint(
        this,
        `${endpointProps.id}`,
        Object.assign(
          pick(['api', 'alarmsTopic'], props),
          this.defaultParams,
          endpointProps
        )
      )

      if (typeof this.grants === 'function') {
        this.grants(endpoint.handler)
      }

      if (typeof endpointProps.grants === 'function') {
        endpointProps.grants(endpoint.handler)
      }

      return endpoint
    })
  }
}
