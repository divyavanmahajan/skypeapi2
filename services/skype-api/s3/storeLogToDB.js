const { DYNAMO_TABLE, documentClient } = require("../utils/aws");
const { processXML, createReportWriteRequest } = require("../rest/processXML");
const debug = require("debug")("storeLogToDB");
// const debugJoin = arr => debug(arr.join(' '));
function storeLogToDB(xml, uuid) {
  try {
    console.log("Start");
    const rawXML = xml.toString();
    console.info(`Parsing XML ${rawXML.length} characters.`);
    // console.dir(rawXML);
    const reports = processXML(rawXML, uuid);
    if (reports.length <= 0) {
      console.error(
        "Possible parsing problem. No session reports detected in XML"
      );
      return { status: 401, message: "No session reports detected." };
      return;
    }
    console.info(`Generating DynamoDB requests for ${reports.length} reports.`);
    const dbrequest = {
      RequestItems: {
        // See later.
      },
      ReturnConsumedCapacity: "INDEXES",
      ReturnItemCollectionMetrics: "SIZE"
    };
    // const requests = generateReportRequests(reports);
    // dbrequest['RequestItems'][DYNAMO_TABLE] = requests;
    const promises = [];
    const results = [];
    const errors = [];
    for (let k = 0; k < reports.length; k++) {
      const report = reports[k];
      try {
        console.info(`Write report ${k + 1} to DB`);
        const requests = createReportWriteRequest(report);
        dbrequest["RequestItems"][DYNAMO_TABLE] = requests;
        debug(`DynamoDB params: ${JSON.stringify(dbrequest, null, 2)}`);
        promises.push(
          documentClient
            .batchWrite(dbrequest)
            .promise()
            .then(result => {
              results.push(result);
              console.info(`Success writing report ${k + 1} to DB`);
            })
            .catch(err => {
              errors.push(err);
              console.error(`Error writing report ${k + 1} to DB`, err);
            })
            .finally(() => {
              console.info(`Finished writing report ${k + 1} to DB`);
            })
        );
      } catch (err1) {
        console.error(`Error sending report ${k + 1} to DB`, err1);
      }
    }
    return Promise.all(promises)
      .then(() => {
        console.info("Success");
        return {
          status: 200,
          message: `Sent ${reports.length} reports to DynamoDB`
        };
      })
      .catch(err => {
        console.error(err);
        return {
          status: 400,
          message: `Error sending ${reports.length} reports to DynamoDB`
        };
      });
  } catch (e) {
    console.error(e);
    return { status: 400, error: e };
  }
}
exports.storeLogToDB = storeLogToDB;
