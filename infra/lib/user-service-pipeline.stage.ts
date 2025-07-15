import { Construct } from 'constructs'
import { Stage, StageProps } from 'aws-cdk-lib'
import { UserServiceStack } from './user-service.stack'

/**
 * Deployable unit
 */
export class UserServicePipelineStage extends Stage {
  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props)

    // eslint-disable-next-line no-new
    new UserServiceStack(this, 'code-fruteria-user-service', {
      ...props,
      stage: id.toLowerCase(),
    })
  }
}
