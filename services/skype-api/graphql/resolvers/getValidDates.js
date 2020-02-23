const dynamoDbLib = require("../../../../libs/dynamodb-lib");
const config = require("../../../../config");
const { DYNAMO_TABLE } = config;

/**
 * getValidDates - resolver to get all calendar days.
 * @param {*} args
 */
const getValidDates = args => {
  return queryDatabase(args).then(result => {
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

async function queryDatabase(args) {
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
    ScanIndexForward: false,
    ReturnConsumedCapacity: "INDEXES"
  };
  console.info("DynamoDB params", JSON.stringify(params, null, 2));
  const result = await dynamoDbLib.call("query", params);
  return result;
}

exports.getValidDates = getValidDates;
