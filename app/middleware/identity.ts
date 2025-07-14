import { MiddlewareObj } from '@middy/core'
import {
  APIGatewayEvent,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'
import { Logger } from '@aws-lambda-powertools/logger'
import createHttpError from 'http-errors'
import { FORBIDDEN } from 'http-status'

export interface IIdentity {
  cognitoUsername: string
  phoneNumber: string
}

export interface IEventIdentity {
  user: IIdentity
}

export function identity(
  logger: Logger,
  options?: { authorizeRole?: string }
): MiddlewareObj<APIGatewayEvent, APIGatewayProxyResult> {
  return {
    async before({ event }): Promise<void> {
      const claims = event.requestContext.authorizer?.claims

      if (claims) {
        ;(
          event as APIGatewayProxyEvent & {
            user: { cognitoUsername: string; phoneNumber: string }
          }
        ).user = {
          cognitoUsername: claims['cognito:username'],
          phoneNumber: claims.phone_number,
        }

        logger.appendKeys({
          userId: claims['cognito:username'],
        })
      }

      if (options?.authorizeRole != null) {
        const groups =
          claims?.['cognito:groups']
            ?.split(',')
            .map((group: string) => group.toLowerCase().trim()) || []

        if (!groups.includes(options.authorizeRole.toLowerCase())) {
          throw createHttpError(FORBIDDEN, 'Forbidden')
        }
      }
    },
  }
}
