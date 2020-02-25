import uuidv4 from 'uuid/v4';
import { loggerAPI } from '../../../libs/logging';
import { initPermissions } from '../../../libs/permissions';
import { moveS3File, createReadStream } from '../libs/s3helpers';
import { extractXML } from '../libs/extractXML';
import { storeLogToDB } from '../libs/storeLogToDB';
import config from '../../../config';

export const handler = async (event, context) => {
  const results = [];
  const promises = [];
  const uuid = uuidv4();
  initPermissions(event, context);
  // const ability = getAbility(); not used here.
  loggerAPI.debug(`Environment\n${JSON.stringify(process.env, null, 2)}`);
  loggerAPI.debug(`Config\n${JSON.stringify(config, null, 2)}`);
  loggerAPI.debug(`Event\n${JSON.stringify(event, null, 2)}`);
  loggerAPI.debug(`Context\n${JSON.stringify(context, null, 2)}`);

  try {
    loggerAPI.info(`----File: ${uuid}.log ----`);
    loggerAPI.debug(`Event\n${JSON.stringify(event)}`);
    loggerAPI.debug(`Context\n${JSON.stringify(context)}`);
    for (let index = 0; index < event.Records.length; index++) {
      const record = event.Records[index];
      const s3Bucket = decodeURIComponent(record.s3.bucket.name);
      const s3ObjectKey = decodeURIComponent(record.s3.object.key);
      const extractPromise = createReadStream(s3Bucket, s3ObjectKey)
        .then(readstream => {
          loggerAPI.info(`-- Extracting XML from ${s3Bucket}/${s3ObjectKey}.`);
          return extractXML(readstream, uuid);
        })
        .then(async xml => {
          try {
            loggerAPI.info(`-- Moving file ${s3Bucket}/${s3ObjectKey}.`);
            await moveS3File(s3Bucket, s3ObjectKey, uuid);
            loggerAPI.info(
              `File moved: ${JSON.stringify(
                { s3Bucket, s3ObjectKey, uuid },
                null,
                2,
              )}`,
            );
          } catch (fileerr) {
            loggerAPI.error('Error moving file:', fileerr);
          }
          loggerAPI.info('Store in database');
          return storeLogToDB(xml, uuid);
        })
        .then(result => {
          result.key = `${s3Bucket}/${s3ObjectKey}`;
          results.push(result);
        })
        .catch(err => {
          loggerAPI.error(
            `-- Error processing ${s3Bucket}/${s3ObjectKey}.\n`,
            err,
            err.stack,
          );
        })
        .finally(() => {
          loggerAPI.info(`Completed ${s3Bucket}/${s3ObjectKey}\n `);
        });
      promises.push(extractPromise);
    } // for
    await Promise.all(promises).then(() => {
      loggerAPI.info(`Final result\n\n${JSON.stringify(results, null, 2)}`);
    });
  } catch (error) {
    loggerAPI.error('Error parsing file:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error }),
    };
  }
};
