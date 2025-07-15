import { Construct } from 'constructs'
import { Stack, StackProps } from 'aws-cdk-lib'
import {
  CodePipeline,
  CodePipelineSource,
  ManualApprovalStep,
  ShellStep,
} from 'aws-cdk-lib/pipelines'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import { LinuxBuildImage, ComputeType } from 'aws-cdk-lib/aws-codebuild'
import { UserServicePipelineStage } from './user-service-pipeline.stage'

export class UserServicePipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)

    const nvmLoad = '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"'

    const githubConnectionArn = StringParameter.valueForStringParameter(
      this,
      'GITHUB_CONNECTION_ARN'
    )
    const owner = this.node.tryGetContext('github_alias')
    const repo = this.node.tryGetContext('github_repo')
    const branch = this.node.tryGetContext('github_branch')

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'codeFruteriaUserServicePipeline',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.connection(`${owner}/${repo}`, branch, {
          connectionArn: githubConnectionArn,
        }),
        installCommands: [
          'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash',
          'export NVM_DIR="$HOME/.nvm"',
          `${nvmLoad} && nvm install 22.4.0`,
          `${nvmLoad} && nvm alias default 22.4.0`,
          `${nvmLoad} && nvm use 22.4.0`,
          `${nvmLoad} && node -v`,
        ],
        commands: [
          'export NVM_DIR="$HOME/.nvm"',
          `${nvmLoad} && nvm use 22.4.0`,
          `${nvmLoad} && node -v`,
          `${nvmLoad} && yarn --version`,
          `${nvmLoad} && yarn install --frozen-lockfile`,
          `${nvmLoad} && yarn workspace infra cdk synth`,
        ],
        primaryOutputDirectory: 'infra/cdk.out',
      }),
      dockerEnabledForSynth: true,
      crossAccountKeys: true,
      selfMutation: true,
      codeBuildDefaults: {
        buildEnvironment: {
          buildImage: LinuxBuildImage.AMAZON_LINUX_2_5,
          computeType: ComputeType.LARGE,
        },
      },
    })

    pipeline.addStage(
      new UserServicePipelineStage(this, 'Staging', {
        env: {
          account: '058264384896',
          region: 'eu-central-1',
        },
      })
    )

    pipeline.addStage(
      new UserServicePipelineStage(this, 'Production', {
        env: {
          account: '058264384896',
          region: 'eu-central-1',
        },
      }),
      {
        pre: [new ManualApprovalStep('PromoteToProduction')],
      }
    )
    pipeline.buildPipeline()
  }
}
