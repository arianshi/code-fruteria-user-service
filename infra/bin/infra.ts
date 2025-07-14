#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { UserServiceStack } from "../lib/user-service.stack";

const app = new App();

// eslint-disable-next-line no-new
new UserServiceStack(app, "CodeFruteriaUserService", {
  env: {
    region: "eu-central-1",
    account: "058264384896",
  },
});
