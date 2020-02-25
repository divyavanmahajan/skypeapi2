// Logplease.
// https://github.com/haadcode/logplease
// Default log level is DEBUG. You can set the log level with LOG environment variable,
// eg. LOG=debug node example/example.js. See Log levels for available options.
//
// To enable AWS SDK logging set APP_AWS_LOGGING=true in the environment

// Require logplease
const logplease = require('logplease');
import config from '../config';

// Set external log file option - e.g. running offline.
// logplease.setLogfile("debug.log");
// Set default log level in program.
logplease.setLogLevel('DEBUG');

// See - https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/logging-sdk-calls.html
// Create logger for AWS.
// To enable set APP_AWS_LOGGING=true in the environment
import AWS from './aws-sdk';
if (config.AWS_LOGGING) {
  const loggerAWS = logplease.create('AWS');
  // AWS.config.logger = console;
  // To send AWS logging to logplease.
  AWS.config.logger = loggerAWS;
}

// Create your own logger for your api.
export const loggerAPI = logplease.create('API', {
  useColors: false,
  showTimestamp: false,
});
export const loggerGQL = logplease.create('GQL', {
  useColors: false,
  showTimestamp: false,
});
export const loggerExtract = logplease.create('EXTRACT', {
  useColors: false,
  showTimestamp: false,
});
