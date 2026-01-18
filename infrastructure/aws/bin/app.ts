#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TrackingInfrastructureStack } from '../lib/tracking-infrastructure-stack';

const app = new cdk.App();

new TrackingInfrastructureStack(app, 'TrackingInfrastructureStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
