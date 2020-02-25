import { loggerAPI } from '../../../libs/logging';
/**
 * Process the multiple VQReportEvents in the XML string
 * For documentation on the format see
 * https://docs.microsoft.com/en-us/openspecs/office_protocols/ms-qoe/c1050431-f4b2-44d4-a425-63d75e99f5df
 */
import xml2js from 'xml2js';

import { processJSON } from './processJSON';
/**
 *
 * @param {*} xml
 * @returns [{ xml, json, info, infoval, hash }] array for each VQReportEvent.
 *           xml,json - xml/json text for single event.
 *           info - json text for subset in infoval.
 *           hash - hash of from,start,end.
 */
function processXML(xmlcontent, uuid) {
  const reports = [];
  let messagecache = [];
  // const uuid = uuidv4();
  xml2js.parseString(xmlcontent, function(err, result) {
    if (err) {
      loggerAPI.error('XML parsing error:', err);
      return [];
    }
    try {
      return processJSON(result, messagecache, uuid, reports);
    } catch (ex1) {
      loggerAPI.error('ProcessJSON error:', ex1.message);
      return [];
    }
  });
  return reports;
}

export { processXML };
