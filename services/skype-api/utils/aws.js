const AWSXRay = require('aws-xray-sdk'); // eslint-disable-line global-require
const AWS = AWSXRay.captureAWS(require('aws-sdk')); // eslint-disable-line global-require
const S3 = new AWS.S3();
const LOG_BUCKET = process.env.LOG_BUCKET;
const LOG_XML_PREFIX = 'logs/xml';
const LOG_RAW_PREFIX = 'logs/raw';
const DYNAMO_TABLE = process.env.DYNAMO_TABLE;
const documentClient = new AWS.DynamoDB.DocumentClient();

exports.S3 = S3;
exports.AWS = AWS;
exports.AWSXRay = AWSXRay;
exports.LOG_BUCKET = LOG_BUCKET;
exports.LOG_XML_PREFIX = LOG_XML_PREFIX;
exports.LOG_RAW_PREFIX = LOG_RAW_PREFIX;
exports.DYNAMO_TABLE = DYNAMO_TABLE;
exports.documentClient = documentClient;
