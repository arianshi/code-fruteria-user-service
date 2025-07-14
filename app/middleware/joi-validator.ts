import { MiddlewareObj } from '@middy/core'
import { UNPROCESSABLE_ENTITY } from 'http-status'
import createError from 'http-errors'
import Joi from 'joi'
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda'
import { logger } from '../lib/logger'
import { NonCriticalError } from '../lib/error'

export interface IJoiMiddlewareProps {
  schema: Joi.Schema
  options?: Joi.ValidationOptions
  failAsNonCriticalError?: boolean
}

export function validator({
  schema,
  options,
  failAsNonCriticalError = false,
}: IJoiMiddlewareProps): MiddlewareObj<APIGatewayEvent, APIGatewayProxyResult> {
  if (!Joi.isSchema(schema)) {
    logger.error(
      '[joi-validator] The schema you provided is not a valid Joi schema'
    )
    throw new Error('The schema is not valid')
  }

  return {
    async before({ event }): Promise<void> {
      try {
        const valid = await schema.validateAsync(event, options)
        Object.assign(event, valid)
      } catch (validationFailure) {
        const error = createError(
          UNPROCESSABLE_ENTITY,
          JSON.stringify((validationFailure as any).details)
        )
        event.headers = Object.assign({}, event.headers)

        if (failAsNonCriticalError) {
          throw new NonCriticalError(error?.message)
        }

        throw error
      }
    },
  }
}
