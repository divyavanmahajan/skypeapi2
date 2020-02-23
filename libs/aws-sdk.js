const aws = require("aws-sdk");
const xray = require("aws-xray-sdk");
const { IS_LOCAL } = require("../config");

// Do not enable tracing for 'invoke local'
const awsWrapped = IS_LOCAL ? aws : xray.captureAWS(aws);
// No runtime error if running offline. See https://github.com/aws/aws-xray-sdk-node/tree/master/packages/core#context-missing-strategy-configuration
if (IS_LOCAL) {
  xray.setContextMissingStrategy("LOG_ERROR");
}
module.exports = exports = awsWrapped;
