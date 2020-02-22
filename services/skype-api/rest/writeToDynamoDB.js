const AWSXRay = require("aws-xray-sdk"); // eslint-disable-line global-require
const AWS = AWSXRay.captureAWS(require("aws-sdk")); // eslint-disable-line global-require
const util = require("util");

const DYNAMO_TABLE = process.env.DYNAMO_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  convertEmptyValues: true
});

const safePromisify = function(fun, methodsArray) {
  const suffix = "Async";
  methodsArray.forEach(method => {
    fun[method + suffix] = util.promisify(fun[method]);
  });
};
safePromisify(dynamoDb, ["batchWrite"]);

async function writeToDynamoDB(requests, index) {
  const dbrequest = {
    RequestItems: {
      // Inserted below.
    },
    ReturnConsumedCapacity: "INDEXES",
    ReturnItemCollectionMetrics: "SIZE"
  };

  try {
    dbrequest["RequestItems"][DYNAMO_TABLE] = requests;
    console.info(`Writing report ${index} to DynamoDB.`);
    // console.info(`Writing reports to DynamoDB.\n${JSON.stringify(dbrequest, null, 2)}`);
    // Test with aws dynamodb batch-write-item --cli-input-json file://input.json
    const result = await dynamoDb.batchWriteAsync(dbrequest);
    console.info(
      `Report ${index} written. \n ${JSON.stringify(result, null, 2)}`
    );
    return { message: `Report ${index} saved.`, result };
  } catch (err) {
    console.error(`Report ${index} not written.\n${err}`);
    throw err;
  }
}

async function updateCalendarInDB(requests) {
  // See createUpdateRequests for structure of the request.
  const keys = Object.keys(requests);
  keys.forEach(async key => {
    const [PK, SK] = key.split(/~/);
    const counter = requests[key];
    if (PK && SK) {
      const params = {
        TableName: DYNAMO_TABLE,
        Key: { PK, SK },
        UpdateExpression: "set #c = #c + :x",
        ExpressionAttributeNames: { "#a": "counter" },
        ExpressionAttributeValues: {
          ":x": counter
        }
      };
      try {
        await dynamoDb.update(params);
        console.info(`Counter ${key} incremented by ${counter}`);
      } catch (err1) {
        console.error(`Failed to update counter ${key}.\n${err1}`);
        throw err1;
      }
    }
  });
}
module.exports.writeToDynamoDB = writeToDynamoDB;
module.exports.updateCalendarInDB = updateCalendarInDB;
