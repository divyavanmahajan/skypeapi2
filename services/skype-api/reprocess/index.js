const { DYNAMO_TABLE } = require("../../../config");
const dynamoDbLib = require("../../../libs/dynamodb-lib");

const { writeToDynamoDB } = require("../rest/writeToDynamoDB");

const {
  processJSON,
  createReportWriteRequest,
  createUpdateRequests
} = require("../rest/processXML");

/**
 * After the logic of extraction changes, this reruns the logic for all previously stored objects.
 */
module.exports.handler = async (event, context) => {
  const { fulltable } = event;

  try {
    // Step 1: Scan / Read all records in DynamoDB in batches of 10
    // Step 2: process the new JSON record
    // Step 3: Generate DynamoDB requests and collect them.
    // Step 4: Promise all DynamoDB requests in a batch.
    const readparams = {
      TableName: DYNAMO_TABLE,
      ScanFilter: {
        SK: {
          ComparisonOperator: "BEGINS_WITH",
          AttributeValueList: ["JSON"]
        } /* SK */
      },
      Limit: 10,
      ScanIndexForward: false,
      ReturnConsumedCapacity: "INDEXES"
    };
    let readresult = null;
    do {
      if (readresult && readresult.LastEvaluatedKey) {
        readparams.ExclusiveStartKey = readresult.LastEvaluatedKey;
      }
      try {
        // Step 1: Scan / Read all records in DynamoDB in batches of 10

        console.log(`Scanning with ${JSON.stringify(readparams, null, 2)}`);
        readresult = await dynamoDbLib.call("scan", readparams);
        console.log(`Result: ${JSON.stringify(readresult, null, 2)}`);
        // Step 2: process the new JSON record
        const reports = [];
        readresult.Items.forEach(item => {
          const rawjson = JSON.parse(item["JSON"]);
          const reportevent = rawjson["VQReportEvent"];
          const uuid = item["FILEID"];
          const messagecache = [];
          const dataset = { Data: { VQReportEvent: [reportevent] } };
          // console.warn(
          //   JSON.stringify(dataset['Data']['VQReportEvent'], null, 2),
          // );
          processJSON(dataset, messagecache, uuid, reports);
        });

        if (reports.length <= 0) {
          console.warn(
            "Possible parsing problem. No session reports found in this batch."
          );
        } else {
          // Step 3: Create DynamoDB requests from the extracted reports.
          console.info(
            `Generating DynamoDB requests for ${reports.length} reports.`
          );
          // const requests = generateReportRequests(reports);
          const promises = [];
          reports.forEach((report, i) => {
            const batch = createReportWriteRequest(report);
            // console.info(`Writing report ${i + 1} to DB`);
            promises.push(writeToDynamoDB(batch, i));
          });
          promises.push(createUpdateRequests(reports));

          // Step 4: Execute the DynamoDB requests.
          await Promise.all(promises)
            .then(result => {
              console.info(
                "Reports saved to DynamoDB",
                JSON.stringify(result, null, 2)
              );
            })
            .catch(err => {
              console.error("Could not store all reports to DynamoDB.", err);
            });
        }
      } catch (err) {
        console.error("Error:", err);
        readresult = null;
      }
    } while (
      (fulltable && readresult && readresult.LastEvaluatedKey) ||
      readresult === null
    );
    // Fulltable scan or stop after first batch.
  } catch (error) {
    console.error(error, error.stack);
  }
};
