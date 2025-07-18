import jwt from 'jsonwebtoken'
import { logger } from './logger'

export interface JwtPayload {
  sub: string       // userId
  username: string
  role: string
  iat?: number
  exp?: number
}

const JWT_SECRET = process.env.JWT_SECRET!

const ACCESS_TOKEN_EXPIRY = '2h'
const REFRESH_TOKEN_EXPIRY = '7d'

export function signTokens(payload: Pick<JwtPayload, 'sub' | 'username' | 'role'>) {
  const fullPayload: JwtPayload = {
    ...payload,
  }

  const access_token = jwt.sign(fullPayload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  })

  const refresh_token = jwt.sign(fullPayload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  })

  return {
    code: 2000,
    message: 'Token generated successfully',
    data: {
      access_token,
      refresh_token,
      token_type: 'Bearer',
      expires_in: 2 * 60 * 60,
    },
  }
}

export function verifyToken(token: string): JwtPayload {
 const cleaned = token.replace(/^"(.*)"$/, '$1')
  logger.info('verifying::: ', { token: cleaned, JWT_SECRET })
  return jwt.verify(cleaned, JWT_SECRET) as JwtPayload
}
