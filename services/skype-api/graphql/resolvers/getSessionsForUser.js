const dynamoDbLib = require("../../../../libs/dynamodb-lib");
const config = require("../../../../config");
const { DYNAMO_TABLE } = config;

/**
 * getSessionsForUser - resolver to get all sessions stored in the table.
 * @param {*} args
 */
const getSessionsForUser = args => {
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
  const result = await dynamoDbLib.call("query", params);
  return result;
}

exports.getSessionsForUser = getSessionsForUser;
