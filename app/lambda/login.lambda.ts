import middy from '@middy/core'
import cors from '@middy/http-cors'
import jsonBodyParser from '@middy/http-json-body-parser'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { UNAUTHORIZED, OK, BAD_REQUEST } from 'http-status'
import Joi from 'joi'
import { validator } from '../middleware/joi-validator'
import { logger } from '../lib/logger'
import { injectLambdaContext } from '@aws-lambda-powertools/logger'
import { clientVersion } from '../middleware/client-version'
import { customHttpErrorLogger } from '../lib/custom-http-error-logger'
import CryptoJS from 'crypto-js'

const USER = { username: process.env.LOGIN_USERNAME, password: process.env.LOGIN_PASSWORD }

const SECRET_KEY = process.env.LOGIN_SECRET_KEY

const schema = Joi.object({
  body: Joi.object({
    encrypted: Joi.string().required(),
  }),
})

async function baseLoginHandler(
  event: APIGatewayProxyEvent & {
    body: {
      encrypted: string
    }
  }
): Promise<APIGatewayProxyResult> {

  logger.error('Login SECRET_KEY', { SECRET_KEY })

  try {
    const bytes = CryptoJS.AES.decrypt(event.body.encrypted, SECRET_KEY as string)
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8)

    if (!decryptedStr) {
      return {
        statusCode: BAD_REQUEST,
        body: JSON.stringify({ success: false, message: 'Invalid encrypted payload' }),
      }
    }

    const { username, password } = JSON.parse(decryptedStr)
    logger.appendKeys({ username })

    if (username === USER.username && password === USER.password) {
      return {
        statusCode: OK,
        body: JSON.stringify({ success: true, message: 'Login successful' }),
      }
    }

    return {
      statusCode: UNAUTHORIZED,
      body: JSON.stringify({ success: false, message: 'username and password do not match' }),
    }
  } catch (err) {
    logger.error('Login error', {err})
    return {
      statusCode: BAD_REQUEST,
      body: JSON.stringify({ success: false, message: 'Failed to decrypt or parse payload' }),
    }
  }
}

export const handler = middy(baseLoginHandler)
  .use(injectLambdaContext(logger))
  .use(clientVersion(logger))
  .use(jsonBodyParser())
  .use(validator({ schema, options: { stripUnknown: true } }))
  .use(cors({ credentials: true }))
  .use(customHttpErrorLogger({ logger }))
