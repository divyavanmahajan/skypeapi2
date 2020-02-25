import * as dynamoDbLib from '../../../../libs/dynamodb-lib';
import config from '../../../../config';
import { loggerAPI } from '../../../../libs/logging';
const { COUNTER_TABLE } = config;

/**
 * getValidDates - resolver to get all calendar days.
 * @param {*} args
 */
const getValidDates = args => {
  return queryDatabase(args).then(result => {
    const response = { ...result };
    loggerAPI.debug(result);
    if (result.LastEvaluatedKey) {
      response.nextToken = {
        PK: result.LastEvaluatedKey.PK,
        SK: result.LastEvaluatedKey.SK,
      };
    }
    return response;
  });
};

async function queryDatabase(args) {
  let searchvalues = {
    ':v1': 'CALENDAR',
  };
  if (args.user && args.user.length > 3) {
    searchvalues = {
      ':v1': `CAL#sip:${args.user}`,
    };
  }
  const params = {
    TableName: COUNTER_TABLE,
    KeyConditionExpression: 'PK = :v1',
    ExpressionAttributeValues: searchvalues,
    ScanIndexForward: false,
    ReturnConsumedCapacity: 'INDEXES',
  };
  loggerAPI.debug('DynamoDB params', JSON.stringify(params, null, 2));
  const result = await dynamoDbLib.call('query', params);
  return result;
}

export { getValidDates };
