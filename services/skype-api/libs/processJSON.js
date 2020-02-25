import hash from 'hash.js';
import { loggerAPI } from '../../../libs/logging';
import { getSafeValue } from './getSafeValue';
import { HEADER_EXTRACT, MEDIALINE_EXTRACT } from './extractlist';

export function processJSON(result, messagecache, uuid, reports) {
  // const builder = new xml2js.Builder();
  const messageLogger = message => messagecache.push(message);
  const messageFlush = title => {
    loggerAPI.debug(`${title}\n${messagecache.join('\n')}`);
    messagecache = [];
  };
  result['Data']['VQReportEvent'].forEach((reportevent, i) => {
    loggerAPI.debug('Processing report event');
    let val = {};
    HEADER_EXTRACT.forEach(ext => {
      val[ext[0]] = getSafeValue(reportevent, ...ext, messageLogger);
    });
    const medialine = reportevent['VQSessionReport'][0]['MediaLine'][0];
    if (medialine) {
      MEDIALINE_EXTRACT.forEach(ext => {
        val[ext[0]] = getSafeValue(reportevent, ...ext, messageLogger);
      });
      // loggerAPI.info(`  Medialine type: ${val['MediaLineType']}`);
    }
    messageFlush('  Missing fields');
    // Fix the From / To fields to prefix them with "sip:"
    // S4BEcho does not have a sip: prefix
    const sStart = val['Start'];
    if (sStart[10] === ' ') {
      val['Start'] =
        sStart.substring(0, 10) + 'T' + sStart.substring(11, 19) + '.0000Z';
    }
    const sEnd = val['End'];
    if (sEnd[10] === ' ') {
      val['End'] =
        sEnd.substring(0, 10) + 'T' + sEnd.substring(11, 19) + '.0000Z';
    }
    if (val['From'].substring(0, 4) !== 'sip:') {
      val['From'] = 'sip:' + val['From'];
    }
    if (val['To'].substring(0, 4) !== 'sip:') {
      val['To'] = 'sip:' + val['To'];
    }
    // Fix SSID: Abondoned since it generated garbage.
    if (val['SSID'] !== ' ') {
      val['SSID'] = hex_to_ascii(val['SSID']);
    }
    // Assign unique File ID
    val['FileID'] = uuid;
    // Calculate Session Hash
    val['Hash'] = hash
      .sha1()
      .update(
        `${val['From']}${val['Start']}${val['End']}${val['MediaLineType']}`,
      )
      .digest('hex');
    var outputObj = { VQReportEvent: reportevent };
    // var xml = builder.buildObject(outputObj);
    var xml = ''; // Not used. Need to clear out.
    var json = JSON.stringify(outputObj);
    var info = JSON.stringify({ info: val });
    if (medialine) {
      loggerAPI.info(
        ` Report data: ${val['Start']}\n${[
          val['From'],
          val['MediaLineType'],
          val['MidCall'],
          val['Start'],
          val['End'],
          val['LocalIPAddress'],
          val['RemoteIPAddress'],
          val['InboundNetworkMOS'],
          val['RecvListenMOS'],
          val['SendListenMOS'],
        ].join(',')}`,
      );
      // Only push the report if medialine  was available
      reports.push({ xml, json, info, infoval: val, hash: val['Hash'] });
    }
  });
  loggerAPI.info(`${reports.length} reports`);
  return reports;
}
/**
 * Convert Hex string to Ascii (e.g. 656565 => AAA)
 * @param {*} str1
 */
function hex_to_ascii(str1) {
  var hex = str1.toString();
  var str = '';
  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}
