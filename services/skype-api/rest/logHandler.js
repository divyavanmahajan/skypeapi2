const { saveXMLtoS3 } = require("../utils/s3utils");
const uuidv4 = require("uuid/v4");
const {
  processXML,
  createReportWriteRequest,
  createUpdateRequests
} = require("./processXML");
const { writeToDynamoDB } = require("./writeToDynamoDB");
async function logHandler(req, res) {
  const uuid = uuidv4();
  // Step1: Extract JSON reports from XML
  const rawXML = req.body.toString();
  console.info(`---- file: ${uuid} -----`);
  saveXMLtoS3(uuid, rawXML).then(() => console.log("XML saved to S3"));
  console.info(`Parsing XML ${rawXML.length} characters.`);
  const reports = processXML(rawXML, uuid);
  if (reports.length <= 0) {
    console.error(
      "Possible parsing problem. No session reports detected in XML"
    );
    req.status(401).message("No session reports detected.");
    return;
  }
  // Step 2: Create DynamoDB requests from the extracted reports.
  console.info(`Generating DynamoDB requests for ${reports.length} reports.`);
  // const requests = generateReportRequests(reports);
  const promises = [];
  reports.forEach((report, i) => {
    const batch = createReportWriteRequest(report);
    // console.info(`Writing report ${i + 1} to DB`);
    promises.push(writeToDynamoDB(batch, i));
  });
  promises.push(createUpdateRequests(reports));
  // Step 3: Execute the DynamoDB requests.
  await Promise.all(promises)
    .then(result => {
      res.status(200).json({ message: "Reports saved to DynamoDB", result });
    })
    .catch(err => {
      res.status(400).json({
        message: "Could not store all reports to DynamoDB.",
        error: err,
        result: {}
      });
    });
}
module.exports.logHandler = logHandler;
