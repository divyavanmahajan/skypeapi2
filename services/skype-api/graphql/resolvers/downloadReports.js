import xml2js from 'xml2js';
import uuidv4 from 'uuid/v4';
import * as dynamoDbLib from '../../../../libs/dynamodb-lib';
import AWS from '../../../../libs/aws-sdk';
import { loggerAPI } from '../../../../libs/logging';

const S3 = new AWS.S3();

import config from '../../../../config';
const logDbTable = dynamoDbLib.adjustedTableName(config.DYNAMO_TABLE);

const OUTPUT_KEY = 'logs/generated'; // Prefix for generated XML and JSON

/**
 * resolver - to combine JSON and XML into a single file.
 * returns the URLs to JSON and XML
 * @param {*} args
 */
const downloadReports = args => {
  loggerAPI.info(JSON.stringify(args, null, 2));
  const uuid = uuidv4();
  const keyprefix = `${OUTPUT_KEY}/${uuid}`;
  return queryDatabase(args)
    .then(result => sendReportsToS3(result, keyprefix))
    .then(result => createSignedUrls(result, keyprefix))
    .then(urls => {
      loggerAPI.debug(JSON.stringify(urls, null, 2));
      return urls;
    })
    .catch(err => {
      loggerAPI.error('Error in DownloadReports\n', err);
      return err.message;
    });
};
async function queryDatabase(args) {
  const params = {
    RequestItems: {},
    ReturnConsumedCapacity: 'INDEXES',
  };
  let Keys = [];
  const prefixRE = /^[^#]+#/;
  for (let index = 0; index < args.PK.length; index++) {
    const PK = args.PK[index];
    // Adjust the SK - to ensure prefix is JSON#
    const SK = args.SK[index].replace(prefixRE, 'JSON#');
    Keys.push({ PK, SK });
  }
  params.RequestItems[logDbTable] = {
    Keys,
  };
  loggerAPI.debug('DynamoDB params', JSON.stringify(params, null, 2));
  const result = await dynamoDbLib.call('batchGet', params);
  return result;
}

function createSignedUrls(result, keyprefix) {
  loggerAPI.info('Uploaded all files\n');
  loggerAPI.debug('  SignedURL response\n', JSON.stringify(result));
  loggerAPI.info('Generating urls');
  const jsonParams = { Bucket: config.LOG_BUCKET, Key: `${keyprefix}.json` };
  const xmlParams = { Bucket: config.LOG_BUCKET, Key: `${keyprefix}.xml` };
  const promises = [
    S3.getSignedUrlPromise('getObject', jsonParams),
    S3.getSignedUrlPromise('getObject', xmlParams),
  ];
  return Promise.all(promises);
}

function sendReportsToS3(result, keyprefix) {
  const { Responses } = result;
  const items = Responses[logDbTable];
  // Concatenate the JSON attribute and surround with [] to make it valid JSON.
  let resultObj = [];
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    try {
      const json = item['JSON'];
      const obj = JSON.parse(json);
      resultObj.push(obj);
    } catch (parseErr) {
      loggerAPI.error(`Parsing error ${index} item.`, parseErr);
    }
  }
  loggerAPI.info(
    `Extracted ${resultObj.length} items from ${items.length} keys.`,
  );
  const resultJSON = JSON.stringify({ Data: resultObj }, null, 2);
  const builder = new xml2js.Builder();
  const resultXML = builder.buildObject({ Data: resultObj });
  const xmlParam = {
    Bucket: config.LOG_BUCKET,
    Key: `${keyprefix}.xml`,
    Body: resultXML,
  };
  const jsonParam = {
    Bucket: config.LOG_BUCKET,
    Key: `${keyprefix}.json`,
    Body: resultJSON,
  };
  const promises = [
    S3.upload(xmlParam, { ContentType: 'application/xml' }).promise(),
    S3.upload(jsonParam, { ContentType: 'application/json' }).promise(),
  ];
  return Promise.all(promises);
}

export { downloadReports };
