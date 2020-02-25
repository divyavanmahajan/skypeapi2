import config from '../../../config';
import AWS from '../../../libs/aws-sdk';
import { loggerAPI } from '../../../libs/logging';

const LOG_XML_PREFIX = 'logs/xml';
const LOG_RAW_PREFIX = 'logs/raw';
const S3 = new AWS.S3();
/**
 * Move a S3 file within the same bucket.
 * @param {*} bucket
 * @param {*} srcKey
 * @param {*} targetKey
 */
const moveS3File = async (bucket, srcKey, uuid) => {
  const targetKey = `${LOG_RAW_PREFIX}/${uuid}.log`;
  try {
    const response = await S3.copyObject({
      Bucket: bucket,
      CopySource: `${bucket}/${srcKey}`,
      Key: targetKey,
    }).promise();

    loggerAPI.debug(
      `Copied  ${srcKey} copied to ${targetKey} ------\n${JSON.stringify(
        response,
        null,
        2,
      )}`,
    );

    await S3.deleteObject({
      Bucket: bucket,
      Key: srcKey,
    }).promise();
    loggerAPI.debug(`Deleted ${srcKey} removed`);
  } catch (e) {
    loggerAPI.error(`Error moving ${srcKey} to ${targetKey}: `, e);
  }
};

/**
 * Save XML extracted or sent to API - to a XML file.
 * @param {*} uuid File identifier
 * @param {*} xml  XML string
 */
const saveXMLtoS3 = async (uuid, xml) => {
  const xmlparams = {
    Bucket: config.LOG_BUCKET,
    Key: `${LOG_XML_PREFIX}/${uuid}.xml`,
    Body: xml,
  };
  try {
    await S3.upload(xmlparams, {
      ContentType: 'application/xml',
    }).promise();
    loggerAPI.debug('Saved XML ', uuid);
  } catch (fileerr) {
    loggerAPI.error('Error saving data to file.\n', fileerr);
  }
};

const createReadStream = (s3Bucket, s3ObjectKey) => {
  return new Promise((resolve, reject) => {
    loggerAPI.info(`== Processing ${s3Bucket}/${s3ObjectKey}`);
    // Retrieve the object
    const params = {
      Bucket: s3Bucket,
      Key: s3ObjectKey,
    };
    try {
      resolve(S3.getObject(params).createReadStream());
    } catch (e) {
      reject(e);
    }
  });
};

export { saveXMLtoS3, moveS3File, createReadStream };
