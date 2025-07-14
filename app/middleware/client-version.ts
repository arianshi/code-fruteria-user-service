import { Logger } from '@aws-lambda-powertools/logger'
import { MiddlewareObj } from '@middy/core'
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda'

export interface IIdentityMiddlewareProps {
  options?: any
}

export interface IIdentity {
  cognitoUsername: string
  phoneNumber: string
}

export interface IEventIdentity {
  user: IIdentity
}

export function clientVersion(
  logger: Logger
): MiddlewareObj<APIGatewayEvent, APIGatewayProxyResult> {
  return {
    async before({ event }): Promise<void> {
      const clientVersion =
        event?.headers?.['x-custom-app-version-tag'] ??
        event?.multiValueHeaders?.['x-custom-app-version-tag']?.[0]
      if (clientVersion) {
        logger.appendKeys({
          clientVersion,
        })
      }
    },
  }
}
