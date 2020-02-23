const xml2js = require("xml2js");
const uuidv4 = require("uuid/v4");
const dynamoDbLib = require("../../../../libs/dynamodb-lib");
const AWS = require("../../../../libs/aws-sdk");
const S3 = new AWS.S3();

const config = require("../../../../config");
const { OUTPUT_KEY, DYNAMO_TABLE, LOG_BUCKET } = config;
/**
 * resolver - to combine JSON and XML into a single file.
 * returns the URLs to JSON and XML
 * @param {*} args
 */
const downloadReports = args => {
  console.info(JSON.stringify(args, null, 2));
  const uuid = uuidv4();
  const keyprefix = `${OUTPUT_KEY}/${uuid}`;
  return queryDatabase(args)
    .then(result => sendReportsToS3(result, keyprefix))
    .then(result => createSignedUrls(result, keyprefix))
    .then(urls => {
      //   console.info(JSON.stringify(urls, null, 2));
      return urls;
    })
    .catch(err => {
      console.info("Error\n", err);
      return err.message;
    });
};
async function queryDatabase(args) {
  const params = {
    RequestItems: {},
    ReturnConsumedCapacity: "INDEXES"
  };
  let Keys = [];
  const prefixRE = /^[^#]+#/;
  for (let index = 0; index < args.PK.length; index++) {
    const PK = args.PK[index];
    // Adjust the SK - to ensure prefix is JSON#
    const SK = args.SK[index].replace(prefixRE, "JSON#");
    Keys.push({ PK, SK });
  }
  params.RequestItems[DYNAMO_TABLE] = {
    Keys
  };
  console.info("DynamoDB params", JSON.stringify(params, null, 2));
  const result = await dynamoDbLib.call("batchGet", params);
  return result;
}

function createSignedUrls(result, keyprefix) {
  console.info("Uploaded all files\n", JSON.stringify(result));
  console.info("Generating urls");
  const jsonParams = { Bucket: LOG_BUCKET, Key: `${keyprefix}.json` };
  const xmlParams = { Bucket: LOG_BUCKET, Key: `${keyprefix}.xml` };
  const promises = [
    S3.getSignedUrlPromise("getObject", jsonParams),
    S3.getSignedUrlPromise("getObject", xmlParams)
  ];
  return Promise.all(promises);
}

function sendReportsToS3(result, keyprefix) {
  const { Responses } = result;
  const items = Responses[DYNAMO_TABLE];
  // Concatenate the JSON attribute and surround with [] to make it valid JSON.
  let resultObj = [];
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    try {
      const json = item["JSON"];
      const obj = JSON.parse(json);
      resultObj.push(obj);
    } catch (parseErr) {
      console.error(`Parsing error ${index} item.`, parseErr);
    }
  }
  console.info(
    `Extracted ${resultObj.length} items from ${items.length} keys.`
  );
  const resultJSON = JSON.stringify({ Data: resultObj }, null, 2);
  const builder = new xml2js.Builder();
  const resultXML = builder.buildObject({ Data: resultObj });
  const xmlParam = {
    Bucket: LOG_BUCKET,
    Key: `${keyprefix}.xml`,
    Body: resultXML
  };
  const jsonParam = {
    Bucket: LOG_BUCKET,
    Key: `${keyprefix}.json`,
    Body: resultJSON
  };
  const promises = [
    S3.upload(xmlParam, { ContentType: "application/xml" }).promise(),
    S3.upload(jsonParam, { ContentType: "application/json" }).promise()
  ];
  return Promise.all(promises);
}

exports.downloadReports = downloadReports;
