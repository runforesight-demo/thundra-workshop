#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { LambdaStack } from '../lib/lambda-stack';

const result = require('dotenv').config({ path: `../${process.env.PROFILE}/.env` })
if (result.error) {
  throw result.error;
}

const app = new cdk.App();

const props = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
};

new LambdaStack(app, `presentation-lambda-stack-${process.env.STAGE}`, props);
