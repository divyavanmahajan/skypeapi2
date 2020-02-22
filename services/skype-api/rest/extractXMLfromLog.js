const lineReader = require("line-reader");
const debug = require("debug")("extractXML");
const debugJoin = arr => debug(arr.join(" "));
// function streamToString(stream) {
//   const chunks = [];
//   return new Promise((resolve, reject) => {
//     stream.on('data', chunk => chunks.push(chunk));
//     stream.on('error', reject);
//     stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
//   });
// }
/**
 * Returns a promise, since stream processing is async
 * @param {*} datasource - path to file / stream
 */
function extractXMLfromLog(datasource) {
  const filePromise = new Promise(function(resolve, reject) {
    try {
      debug("Extracting XML from log");
      let collector = '<?xml version="1.0" encoding="UTF-8"?>\n<Data>\n';
      let insideXML = false;
      let lineNumber = 0;
      // To debug S3 - use these lines to dump contents to the log
      // streamToString(datasource).then(result => {
      //   console.log(result);
      //   resolve(result);
      // });
      // console.log(JSON.stringify(datasource, null, 2));
      let macMediaLine = "";
      let macEndpoint = "";
      let macUser = "sip:sfbmac@apple.com";
      let macConfUri = "sip:sfbmac@apple.com";
      let macCallId = "fakeCallID";
      lineReader.eachLine(datasource, function(line, isLastLine) {
        const startAt = line.indexOf("<VQReportEvent");
        const endAt = line.indexOf("</VQReportEvent>");
        const macMedialineIndex = line.indexOf("QoE media: <MediaLine");
        const macEndpointIndex = line.indexOf("QoE endpoint: <Endpoint ");
        const macUserIndex = line.indexOf("signInName (");
        const macConfUriIndex = line.indexOf("<conf-uri>");
        const macCallIdIndex = line.indexOf(
          "initializeMediaCall() mediaCallId="
        );
        lineNumber = lineNumber + 1;
        let snippet = "";
        // Case 1: Start and End in same line. Start<End (valid outside a tag)
        // Case 2: Start and End in same line. Start>End (valid inside a tag only)
        // Case 3: Only Start in the line (valid outside a tag)
        // Case 4: Only End in the line (valid inside a tag)
        // Case 5: No start/end tag in line
        if (startAt > -1 && endAt > -1) {
          if (startAt < endAt) {
            // Case 1
            debugJoin(["1", lineNumber, startAt, endAt]);
          } else {
            // Case 2
            debugJoin(["2", lineNumber, startAt, endAt]);
          }
        } else if (startAt > -1) {
          // Case 3
          debugJoin(["3", lineNumber, startAt, endAt]);
        } else if (endAt > -1) {
          // Case 4
          debugJoin(["4", lineNumber, startAt, endAt]);
        } else {
        }
        // Get logged in User name for a Mac log file
        if (macUserIndex > -1) {
          const regex = /signInName \(([^\)]+)\)/;
          const match = line.match(regex);
          if (match) {
            macUser = "sip:" + match[1];
          }
        }
        if (macConfUriIndex > -1) {
          // Try to get Conference URI
          const regex = /<conf-uri>(.+)<\/conf-uri>/;
          const match = line.match(regex);
          if (match) {
            macConfUri = match[1];
          }
        }
        if (macCallIdIndex > -1) {
          // Try to get Conference URI
          const regex = /mediaCallId=([^\s]+)/;
          const match = line.match(regex);
          if (match) {
            macCallId = match[1];
          }
        }
        if (macMedialineIndex > -1) {
          debugJoin(["Mac-Medialine", lineNumber, macMedialineIndex]);
          macMediaLine = line.substr(macMedialineIndex + 11);
        }
        if (macEndpointIndex > -1) {
          debugJoin(["Mac-Endpoint", lineNumber, macEndpointIndex]);
          macEndpoint = line.substr(macEndpointIndex + 14);
          const start = `${line.substring(0, 10)}T${line.substring(11, 23)}Z`;
          const end = start;
          const fromuri = macUser;
          const touri = macConfUri;
          const dialogInfo = `<DialogInfo CallId="${macCallId}" FromTag="notag" ToTag="notag" Start="${start}" End="${end}"><FromURI>${fromuri}</FromURI><ToURI>${touri}</ToURI></DialogInfo>`;
          const reportevent =
            '<VQReportEvent xmlns="ms-rtcp-metrics" xmlns:v2="ms-rtcp-metrics.v2" v2:SchemaVersion="2.0">';
          const sessionevent =
            '<VQSessionReport SessionId="nosessionid;from-tag=notag;to-tag=notag">';
          collector =
            collector +
            `${reportevent}${sessionevent}${macEndpoint}${dialogInfo}${macMediaLine}</VQSessionReport></VQReportEvent>`;
          macMediaLine = "";
          macEndpoint = "";
        }
        snippet = "";
        // Scan the line.
        while (line) {
          if (!insideXML) {
            // Search for the start tag only.
            // If found - remove text before the start tag.
            // No snippet at this time.
            const s = line.indexOf("<VQReportEvent");
            if (s > -1) {
              insideXML = true;
              line = line.substr(s);
            } else {
              // No starting tag found. Consume the line.
              line = null;
            }
          }
          if (insideXML) {
            // While inside a tag.
            //   Either an end tag - only part of the line.
            //   or the full line
            const e = line.indexOf("</VQReportEvent>");
            if (e > -1) {
              insideXML = false;
              snippet = line.substring(0, e + 16) + "\n";
              line = line.substr(e + 16);
            } else {
              snippet = line;
              line = null;
            }
            collector = collector + snippet;
          }
        }
        if (isLastLine) {
          collector = collector + "\n</Data>\n";
          resolve(collector);
        }
      });
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
  return filePromise;
}
exports.extractXMLfromLog = extractXMLfromLog;
