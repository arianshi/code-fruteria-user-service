import { Logger } from "@aws-lambda-powertools/logger";

export const logger = new Logger({
  logLevel: process.env.DEBUG_LEVEL || "INFO",
});

export function httpErrorHandlerLogger(error: {
  message: string;
  statusCode?: number;
  suppressLogger?: boolean;
}) {
  if (error.suppressLogger) {
    return;
  }

  if (error.statusCode && error.statusCode < 500) {
    logger.info(error.message, { error });

    return;
  }

  logger.info(error.message, { error });
}
