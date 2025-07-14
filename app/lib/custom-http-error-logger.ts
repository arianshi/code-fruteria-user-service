import { NonCriticalError } from './error'
import httpErrorHandler from '@middy/http-error-handler'
import { logger } from './logger'

export const customHttpErrorLogger = (opts: { logger: typeof logger }) => {
  return {
    onError: (handler: any) =>
      httpErrorHandler({
        logger:
          handler.error instanceof NonCriticalError
            ? opts.logger.warn.bind(opts.logger)
            : opts.logger.error.bind(opts.logger),
      }).onError?.(handler),
  }
}
