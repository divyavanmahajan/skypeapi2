const STAGE = process.env.APP_STAGE || "dev";
// Prefix used while creating resources. This is used to determine the DYNAMO Tables.
const RESOURCEPREFIX = process.env.APP_RESOURCEPREFIX;
// DYNAMO_TABLE = suffix of the DynamoDb table created as a resource.
const DYNAMO_TABLE = process.env.APP_DYNAMO_TABLE || "db";
// LOG_BUCKET = S3 bucket created as a resource for the app.
const LOG_BUCKET = process.env.APP_LOG_BUCKET;
// IS_LOCAL = true , when running offline. This turns off some of AWS Xray
const IS_LOCAL = process.env.IS_LOCAL;
// Debug levels
const APP_DEBUG = process.env.APP_DEBUG;
// Enable the GraphQL playground and introspection
const GRAPHQL_PLAYGROUND = process.env.APP_GRAPHQL_PLAYGROUND || false;
console.log(JSON.stringify(process.env, null, 2));
const adminPhoneNumber = "+14151234567";

// Sample - stage specific configuration.
const stageConfigs = {
  dev: {
    stripeKeyName: "/stripeSecretKey/test"
  },
  prod: {
    stripeKeyName: "/stripeSecretKey/live"
  }
};
const OUTPUT_KEY = "logs/generated"; // Prefix for generated XML and JSON

// Default stage configuration - dev is used as default here.
const config = stageConfigs[STAGE] || stageConfigs.dev;

module.exports = {
  STAGE,
  RESOURCEPREFIX,
  adminPhoneNumber,
  DYNAMO_TABLE,
  LOG_BUCKET,
  OUTPUT_KEY,
  IS_LOCAL,
  APP_DEBUG,
  GRAPHQL_PLAYGROUND,
  ...config
};
