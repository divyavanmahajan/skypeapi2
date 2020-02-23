const AWS = require("./aws-sdk");
const { RESOURCEPREFIX } = require("../config");

const dynamoDb = new AWS.DynamoDB.DocumentClient({
  convertEmptyValues: true
});

function call(action, params) {
  // Parameterize table names with stage name
  const adjustedParams = {
    ...params,
    TableName: `${RESOURCEPREFIX}-${params.TableName}`
  };
  console.log(
    `Adjusted parameters\n${JSON.stringify(adjustedParams, null, 2)}`
  );
  return dynamoDb[action](adjustedParams).promise();
}
exports.call = call;
