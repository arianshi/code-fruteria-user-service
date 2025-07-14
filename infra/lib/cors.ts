import { Cors } from 'aws-cdk-lib/aws-apigateway'

export const defaultPreflightOptions = {
  allowHeaders: [
    'Content-Type',
    'X-Amz-Date',
    'Authorization',
    'X-Api-Key',
    'X-Custom-App-Version-Tag',
    'X-Aws-Waf-Token',
  ],
  allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowCredentials: false,
  allowOrigins: Cors.ALL_ORIGINS,
}
