import {
  BuildSpec,
  EventAction,
  FilterGroup,
  LinuxBuildImage,
  Project,
  Source,
} from 'aws-cdk-lib/aws-codebuild'
import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'

export interface IUserServiceBuildStackProps extends StackProps {
  stage: string
}

export class UserServiceBuildStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: IUserServiceBuildStackProps
  ) {
    super(scope, id, props)

    const owner = this.node.tryGetContext('github_alias')
    const repo = this.node.tryGetContext('github_repo')
    const branch = this.node.tryGetContext('github_branch')

    const source = Source.gitHub({
      owner,
      repo,
      webhook: true,
      webhookFilters: [
        FilterGroup.inEventOf(
          EventAction.PULL_REQUEST_CREATED,
          EventAction.PULL_REQUEST_UPDATED
        ).andBaseBranchIs(branch),
      ],
    })

    // eslint-disable-next-line no-new
    new Project(this, 'code-fruteria-user-service-build-project', {
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: ['yarn', 'yarn workspace infra cdk synth'],
          },
        },
      }),
      source,
      environment: {
        buildImage: LinuxBuildImage.STANDARD_6_0,
        privileged: true,
      },
    })
  }
}
