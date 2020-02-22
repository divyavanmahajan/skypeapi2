// const util = require('util');
const xml2js = require("xml2js");
const uuidv4 = require("uuid/v4");

const AWSXRay = require("aws-xray-sdk"); // eslint-disable-line global-require
const AWS = AWSXRay.captureAWS(require("aws-sdk")); // eslint-disable-line global-require
const S3 = new AWS.S3();
const docClient = new AWS.DynamoDB.DocumentClient();
const DYNAMO_TABLE = process.env.DYNAMO_TABLE;
const LOG_BUCKET = process.env.LOG_BUCKET;
const OUTPUT_KEY = "logs/generated"; // Prefix for generated XML and JSON

// add to handler.js
const promisify = foo =>
  new Promise((resolve, reject) => {
    foo((error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });

/**
 * resolver - to combine JSON and XML into a single file.
 * returns the URLs to JSON and XML
 * @param {*} args
 */
const downloadReports = args => {
  console.info(JSON.stringify(args, null, 2));
  const uuid = uuidv4();
  const keyprefix = `${OUTPUT_KEY}/${uuid}`;
  // return 'http://www.google.com';
  return promisify(callback => {
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
    docClient.batchGet(params, callback);
  })
    .then(result => {
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
    })
    .then(result => {
      console.info("Uploaded all files\n", JSON.stringify(result));
      console.info("Generating urls");
      const jsonParams = { Bucket: LOG_BUCKET, Key: `${keyprefix}.json` };
      const xmlParams = { Bucket: LOG_BUCKET, Key: `${keyprefix}.xml` };
      const promises = [
        S3.getSignedUrlPromise("getObject", jsonParams),
        S3.getSignedUrlPromise("getObject", xmlParams)
      ];
      return Promise.all(promises);
    })
    .then(urls => {
      console.info(JSON.stringify(urls, null, 2));
      return urls;
    })
    .catch(err => {
      console.info("Error\n", err);
      return err.message;
    });
};
/**
 * getSessionsForUser - resolver to get all sessions stored in the table.
 * @param {*} args
 */
const getSessionsForUser = args => {
  return promisify(callback => {
    let searchvalues = null;
    if (args.searchByDate) {
      searchvalues = {
        ":v1": `DAY#${args.startfrom}`,
        ":v2": `USER#sip:${args.user}`
      };
    } else {
      searchvalues = {
        ":v1": `USER#sip:${args.user}`,
        ":v2": `RE#${args.startfrom}`
      };
    }
    const params = {
      TableName: DYNAMO_TABLE,
      KeyConditionExpression: "PK = :v1 and begins_with(SK,:v2)",
      ExpressionAttributeValues: searchvalues,
      // IndexName: 'tweet-index',
      Limit: args.limit,
      ScanIndexForward: false,
      ReturnConsumedCapacity: "INDEXES"
    };

    if (args.nextToken && args.nextToken.PK && args.nextToken.PK.length > 2) {
      params.ExclusiveStartKey = {
        PK: args.nextToken.PK,
        SK: args.nextToken.SK
      };
    }
    console.info("DynamoDB params", JSON.stringify(params, null, 2));
    docClient.query(params, callback);
  }).then(result => {
    const response = { ...result };

    console.log(result);

    if (result.LastEvaluatedKey) {
      response.nextToken = {
        PK: result.LastEvaluatedKey.PK,
        SK: result.LastEvaluatedKey.SK
      };
    }

    return response;
  });
};

/**
 * getValidDates - resolver to get all calendar days.
 * @param {*} args
 */
const getValidDates = args => {
  return promisify(callback => {
    // const afterFilter = `and SK `
    // if (args.after)
    let searchvalues = {
      ":v1": `CALENDAR`
    };
    if (args.user && args.user.length > 3) {
      searchvalues = {
        ":v1": `CAL#sip:${args.user}`
      };
    }
    const params = {
      TableName: DYNAMO_TABLE,
      KeyConditionExpression: "PK = :v1",
      ExpressionAttributeValues: searchvalues,
      // IndexName: 'tweet-index',
      // Limit: args.limit,
      ScanIndexForward: false,
      ReturnConsumedCapacity: "INDEXES"
    };

    // if (args.nextToken && args.nextToken.PK && args.nextToken.PK.length > 2) {
    //   params.ExclusiveStartKey = {
    //     PK: args.nextToken.PK,
    //     SK: args.nextToken.SK,
    //   };
    // }
    console.info("DynamoDB params", JSON.stringify(params, null, 2));
    docClient.query(params, callback);
  }).then(result => {
    const response = { ...result };

    console.log(result);

    if (result.LastEvaluatedKey) {
      response.nextToken = {
        PK: result.LastEvaluatedKey.PK,
        SK: result.LastEvaluatedKey.SK
      };
    }

    return response;
  });
};

// Pseudo Data API;
const data = {
  getSessionsForUser,
  downloadReports,
  getValidDates
};
// eslint-disable-next-line import/prefer-default-export
module.exports.resolvers = {
  Query: {
    getSessionsForUser: (root, args) => data.getSessionsForUser(args),
    downloadReports: (root, args) => data.downloadReports(args),
    getValidDates: (root, args) => data.getValidDates(args)
  }
  // User: {
  //   tweets: (obj, args) => data.getPaginatedTweets(obj.handle, args),
  // },
};
