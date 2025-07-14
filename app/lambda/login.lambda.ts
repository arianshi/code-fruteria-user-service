import middy from '@middy/core'
import cors from '@middy/http-cors'
import jsonBodyParser from '@middy/http-json-body-parser'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { UNAUTHORIZED, OK } from 'http-status'
import Joi from 'joi'
import { validator } from '../middleware/joi-validator'
import { logger } from '../lib/logger'
import { injectLambdaContext } from '@aws-lambda-powertools/logger'
import { clientVersion } from '../middleware/client-version'
import { customHttpErrorLogger } from '../lib/custom-http-error-logger'

const USER = { username: 'admin', password: 'password' }

const schema = Joi.object({
  body: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),
})

async function baseLoginHandler(
  event: APIGatewayProxyEvent & {
    body: {
      username: string
      password: string
    }
  }
): Promise<APIGatewayProxyResult> {
  const { username, password } = event.body

  logger.appendKeys({ username })

  if (username === USER.username && password === USER.password) {
    return {
      statusCode: OK,
      body: JSON.stringify({ success: true, message: 'Login successful' }),
    }
  }

  return {
    statusCode: UNAUTHORIZED,
    body: JSON.stringify({ success: false, message: 'Invalid credentials' }),
  }
}

export const handler = middy(baseLoginHandler)
  .use(injectLambdaContext(logger))
  .use(clientVersion(logger))
  .use(jsonBodyParser())
  .use(validator({ schema, options: { stripUnknown: true } }))
  .use(cors({ credentials: true }))
  .use(customHttpErrorLogger({ logger }))
