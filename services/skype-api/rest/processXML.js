const { getSafeValue } = require("./getSafeValue");
// var debug = require('debug')('processXML');
/**
 * Process the multiple VQReportEvents in the XML string
 * For documentation on the format see
 * https://docs.microsoft.com/en-us/openspecs/office_protocols/ms-qoe/c1050431-f4b2-44d4-a425-63d75e99f5df
 */
const xml2js = require("xml2js");
const hash = require("hash.js");
const { HEADER_EXTRACT, MEDIALINE_EXTRACT } = require("./extractlist");
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
      console.error("Error:", err);
      return {};
    } else {
      try {
        return processJSON(result, messagecache, uuid, reports);
      } catch (ex1) {
        console.error("Error parsing the report.", ex1.message);
        return [];
      }
    }
  });
  return reports;
}

function processJSON(result, messagecache, uuid, reports) {
  // const builder = new xml2js.Builder();
  const messageLogger = message => messagecache.push(message);
  const messageFlush = title => {
    console.warn(`${title}\n${messagecache.join("\n")}`);
    messagecache = [];
  };
  result["Data"]["VQReportEvent"].forEach((reportevent, i) => {
    console.info(`Processing report ${i}`);
    let val = {};
    HEADER_EXTRACT.forEach(ext => {
      val[ext[0]] = getSafeValue(reportevent, ...ext, messageLogger);
    });
    const medialine = reportevent["VQSessionReport"][0]["MediaLine"][0];
    if (medialine) {
      MEDIALINE_EXTRACT.forEach(ext => {
        val[ext[0]] = getSafeValue(reportevent, ...ext, messageLogger);
      });
      // console.info(`  Medialine type: ${val['MediaLineType']}`);
    }
    messageFlush("  Missing fields");
    // Fix the From / To fields to prefix them with "sip:"
    // S4BEcho does not have a sip: prefix
    const sStart = val["Start"];
    if (sStart[10] === " ") {
      val["Start"] =
        sStart.substring(0, 10) + "T" + sStart.substring(11, 19) + ".0000Z";
    }
    const sEnd = val["End"];
    if (sEnd[10] === " ") {
      val["End"] =
        sEnd.substring(0, 10) + "T" + sEnd.substring(11, 19) + ".0000Z";
    }
    if (val["From"].substring(0, 4) !== "sip:") {
      val["From"] = "sip:" + val["From"];
    }
    if (val["To"].substring(0, 4) !== "sip:") {
      val["To"] = "sip:" + val["To"];
    }
    // Fix SSID: Abondoned since it generated garbage.
    if (val["SSID"] !== " ") {
      val["SSID"] = hex_to_ascii(val["SSID"]);
    }
    // Assign unique File ID
    val["FileID"] = uuid;
    // Calculate Session Hash
    val["Hash"] = hash
      .sha1()
      .update(
        `${val["From"]}${val["Start"]}${val["End"]}${val["MediaLineType"]}`
      )
      .digest("hex");
    var outputObj = { VQReportEvent: reportevent };
    // var xml = builder.buildObject(outputObj);
    var xml = ""; // Not used. Need to clear out.
    var json = JSON.stringify(outputObj);
    var info = JSON.stringify({ info: val });
    if (medialine) {
      console.info(
        "  ",
        [
          val["From"],
          val["MediaLineType"],
          val["MidCall"],
          val["Start"],
          val["End"],
          val["LocalIPAddress"],
          val["RemoteIPAddress"],
          val["InboundNetworkMOS"],
          val["RecvListenMOS"],
          val["SendListenMOS"]
        ].join(",")
      );
      // Only push the report if medialine  was available
      reports.push({ xml, json, info, infoval: val, hash: val["Hash"] });
    }
  });
  console.info(`${reports.length} reports`);
  return reports;
}

/**
 * Fix empty strings in the object (in place)
 * @param {*} obj
 */
function fixEmptyStrings(obj) {
  for (var k in obj) {
    const objtype = typeof obj[k];
    if (objtype === "object" && obj[k] !== null) fixEmptyStrings(obj[k]);
    else if (objtype === "string") {
      if (obj[k] === "") {
        obj[k] = " ";
      }
    }
  }
}

/**
 * Generate an array of update requests to update Calendar date counts.
 * @param {*} report array
 */
function createUpdateRequests(reports) {
  const counters = {};
  reports.forEach(report => {
    const { infoval } = report;
    const tFrom = infoval["From"];
    const tStart = infoval["Start"];
    const sDate = tStart.substring(0, 10);
    const key1 = `CAL#${tFrom}~DAY#${sDate}`;
    counters[key1] = (counters[key1] || 0) + 1;
    let key2 = `CALENDAR~DAY#${sDate}`;
    counters[key2] = (counters[key2] || 0) + 1;
  });
  return counters;
}

/**
 *
 * @param {*} param0
 */
function createReportWriteRequest({ json, infoval }) {
  const tFrom = infoval["From"];
  const tStart = infoval["Start"];
  const tEnd = infoval["End"];
  const tMidCall = infoval["MidCall"];
  fixEmptyStrings(infoval);
  const requests = [
    {
      PutRequest: {
        Item: {
          PK: `USER#${tFrom}`,
          SK: `RE#${tStart}#${tEnd}`,
          ...infoval
        }
      }
    },
    {
      PutRequest: {
        Item: {
          PK: `DAY#${tStart.substring(0, 10)}`,
          SK: `USER#${tFrom}#RE#${tStart}#${tEnd}`,
          ...infoval
        }
      }
    },
    {
      PutRequest: {
        Item: {
          PK: `USER#${tFrom}`,
          SK: `JSON#${tStart}#${tEnd}`,
          MIDCALL: tMidCall,
          MEDIA: infoval["MediaLineType"],
          FILEID: infoval["FileID"],
          HASH: infoval["Hash"],
          JSON: json
        }
      }
    }
  ];
  // console.log(`Generated \n ${JSON.stringify(requests, null, 2)}`);
  return requests;
}

/**
 * Convert Hex string to Ascii (e.g. 656565 => AAA)
 * @param {*} str1
 */
function hex_to_ascii(str1) {
  var hex = str1.toString();
  var str = "";
  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}

/**
 * Generate DynamoDB Batch Put requests for all reports
 * @param {*} reports
 */
function generateReportRequests(reports) {
  const requests = [];
  reports.forEach(report => {
    const singleReportRequests = createReportWriteRequest(report);
    requests.push(...singleReportRequests);
  });
  return requests;
}
module.exports.generateReportRequests = generateReportRequests;
module.exports.createReportWriteRequest = createReportWriteRequest;
module.exports.createUpdateRequests = createUpdateRequests;
module.exports.processXML = processXML;
module.exports.processJSON = processJSON;
