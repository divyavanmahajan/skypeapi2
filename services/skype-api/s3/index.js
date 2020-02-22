const { storeLogToDB } = require("./storeLogToDB");

const { moveS3File, saveXMLtoS3 } = require("../utils/s3utils");
const { S3 } = require("../utils/aws");
const { extractXMLfromLog } = require("../rest/extractXMLfromLog");

const uuidv4 = require("uuid/v4");

// const logFileKey = (uuid, isError) => {
//   const folder = isError ? 'error' : 'raw';
//   return `logs/${folder}/${uuid}.log`;
// };

const createReadStream = (s3Bucket, s3ObjectKey) => {
  return new Promise((resolve, reject) => {
    console.info(`== Processing ${s3Bucket}/${s3ObjectKey}`);
    // Retrieve the object
    const params = {
      Bucket: s3Bucket,
      Key: s3ObjectKey
    };
    try {
      resolve(S3.getObject(params).createReadStream());
    } catch (e) {
      reject(e);
    }
  });
};

module.exports.handler = async (event, context) => {
  const results = [];
  const promises = [];
  const uuid = uuidv4();

  try {
    console.info(`----file: ${uuid}.log ----`);
    console.info("---------event-----------");
    console.info(JSON.stringify(event));
    console.info("---------context----------");
    console.info(JSON.stringify(context));
    for (let index = 0; index < event.Records.length; index++) {
      const record = event.Records[index];
      const s3Bucket = decodeURIComponent(record.s3.bucket.name);
      const s3ObjectKey = decodeURIComponent(record.s3.object.key);
      const extractPromise = createReadStream(s3Bucket, s3ObjectKey)
        .then(readstream => {
          console.info("Await1");
          return extractXMLfromLog(readstream, uuid);
        })
        .then(async xml => {
          console.info("Await2a");
          // Move to processed folder.
          // console.info(xml);
          try {
            await saveXMLtoS3(uuid, xml);
            await moveS3File(s3Bucket, s3ObjectKey, uuid);
          } catch (fileerr) {
            console.error("Problem saving files: ", fileerr);
          }
          console.info(
            `-- Parsed ${s3Bucket}/${s3ObjectKey}\n -- Pushing to store now`
          );
          return storeLogToDB(xml, uuid);
        })
        .then(result => {
          console.info("Await2b");
          result.key = `${s3Bucket}/${s3ObjectKey}`;
          console.info(`-- Saved ${s3Bucket}/${s3ObjectKey} to S3.`);
          results.push(result);
        })
        .catch(err => {
          console.error(
            `-- Error processing ${s3Bucket}/${s3ObjectKey}.`,
            err,
            err.stack
          );
        })
        .finally(() => {
          console.info(`== Completed ${s3Bucket}/${s3ObjectKey}\n `);
        });
      promises.push(extractPromise);
    } // for
    await Promise.all(promises).then(() => {
      console.info("Await4");

      return {
        statusCode: 200,
        body: JSON.stringify({ result: results })
      };
    });
  } catch (error) {
    console.error(error, error.stack);
    return {
      statusCode: 400,
      body: JSON.stringify({ error })
    };
  }
};
