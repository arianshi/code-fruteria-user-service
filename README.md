# code-fruteria-user-service

This is the backend service for the **Code Fruteria** project, responsible for user authentication, authorization, and user-related operations.

## 📐 Architecture

This service follows a modular structure, separating infrastructure code (CDK), business logic, and app handlers.

```
code-fruteria-user-service/
├── app/              # Lambda function logic and handlers
├── infra/            # AWS CDK infrastructure code
├── node_modules/
├── README.md
├── package.json
├── tsconfig.json
└── ...
```

## 🚀 Features

- AWS Lambda-based user services
- AWS CDK for infrastructure provisioning
- JWT-based authentication
- Environment configuration using SSM
- Modular architecture for easy scaling

## 🌐 Production URL

Frontend App: [https://smartretailstore.net](https://smartretailstore.net)

## 🛠️ Tech Stack

- TypeScript
- AWS Lambda + API Gateway
- AWS CDK
- Amazon SSM, Cognito, DynamoDB (if applicable)

## 📦 Getting Started

1. Install dependencies:

   ```bash
   yarn install
   ```

2. Deploy infrastructure (CDK bootstrap may be required first):

   ```bash
   npx cdk deploy --all
   ```

3. Run tests:

   ```bash
   yarn test
   ```

## 🧪 Testing

Tests are written using [Jest](https://jestjs.io/) or Vitest, depending on setup. Ensure all logic in `app/` is covered.

## 📁 Environments

| Environment | Description      |
|-------------|------------------|
| dev         | Local development|
| prod        | Production stack |

## 📄 License

MIT
