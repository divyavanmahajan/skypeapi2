import { fixEmptyStrings } from './fixEmptyStrings';

/**
 *
 * @param {*} param0
 */
export function createReportWriteRequest({ json, infoval }) {
  const tFrom = infoval['From'];
  const tStart = infoval['Start'];
  const tEnd = infoval['End'];
  const tMidCall = infoval['MidCall'];
  fixEmptyStrings(infoval);
  const requests = [
    {
      PutRequest: {
        Item: {
          PK: `USER#${tFrom}`,
          SK: `RE#${tStart}#${tEnd}`,
          ...infoval,
        },
      },
    },
    {
      PutRequest: {
        Item: {
          PK: `DAY#${tStart.substring(0, 10)}`,
          SK: `USER#${tFrom}#RE#${tStart}#${tEnd}`,
          ...infoval,
        },
      },
    },
    {
      PutRequest: {
        Item: {
          PK: `USER#${tFrom}`,
          SK: `JSON#${tStart}#${tEnd}`,
          MIDCALL: tMidCall,
          MEDIA: infoval['MediaLineType'],
          FILEID: infoval['FileID'],
          HASH: infoval['Hash'],
          JSON: json,
        },
      },
    },
  ];
  // loggerAPI.log(`Generated \n ${JSON.stringify(requests, null, 2)}`);
  return requests;
}
