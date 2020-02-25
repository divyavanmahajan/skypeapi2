import AWS from './aws-sdk';
import config from '../config';
import { loggerAPI } from './logging';

const dynamoDb = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true });
// Parameterize table names with stage name
function adjustedTableName(tablename) {
  return `${config.RESOURCEPREFIX}-${tablename}`;
}
//
function call(action, params) {
  const adjustedParams = params;
  if (params.TableName && !params.TableName.startsWith(config.RESOURCEPREFIX)) {
    adjustedParams.TableName = adjustedTableName(params.TableName);
  }
  loggerAPI.debug(
    `Adjusted parameters\n${JSON.stringify(adjustedParams, null, 2)}`,
    typeof dynamoDb[action],
  );
  if (typeof dynamoDb[action] === 'function') {
    return dynamoDb[action](adjustedParams).promise();
  } else {
    throw new Error(
      `DynamoDB-lib: Invalid method for DocumentCLient ${action}`,
    );
  }
}
export { call, adjustedTableName };
