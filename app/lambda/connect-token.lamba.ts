import middy from '@middy/core'
import cors from '@middy/http-cors'
import jsonBodyParser from '@middy/http-json-body-parser'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { OK, BAD_REQUEST, UNAUTHORIZED } from 'http-status'
import Joi from 'joi'
import jwt from 'jsonwebtoken'
import CryptoJS from 'crypto-js'
import { validator } from '../middleware/joi-validator'
import { logger } from '../lib/logger'
import { injectLambdaContext } from '@aws-lambda-powertools/logger'
import { clientVersion } from '../middleware/client-version'
import { customHttpErrorLogger } from '../lib/custom-http-error-logger'
import { verifyToken } from '../lib/jwt-utils'

// Environment
const USER = { username: process.env.LOGIN_USERNAME, password: process.env.LOGIN_PASSWORD }
const SECRET_KEY = process.env.LOGIN_SECRET_KEY!
const JWT_SECRET = process.env.JWT_SECRET!
const ACCESS_TOKEN_EXPIRY = '2h'
const REFRESH_TOKEN_EXPIRY = '7d'

// Request validation schema
const schema = Joi.object({
  body: Joi.object({
    grant_type: Joi.string().valid('password', 'refresh_token').required(),
    encrypted: Joi.string(),
    refresh_token: Joi.string(),
  }),
})

// Sign token utility
function signTokens(payload: object) {
  const tokens = {
    access_token: jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY }),
    refresh_token: jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY }),
    token_type: 'Bearer',
    expires_in: 2 * 60 * 60, // 7200s
  }

  return {
    code: 2000,
    message: 'Token generated successfully',
    data: tokens,
  }
}

async function baseConnectTokenHandler(
  event: APIGatewayProxyEvent & {
    body: {
      grant_type: string
      encrypted?: string
      refresh_token?: string
    }
  }
): Promise<APIGatewayProxyResult> {
  const { grant_type, encrypted, refresh_token } = event.body

  logger.info('✅ ✅ ✅ baseConnectTokenHandler: ', { grant_type })

  if (grant_type === 'password') {
    let decryptedStr = ''
    try {
      const bytes = CryptoJS.AES.decrypt(encrypted!, SECRET_KEY)
      decryptedStr = bytes.toString(CryptoJS.enc.Utf8)
    } catch (err) {
      logger.info('AES decrypt error', { err })
      return {
        statusCode: BAD_REQUEST,
        body: JSON.stringify({ code: 4001, error: 'invalid_payload', message: 'Invalid encrypted content' }),
      }
    }

    if (!decryptedStr) {
      return {
        statusCode: BAD_REQUEST,
        body: JSON.stringify({ code: 4001, error: 'invalid_payload', message: 'Empty decrypted result' }),
      }
    }

    let credentials: { username: string; password: string }
    try {
      credentials = JSON.parse(decryptedStr)
    } catch {
      return {
        statusCode: BAD_REQUEST,
        body: JSON.stringify({ code: 4001, error: 'invalid_payload', message: 'Decrypted data is not valid JSON' }),
      }
    }

    const { username, password } = credentials
    logger.appendKeys({ username })

    if (username === USER.username && password === USER.password) {
      const payload = { sub: username, role: 'basicUser' }
      return {
        statusCode: OK,
        body: JSON.stringify(signTokens(payload)),
      }
    } else {
      return {
        statusCode: OK,
        body: JSON.stringify({
          code: 4002,
          error: 'invalid_grant',
          message: 'Username or password incorrect',
        }),
      }
    }
  }

  if (grant_type === 'refresh_token') {
    try {

      logger.info('✅ ✅ ✅ refresh_token:::: ', { refresh_token })

      const decoded = verifyToken(refresh_token as string)
      
      logger.info('refresh_token token', { decoded: JSON.stringify(decoded) })

      const payload = { sub: decoded.sub, role: 'basicUser' }

      return {
        statusCode: OK,
        body: JSON.stringify(signTokens(payload)),
      }
      
    } catch (err) {
      logger.info('Invalid refresh token', { err })
      return {
        statusCode: UNAUTHORIZED,
        body: JSON.stringify({
          code: 4003,
          error: 'invalid_grant',
          message: 'Refresh token expired or invalid',
        }),
      }
    }
  }

  return {
    statusCode: BAD_REQUEST,
    body: JSON.stringify({
      code: 4004,
      error: 'unsupported_grant_type',
      message: 'Grant type not supported',
    }),
  }
}

export const handler = middy(baseConnectTokenHandler)
  .use(injectLambdaContext(logger))
  .use(clientVersion(logger))
  .use(jsonBodyParser())
  .use(validator({ schema, options: { stripUnknown: true } }))
  .use(cors({ credentials: true }))
  .use(customHttpErrorLogger({ logger }))
