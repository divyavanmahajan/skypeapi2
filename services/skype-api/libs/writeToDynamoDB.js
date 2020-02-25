import config from '../../../config';
import * as dynamoDbLib from '../../../libs/dynamodb-lib';
import { loggerAPI } from '../../../libs/logging';
import { createReportWriteRequest } from './records';

const logDbTable = dynamoDbLib.adjustedTableName(config.DYNAMO_TABLE);
const counterDbTable = dynamoDbLib.adjustedTableName(config.COUNTER_TABLE);
async function writeReportsToDB(reports) {
  // Step 3: Create DynamoDB requests from the extracted reports.
  loggerAPI.info(`Writing ${reports.length} reports.`);
  await updateCalendarInDB(reports);
  loggerAPI.info('Calendar entries submitted');
  const promises = [];
  reports.forEach((report, i) => {
    const batch = createReportWriteRequest(report);
    promises.push(writeBatchToDB(batch, i));
  });

  // Step 4: Execute the DynamoDB requests.
  const retvalue = await Promise.all(promises)
    .then(result => {
      loggerAPI.info('Reports saved to DynamoDB');
      loggerAPI.debug('Results\n', JSON.stringify(result, null, 2));
      return result;
    })
    .catch(err => {
      loggerAPI.error('Could not store all reports to DynamoDB.', err);
    });
  return retvalue;
}
// ==================
// Internal functions
// ==================
async function writeBatchToDB(requests, index) {
  const dbrequest = {
    RequestItems: {
      // Inserted below.
    },
    ReturnConsumedCapacity: 'INDEXES',
    ReturnItemCollectionMetrics: 'SIZE',
  };

  try {
    dbrequest['RequestItems'][logDbTable] = requests;
    loggerAPI.debug(`Writing report ${index} to DynamoDB.`);
    // Test with aws dynamodb batch-write-item --cli-input-json file://input.json
    const result = await dynamoDbLib.call('batchWrite', dbrequest);
    loggerAPI.debug(`Report ${index} written.`);
    loggerAPI.debug(`${JSON.stringify(result, null, 2)}`);
    return { message: `Report ${index} saved.`, result };
  } catch (err) {
    loggerAPI.error(
      `Report ${index} not written.\n`,
      err,
      `\n Request:${JSON.stringify(dbrequest, null, 2)} `,
    );
    throw err;
  }
}

/**
 * Generate an array of calendar requests to update Calendar date counts.
 * @param {*} report array
 */
function createCalendarRequests(reports) {
  const counters = {};
  reports.forEach(report => {
    const { infoval } = report;
    const tFrom = infoval['From'];
    const tStart = infoval['Start'];
    const sDate = tStart.substring(0, 10);
    const key1 = `CAL#${tFrom}~DAY#${sDate}`;
    counters[key1] = (counters[key1] || 0) + 1;
    let key2 = `CALENDAR~DAY#${sDate}`;
    counters[key2] = (counters[key2] || 0) + 1;
  });
  return counters;
}

async function updateCalendarInDB(reports) {
  // See createCalendarRequests for structure of the request.
  const requests = createCalendarRequests(reports);
  const keys = Object.keys(requests);
  loggerAPI.debug(JSON.stringify(requests, null, 2));
  // const updatePromises = [];
  keys.forEach(async key => {
    const [PK, SK] = key.split(/~/);
    const counter = requests[key];
    if (PK && SK) {
      const params = {
        TableName: counterDbTable,
        Key: { PK, SK },
        UpdateExpression: 'set #c = #c + :x',
        ReturnValue: 'ALL_NEW',
        ExpressionAttributeNames: { '#c': 'reportcount' },
        ExpressionAttributeValues: {
          ':x': counter,
        },
      };
      // First try to set the counter
      let counterUpdated = false;
      let newvalues = await dynamoDbLib
        .call('update', {
          ...params,
          ConditionExpression: 'attribute_not_exists(reportcount)',
          UpdateExpression: 'set #c = :x',
        })
        .then(r => {
          counterUpdated = true;
          return r;
        })
        .catch(err => {
          counterUpdated = false;
          loggerAPI.debug(err);
        });
      // Try incrementing it - if the counter exists.
      if (!counterUpdated) {
        newvalues = await dynamoDbLib.call('update', params).catch(err => {
          loggerAPI.error(
            `Failed to update Calendar counter ${key}.\n${JSON.stringify(
              params,
              null,
              2,
            )}\n`,
            err,
          );
        });
      }
      loggerAPI.debug(
        `Counter updated ${key}\n${JSON.stringify(newvalues, null, 2)}`,
      );
    }
  });
  // await Promise.all(updatePromises)
  //   .then(() => {
  //     loggerAPI.info("Calendar updated");
  //   })
  //   .catch(err => {
  //     loggerAPI.error("Error during calendar update:", err);
  //   });
}
export { writeReportsToDB };
