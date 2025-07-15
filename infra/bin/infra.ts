#!/usr/bin/env node
import 'source-map-support/register'
import { App } from 'aws-cdk-lib'
import { UserServiceStack } from '../lib/user-service.stack'
import { UserServicePipelineStack } from '../lib/user-service-pipeline.stack'
import { UserServiceBuildStack } from '../lib/user-service-build.stack'

const app = new App()

// eslint-disable-next-line no-new
new UserServiceStack(app, 'code-fruteria-user-service', {
  env: {
    region: 'eu-central-1',
    account: '058264384896',
  },
  stage: 'Development',
})

// eslint-disable-next-line no-new
new UserServicePipelineStack(app, 'code-fruteria-user-service-pipeline', {
  env: {
    region: 'eu-central-1',
    account: '058264384896',
  },
})

// eslint-disable-next-line no-new
new UserServiceBuildStack(app, 'code-fruteria-user-service-build', {
  env: {
    region: 'eu-central-1',
    account: '058264384896',
  },
  stage: 'Development',
})
