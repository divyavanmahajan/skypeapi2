import aws from 'aws-sdk';
import xray from 'aws-xray-sdk';
import config from '../config';

// Do not enable tracing for 'invoke local'
const awsWrapped = config.IS_LOCAL ? aws : xray.captureAWS(aws);
// No runtime error if running offline.
// See https://github.com/aws/aws-xray-sdk-node/tree/master/packages/core#context-missing-strategy-configuration
if (config.IS_LOCAL) {
  xray.setContextMissingStrategy('LOG_ERROR');
}
export default awsWrapped;
