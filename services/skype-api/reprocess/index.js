import config from '../../../config';
import * as dynamoDbLib from '../../../libs/dynamodb-lib';
import { writeReportsToDB } from '../libs/writeToDynamoDB';
import { loggerAPI } from '../../../libs/logging';
import { processJSON } from '../libs/processJSON';

/**
 * After the logic of extraction changes, this reruns the logic for all previously stored objects.
 */
export const handler = async (event, context) => {
  loggerAPI.debug(`Environment\n${JSON.stringify(process.env, null, 2)}`);
  loggerAPI.debug(`Config\n${JSON.stringify(config, null, 2)}`);
  loggerAPI.debug(`Event\n${JSON.stringify(event, null, 2)}`);
  loggerAPI.debug(`Context\n${JSON.stringify(context, null, 2)}`);
  // const { fulltable } = event;
  let fulltable = false;
  try {
    // Step 1: Scan / Read all records in DynamoDB in batches of 10
    // Step 2: process the new JSON record
    // Step 3: Write reports to DynamoDB
    const readparams = {
      TableName: config.DYNAMO_TABLE,
      ScanFilter: {
        SK: {
          ComparisonOperator: 'BEGINS_WITH',
          AttributeValueList: ['JSON'],
        } /* SK */,
      },
      Limit: 3,
      ScanIndexForward: false,
      ReturnConsumedCapacity: 'INDEXES',
    };
    let readresult = null;
    do {
      if (readresult && readresult.LastEvaluatedKey) {
        readparams.ExclusiveStartKey = readresult.LastEvaluatedKey;
      }
      try {
        // Step 1: Scan / Read all records in DynamoDB in batches of 10

        loggerAPI.info(`Scanning\n ${JSON.stringify(readparams, null, 2)}`);
        readresult = await dynamoDbLib.call('scan', readparams);
        loggerAPI.debug(`Result: ${JSON.stringify(readresult, null, 2)}`);
        // Step 2: process the new JSON record
        const reports = [];
        readresult.Items.forEach(item => {
          const rawjson = JSON.parse(item['JSON']);
          const reportevent = rawjson['VQReportEvent'];
          const uuid = item['FILEID'];
          const messagecache = [];
          const dataset = { Data: { VQReportEvent: [reportevent] } };
          processJSON(dataset, messagecache, uuid, reports);
        });
        // Step 3: Write reports to DynamoDB
        if (reports.length <= 0) {
          loggerAPI.warn(
            'No session reports found in this batch. Possible parsing problem. ',
          );
        } else {
          await writeReportsToDB(reports);
        }
      } catch (err) {
        loggerAPI.error('Error:', err);
        readresult = null;
      }
    } while (
      (fulltable && readresult && readresult.LastEvaluatedKey) ||
      readresult === null
    );
    // Fulltable scan or stop after first batch.
  } catch (error) {
    loggerAPI.error(error);
  }
};
