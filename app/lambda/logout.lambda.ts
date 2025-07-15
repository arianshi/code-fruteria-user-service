import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import middy from '@middy/core'
import cors from '@middy/http-cors'
import { injectLambdaContext } from '@aws-lambda-powertools/logger'
import { logger } from '../lib/logger'
import { clientVersion } from '../middleware/client-version'
import { customHttpErrorLogger } from '../lib/custom-http-error-logger'
import { verifyToken } from '../lib/jwt-utils'

async function baseLogoutHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const authHeader = event.headers?.authorization || event.headers?.Authorization
  const token = authHeader?.replace(/^Bearer /i, '').trim()

  if (!token) {
    logger.info('Logout request missing Authorization header')
    return {
      statusCode: 401,
      body: JSON.stringify({
        code: 4005,
        message: 'Missing Authorization header',
      }),
    }
  }

  try {
    const decoded = verifyToken(token)
    logger.info('Logout with valid token', { decoded })

    return {
      statusCode: 200,
      body: JSON.stringify({
        code: 2000,
        message: 'Logout successful. Please remove token from client.',
      }),
    }
  } catch (err) {
    logger.info('Token verification failed during logout', { err })
    return {
      statusCode: 401,
      body: JSON.stringify({
        code: 4006,
        message: 'Invalid or expired token',
      }),
    }
  }
}

export const handler = middy(baseLogoutHandler)
  .use(injectLambdaContext(logger))
  .use(clientVersion(logger))
  .use(cors({ credentials: true }))
  .use(customHttpErrorLogger({ logger }))
