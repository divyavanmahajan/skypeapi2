// import { saveXMLtoS3 } from '../../libs/s3helpers';
import uuidv4 from 'uuid/v4';
import { loggerAPI } from '../../../../libs/logging';
import { storeLogToDB } from '../../libs/storeLogToDB';
// import { processXML } from './processXML';
// import { writeReportsToDB } from './writeToDynamoDB';

// async function logHandlerOld(req, res) {
//   const uuid = uuidv4();
//   try {
//     // Step1: Extract JSON reports from XML
//     const rawXML = req.body.toString();
//     loggerAPI.info(`---- file: ${uuid} -----`);
//     saveXMLtoS3(uuid, rawXML).then(() => loggerAPI.debug('XML saved to S3'));
//     loggerAPI.info(`Parsing XML ${rawXML.length} characters.`);
//     const reports = processXML(rawXML, uuid);
//     if (reports.length <= 0) {
//       loggerAPI.warn(
//         'Possible parsing problem. No session reports detected in XML',
//       );
//       req.status(401).message('No session reports detected.');
//       return;
//     } else {
//       await writeReportsToDB(reports);
//     }
//   } catch (err) {
//     loggerAPI.error('Error:', err);
//   }
// }
async function logHandler(req, res) {
  const uuid = uuidv4();
  try {
    // Step1: Extract JSON reports from XML
    const rawXML = req.body.toString();
    loggerAPI.info(`---- file: ${uuid} -----`);
    const result = await storeLogToDB(rawXML, uuid);
    res.status(result.status).json(result.message);
  } catch (err) {
    loggerAPI.error('Error:', err);
    res.status(500).json(err.toString());
  }
}
export { logHandler };
