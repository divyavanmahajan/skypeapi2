import { processXML } from './processXML';
import { writeReportsToDB } from './writeToDynamoDB';
import { loggerAPI } from '../../../libs/logging';
import { saveXMLtoS3 } from '../libs/s3helpers';

function summarizeReports(reports) {
  const details = reports.map(r => {
    const x = r.infoval;
    return { from: x['From'], start: x['Start'], end: x['End'] };
  });
  return { summary: `${reports.length} reports were uploaded.`, details };
}
async function storeLogToDB(xml, uuid) {
  try {
    const rawXML = xml.toString();
    await saveXMLtoS3(uuid, rawXML).then(() =>
      loggerAPI.debug('XML saved to S3'),
    );
    loggerAPI.debug(`Parsing XML ${rawXML.length} characters.`);
    // loggerAPI.debug(rawXML);
    const reports = processXML(rawXML, uuid);
    if (reports.length <= 0) {
      loggerAPI.warn(
        'Possible parsing problem. No session reports detected in XML',
      );
      return { status: 401, message: 'No session reports detected.' };
    }
    loggerAPI.info(
      `Generating DynamoDB requests for ${reports.length} reports.`,
    );
    await writeReportsToDB(reports);

    return {
      status: 200,
      message: summarizeReports(reports),
    };
  } catch (e) {
    loggerAPI.error(e);
    return {
      status: 401,
      message: 'Error uploading reports',
    };
  }
}
export { storeLogToDB };
