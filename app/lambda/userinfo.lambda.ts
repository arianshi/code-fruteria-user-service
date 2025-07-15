import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import middy from '@middy/core'
import cors from '@middy/http-cors'
import { injectLambdaContext } from '@aws-lambda-powertools/logger'
import { logger } from '../lib/logger'
import { clientVersion } from '../middleware/client-version'
import { customHttpErrorLogger } from '../lib/custom-http-error-logger'
import { verifyToken } from '../lib/jwt-utils'

async function baseUserInfoHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const authHeader = event.headers?.authorization || event.headers?.Authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.info('Missing or invalid Authorization header')
    return {
      statusCode: 401,
      body: JSON.stringify({ code: 4005, message: 'Missing or invalid Authorization header' }),
    }
  }

  const token = authHeader.replace(/^Bearer /i, '').trim()

  try {

    logger.info('get token to verify', { token })
    const decoded = verifyToken(token)

    logger.info('Token get verification decoded', { decoded: JSON.stringify(decoded) })

    return {
      statusCode: 200,
      body: JSON.stringify({
        code: 2000,
        message: 'User info retrieved successfully',
        data: {
          username: decoded.username,
        },
      }),
    }
  } catch (err) {
    logger.info('Token verification failed', { err })
    return {
      statusCode: 401,
      body: JSON.stringify({ code: 4006, message: 'Invalid or expired token' }),
    }
  }
}

export const handler = middy(baseUserInfoHandler)
  .use(injectLambdaContext(logger))
  .use(clientVersion(logger))
  .use(cors({ credentials: true }))
  .use(customHttpErrorLogger({ logger }))